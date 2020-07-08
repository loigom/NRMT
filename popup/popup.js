const splitter = document.getElementById("splitter");
const save_btn = document.getElementById("save");
save_btn.onclick = function() {
    const elements = document.getElementsByClassName("collectionWrapper");
    const index = [];
    for (let i = 0; i < elements.length; i++) {
        const properties = {};
        
    }
}
const new_btn = document.getElementById("new");
new_btn.onclick = function() {
    newCollection();
    save_btn.disabled = 0;
}
const info = document.getElementById("info");

function onError(error) {
    alert(error);
}

function newCollection(sub="", weight=1) {
    info.style.visibility = "visible";

    const count = document.getElementsByClassName("collectionWrapper").length;
    const e = document.createElement("div");
    e.className = "collectionWrapper";
    if (!(count & 1)) {
        e.style.backgroundColor = "lightgray";
    }

    const subInput = document.createElement("input");
    subInput.value = sub;
    e.appendChild(subInput);

    const weightInput = document.createElement("input");
    weightInput.style.float = "right";
    weightInput.style.width = "30px";
    weightInput.value = weight;
    e.appendChild(weightInput);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    e.appendChild(colorInput);

    document.body.appendChild(e);
}

function onLoad(item) {
    item.index.forEach(node => {
        const e = document.createElement("div");
        
    });
}

browser.storage.sync.get("index")
    .then(onLoad, onError);