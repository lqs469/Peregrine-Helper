const $ = s => document.querySelector(s);

const urlTxt = $("#url");
const copyBtn = $('#copy');
const openBtn = $('#open');
const queryBox = $('#query-box');
const addQuery = $('#add-query');
const rmQuery = $('#remove-query');
const newBtn = $('#new');

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

const renderQueryBox = () => {
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

const handleChange = () => {
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

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.get(tabs[0].id, (tab) => {
        // urlTxt.value = tab.url;

        NTP.host = tab.url.split('?')[0];
        NTP.queryArray = parseQuery(tab.url);

        copyBtn.onclick = () => {
            urlTxt.select();
            document.execCommand("copy");
        };

        openBtn.onclick = () => {
            chrome.tabs.update(tabs[0].id, { url: urlTxt.value });
        }
    });
});

newBtn.onclick = () => {
    chrome.tabs.create({
        active: true,
        url: "https://ntp.msn.com/edge/ntp?"
    });
}