'use strict'
// ==UserScript==
// @name        Faction Armory Supervisor
// @author      nepherius[2009878]
// @description Montior the faction's item usage
// @match       https://www.torn.com/factions.php*
// @version     0.0.1
// @updateURL   https://github.com/Nepherius/userscripts/raw/master/faction_armory_supervisor.user.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @run-at      document-start
// ==/UserScript==


///////////////////////////// EDIT HERE /////////////////////////
//Enter your Torn API Key below
const API_KEY = 'Enter API Here'
//If you're using your own server change the urls below
// Get data
const server_api_get = 'https://torn.market:8443/getarmoury'
// Update Data
const server_api_update = 'https://torn.market:8443/updatearmoury'
//
/////////////////////////////////////////////////////////////////


// Table Style
GM_addStyle(`
    #armoury_supervisor_table thead {
        color: blue;
        font-weight: bold
    }
    #armoury_supervisor_table tr:nth-child(even) {
        background-color: lightgrey
    }
    #armoury_supervisor_table tr:hover {
        background-color: lightblue
    }
    #armoury_supervisor_table  > td , th {
        border: 1px solid black;
    }
    #armoury_supervisor_table  > tfoot, th {
        text-align: center;
        background-color: lightblue
    }
`);

waitForKeyElements('#faction-news', init)

function init(jNode) {
    jNode.after(`
    <div id="armoury_supervisor" style="text-transform: capitalize;">
    <div aria-level="5" class="title-black top-round" role="heading">
        <span>Faction Armoury Supervisor</span>
    </div>
    <div class="bottom-round cont-gray" style="height: auto">
        Start Date <input id="date_start" type="date" />
        End Date   <input id="date_end" type="date" />
        <button id='analyse'>Analyse</button>
        <button id='update_armoury' style="float: right">Update</button>
        <table id="armoury_supervisor_table" class="bottom-round cont-gray" style="width: 100%; float: left;" border="2" cellpadding="1">
        <thead>
            <tr>
                <th>Name</th>
                <th>BB Refill</th>
                <th>SFAK</th>
                <th>FAK</th>
                <th>Blood Bag</th>
                <th>Morphine</th>
                <th>Xanax</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="7">By <a href="https://www.torn.com/profiles.php?XID=2009878">Nepherius</a></td>
            </tr>
        </tfoot>
        </table>
    </div>
</div>
`)
    const analyse_btn = document.querySelector('#analyse')
    const update_btn = document.querySelector('#update_armoury')
    analyse_btn.addEventListener('click', getData, false)
    update_btn.addEventListener('click', updateData, false)
}


function updateData() {
    updateRequest(API_KEY).then(res => {
        if (res.error) {
            console.log({
                errorCode: res.error,
                errorMessage: res.message
            })
        } else {
            console.log(res.message)
        }
    })
}

function getData() {
    const start_date = $('#date_start').val()
    const end_date = $('#date_end').val()
    // If either date is null stop here
    if (!start_date || !end_date) {
        return
    }
    getNews(start_date, end_date, API_KEY).then(events => {
        // Get all names without duplicates
        const distinctNames = [...new Set(events.map(event => event.user))]
        // Create the table object
        const tableData = {}
        for (let i = 0; i < distinctNames.length; i++) {
            tableData[distinctNames[i]] = {
                Refill: 0,
                SFAK: 0,
                FAK: 0,
                BloodBag: 0,
                Morphine: 0,
                Xanax: 0
            }
        }
        //Loop events, increment relevant category
        for (let i = 0; i < events.length; i++) {
            if (!events[i].item) {
                continue
            } else if (events[i].type === 'refill') {
                tableData[events[i].user].Refill = tableData[events[i].user].Refill + 1
            } else if (events[i].item.includes('Small First Aid Kit')) {
                tableData[events[i].user].SFAK = tableData[events[i].user].SFAK + 1
            } else if (events[i].item.includes('First Aid Kit')) {
                tableData[events[i].user].FAK = tableData[events[i].user].FAK + 1
            } else if (events[i].item.includes('Blood Bag')) {
                tableData[events[i].user].BloodBag = tableData[events[i].user].BloodBag + 1
            } else if (events[i].item.includes('Morphine')) {
                tableData[events[i].user].Morphine = tableData[events[i].user].Morphine + 1
            } else if (events[i].item.includes('Xanax')) {
                tableData[events[i].user].Xanax = tableData[events[i].user].Xanax + 1
            }
        }
        // Insert tableData into table body
        insertTableData(tableData)
    })
}


function insertTableData(tableData) {
    // Clear data if exists
    $("#armoury_supervisor_table tbody").empty();
    for (data in tableData) {
        let e = tableData[data]
        $('#armoury_supervisor_table > tbody').append(`
            <tr>
                <td>${data}</td>
                <td>${e.Refill}</td>
                <td>${e.SFAK}</td>
                <td>${e.FAK}</td>
                <td>${e.BloodBag}</td>
                <td>${e.Morphine}</td>
                <td>${e.Xanax}</td>
            </tr>
        `);
    }
}

function getNews(start_date, end_date, API_KEY) {
    return new Promise((resolve, reject) => {
        let data = {
            start_date: start_date,
            end_date: end_date,
            API_KEY: API_KEY
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: server_api_get,
            data: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            },
            onreadystatechange: function (res) {
                if (res.readyState === 4 && res.status === 200) {
                    const parsedRes = JSON.parse(res.responseText)
                    resolve(parsedRes[0].armoury)
                }
            },
        });
    }).catch(e => {
        console.log(e)
    });
}

function updateRequest(API_KEY) {
    return new Promise((resolve, reject) => {
        let data = {
            API_KEY: API_KEY
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: server_api_update,
            data: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            },
            onreadystatechange: function (res) {
                if (res.readyState === 4 && res.status === 200) {
                    const parsedRes = JSON.parse(res.responseText)
                    resolve(parsedRes)
                }
            },
        });
    }).catch(e => {
        console.log(e)
    });
}