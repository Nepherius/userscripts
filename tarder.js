// ==UserScript==
// @name        Torn Tarder
// @author      nepherius[2009878]
// @description Calculates total value of items in trade
// @match       https://www.torn.com/trade.php
// @version     0.0.1
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @run-at      document-start
// ==/UserScript==
'use strict'

// Uncomment the following line if you enter the wrong api key, comment it again once you've set your key
// GM_deleteValue('api_key')

let API_KEY;
if (!GM_getValue('api_key')) {
    let key = prompt('Please enter your Torn API Key, this will be stored locally!')
    GM_setValue('api_key', key)
    API_KEY = key
} else {
    API_KEY = GM_getValue('api_key')
}

// Listen for page change
window.addEventListener('hashchange', function (e) {
    // Do nothing if not viewing a trade
    if (!/step=view&ID=/.test(location.hash)) {
        //TODO clean up if leaving active trade
        return
    }
    setTimeout(function () {
        setup()
    }, 1500)
});



function setup() {
    let seller_total_txt = '<font color="gray">Searching for items...</font>';
    let buyer_total_txt = '<font color="gray">Searching for items...</font>';
    $(".trade-cont").after(`
            <div id="seller"  style="width:250px; text-transform: capitalize;">
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

    $(".trade-cont").after(`
        <div id="buyer" class="right" style="width:250px; text-transform: capitalize;">
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
    getItems(API_KEY).then(items => {
        calculateSellerTotal(items)
    })
}


function calculateSellerTotal(items) {
    const money = $('.user.left .color1').text().match(/\d+/gm) * 1
    let totalValue = 0
    // item value
    $('.user.left .cont .color2 li').each(function () {
        let text = $(this).text()
        let name = text.match(/.+?(?=x\d+)/gm)[0].trim()
        let quantity = text.match(/x\d+/gm)[0].replace('x', '')
        let itemStats = getItemByName(name, items)
        totalValue += itemStats.market_value * quantity
    });
    $('.user.left .cont .color4 li').each(function () {
        let blockValue = $(this).text().match(/(?<=\(\$)(.*?)(?=\s*total\))/gm)[0].replace(/,/gm, '') * 1
        totalValue += blockValue
    })
    totalValue += money
    updateTotal('seller', (totalValue).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    }))
}


function getItems(api_key) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', `https://api.torn.com/torn/?selections=items&key=${api_key}`, true)
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const res = JSON.parse(xhr.responseText)
                resolve(res.items)
            }
        };
        xhr.onerror = function () {
            console.log(xhr.statusText)
            reject('Fetch error');
        };
        xhr.send(null)
    }).catch(e => {
        console.log(e)
    });
}

function getItemByName(name, items) {
    // case-sensitive and spaces required:
    return items[Object.keys(items).find(key => items[key].name == name)]
}

function updateTotal(user, value) {
    if (user === 'seller') {
        $("#seller_total").html(`<font color="green">${value}</font>`);
    } else if (user === 'buyer') {
        $("#buyer_total").html(`<font color="green">${value}</font>`);
    }
}