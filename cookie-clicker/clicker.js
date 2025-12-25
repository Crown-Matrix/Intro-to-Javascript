const versionInt = 1; //increment this when making breaking changes to save data structure
scrollTo(0,0); //ensure page is scrolled to top on load

//import upgrades data
let response = await fetch("/upgradesJSON/clickUpgrades.json");
var importedClickUpgradesJsonData = await response.json();

let passiveResponse = await fetch("/upgradesJSON/passiveUpgrades.json");
var importedPassiveUpgradesJsonData = await passiveResponse.json();

//global game variables(hoisted)
var shopOpen = false;
var testingMode = false; //set to true to enable testing command terminal

var clickUpgradeList = importedClickUpgradesJsonData; //object of objs
var clickUpgradesArray = Object.values(clickUpgradeList); //array of objs

var passiveUpgradeList = importedPassiveUpgradesJsonData; //object of objs
var passiveUpgradesArray = Object.values(passiveUpgradeList); //array of objs



//register service worker for image caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/cookie-clicker/image-cacher.js')
    .then(reg => {
      console.log('Service Worker registered!', reg);
    })
    .catch(err => {
      console.error('SW registration failed:', err);
    });
}

//check if there is saved data
const savedData = localStorage.getItem('clickerGameAutoSaveData');
console.log("Retrieved saved data from localStorage: ", savedData);
//if there is, load it
if (savedData) {
    console.log("Saved data found, loading...");
    try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.versionInt !== versionInt) {
            console.warn("Saved data version (" + parsedData.versionInt + ") does not match current version (" + versionInt + "). Save data may be incompatible.")
        }
        var cookieCount = parsedData.cookieCount || 0;
        var cookieRate = parsedData.cookieRate || 1;
        var ownedUpgradesDict = parsedData.ownedUpgradesDict || {};
        //load settings
        document.getElementById("shortNumbersCheckbox").checked = parsedData.shortNumbersEnabled || false;
        document.getElementById("autoSaveCheckbox").checked = parsedData.autoSaveEnabled || false;
        document.getElementById("bakery-name-span").innerText = parsedData.bakeryName || "Jane Doe";
        document.getElementById("bakery-name-s-span").innerText = (parsedData.bakeryName || "Jane Doe").endsWith("s") ? "" : "s";
        updateCookieDisplay();
        updateCookieRate();
        console.log("successfully Loaded saved data: ", parsedData);
    } catch (e) {
        console.error("Error parsing saved data: ", e);
    }
} else {
    var cookieCount = 0;
    var cookieRate = 1;
    var ownedUpgradesDict = {};
    updateCookieDisplay();
    updateCookieRate();
    console.log("No saved data found, starting new game.");
}

//auto save every 30 seconds
setInterval(function() {
    const autoSaveEnabled = document.getElementById("autoSaveCheckbox").checked;
    if (!autoSaveEnabled) {
        console.log("Auto-save is disabled, skipping auto-save.");
        return;
    }
    console.log("Auto-saving game...");
    var vars_obj = {
        "cookieCount" : cookieCount,
        "cookieRate" : cookieRate,
        "ownedUpgradesDict" : ownedUpgradesDict,
        "shortNumbersEnabled" : document.getElementById("shortNumbersCheckbox").checked,
        "autoSaveEnabled" : document.getElementById("autoSaveCheckbox").checked,
        "bakeryName" : document.getElementById("bakery-name-span").innerText,
        "lastAutoSaveTime" : Date.now(),
        "versionInt" : versionInt
    };
    localStorage.setItem('clickerGameAutoSaveData', JSON.stringify(vars_obj));
}, 30000);

//helper function to clear saved data
function removeSaveData() {
    localStorage.removeItem('clickerGameAutoSaveData');
    console.log("Cleared saved data from localStorage.");
}

//testing command terminal
if (testingMode) {
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.id = "terminal-input";
    inputElement.placeholder = "Enter command here";
    inputElement.style.position = "sticky";
    inputElement.style.bottom = "0";
    inputElement.style.left = "50%";
    inputElement.style.transform = "translateX(-50%)";
    inputElement.style.backgroundColor = "black";
    inputElement.style.color = "green";
    inputElement.style.fontWeight = "bold";
    document.body.appendChild(inputElement);
    document.getElementById("terminal-input").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            //run it as javascript code
            const command = document.getElementById("terminal-input").value;
            try {
                const result = eval(command);
                //handle GUI for any var changes
                updateCookieDisplay();
                updateCookieRate();
                console.log("Command result: ", result);
            } catch (error) {
                console.error("Error executing command: ", error);
            }
            document.getElementById("terminal-input").value = '';
        }
    });
}

