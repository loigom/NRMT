let NRMT_node_style = document.createElement("style");
NRMT_node_style.innerHTML = `
.NRMT_node {
    background-color:aliceblue;
    border-style:solid;
    border-color:grey;
    border-width:1px;
    border-radius:5px;
    padding:1px
}
`
document.head.appendChild(NRMT_node_style);

let user_to_NRMT_node = {};

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function make_NRMT_node(parsed) {
    let username = parsed["children"][0]["data"]["author"]
    ,   frequented = {};

    for (let i = 0; i < parsed["dist"]; i++) {
        let sub = parsed["children"][i]["data"]["subreddit"];
        if (sub in frequented) {
            frequented[sub]++;
        } else {
            frequented[sub] = 1;
        }
    }

    let most_frequented = null,
        c = 0,
        key;
    
    for (key in frequented) {
        if (frequented[key] > c) {
            c = frequented[key];
            most_frequented = key;
        }
    }

    let text_node = document.createElement("a");
    text_node.appendChild(document.createTextNode(most_frequented));
    text_node.setAttribute("href", "https://old.reddit.com/r/" + most_frequented);
    text_node.setAttribute("target", "_blank");
    text_node.setAttribute("style", "color:black;");

    let NRMT_node = document.createElement("span");
    NRMT_node.appendChild(text_node);
    NRMT_node.className = "NRMT_node";
    NRMT_node.title = "NRMT - most frequented subreddit";
    user_to_NRMT_node[username] = NRMT_node;
}

function NRMT_node_in_tagline(tagline) {
    return tagline.getElementsByClassName("NRMT_node").length > 0;
}

function main_loop() {
    let taglines = document.getElementsByClassName("tagline");
    for (let i = 0; i < taglines.length; i++) {
        if (!NRMT_node_in_tagline(taglines[i])) {
            let author_tag = taglines[i].getElementsByClassName("author")[0];
            let username = author_tag.innerHTML;
            if (username in user_to_NRMT_node) {
                if (user_to_NRMT_node[username] != null) {
                    insertAfter(user_to_NRMT_node[username].cloneNode(true), author_tag);
                }
            } else {
                user_to_NRMT_node[username] = null;
                let request = new XMLHttpRequest();
                let url = "https://old.reddit.com/user/" + username + ".json?limit=100";
                request.open("GET", url);
                request.onreadystatechange = function() {
                    if (request.readyState == 4 && request.status == 200) {
                        let parsed = JSON.parse(request.responseText);
                        make_NRMT_node(parsed["data"]);
                    }
                }
                request.send();
            }
        }
    }
}

setInterval(main_loop, 400);
console.log("NRMT ready");
