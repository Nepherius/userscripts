'use strict'
// ==UserScript==
// @name        No stealth warning - Underconstruction
// @author      nepherius[2009878]
// @description Display a warning when an attack was not stealth
// @match       https://www.torn.com/loader.php*
// @version     0.0.1
// @updateURL   https://github.com/Nepherius/userscripts/raw/master/no_stealth_warn.user.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @run-at      document-start
// ==/UserScript==



waitForKeyElements(".participants-scrollbar", setup)

function setup() {
    const participants = $('.participants-scrollbar')
    console.log($(participants).find('.name'))
}