//update document title every second
const docTitleintervalId = setInterval(function() {
    document.title = "Cookies: " + humanizeNumber(cookieCount);
}, 1000);


//buttons 'click' event listeners
document.getElementById("cookie").addEventListener("click", function() {
    cookieClick();
});
document.getElementById("shop-button").addEventListener("click", function() {
    shopOpen = true;
    openShop();
});



let cKeyPressed = false; //so they cant just hold down the key to auto click
document.addEventListener("keydown", function(event) {
    if ((event.key === 'c' || event.key === 'C') && !cKeyPressed) {
        cKeyPressed = true;
        cookieClick();
    }
});
//reset c key press state
document.addEventListener("keyup", function(event) {
    if (event.key === 'c' || event.key === 'C') {
        cKeyPressed = false;
    }
});
document.addEventListener("keydown", function(event) {
    if (event.key === 's' || event.key === 'S') {
        shopToggle();
    }
});

//function to handle cookie click
function cookieClick() {
    // Increment cookie count and update display
    cookieCount += cookieRate;
    updateCookieDisplay();
    //click animation
    const cookieElement = document.getElementById("cookie");
    cookieElement.style.transform = "scale(0.95)";
    setTimeout(() => {
        cookieElement.style.transform = "scale(1.05)";
        setTimeout(() => {
            cookieElement.style.transform = "scale(1)";
        }, 100);
    }, 100);
}


setInterval(function() {
    //auto clicker functionality
    const autoClickerOwned = ownedUpgradesDict["Auto Clicker"] || 0;
    if (autoClickerOwned !== 0) {
    // Increment cookie count and update display
    cookieCount += cookieRate * autoClickerOwned;
    updateCookieDisplay();
    //click animation
    const cookieElement = document.getElementById("cookie");
    cookieElement.style.transform = "scale(0.95)";
    setTimeout(() => {
        cookieElement.style.transform = "scale(1.05)";
        setTimeout(() => {
            cookieElement.style.transform = "scale(1)";
        }, 100);
    }, 100);
}
},1000);


function updateCookieDisplay() {
    document.getElementById("score-int").innerText = humanizeNumber(cookieCount);
    document.getElementById("score-int-2").innerText = humanizeNumber(cookieCount);
    document.getElementById("cookie-score-div").style.fontSize = "1.25em";
    //document.getElementById("cookie-score-div").style.width = (document.getElementById("score-int").innerText.length * 0.6 + 4) + "em";
}

