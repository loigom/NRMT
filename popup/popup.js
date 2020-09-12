const new_btn = document.getElementById("new");
new_btn.onclick = function() {
    newCollection();
}
let changesMade = false;
const alreadySeen = new Set();

function newCollection(sub="", weight=1, color="white") {
    const count = document.getElementsByClassName("collectionWrapper").length;
    const e = document.createElement("div");
    e.className = "collectionWrapper";
    const defaultColor = (!(count & 1)) ? "lightgray" : "white";
    e.style.backgroundColor = defaultColor;
    e.onmouseenter = function() {
        e.style.backgroundColor = "lightgreen";
    }
    e.onmouseleave = function() {
        e.style.backgroundColor = defaultColor;
    }

    e.appendChild(document.createTextNode("/r/"));
    const subInput = document.createElement("input");
    subInput.value = sub;
    subInput.onkeydown = function(e) {
        if (e.key.match("[a-zA-Z0-9_]") || e.keyCode == 8) {
            changesMade = true;
            return true;
        }
        return false;
    }
    e.appendChild(subInput);
    
    e.appendChild(document.createTextNode(" | Weight:"))
    const weightInput = document.createElement("input");
    weightInput.style.width = "30px";
    weightInput.value = weight;
    weightInput.style.color = "green";
    weightInput.onkeydown = function(e) {
        if (e.key.match("[0-9\.]") || e.keyCode == 8) {
            const future = (e.keyCode == 8) ? weightInput.value.substr(0, weightInput.value.length - 1) : weightInput.value + e.key;
            if (future.length >= 5) { return false; }
            if (future.match("^([0-9]+|([0-9]+\.[0-9]+))$")) {
                weightInput.style.color = "green";
                changesMade = true;
            } else {
                weightInput.style.color = "red";
                changesMade = false;
            }
            return true;
        }
        return false;
    } 
    e.appendChild(weightInput);
    
    e.appendChild(document.createTextNode(" | Color:"));
    const colorSelect = document.createElement("select");
    ["white", "red", "pink", "cyan", "green", "orange", "yellow"].forEach(x => {
        const option = document.createElement("option");
        if (x == color) {
            option.setAttribute("selected", "");
        }
        option.value = x;
        option.appendChild(document.createTextNode(x));
        colorSelect.appendChild(option);
    });
    colorSelect.onchange = function() {
        changesMade = true;
    }
    e.appendChild(colorSelect);

    e.appendChild(document.createTextNode(" | "));
    const eraseButton = document.createElement("button");
    eraseButton.innerHTML = "Erase";
    eraseButton.onclick = function() {
        e.remove();
        changesMade = true;
    }
    e.appendChild(eraseButton);

    document.body.appendChild(e);
}

function onLoad(item) {
    item.index.forEach(node => {
        newCollection(node.subreddit, node.weight, node.color);
    });
}

function saveAndSync() {
    const elements = document.getElementsByClassName("collectionWrapper");
    const index = [];
    alreadySeen.clear();

    for (let i = 0; i < elements.length; i++) {
        const inputs = elements[i].getElementsByTagName("input");
        const sub = inputs[0].value.toLowerCase();
        const w = inputs[1].value;
        const c = elements[i].getElementsByTagName("select")[0].value;

        if (sub.length > 0 && !alreadySeen.has(sub)) {
            index.push({subreddit: sub, weight: w, color: c});
            alreadySeen.add(sub);
        }
    }

    browser.storage.sync.set({index})
        .then(null, alert);
}

browser.storage.sync.get("index")
    .then(onLoad, alert);

setInterval(function() {
    if (changesMade) {
        changesMade = false;
        saveAndSync();
    }
}, 150);
