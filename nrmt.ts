interface Comment {
	author: string;
	subreddit: string;
}

interface UserJson {
	kind: 'Listing';
	data: {
		modhash: string;
		dist: number;
		children: Array<{
			data: Comment;
		}>;
		after: null;
		before: null;
	};
}

async function getUserComments(
	username: string,
	limit = 100
): Promise<UserJson> {
	const { protocol, host } = window.location;
	const url = `${protocol}//${host}/user/${username}.json?limit=${limit}`;
	const res = await fetch(url);

	if (res.ok) return res.json();
	else throw res.statusText;
}

const NRMTstyles = document.createElement('style');
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
`;
document.head.appendChild(NRMTstyles);

interface UserSetting {
	weight: number;
	color: string;
}

const userOptions: Record<string, UserSetting> = {};

browser.storage.sync.get('index').then(item => {
	(item?.index as any[])?.forEach(
		(node: { subreddit: string; weight: string; color: any }) => {
			userOptions[node.subreddit] = {
				weight: parseFloat(node.weight),
				color: node.color
			};
		}
	);
}, console.log);

const userToNRMTnode: Record<string, HTMLSpanElement | null | undefined> = {};
const userToTooltipInfo: Record<
	string,
	Array<{ text: string; color: string }>
> = {};

const NRMT_TOOLTIP_LEFT_OFFSET = 65,
	NRMT_TOOLTIP_TOP_OFFSET = 20;

const tooltip = document.createElement('div');
tooltip.id = 'NRMTtooltip';
const tooltipNameHeader = document.createElement('h3');
tooltip.appendChild(tooltipNameHeader);
tooltip.appendChild(document.createElement('hr'));
const tooltipContributionsContainer = document.createElement('div');
tooltip.appendChild(tooltipContributionsContainer);
document.body.append(tooltip);

function insertAfter(newNode: HTMLElement, referenceNode: Element) {
	referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
}

function makeToolTipInfoItem(sub: string, score: any) {
	const subLower = sub.toLowerCase();
	let postfix, c;
	if (subLower in userOptions) {
		postfix = '*';
		c = userOptions[subLower]['color'];
	} else {
		postfix = '';
		c = 'white';
	}
	return {
		text: `r/${sub}: ${score}${postfix}`,
		color: c
	};
}

function makeNRMTnode(parsed: UserJson['data']) {
	const username = parsed['children'][0]['data']['author'];
	const frequented: Record<string, number> = {};

	for (let i = 0; i < parsed.dist; i++) {
		const { subreddit } = parsed.children[i].data;
		if (subreddit in frequented) {
			frequented[subreddit]++;
		} else {
			frequented[subreddit] = 1;
		}
	}

	for (let sub in frequented) {
		const lower = sub.toLowerCase();
		if (lower in userOptions) {
			frequented[sub] *= userOptions[lower]['weight'];
			if (frequented[sub] == 0) {
				delete frequented[sub];
			}
		}
	}

	const sortable: Array<[string, number]> = [];
	for (const key in frequented) {
		sortable.push([key, frequented[key]]);
	}
	sortable.sort((a, b) => a[1] - b[1]);

	const mostFrequented = sortable[sortable.length - 1][0];

	const textNode = document.createElement('a');
	textNode.appendChild(document.createTextNode(mostFrequented));
	textNode.setAttribute('href', `https://old.reddit.com/r/${mostFrequented}`);
	textNode.setAttribute('target', '_blank');
	textNode.style.color = 'black';

	const NRMTnode = document.createElement('span');
	NRMTnode.appendChild(textNode);
	NRMTnode.className = 'NRMTnode';

	userToNRMTnode[username] = NRMTnode;

	userToTooltipInfo[username] = [];
	let i = sortable.length;
	while (--i >= 0 && userToTooltipInfo[username].length < 10) {
		userToTooltipInfo[username].push(
			makeToolTipInfoItem(sortable[i][0], sortable[i][1])
		);
	}
	if (i == 0) {
		userToTooltipInfo[username].push(
			makeToolTipInfoItem(sortable[0][0], sortable[0][1])
		);
	} else if (i > 0) {
		userToTooltipInfo[username].push({
			text: `... [${i + 1} more subs]`,
			color: 'white'
		});
	}

	return NRMTnode;
}

function taglineHasNode(tagline: Element) {
	return tagline.getElementsByClassName('NRMTnode').length > 0;
}

async function cloneNode(username: string) {
	if (!userToNRMTnode[username]) {
		const user = await getUserComments(username);
		makeNRMTnode(user.data);
	}

	const node = userToNRMTnode[username]?.cloneNode(true) as HTMLSpanElement;

	node.addEventListener('mouseenter', () => {
		const cRect = node.getBoundingClientRect();
		tooltip.style.position = 'absolute';
		tooltip.style.visibility = 'visible';
		tooltip.style.left = cRect.left + window.scrollX + 'px';
		tooltip.style.top = cRect.top + cRect.height + window.scrollY + 'px';
		tooltip.style.zIndex = '999';
		tooltipNameHeader.innerText = username;
		tooltipContributionsContainer.innerHTML = '';
		userToTooltipInfo[username].forEach(infoNode => {
			const p = document.createElement('p');
			p.appendChild(document.createTextNode(infoNode.text));
			p.style.color = infoNode.color;
			tooltipContributionsContainer.appendChild(p);
		});
	});
	node.addEventListener('mouseleave', () => {
		tooltip.style.visibility = 'hidden';
	});
	return node;
}

async function handleTagline(tagline: HTMLElement) {
	if (taglineHasNode(tagline)) return;

	const authorTag = tagline.getElementsByClassName('author')[0];
	if (authorTag != null) {
		const username = authorTag.innerHTML;
		const node = await cloneNode(username);
		insertAfter(node, authorTag);
	}
}

function userLinkSeen(anchor: HTMLAnchorElement) {
	return anchor.classList.contains('NRMT-seen');
}

const userLinkRegex = /\/user\/(.+?)\//;

async function handleUserLink(anchor: HTMLAnchorElement) {
	if (userLinkSeen(anchor)) return;

	const href = anchor.getAttribute('href');
	if (!href) throw new Error('expected href');
	const usernameMatch = userLinkRegex.exec(href);
	if (!usernameMatch) throw new Error('expected match');
	const username = usernameMatch[1];
	if (!username) throw new Error('expected username in capture group');
	const node = await cloneNode(username);
	insertAfter(node, anchor.parentElement!);

	anchor.classList.add('NRMT-seen');
}

const old = !!document.querySelector('div#header');
if (old) console.log('[NRMT] old reddit detected');
else console.log('[NRMT] new reddit detected');

async function mainLoop() {
	if (old) {
		const taglines = Array.from(
			document.getElementsByClassName('tagline')
		) as HTMLElement[];

		return Promise.all(taglines.map(handleTagline));
	} else {
		const userHrefs = Array.from(
			document.querySelectorAll('a[href^="/user/"]')
		) as HTMLAnchorElement[];

		return Promise.all(userHrefs.map(handleUserLink));
	}
}

async function recurse(interval = 100) {
	await mainLoop();
	await new Promise(resolve => setTimeout(resolve, interval));
	recurse(interval);
}

console.log('NRMT ready');
recurse();