//for "s" key input
function shopToggle() {
    shopOpen = !shopOpen;
    if (shopOpen) {
        openShop();
    } else {
        closeShop();
    }
}
//function to open shopUI, populate it with upgrades from imported JSON data
function openShop() {
    console.log("Shop toggled. Now shopOpen=" + shopOpen);
    document.querySelector(".right-axis").style.justifyContent = "flex-start";


    const openShopButton = document.getElementById("shop-button");
    if (openShopButton) {
        openShopButton.remove();
    }//may not exist if switching back from passive shop
    const shopDiv = document.getElementById("shop-container");
    const title_element = document.createElement("h3");
    title_element.id = "shop-title-header";
    title_element.innerText = "CookiesPerClick Upgrades Shop";
    shopDiv.appendChild(title_element);

    //shopDiv.style.borderTop = "10px solid black";
    //shopDiv.style.borderBottom = "10px solid black";
    //for top and bottom black borders

    shopDiv.style.overflowY = "auto";
    //add close shop button at top before population
    const shopMenuSwitcher = document.createElement("div");
    shopMenuSwitcher.id = "shop-menu-switcher";
    shopDiv.appendChild(shopMenuSwitcher);
    const shopBtnSwitcher = document.createElement("button");
    shopBtnSwitcher.id = "shop-btn-switcher";
    shopBtnSwitcher.innerText = "Close Shop (S)";
    shopBtnSwitcher.classList.add("not-selectable");
    shopBtnSwitcher.addEventListener("click", function() {
        shopOpen = false;
        closeShop();
    });
    shopMenuSwitcher.appendChild(shopBtnSwitcher);
    shopDiv.appendChild(shopMenuSwitcher);
    //add secondary shop button
    const passiveShopButton = document.createElement("button");
    passiveShopButton.id = "passive-shop-button";
    passiveShopButton.innerText = "Passive Upgrades Shop";
    passiveShopButton.classList.add("not-selectable");
    passiveShopButton.addEventListener("click", function() {
        console.log("Switching to Passive Upgrades Shop");
        passiveShop();
    });
    shopMenuSwitcher.appendChild(passiveShopButton);
    //populate shop with upgrades
    for (let i = 0; i < clickUpgradesArray.length; i++) {
        const current_obj = clickUpgradesArray[i]
        const div = document.createElement("div")
        const name_div = document.createElement("div")
        const cost_div = document.createElement("div")
        const cost_p = document.createElement("p")
        const quantity_div = document.createElement("div")
        const quantity_p = document.createElement("p")
        div.style.minWidth = "fit-content";
        quantity_p.classList.add('not-selectable');
        quantity_p.innerText = "Owned: " + (ownedUpgradesDict[current_obj.name] || 0);
        quantity_p.id = current_obj.name + "-quantity-p"
        quantity_div.appendChild(quantity_p);
        cost_p.classList.add('not-selectable');
        const imag_elem = document.createElement("img")
        imag_elem.classList.add('not-selectable');
        const upgradeAmtDiv = document.createElement("div")
        const p_upgradeAmt = document.createElement("p")
        p_upgradeAmt.classList.add('not-selectable');
        cost_p.id = current_obj.name + "-upgrade-amt-p"
        const upgradeAmt = current_obj.cps;
        p_upgradeAmt.innerText = "+" + humanizeNumber(upgradeAmt) + " CPC";
        upgradeAmtDiv.appendChild(p_upgradeAmt);
        
        imag_elem.src = "/images/" + current_obj.name + ".png"
        imag_elem.alt = current_obj.name + " image"
        imag_elem.classList.add("shop-upgrade-image")
        
        cost_p.innerText = "Cost: " + humanizeNumber(current_obj.baseCost)
        cost_div.appendChild(cost_p)
        name_div.innerText = current_obj.name
        name_div.classList.add("not-selectable");
        div.appendChild(imag_elem)
        div.appendChild(name_div)
        div.appendChild(upgradeAmtDiv);
        div.appendChild(cost_div)
        div.appendChild(quantity_div);
        

        div.classList.add("shop-upgrade-button");

        for (const child of div.children) {
            child.style.marginRight = "10px";
            child.style.maxWidth = "fit-content";
        }
        div.classList.add("shop-upgrade-div")
        div.id = current_obj.name + "-upgrade-div"
        shopDiv.appendChild(div);
    }
    shopDiv.scrollTop = 0;
    renderButtons();
    }


