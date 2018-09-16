"use strict";

const SCRIPT_DIRECTORY = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf("/"));

// Web animation API polyfill

let animationTestEl = document.createElement("div");
if (!animationTestEl.animate) {
    let polyfill = document.createElement('script');
    polyfill.setAttribute('src', SCRIPT_DIRECTORY + '/web-animations.min.js');
    document.head.appendChild(polyfill);
}

// Collectibles.js

function CollectiblesJS(config) {
    CollectiblesJS.createSecrets = function(secretURL, numShards) {
        numShards = parseInt(numShards, 10);
        let secretURLHex = secrets.str2hex(secretURL);
        let shares = secrets.share(secretURLHex, numShards, numShards);
        return shares;
    }

    CollectiblesJS.redeemSecrets = function(secretsArray) {
        let secretHex = secrets.combine(secretsArray);
        let secret = secrets.hex2str(secretHex);
        return secret;
    }

    const INSTALL_ID = config.installID || 1;
    const KEY_VERSION = config.itemVersion || 1;
    const STORAGE = config.persistent ? localStorage : sessionStorage;
    const NUM_ITEMS = config.numItems || 5;
    
    function createItemElement(keyid) {
        let el = document.createElement("div");
        el.className = "collectible-item collectible-item-collected collectible-item-" + keyid;
        el.dataset.keyid = keyid;
        let innerel = document.createElement("div");
        innerel.className = "collectible-item-inner";
        el.appendChild(innerel);
        return el;
    }
    
    function getCollectedItems() {
        let obj = JSON.parse(STORAGE.getItem("collectible-js-items-" + INSTALL_ID));
        if (!obj || obj.version < KEY_VERSION) return (new Array(NUM_ITEMS)).fill(false);
        return obj.items;
    }
    
    function setCollectedItems(itemArray) {
        STORAGE.setItem("collectible-js-items-" + INSTALL_ID, JSON.stringify({
            version: KEY_VERSION,
            items: itemArray
        }));
    }
    
    function allTruthy(array) {
        return array.every(Boolean);
    }
    
    function anyTruthy(array) {
        return array.some(Boolean);
    }
    
    // Updates whether the drawer is hidden, partially shown, or completely shown.
    // Grants secret if all items are collected.
    function notifyItemsChanged(itemArray) {
        // If all items are collected, grant secret
        function grantSecret(itemArray) {
            let secret = CollectiblesJS.redeemSecrets(itemArray);
            let secretLinkEl = document.getElementById("collectible-secret-link");
            secretLinkEl.href = secret;
            secretLinkEl.addEventListener("click", function(e) {
                STORAGE.removeItem("collectible-js-items-" + INSTALL_ID); // User has redeemed their keys!
            });
        }
        
        if (allTruthy(itemArray)) {
            drawer.className = "allItems";
            grantSecret(itemArray);
        }
        else if (anyTruthy(itemArray)) {
            drawer.className = "someItems";
        }
    }
    
    let initialCollectedItems = getCollectedItems();
    
    for (let item of Array.from(document.getElementsByClassName("collectible-item"))) {
        
        // Initialize element
        
        let inner = document.createElement("div");
        inner.className = "collectible-item-inner";
        item.appendChild(inner);
        
        item.classList.add("collectible-item-" + item.dataset.keyid);
        item.title = "Click me!";
        item.alt = "Collectible item (Click me!)";
        if (!initialCollectedItems[item.dataset.keyid]) item.style.visibility = "visible"; // Show only uncollected keys
        
        // Add click behavior
        
        var presentingTimeout;
        
        item.addEventListener("click", function(e) {
            let keyid = item.dataset.keyid;
            let coin_offset = item.getBoundingClientRect();
            let spot_offset = itemSpots[keyid].getBoundingClientRect();
            let coin_spot_offset = {top: coin_offset.top - spot_offset.top, left: coin_offset.left - spot_offset.left};
            
            let itemDup = item.cloneNode(true);
            item.style.visibility = "hidden";
            itemDup.removeAttribute("style");
            itemDup.style.visibility = "visible";
            itemDup.style.position = "absolute";
            itemDup.style.top = "0";
            itemDup.style.left = "0";
            itemDup.style["pointer-events"] = "none";
            itemDup.classList.add("collectible-item-collected");
            itemSpots[keyid].appendChild(itemDup);
            
            itemDup.animate({
                transform: ["translate(" + coin_spot_offset.left + "px, " + coin_spot_offset.top + "px)", "none"]
            }, {
                duration: 500,
                easing: "ease-in-out"
            });
            
            // Record key in storage
            
            let collectedItems = getCollectedItems();
            collectedItems[keyid] = itemDup.dataset.key;
            setCollectedItems(collectedItems);
            
            notifyItemsChanged(collectedItems);
            
            drawer.classList.add("presenting");
            window.clearTimeout(presentingTimeout);
            presentingTimeout = window.setTimeout(function() {
                drawer.classList.remove("presenting");
            }, 3000);
        });
    }
    
    // Create drawer
    
    let drawerStr =`
    <div id="collectible-item-drawer">
        <div id="collectible-item-chest-holder">
            <a id="collectible-secret-link">
                <img id="collectible-item-chest" src="` + SCRIPT_DIRECTORY + `/chest.svg"><br>
                Click to<br>collect reward!
            </a>
        </div>
        <div id="collectible-item-holder">
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', drawerStr);
    let drawer = document.getElementById("collectible-item-drawer");
    let holder = document.getElementById("collectible-item-holder");
    
    let itemSpots = [];
    for (let i = 0; i < NUM_ITEMS; i++) {
        // Create spot
        let itemSpot = document.createElement("div");
        itemSpot.className = "collectible-item-spot";
        holder.appendChild(itemSpot);
        itemSpots.push(itemSpot);
        // Create already-collected key element into spot
        if (initialCollectedItems[i]) itemSpot.appendChild(createItemElement(i));
    }
    
    // Add question mark to holder
    
    holder.insertAdjacentHTML('beforeend', '<div class="collectible-help" aria-label="Find all 5 keys on this website!" data-microtip-position="right" role="tooltip"></div>');
    
    // Upon initial page load, user may already have all items
    // So we do this check after initialization
    notifyItemsChanged(initialCollectedItems);
}
