const $ = s => document.querySelector(s);

const urlTxt = $("#url");
const copyBtn = $('#copy');
const openBtn = $('#open');
const queryBox = $('#query-box');
const addQuery = $('#add-query');
const rmQuery = $('#remove-query');
const newBtn = $('#new');
const historyBox = $('#history');

const LS_KEY = 'NTP_HISTORY';
let historyList = new Set([]);

let tabId = null;

const NTP = new Proxy({
    host: '',
    queryArray: [],
}, {
    set(obj, prop, value) {
        obj[prop] = value;

        if (prop === 'queryArray') {
            value = value.filter(kv => kv.key !== '' || kv.value !== '');
            obj[prop] = value;
            renderQueryBox();
            urlTxt.value = buildQuery(obj.host, value);
        }

        return true;
    }
});

const parseQuery = (url) => {
    const res = [];
    if (url.indexOf('?') < 0) return res;

    url.split('?')[1].split('&').forEach(kv => {
        const [key, value] = kv.split('=');
        if (key !== '' && value !== '') {
            res.push({ key, value })
        }
    });

    return res;
}

const buildQuery = (host, queryArray) => {
    return host +
        (queryArray.length ? '?' : '') +
        queryArray.map(kv => `${kv.key}=${kv.value}`).join('&');
}

addQuery.onclick = () => {
    NTP.queryArray = [...NTP.queryArray, {
        key: 'item',
        value: ''
    }];
}

rmQuery.onclick = () => {
    NTP.queryArray.pop();
    NTP.queryArray = NTP.queryArray;
}

newBtn.onclick = () => {
    chrome.tabs.create({
        active: true,
        url: "https://ntp.msn.com/edge/ntp?"
    });
}


function renderQueryBox() {
    while (queryBox.firstChild) {
        queryBox.removeChild(queryBox.lastChild);
    }

    NTP.queryArray.forEach(({ key, value }) => {
        const kvBox = document.createElement('div');

        const keyInput = document.createElement('input');
        keyInput.value = key;
        keyInput.onchange = handleChange;
        kvBox.appendChild(keyInput)

        const valInput = document.createElement('input');
        valInput.value = value;
        valInput.onchange = handleChange;
        kvBox.appendChild(valInput)

        queryBox.appendChild(kvBox);
    });
}

function handleChange() {
    const newQueryArray = [...$('#query-box').querySelectorAll('div')]
        .map(kvBox => {
            const [keyEl, valueEl] = [...kvBox.querySelectorAll('input')];
            return {
                key: keyEl.value,
                value: valueEl.value
            };
        });

    NTP.queryArray = newQueryArray;
}

function renderHistory() {
    while (historyBox.firstChild) {
        historyBox.removeChild(historyBox.lastChild);
    }

    historyList.forEach(val => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const urlBox = document.createElement('div');
        urlBox.className = 'history-item-url';
        const url = document.createElement('span');
        url.innerText = val;
        url.onclick = () => {
            openUrl(val);
        }
        urlBox.appendChild(url);

        const closeBtn = document.createElement('span');
        closeBtn.className = 'history-item-close';
        closeBtn.innerText = 'x';
        closeBtn.onclick = () => {
            rmHistory(val);
        }

        item.appendChild(urlBox);
        item.appendChild(closeBtn);
        historyBox.appendChild(item);
    });
}

function openUrl(url) {
    chrome.tabs.update(tabId, { url });

    historyList.add(url);
    localStorage.setItem(LS_KEY, JSON.stringify([...historyList]));

    renderHistory();

    NTP.host = url.split('?')[0];
    NTP.queryArray = parseQuery(url);
}

function rmHistory(url) {
    if (historyList.has(url)) {
        historyList.delete(url);
        localStorage.setItem(LS_KEY, JSON.stringify([...historyList]));
        renderHistory();
    }
}


// entry
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    tabId = tabs[0].id

    chrome.tabs.get(tabId, (tab) => {
        NTP.host = tab.url.split('?')[0];
        NTP.queryArray = parseQuery(tab.url);

        copyBtn.onclick = () => {
            urlTxt.select();
            document.execCommand("copy");
        };

        openBtn.onclick = () => {
            openUrl(urlTxt.value);
        }

        try {
            historyList = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
        } catch (error) {
            console.error(error);
            localStorage.removeItem(LS_KEY);
        }

        renderHistory();
    });
});