function passiveShop() {
    console.log("Passive Upgrades Shop opened");

    document.querySelector(".right-axis").style.justifyContent = "flex-start";
    //build passive shop UI
    const shopDiv = document.getElementById("shop-container");
    shopDiv.innerHTML = "";
    const title_element = document.createElement("h3");
    title_element.id = "shop-title-header";
    title_element.innerText = "Passive Upgrades Shop";
    shopDiv.appendChild(title_element);


    const shopMenuSwitcher = document.createElement("div");
    shopMenuSwitcher.id = "shop-menu-switcher";
    shopDiv.appendChild(shopMenuSwitcher);
    const shopBtnSwitcher = document.createElement("button");
    shopBtnSwitcher.id = "shop-btn-switcher";
    shopBtnSwitcher.innerText = "Close Shop (S)";
    shopBtnSwitcher.classList.add("not-selectable");
    shopBtnSwitcher.addEventListener("click", function() {
        shopOpen = false;
        closeShop();
    });
    shopMenuSwitcher.appendChild(shopBtnSwitcher);
    shopDiv.appendChild(shopMenuSwitcher);

    const clickShopButton = document.createElement("button");
    clickShopButton.id = "click-shop-button";
    clickShopButton.innerText = "Click Upgrades Shop";
    clickShopButton.classList.add("not-selectable");
    clickShopButton.addEventListener("click", function() {
        console.log("Switching to Click Upgrades Shop");
        shopDiv.innerHTML = "";
        openShop();
    });
    shopMenuSwitcher.appendChild(clickShopButton);
    for (let i = 0; i < passiveUpgradesArray.length+1; i++) {
        if (i == 0) {
            var current_obj = {"name": "Auto Clicker", "description": "Automatically Clicks over time", "baseCost": 1000}
        } else {
            var current_obj = passiveUpgradesArray[i-1]
        }
        const div = document.createElement("div")
        const name_div = document.createElement("div")
        const cost_div = document.createElement("div")
        const cost_p = document.createElement("p")
        const imag_div = document.createElement("div")
        const imag_elem = document.createElement("img")
        const quantity_div = document.createElement("div")
        const quantity_p = document.createElement("p")
        div.style.minWidth = "fit-content";
        quantity_p.classList.add('not-selectable');
        quantity_p.innerText = "Owned: " + (ownedUpgradesDict[current_obj.name] || 0);
        quantity_p.id = current_obj.name + "-quantity-p"
        quantity_div.appendChild(quantity_p);
        imag_elem.classList.add('not-selectable');
        imag_elem.src = "/images/" + current_obj.name + ".png"
        imag_elem.alt = current_obj.name + " image"
        imag_div.appendChild(imag_elem)
        imag_elem.classList.add("shop-upgrade-image")
        div.appendChild(imag_div)
        cost_p.classList.add('not-selectable');
        cost_p.id = current_obj.name + "-passive-upgrade-amt-p"
        cost_p.innerText = "Cost: " + humanizeNumber(current_obj.baseCost)
        cost_div.appendChild(cost_p)
        name_div.innerText = current_obj.name
        name_div.classList.add("not-selectable");
        div.appendChild(name_div)
        div.appendChild(cost_div)
        div.appendChild(quantity_div);

        div.classList.add("shop-upgrade-button");

        for (const child of div.children) {
            child.style.marginRight = "10px";
            child.style.maxWidth = "fit-content";
        }
        div.classList.add("shop-upgrade-div")
        div.id = current_obj.name + "-passive-upgrade-div"
        shopDiv.appendChild(div);

}
    shopDiv.scrollTop = 0;
    renderPassiveButtons();
}

//function to close shopUI by deletion and replacing with open shop button
function closeShop() {
    console.log("Shop toggled. Now shopOpen= " + shopOpen);
    document.querySelector(".right-axis").style.justifyContent = "center";

    const shopDiv = document.getElementById("shop-container");
    shopDiv.style.border = "none";
    shopDiv.style.boxSizing = "content-box";
    shopDiv.innerHTML = '';
    shopDiv.style.overflowY = "visible";
    const shopButton = document.createElement("button");
    shopButton.id = "shop-button";
    shopButton.innerText = "Open Shop (S)";
    shopButton.addEventListener("click", function() {
        shopOpen = true;
        openShop();
    });
    shopDiv.appendChild(shopButton);
};

//function to update the cookie rate display
function updateCookieRate() {
    const el = document.getElementById("cpc-int");
    if (el) {
        el.innerText = humanizeNumber(cookieRate);
    } else {
        console.warn("Could not find cpc-int element to update cookie rate display");
    }
}
function calcCookieRate() {
    let cookieRate = 1
    clickUpgradesArray.forEach(obj => {
        const ownedAmount = ownedUpgradesDict[obj.name] || 0;
        const ownedUpgradeAmount = ownedUpgradesDict[obj.name + " Multiplier"] || 0;
        const upgradeCps = obj.cps;
        const passiveUpgradeMultiplier = Math.pow(2, ownedUpgradeAmount);
        cookieRate += upgradeCps * passiveUpgradeMultiplier * ownedAmount;
    })
    return cookieRate;


}

