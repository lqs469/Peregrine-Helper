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
            urlTxt.value = buildQuery(obj.host, value);

            subscribe.set("render_query", renderQueryBox);
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

const subscribe = new Map();
function trigger(key) {
    const cb = subscribe.get(key);
    cb && cb();
    subscribe.delete(key);
}

const flights = [
    'prg-webcomp-os',
    'prg-gitconfigs-t'
];

function renderQueryBox() {
    while (queryBox.firstChild) {
        queryBox.removeChild(queryBox.lastChild);
    }

    NTP.queryArray.forEach(({ key, value }, idx) => {
        const kvBox = document.createElement('div');

        const keyInput = document.createElement('input');
        keyInput.value = key;
        keyInput.onkeyup = () => handleChange(idx, 'key', keyInput);
        kvBox.appendChild(keyInput)

        const valInput = document.createElement('input');
        valInput.value = value;
        valInput.onkeyup = () => handleChange(idx, 'value', valInput);
        valInput.focus();
        kvBox.appendChild(valInput)

        if (valInput.value.includes('spalink')) {
            const debugBtn = document.createElement('button');
            debugBtn.innerText = 'debug';
            debugBtn.className = 'debug-btn';
            debugBtn.onclick = () => {
                if (valInput.value.includes('/debug')) {
                    valInput.value = valInput.value.replace(/\/debug/g, '');
                } else {
                    valInput.value += '/debug';
                }
            }
            kvBox.appendChild(debugBtn);
        }

        queryBox.appendChild(kvBox);

        if (valInput.value.includes('flights:')) {
            const btnBox = document.createElement('div');
            btnBox.className = 'flight-btn';

            flights.forEach(flight => {
                const flightBtn = document.createElement('button');
                flightBtn.innerText = flight;
                flightBtn.onclick = () => {
                    const flightSet = new Set(valInput.value.replace(/flights:/g, '').split(',').filter(item => item));

                    if (flightSet.has(flight)) {
                        flightSet.delete(flight);
                    } else {
                        flightSet.add(flight);
                    }

                    valInput.value = `flights:${[...flightSet].join(',')}`
                }
                btnBox.appendChild(flightBtn);
            });
            queryBox.appendChild(btnBox);
        }

    });
}

function handleChange(idx, target, el) {
    const prevState = [...NTP.queryArray];
    prevState[idx][target] = el.value;

    NTP.queryArray = prevState;

    el.onblur = () => {
        trigger("render_query");
    }
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
        closeBtn.innerText = `X`;
        closeBtn.onclick = () => {
            rmHistory(val);
        }

        item.appendChild(closeBtn);
        item.appendChild(urlBox);
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

        trigger("render_query");
        renderHistory();
    });
});
