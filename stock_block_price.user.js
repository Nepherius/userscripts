'use strict'
// ==UserScript==
// @name        Stock Block Price
// @author      nepherius[2009878]
// @description Display to full price required for a block of each stock
// @match       https://www.torn.com/stockexchange.php
// @version     0.0.2
// @updateURL   https://raw.githubusercontent.com/Nepherius/userscrips/master/stock_block_price.user.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @run-at      document-start
// ==/UserScript==

//Setup listenet for trade window
waitForKeyElements(".stock-list", setup)

function setup() {
    const stockList = $('.stock-list').find('li')
    stockList.each(index => {
        let stock = stockList[index]
        const abbr = $(stock).find('.abbr-name').text()
        const priceBox = $(stock).find('.price')
        const shareCost = priceBox.text().match(/\d+[,.]\d+([,.]\d+)?/g)
        const owned = $(stock).find('.owned').text().match(/\d+[,.]\d+([,.]\d+)?/g)
        const blockCost = shareCost[0].replace(',', '') * Stocks[abbr]
        priceBox.html(`<p class="point-block___xpMEi">${toCurrency(blockCost)}</p><p class="point-block___xpMEi" >@ ${toCurrency(Number(shareCost[0].replace(',', '')))}</p>`)
    })
}

const Stocks = {
    TCSE: 0,
    MCS: 1750000,
    BAG: 3000000,
    TCHS: 150000,
    PRN: 1500000,
    LSC: 100000,
    WLT: 9000000,
    ISTC: 100000,
    TMI: 6000000,
    SYM: 500000,
    SYS: 3000000,
    TSBC: 4000000,
    EVL: 1750000,
    IOU: 3000000,
    CNC: 5000000,
    TCM: 1000000,
    FHG: 2000000,
    TCB: 1500000,
    EWM: 2000000,
    HRG: 1500000,
    TCC: 350000,
    TCP: 1000000,
    GRN: 500000,
    SLAG: 1500000,
    TCT: 125000,
    ELBT: 5000000,
    MSG: 300000,
    TGP: 2500000,
    WSSB: 1000000,
    IIL: 100000,
    YAZ: 1000000
}

function toCurrency(amount) {
    console.log(amount)
    return amount.toLocaleString(
        'en', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
    )
}