//handles color changes, click events, cost updating, and affordability checking for upgrade buttons
function renderButtons() {
    clickUpgradesArray.forEach(obj => {

        const div = document.getElementById(obj.name + "-upgrade-div");
        div.addEventListener("click",function () {
            if (cookieCount >= calcUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0)) {
                //they have enough money
                console.log(obj.name + " has been purchased")
                cookieCount -= calcUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0);
                updateCookieDisplay();
                ownedUpgradesDict[obj.name] = (ownedUpgradesDict[obj.name] || 0) + 1; //increment owned count
                document.getElementById(obj.name + "-quantity-p").innerText = "Owned: " + ownedUpgradesDict[obj.name];
                cookieRate = calcCookieRate();
                updateCookieRate();
            } else {
                console.log(obj.name + " could not be afforded")
            }
        });
        setInterval(() => {
            const currentCost = calcUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0);
            const cost_p = document.getElementById(obj.name + "-upgrade-amt-p");
            if (cost_p !== null) {
            cost_p.innerText = "Cost: " + humanizeNumber(currentCost);
            }
            if (cookieCount >= currentCost) {
                div.style.borderColor = "lightgreen";
                div.style.backgroundColor = "darkgreen";
                div.style.cursor = "pointer";
            } else {
                div.style.borderColor = "red";
                div.style.backgroundColor = "darkred";
                div.style.cursor = "not-allowed";
            }

        }, 25);
    });
};

function renderPassiveButtons() {
    passiveUpgradesArray.forEach(obj => {

        const div = document.getElementById(obj.name + "-passive-upgrade-div");
        div.addEventListener("click",function () {
            if (cookieCount >= calcPassiveUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0)) {
                //they have enough money
                console.log(obj.name + ", the passive upgrade, has been purchased")
                cookieCount -= calcPassiveUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0);
                updateCookieDisplay();
                ownedUpgradesDict[obj.name] = (ownedUpgradesDict[obj.name] || 0) + 1; //increment owned count
                document.getElementById(obj.name + "-quantity-p").innerText = "Owned: " + ownedUpgradesDict[obj.name];
                //double cookie rate increase for passive upgrades
                cookieRate = calcCookieRate();
                updateCookieRate();
            } else {
                console.log(obj.name + " could not be afforded")
            }
        });
        setInterval(() => {
            const currentCost = calcPassiveUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0);
            const cost_p = document.getElementById(obj.name + "-passive-upgrade-amt-p");
            if (cost_p !== null) {
            cost_p.innerText = "Cost: " + humanizeNumber(currentCost);
            }
            if (cookieCount >= currentCost) {
                div.style.borderColor = "lightgreen";
                div.style.backgroundColor = "darkgreen";
                div.style.cursor = "pointer";
            } else {
                div.style.borderColor = "red";
                div.style.backgroundColor = "darkred";
                div.style.cursor = "not-allowed";
            }
        }
    )}, 25);
//handle the first auto clicker separately
    const autoClickerDiv = document.getElementById("Auto Clicker-passive-upgrade-div");
    autoClickerDiv.addEventListener("click", function() {
        if (cookieCount >= calcPassiveUpgradeCost(1000, ownedUpgradesDict["Auto Clicker"] || 0)) {
            console.log("Auto Clicker purchased");
            cookieCount -= calcPassiveUpgradeCost(1000, ownedUpgradesDict["Auto Clicker"] || 0);
            updateCookieDisplay();
            ownedUpgradesDict["Auto Clicker"] = (ownedUpgradesDict["Auto Clicker"] || 0) + 1;
            document.getElementById(obj.name + "-quantity-p").innerText = "Owned: " + ownedUpgradesDict[obj.name];
        } else {
            console.log("Auto Clicker could not be afforded");
        }
    });
    setInterval(() => {
        const currentCost = calcPassiveUpgradeCost(1000, ownedUpgradesDict["Auto Clicker"] || 0);
        const cost_p = document.getElementById("Auto Clicker-passive-upgrade-amt-p");
        if (cost_p !== null) {
        cost_p.innerText = "Cost: " + humanizeNumber(currentCost);
        }
        if (cookieCount >= currentCost) {
            autoClickerDiv.style.borderColor = "lightgreen";
            autoClickerDiv.style.backgroundColor = "darkgreen";
            autoClickerDiv.style.cursor = "pointer";
        } else {
            autoClickerDiv.style.borderColor = "red";
            autoClickerDiv.style.backgroundColor = "darkred";
            autoClickerDiv.style.cursor = "not-allowed";
        }
    }, 25);
};

