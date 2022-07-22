// ==UserScript==
// @name        Russian Roulette Timeout - torn.com
// @namespace   Violentmonkey Scripts
// @match       https://www.torn.com/page.php?sid=russianRoulette
// @grant       none
// @version     1.0
// @author      nepherius[2009878]
// @updateURL   https://github.com/Nepherius/userscripts/raw/master/russian_roulette_timeout.user.js
// @description Estimate when a Russian Roulette game will timeout
// @run-at      document-end
// ==/UserScript==

const actievGameTimeout = 15;

// Options for the observers (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };
const gameObserverConfig = {
  attributes: true,
  childList: true,
  subtree: false,
};

// @targetClassName contains the game list
const targetClassName = ".rowsWrap___avtOg";

// Callback function to execute when mutations are observed
const onGameListChange = function (mutationList, observer) {
  // Use traditional 'for loops' for IE 11
  for (const mutation of mutationList) {
    // If there's a mutation to the childList and that mutation adds a child
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      // Get current time
      const now = new Date();
      // Add timeout
      const estimatedTimeout = new Date(
        now.getTime() + actievGameTimeout * 60000
      );
      // Get hours, minutes, seconds
      const hours =
        estimatedTimeout.getHours() < 10
          ? "0" + estimatedTimeout.getHours()
          : estimatedTimeout.getHours();
      const minutes =
        estimatedTimeout.getMinutes() < 10
          ? "0" + estimatedTimeout.getMinutes()
          : estimatedTimeout.getMinutes();
      const seconds =
        estimatedTimeout.getSeconds() < 10
          ? "0" + estimatedTimeout.getSeconds()
          : estimatedTimeout.getSeconds();
      const timeoutString = `Timeout: ${hours}:${minutes}:${seconds}`;
      //const divId = mutation.addedNodes[0].id;
      // Select the relevant child, easier to not break format
      const children = mutation.addedNodes[0].children[0]?.children;
      for (child in children) {
        const className = children[child].className;
        if (className && className.match(/statusBlock/g)) {
          // Replace "Waiting for an opponent" with @timeoutString
          children[child].children[0].textContent = timeoutString;
        }
      }
    }
  }
};

// Create an observer instance linked to the callback function
const activeGameListObserver = new MutationObserver(onGameListChange);

// Function to call for @targetClassNameObserver
const waitForTargetClassName = function (
  mutationList,
  targetClassNameObserver
) {
  if (document.querySelector(".rowsWrap___avtOg")) {
    // We no longer need to observe this node
    targetClassNameObserver.disconnect();

    // Get the @activeGameList
    const activeGameList = document.querySelector(".rowsWrap___avtOg");
    activeGameListObserver.observe(activeGameList, gameObserverConfig);
  }
};

// Create an observer to find @targetClassName - wait for page to load
const targetClassNameObserver = new MutationObserver(waitForTargetClassName);

// Search for @targetClassName by observering changes in the full document
targetClassNameObserver.observe(document, config);
