// collectibles.js
    
CollectiblesJS.createSecrets = function(secretURL, numShards) {
    numShards = parseInt(numShards, 10);
    const secretURLHex = secrets.str2hex(secretURL);
    const shares = secrets.share(secretURLHex, numShards, numShards);
    return shares;
};

CollectiblesJS.redeemSecrets = function(secretsArray) {
    const secretHex = secrets.combine(secretsArray);
    const secret = secrets.hex2str(secretHex);
    return secret;
};

CollectiblesJS.changeTheme = function(theme) {
    const newTheme = "collectible-theme-" + theme;
    const oldTheme = document.body.className.match(/(collectible-theme-)\w+/)[0];
    document.body.classList.replace(oldTheme, newTheme);
};

function CollectiblesJS(config) {
    "use strict";
    
    // Consts from config

    const INSTALL_ID = config.installID || 1;
    const KEY_VERSION = config.itemVersion || 1;
    const STORAGE = config.persistent ? localStorage : sessionStorage;
    const NUM_ITEMS = config.numItems || 5;
    const THEME = config.theme || "keys";
    const POSITION = config.position || "left";
    const CALLBACK = config.keyCollectedCallback || null;
    
    document.body.classList.add("collectible-theme-" + THEME);
    document.body.classList.add("collectible-position-" + POSITION);
    
    function createItemElement(keyid) {
        const el = document.createElement("div");
        el.className = "collectible-item collectible-item-collected";
        el.dataset.keyid = keyid;
        const innerel = document.createElement("div");
        innerel.className = "collectible-item-inner";
        el.appendChild(innerel);
        return el;
    }
    
    function getCollectedItems() {
        const obj = JSON.parse(STORAGE.getItem("collectible-js-items-" + INSTALL_ID));
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
            const secret = CollectiblesJS.redeemSecrets(itemArray);
            const secretLinkEl = document.getElementById("collectible-secret-link");
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
    
    let presentingTimeout;
    // Runs when a collectible item element is clicked
    function itemClickHandler(e) {
        const item = e.target;
        const keyid = item.dataset.keyid;
        const coin_offset = item.getBoundingClientRect();
        const spot_offset = itemSpots[keyid].getBoundingClientRect();
        const coin_spot_offset = {top: coin_offset.top - spot_offset.top, left: coin_offset.left - spot_offset.left};
        
        const itemDup = item.cloneNode(true);
        item.style.visibility = "hidden";
        itemDup.removeAttribute("style");
        itemDup.style.visibility = "visible";
        itemDup.style.position = "absolute";
        itemDup.style.top = "0";
        itemDup.style.left = "0";
        itemDup.style["pointer-events"] = "none";
        itemDup.classList.add("collectible-item-collected");
        itemSpots[keyid].appendChild(itemDup);
        
        if (itemDup.animate) {
            itemDup.animate({
                transform: ["translate(" + coin_spot_offset.left + "px, " + coin_spot_offset.top + "px)", "none"]
            }, {
                duration: 500,
                easing: "ease-in-out"
            });
        }
        
        // Record key in storage
        
        const collectedItems = getCollectedItems();
        collectedItems[keyid] = itemDup.dataset.key;
        setCollectedItems(collectedItems);
        
        notifyItemsChanged(collectedItems);
        
        drawer.classList.add("presenting");
        window.clearTimeout(presentingTimeout);
        presentingTimeout = window.setTimeout(function() {
            drawer.classList.remove("presenting");
        }, 3000);
        
        // Call callback
        
        if (CALLBACK) CALLBACK(keyid);
    }
    
    const initialCollectedItems = getCollectedItems();
    
    for (let item of Array.from(document.getElementsByClassName("collectible-item"))) {
        
        // Initialize element
        
        const inner = document.createElement("div");
        inner.className = "collectible-item-inner";
        item.appendChild(inner);
        
        item.title = "Click me!";
        item.alt = "Collectible item (Click me!)";
        if (!initialCollectedItems[item.dataset.keyid]) item.style.visibility = "visible"; // Show only uncollected keys
        
        // Add click behavior
        
        item.addEventListener("click", itemClickHandler);
        
    }
    
    // Create drawer
    
    const drawerStr =`
    <div id="collectible-item-drawer">
        <div id="collectible-item-chest-holder">
            <a id="collectible-secret-link">
                <div id="collectible-item-chest"></div><br>
                Click to<br>collect reward!
            </a>
        </div>
        <div id="collectible-item-holder">
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', drawerStr);
    const drawer = document.getElementById("collectible-item-drawer");
    const holder = document.getElementById("collectible-item-holder");
    
    const itemSpots = [];
    for (let i = 0; i < NUM_ITEMS; i++) {
        // Create spot
        const itemSpot = document.createElement("div");
        itemSpot.className = "collectible-item-spot";
        holder.appendChild(itemSpot);
        itemSpots.push(itemSpot);
        // Create already-collected key element into spot
        if (initialCollectedItems[i]) itemSpot.appendChild(createItemElement(i));
    }
    
    // Add question mark to holder
    
    const microtipPosition = {
      left: "right",
      right: "left"
    };
    
    holder.insertAdjacentHTML('beforeend', '<div class="collectible-help" aria-label="Find all ' + NUM_ITEMS + ' collectibles on this website!" data-microtip-position="' + microtipPosition[POSITION] + '" role="tooltip"></div>');
    
    // Upon initial page load, user may already have all items
    // So we do this check after initialization
    notifyItemsChanged(initialCollectedItems);
}