//function to calculate passive upgrade cost
function calcPassiveUpgradeCost(baseCost, ownedAmount) {
    //cost scaling formula: baseCost * (1.25 ^ ownedAmount)
    return Math.ceil(baseCost * (10 ** ownedAmount));
    //super expensive cuz they add up fast
}

document.getElementById("shortNumbersCheckbox").addEventListener("change", function() {
    //update document title
    document.title = "Cookies: " + humanizeNumber(cookieCount);
    //update all number displays
    updateCookieDisplay();
    updateCookieRate();
    
    //update shop costs
    clickUpgradesArray.forEach(obj => {
        const cost_p = document.getElementById(obj.name + "-upgrade-amt-p");
        if (cost_p !== null) {
            const currentCost = calcUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0);
            cost_p.innerText = "Cost: " + humanizeNumber(currentCost);
        }
    });
    passiveUpgradesArray.forEach(obj => {
        const cost_p = document.getElementById(obj.name + "-passive-upgrade-amt-p");
        if (cost_p !== null) {
            const currentCost = calcPassiveUpgradeCost(obj.baseCost, ownedUpgradesDict[obj.name] || 0);
            cost_p.innerText = "Cost: " + humanizeNumber(currentCost);
        }
    });
    //handle auto clicker separately
    const autoClickerCostP = document.getElementById("Auto Clicker-passive-upgrade-amt-p");
    if (autoClickerCostP !== null) {
        const currentCost = calcPassiveUpgradeCost(1000, ownedUpgradesDict["Auto Clicker"] || 0);
        autoClickerCostP.innerText = "Cost: " + humanizeNumber(currentCost);
    }
});
//stringify large numbers for human readability, i might make this 
function humanizeNumber(number_input) {
    //check if setting is enabled
    const shortNumbersEnabled = document.getElementById("shortNumbersCheckbox").checked;
    if (!shortNumbersEnabled) {
        return number_input.toLocaleString(); //just add commas
    }


    //if the number is less than the thousands then no simplification neccssary
    //if the number is in the thousands we want to simply add a comma
    //if the numer is in the millions then we want to shorten it with 3 decimal places -- 3.141 million
    // or billions -- 2.718 billion
    function stringifyNumber(number_input, decimals = 3) {
        const factor = 10 ** decimals;
        const scaledDown = Math.floor(number_input/factor) * factor; //flooring since Intl rounds up
        return Intl.NumberFormat("en", {
          notation: "compact",
          compactDisplay: "long",
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals
        }).format(scaledDown).replaceAll("/0/g","")};

    const num_array = number_input.toString().split("");
    const len = num_array.length;

    //aw man why doesnt javascript have a built-in floor divide operator..
    const comma_group = Math.floor((len-1)/3) //wtv
    switch (comma_group) {
        case 0:
            return number_input //under a thousand
        case 1:
            return Intl.NumberFormat().format(number_input) //format thousands with comma
        default:
            return stringifyNumber(number_input); //millions and above
    }
};

function calcUpgradeCost(baseCost, ownedAmount) {
    //cost scaling formula: baseCost * (1.15 ^ ownedAmount)
    //officially used by the cookie clicker game that tried to copy me(totally)(/j)
    return Math.ceil(baseCost * (1.15 ** ownedAmount));
}



function overlay() {
    const overlay = document.createElement('div');
    overlay.id = 'confirmation-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // dims the page w transparency of 0.5
    overlay.style.zIndex = '1000'; // ensures it’s on top of other content(duh)
    document.body.appendChild(overlay);
}



