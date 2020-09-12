const NRMTstyles = document.createElement("style");
NRMTstyles.innerHTML = `
.NRMTnode,
#NRMTtooltip {
    border-style: solid;
    border-width: 1px;
    border-radius: 5px;
    padding:1px;
    z-index: 1000;
}

.NRMTnode {
    margin: 3px;
    background-color: white;
    border-color: grey;
}

#NRMTtooltip {
    position: absolute;
    visibility: hidden;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
}
`
document.head.appendChild(NRMTstyles);

const userOptions = {};

browser.storage.sync.get("index")
    .then(function(item) {
        item.index.forEach(node => {
            userOptions[node.subreddit] = {
                weight: parseFloat(node.weight),
                color: node.color
            };
        });
    }, console.log);

const userToNRMTnode = {}
,     userToTooltipInfo = {};

const NRMT_TOOLTIP_LEFT_OFFSET = 65
,     NRMT_TOOLTIP_TOP_OFFSET = 20;

const tooltip = document.createElement("div");
tooltip.id = "NRMTtooltip";
const tooltipNameHeader = document.createElement("h3");
tooltip.appendChild(tooltipNameHeader);
tooltip.appendChild(document.createElement("hr"));
const tooltipContributionsContainer = document.createElement("div");
tooltip.appendChild(tooltipContributionsContainer);
const siteTable = document.getElementById("siteTable");
siteTable.insertBefore(tooltip, siteTable.firstChild);

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function makeToolTipInfoItem(sub, score) {
    const subLower = sub.toLowerCase();
    let postfix, c;
    if (subLower in userOptions) {
        postfix = "*";
        c = userOptions[subLower]["color"];
    } else {
        postfix = "";
        c = "white";
    }
    return {
        text: `r/${sub}: ${score}${postfix}`,
        color: c
    };
}

function makeNRMTnode(parsed) {
    const username = parsed["children"][0]["data"]["author"]
    ,     frequented = {};
    
    for (let i = 0; i < parsed["dist"]; i++) {
        const sub = parsed["children"][i]["data"]["subreddit"];
        if (sub in frequented) {
            frequented[sub]++;
        } else {
            frequented[sub] = 1;
        }
    }

    for (let sub in frequented) {
        const lower = sub.toLowerCase();
        if (lower in userOptions) {
            frequented[sub] *= userOptions[lower]["weight"];
            if (frequented[sub] == 0) {
                delete frequented[sub];
            }
        }
    }

    const sortable = [];
    for (key in frequented) {
        sortable.push([key, frequented[key]]);
    }
    sortable.sort(function(a, b) {
        return a[1] - b[1];
    });
    
    const mostFrequented = sortable[sortable.length - 1][0];

    const textNode = document.createElement("a");
    textNode.appendChild(document.createTextNode(mostFrequented));
    textNode.setAttribute("href", `https://old.reddit.com/r/${mostFrequented}`);
    textNode.setAttribute("target", "_blank");
    textNode.style.color = "black";

    const NRMTnode = document.createElement("span");
    NRMTnode.appendChild(textNode);
    NRMTnode.className = "NRMTnode";

    userToNRMTnode[username] = NRMTnode;

    userToTooltipInfo[username] = [];
    let i = sortable.length;
    while (--i >= 0 && userToTooltipInfo[username].length < 10) {
        userToTooltipInfo[username].push(makeToolTipInfoItem(sortable[i][0], sortable[i][1]));
    }
    if (i == 0) {
        userToTooltipInfo[username].push(makeToolTipInfoItem(sortable[0][0], sortable[0][1]));
    }
    else if (i > 0) {
        userToTooltipInfo[username].push({
            text: `... [${i + 1} more subs]`,
            color: "white"
        });
    }
}

function NRMTnode_in_tagline(tagline) {
    return tagline.getElementsByClassName("NRMTnode").length > 0;
}

function mainLoop() {
    const taglines = document.getElementsByClassName("tagline");
    for (let i = 0; i < taglines.length; i++) {
        if (!NRMTnode_in_tagline(taglines[i])) {
            const authorTag = taglines[i].getElementsByClassName("author")[0];
            if (authorTag != null) {
                const username = authorTag.innerHTML;
                if (username in userToNRMTnode) {
                    if (userToNRMTnode[username] != null) {
                        const n = userToNRMTnode[username].cloneNode(true);
                        n.onmouseenter = function() {
                            tooltip.style.visibility = "visible";
                            tooltip.style.left = n.offsetLeft + NRMT_TOOLTIP_LEFT_OFFSET + "px";
                            tooltip.style.top = n.offsetTop + NRMT_TOOLTIP_TOP_OFFSET + "px";
                            tooltipNameHeader.innerText = username;
                            tooltipContributionsContainer.innerHTML = "";
                            userToTooltipInfo[username].forEach(infoNode => {
                                const p = document.createElement("p");
                                p.appendChild(document.createTextNode(infoNode.text));
                                p.style.color = infoNode.color;
                                tooltipContributionsContainer.appendChild(p);
                            });
                        }
                        n.onmouseleave = function() {
                            tooltip.style.visibility = "hidden";
                        }
                        insertAfter(n, authorTag);
                    }
                } else {
                    userToNRMTnode[username] = null;
                    const request = new XMLHttpRequest();
                    const url = `https://old.reddit.com/user/${username}.json?limit=100`;
                    request.open("GET", url);
                    request.onreadystatechange = function() {
                        if (request.readyState == 4 && request.status == 200) {
                            const parsed = JSON.parse(request.responseText);
                            makeNRMTnode(parsed["data"]);
                        }
                    }
                    request.send();
                }   
            }
        }
    }
}

setInterval(mainLoop, 100);
console.log("NRMT ready");
