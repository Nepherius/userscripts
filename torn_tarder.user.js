'use strict'
// ==UserScript==
// @name        Torn Tarder
// @author      nepherius[2009878]
// @description Calculates total value of items in trade
// @match       https://www.torn.com/trade.php
// @connect     api.torn.com
// @version     1.2.1
// @updateURL   https://raw.githubusercontent.com/Nepherius/userscripts/master/torn_tarder.user.js
// @supportURL  https://www.torn.com/forums.php#/forums.php?p=threads&f=67&t=16074804&b=0&a=0
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest
// @run-at      document-start
// ==/UserScript==

// Uncomment the following line if you enter the wrong api key, comment it again once you've set your key
// GM_deleteValue('api_key')

let API_KEY;
let Items;
if (!GM_getValue('api_key')) {
    let key = prompt('Please enter your Torn API Key, this will be stored locally!')
    GM_setValue('api_key', key)
    API_KEY = key
} else {
    API_KEY = GM_getValue('api_key')
}

//Setup listenet for trade window
waitForKeyElements(".trade-cont", setup)
// Add display boxes and start searching for items
function setup(jNode) {
    let seller_total_txt = '<font color="gray">Searching for items...</font>';
    let buyer_total_txt = '<font color="gray">Searching for items...</font>';
    jNode.after(`
        <div id="seller"  style="width:362px; text-transform: capitalize;">
            <div aria-level="5" class="title-black top-round" role="heading">
                <span>
                    Total
                </span>
            </div>
            <div class="bottom-round cont-gray p10" id="seller_total">
                ${seller_total_txt}
            </div>
        </div>
    `);
    jNode.after(`
        <div id="buyer" class="right" style="width:362px; text-transform: capitalize;">
            <div aria-level="5" class="title-black top-round" role="heading">
                <span>
                    Total
                </span>
            </div>
            <div class="bottom-round cont-gray p10" id="buyer_total">
                ${buyer_total_txt}
            </div>
         </div>
    `);

    //Fetch all items from Torn Server
    getItems(API_KEY).then(() => {
        //Left user = Seller
        calculateTotal('left')
        //Right user = Buyer
        calculateTotal('right')
    })
}

function calculateTotal(side) {
    let totalValue = 0
    //Get money
    let moneyAdded = $(`.user.${side} .color1`).text().match(/\d+/gm)
    if (moneyAdded) {
        totalValue += moneyAdded.join('') * 1
    }

    // Loop through item list
    const itemsArray = $(`.user.${side} .cont .color2 li`)
    if (itemsArray) {
        itemsArray.each(function () {
            let text = $(this).text()
            let nameRaw = text.match(/.+?(?=x\d+)/gm)
            if (nameRaw) {
                let name = nameRaw[0].trim()
                let quantity = text.match(/x\d+/gm)[0].replace('x', '')
                let itemStats = getItemByName(name)
                totalValue += itemStats.market_value * quantity
            }
        })
    }

    // Loop through stock list
    const stocksArray = $(`.user.${side} .cont .color4 li`)
    stocksArray.each(function () {
        let blockValue = $(this).text().match(/(?<=\(\$)(.*?)(?=\s*total\))/gm)
        if (blockValue) {
            totalValue += blockValue[0].replace(/,/gm, '') * 1
        }
    })

    //Update total & display
    updateTotal(side, (totalValue).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    }))
}

function getItems(api_key) {
    return new Promise((resolve, reject) => {
        let ret = GM_xmlhttpRequest({
            method: "GET",
            url: `https://api.torn.com/torn/?selections=items&key=${api_key}`,
            onreadystatechange: function (res) {
                if (res.readyState === 4 && res.status === 200) {
                    const parsedRes = JSON.parse(res.responseText)
                    Items = parsedRes.items
                    resolve()
                }
            },
            onerror: function (err) {
                console.log(err)
            }
        })
    }).catch(e => {
        console.log(e)
    });
}

function getItemByName(name) {
    // case-sensitive and spaces required
    return Items[Object.keys(Items).find(key => Items[key].name == name)]
}

function updateTotal(user, value) {
    if (user === 'left') {
        $("#seller_total").html(`<font color="green">${value}</font>`);
    } else if (user === 'right') {
        $("#buyer_total").html(`<font color="green">${value}</font>`);
    }
}
