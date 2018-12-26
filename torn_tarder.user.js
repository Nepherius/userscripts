// ==UserScript==
// @name        Torn Tarder
// @author      nepherius[2009878]
// @description Calculates total value of items in trade
// @match       https://www.torn.com/trade.php
// @version     1.0.0
// @updateURL   https://raw.githubusercontent.com/Nepherius/userscrips/master/torn_tarder.user.js
// @supportURL   https://www.torn.com/forums.php#/forums.php?p=threads&f=67&t=16074804&b=0&a=0
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
let Items;
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
    // Wait for page load, dirty fix until better sollution
    setTimeout(function () {
        setup()
    }, 1500)
});


// Add display boxes and start searching for items
function setup() {
    let seller_total_txt = '<font color="gray">Searching for items...</font>';
    let buyer_total_txt = '<font color="gray">Searching for items...</font>';

    $(".trade-cont").after(`
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

    $(".trade-cont").after(`
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
    const money = $(`.user.${side} .color1`).text().match(/\d+/gm).join('') * 1

    // Loop through item list
    $(`.user.${side} .cont .color2 li`).each(function () {
        let text = $(this).text()
        let name = text.match(/.+?(?=x\d+)/gm)[0].trim()
        let quantity = text.match(/x\d+/gm)[0].replace('x', '')
        let itemStats = getItemByName(name)
        totalValue += itemStats.market_value * quantity
    })
    // Loop through stock list
    $(`.user.${side} .cont .color4 li`).each(function () {
        let blockValue = $(this).text().match(/(?<=\(\$)(.*?)(?=\s*total\))/gm)[0].replace(/,/gm, '') * 1
        totalValue += blockValue
    })
    totalValue += money

    //Update total & display
    updateTotal(side, (totalValue).toLocaleString('en-US', {
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
                Items = res.items
                resolve()
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

function getItemByName(name) {
    // case-sensitive and spaces required:
    return Items[Object.keys(Items).find(key => Items[key].name == name)]
}

function updateTotal(user, value) {
    if (user === 'left') {
        $("#seller_total").html(`<font color="green">${value}</font>`);
    } else if (user === 'right') {
        $("#buyer_total").html(`<font color="green">${value}</font>`);
    }
}