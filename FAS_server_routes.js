const Faction = require('./models/Faction')
const cloudscraper = require('cloudscraper')



router.post('/updatearmoury', async (req, res) => {
    // Get faction data
    if (!req.body.API_KEY) {
      return res.status(200).send({ error: 1, message: 'Invalid API Key' })
    }
    const api_key = req.body.API_KEY;
    getArmouryData(api_key).then(async data => {
      if (data.error) {
        res.status(200).send({ error: 2, message: data.error.error })
      } else {
        updateArmouryData(data).then(res.status(200).send({messagge: 'Update Successful'}))
      }
    })
  })

router.post('/getarmoury', (req, res) => {
    // Get faction data
    if (!req.body.API_KEY || !req.body.start_date || !req.body.end_date) {
        return res.status(200).send({
            error: 1,
            message: 'Data misssing!'
        })
    }
    const api_key = req.body.API_KEY;
    getProfile(api_key).then(result => {
        const start_date = new Date(req.body.start_date + 'T23:59:59')
        const end_date = new Date(req.body.end_date)
        Faction.aggregate([{
                $match: {
                    id: result.faction.faction_id
                }
            },
            {
                '$project': {
                    'armoury': {
                        $filter: {
                            input: '$armoury',
                            as: 'news',
                            cond: {
                                $and: [{
                                        $lte: ['$$news.date', start_date]
                                    },
                                    {
                                        $gte: ['$$news.date', end_date]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ], (err, result) => {
            if (err) {
                console.error(err)
            } else {
                res.status(200).send(result)
            }
        })
    })
})

async function updateArmouryData(data) {
    let faction = await Faction.findOne({
        id: data.ID
    })
    return new Promise((resolve, reject) => {
        if (!faction) {
            addNewFaction(data).then(saveResult => {
                if (!saveResult) {
                    res.status(200).send(ReturnInfo.internal_error)
                } else {
                    saveNews(data).then(resolve())
                }
            })
        } else {
            saveNews(data).then(resolve())
        }
    });
}

function saveNews(data) {
    return new Promise((resolve, reject) => {
        for (news in data.armorynews) {
            const FactionData = {}
            FactionData.id = news
            FactionData.raw = data.armorynews[news].news
            FactionData.date = data.armorynews[news].timestamp * 1000
            if (data.armorynews[news].news.includes('deposited')) {
                FactionData.type = 'deposit'
            } else if (data.armorynews[news].news.includes('filled')) {
                FactionData.type = 'refill'
            } else if (data.armorynews[news].news.includes('used')) {
                FactionData.type = 'use'
            } else {
                FactionData.type = 'other'
            }
            FactionData.user = data.armorynews[news].news.match(/\<a(.*?)\<\/a>/im)[0] // !Select only first match
            FactionData.item = data.armorynews[news].news.match(/(?<=faction\'s\s)(.*)(?=items)/gmi)
            if (FactionData.item) {
                FactionData.item = FactionData.item.toString().trim()
            }

            Faction.updateOne({
                id: data.ID,
                'armoury.id': {
                    $ne: FactionData.id
                }
            }, {
                $addToSet: {
                    armoury: FactionData
                }
            }, (err, result) => {
                if (err) {
                    console.error(err)
                }
            })
        }
        resolve()
    })
}

function addNewFaction(data) {
    return new Promise((resolve, reject) => {
        const newFaction = new Faction()
        newFaction.id = data.ID
        newFaction.name = data.name
        newFaction.save(err => {
            if (err) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}
const armouryDataUrl = 'https://api.torn.com/faction/?selections=basic,armorynewsfull&key='

function getArmouryData(api_key) {
    return new Promise((resolve, reject) => {
        cloudscraper.request({
            method: 'GET',
            url: armouryDataUrl + api_key,
            encoding: JSON,
            challengesToSolve: 3, // optional, if CF returns challenge after challenge, how many to solve before failing
            followAllRedirects: true, // mandatory for successful challenge solution
        }, function (error, response, body) {
            let json = JSON.parse(body.toString())
            resolve(json)
        });
    }).catch(err => {
        console.info(err)
    })
}

const url = 'https://api.torn.com/user/?selections=profile&key='
function getProfile(api_key) {
  return new Promise((resolve, reject) => {
    cloudscraper.request({
      method: 'GET',
      url: url + api_key,
      encoding: JSON,
      challengesToSolve: 3, // optional, if CF returns challenge after challenge, how many to solve before failing
      followAllRedirects: true, // mandatory for successful challenge solution
    }, function (error, response, body) {
      let json = JSON.parse(body.toString())
      resolve(json)
    });
  }).catch(err => {
    logger.info(err)
  })
}