function removeOverlay() {
    const overlay = document.getElementById('confirmation-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
}



function popUpInput(promptText, callback) {
    
    const popup = document.createElement('div');
    popup.id = 'input-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';


    
    const promptDiv = document.createElement('div');
    promptDiv.id = 'popup-prompt-div';
    promptDiv.style.padding = '20px';
    promptDiv.style.backgroundColor = '#fff';
    promptDiv.style.border = '2px solid #000';
    promptDiv.style.borderRadius = '10px';
    promptDiv.style.textAlign = 'center';

    


    const promptLabel = document.createElement('label');
    promptLabel.htmlFor = 'popup-input-field';
    promptLabel.innerText = promptText;
    promptLabel.style.display = 'block';
    promptLabel.style.marginBottom = '10px';
    promptLabel.style.fontSize = '1.2em';
    promptDiv.appendChild(promptLabel);


    const promptInput = document.createElement('input');
    promptInput.type = 'text';
    promptInput.placeholder = "";
    promptInput.id = 'popup-input-field';
    promptInput.style.padding = '10px';
    promptInput.style.fontSize = '1em';
    promptDiv.appendChild(promptInput);

    
    promptInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const userInput = promptInput.value;
            callback(userInput);
            document.body.removeChild(popup);
            removeOverlay();
        }
    });
    overlay();
    popup.style.zIndex = '1001'; // above overlay
    popup.appendChild(promptDiv);
    document.body.appendChild(popup);
    promptInput.focus(); //sets user input to type in automatically
}   

//popUpInput("Enter your bakery name:", updateBakeryName);

document.getElementById("bakeryNameInput").addEventListener("click", function() {
    setBakeryName();
});

function setBakeryName() {
    popUpInput("Enter your bakery name:", function(name) {
        
        if (name.trim() === "") {
            document.getElementById("bakery-name-s-span").innerText = "s";
            document.getElementById("bakery-name-span").innerText = "Jane Doe";
            return;
        }
        if (name.length >= 20) {
            alert("Bakery name too long! Please keep it under 20 characters.");
            return;
        }
        document.getElementById("bakery-name-span").innerText = name;
        //check if last character is s, cuz grammar
        if (name.charAt(name.length - 1) === 's') {
            document.getElementById("bakery-name-s-span").innerText = "";
        } else {
            document.getElementById("bakery-name-s-span").innerText = "s";
        }
        generateBakeryNamePlaque();
        console.log("Bakery name set to: " + name);
    });
}


document.getElementById("reset-button").addEventListener("click", function() {
    popUpConfirmation("Are you sure you want to reset your progress? This action cannot be undone.", function() {
        //on confirm
        removeSaveData();
        location.reload();
    }, function() {
        //on cancel
        console.log("Reset cancelled.");
    });
});

function resetGame() {
    popUpConfirmation("Are you sure you want to reset your progress? This action cannot be undone.", function() {
        //on confirm
        removeSaveData();
        location.reload();
    }, function() {
        //on cancel
        console.log("Reset cancelled.");
    });
}

function popUpConfirmation(promptText, onConfirm, onCancel) {
    const popup = document.createElement('div');
    popup.id = 'confirmation-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';

    const promptDiv = document.createElement('div');
    promptDiv.id = 'confirmation-prompt-div';
    promptDiv.style.padding = '20px';
    promptDiv.style.backgroundColor = '#fff';
    promptDiv.style.border = '2px solid #000';
    promptDiv.style.borderRadius = '10px';
    promptDiv.style.textAlign = 'center';

    const promptLabel = document.createElement('label');
    promptLabel.innerText = promptText;
    promptLabel.style.display = 'block';
    promptLabel.style.marginBottom = '20px';
    promptLabel.style.fontSize = '1.2em';
    promptDiv.appendChild(promptLabel);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.justifyContent = 'space-around';

    const confirmButton = document.createElement('button');
    confirmButton.innerText = 'Confirm';
    confirmButton.style.padding = '10px 20px';
    confirmButton.style.fontSize = '1em';
    confirmButton.addEventListener('click', function() {
        onConfirm();
        document.body.removeChild(popup);
        removeOverlay();
    });
    buttonsDiv.appendChild(confirmButton);

    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.fontSize = '1em';
    cancelButton.addEventListener('click', function() {
        onCancel();
        document.body.removeChild(popup);
        removeOverlay();
    });
    buttonsDiv.appendChild(cancelButton);

    promptDiv.appendChild(buttonsDiv);
    overlay();
    popup.style.zIndex = '1001'; // above overlay
    popup.appendChild(promptDiv);
    document.body.appendChild(popup);
}


function generateBakeryNamePlaque()  {
    const bakeryName = document.getElementById("bakery-name-header").innerText;
    const plaque = document.getElementById("bakery-plaque-h2");
    plaque.innerText = bakeryName
    plaque.style.fontSize = "2em";
    plaque.style.fontWeight = "bold";

}

generateBakeryNamePlaque(); //initial generation of plaque