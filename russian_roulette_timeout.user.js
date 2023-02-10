// ==UserScript==
// @name        Russian Roulette Timeout - torn.com
// @namespace   Violentmonkey Scripts
// @match       https://www.torn.com/page.php?sid=russianRoulette
// @grant       none
// @version     1.1
// @author      nepherius[2009878]
// @updateURL   https://github.com/Nepherius/userscripts/raw/master/russian_roulette_timeout.user.js
// @description Estimate when a game will timeout
// @run-at      document-end
// ==/UserScript==

//* Editable settings
const timeoutInMinutes = 15;
const isDebugModeEnabled = false;

//! Editing anything below might break the script
/**
 * This is the class name that contains the active games list, the format seems
 *  to be "rowsWrap__*", use `startsWith` selector to find it instead of
 * hard-coding a value as it might change on future torn updates.
 */
const gameListClassSelector = "[class^=rowsWrap]";
if (!gameListClassSelector) {
  return console.error(
    "Failed to find the gamelist with class name: " + gameListClassSelector
  );
}
/**
 * This is the class used to display the 'No active games message'
 * will be used to determine when the game list observer should be active.
 * "placeholder__*"
 */
const placeholderClassSelector = "[class^=placeholder]";
if (!placeholderClassSelector) {
  return console.error(
    "Failed to find the placeholder div with class name: " +
      gameListClassSelector
  );
}

const documentObserverConfig = {
  attributes: true,
  childList: true,
  subtree: true,
};
const gameObserverConfig = {
  attributes: true,
  childList: true,
  subtree: false,
};

/**
 * Observer function that watched for changes in the main document,
 * it searches for @gameListClassSelector and activates [gameListObserver]
 * MutationObserver when it's found
 */
const onMainDocumentMutation = function (
  mutationList,
  gameListClassSelectorObserver
) {
  logDebugMessage("Main observer initiated");

  mutationList.forEach(function (mutation) {
    // Only interested in mutations with childList `type` and
    // the `target` `div.cont-gray.bottom-round`
    if (mutation.type === "childList") {
      /**
       * If the @placeholder div is present, then there no active games,
       * so we should disconnect [activeGameObserver]
       */
      if (document.querySelector(placeholderClassSelector)) {
        logDebugMessage("No active games, disconnecting observer");
        activeGameListObserver.disconnect();
      } else if (document.querySelector(gameListClassSelector)) {
        logDebugMessage("Active games found, observing...");
        // Activate the observer
        const activeGameList = document.querySelector(gameListClassSelector);
        activeGameListObserver.observe(activeGameList, gameObserverConfig);
      }
    }
  });
};

// Callback function to execute when mutations are observed
const onActiveGameListMutation = function (mutationList, observer) {
  mutationList.forEach(function (mutation) {
    if (mutation.addedNodes.length > 0) {
      const addedNode = mutation.addedNodes[0];
      if (mutation.type === "childList") {
        logDebugMessage("Found new entry, estimating timeout");
        const children = addedNode.children[0]?.children;
        for (child in children) {
          const className = children[child].className;
          if (className && className.match(/statusBlock/g)) {
            // Replace "Waiting for an opponent" with @timeoutString
            children[child].children[0].textContent = getTimeoutString();
          }
        }
      }
    }
  });
};

/**
 * Takes a String and returns it if debugging is enabled
 * @param {String} message
 */
function logDebugMessage(message) {
  if (isDebugModeEnabled) console.log(message);
}

/**
 *
 * @returns Timeleft until the game should timeout
 */
function getTimeoutString() {
  const now = new Date();
  const estimatedTimeout = new Date(now.getTime() + timeoutInMinutes * 60000);
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
  return `Timeout: ${hours}:${minutes}:${seconds}`;
}

//* Create the main and the game list observer instances
/**
 * Watch the entire document for changes and see when the game list is active.
 */
const documentObserver = new MutationObserver(onMainDocumentMutation);

/**
 * Watch the game list for changes and apply the timeout to new games
 */
const activeGameListObserver = new MutationObserver(onActiveGameListMutation);

//* Initilize the main document observer
documentObserver.observe(document, documentObserverConfig);
