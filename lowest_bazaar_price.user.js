'use strict'
// ==UserScript==
// @name        Lowest Bazaar Price
// @author      nepherius[2009878]
// @description Display the lowest bazaar price, on itemmarket/bazzar add item page.
// @match       https://www.torn.com/bazaar.php*
// @include     https://www.torn.com/imarket.php*
// @connect     api.torn.com
// @version     0.0.1
// @updateURL   https://github.com/Nepherius/userscripts/raw/master/lowest_bazaar_price.user.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @run-at      document-start
// ==/UserScript==


let API_KEY;
let Items;
if (!GM_getValue('api_key')) {
    let key = prompt('Please enter your Torn API Key, this will be stored locally!')
    GM_setValue('api_key', key)
    API_KEY = key
} else {
    API_KEY = GM_getValue('api_key')
}

waitForKeyElements(".info-active.item-active.actions-active", setup)

function setup() {
    let item = $('.info-active.item-active.actions-active')
    let itemId = $(item).find('.image-wrap img').attr('src').match(/(?<=items\/)(\d+)(?=\/)/gi)[0]
    console.log('result:', itemId)
    bazaarList(API_KEY, itemId).then(async (list) => {
        let lowestPrice = findLowestPrice(list)
        let boXtoReplace = $(item).find('.show-item-info .info-content .t-right')[0]
        $(boXtoReplace).html(`<div class="title">Bazaar buy:</div>
        <div class="desc">${toCurrency(lowestPrice)}</div>
        <div class="clear"></div>`)
    })
}


function findLowestPrice(list) {
    let lowest;
    for (let bazaar in list) {
        if (!lowest) {
            lowest = list[bazaar]['cost']
        } else if (list[bazaar]['cost'] < lowest) {
            lowest = list[bazaar]['cost']
        }
    }
    return lowest
}

function toCurrency(amount) {
    return amount.toLocaleString(
        'en', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
    )
}

function bazaarList(api_key, itemId) {
    return new Promise((resolve, reject) => {
        let ret = GM_xmlhttpRequest({
            method: "GET",
            url: `https://api.torn.com/market/${itemId}?selections=bazaar&key=${api_key}`,
            onreadystatechange: function (res) {
                if (res.readyState === 4 && res.status === 200) {
                    const parsedRes = JSON.parse(res.responseText)
                    list = parsedRes.bazaar
                    resolve(list)
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