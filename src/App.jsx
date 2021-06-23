import React, { useEffect, useState, useCallback, createRef, useMemo } from 'react';

const LS_KEY = 'NTP_HISTORY';
let historyList = new Set([]);

const parseQuery = (url) => {
    const res = [];
    if (url.indexOf('?') < 0) return res;

    url.split('?')[1].split('&').forEach(kv => {
        const [key, value] = kv.split('=');
        if (key !== '' && value !== '') {
            res.push([key, value])
        }
    });

    return res;
}

const buildQuery = (host, queryArray) => {
    return host +
        (queryArray.length ? '?' : '') +
        queryArray.map(([key, val]) => `${key}=${val}`).join('&');
}

export const App = () => {
    const urlInput = createRef();

    const [tabId, setTabId] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            setTabId(tabs[0].id);

            chrome.tabs.get(tabs[0].id, (tab) => {
                setUrl(tab.url);

                try {
                    historyList = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
                } catch (error) {
                    console.error(error);
                    localStorage.removeItem(LS_KEY);
                }
            });
        });
    }, []);

    const handleTextareaChange = useCallback((e) => {
        setUrl(e.target.value);
    }, []);

    const clickNew = useCallback(() => {
        chrome.tabs.create({
            active: true,
            url: "https://ntp.msn.com/edge/ntp?"
        });
    }, []);

    const clickCopy = useCallback(() => {
        urlInput.current.select();
        document.execCommand("copy");
    }, [url]);

    const clickOpen = useCallback(() => {
        chrome.tabs.update(tabId, { url });
    }, [url]);

    const query = useMemo(() => parseQuery(url), [url]);

    const handleChangeQuery = useCallback(([idx, item]) => {
        return (e) => {
            console.log(e.target, idx)
            query[idx][item] = e.target.value;
            const host = url.split('?')[0];
            setUrl(buildQuery(host, query));
        }
    }, [url]);

    return (
        <>
            <h2>NTP Helper</h2>
            <div>
                <textarea className="url" ref={urlInput} id="url" rows="3" onChange={handleTextareaChange} value={url}></textarea>
            </div>

            <div>
                <input id="new" type="button" value="New" onClick={clickNew} />
                <input id="copy" type="button" value="Copy" onClick={clickCopy} />
                <input id="open" type="button" value="Open" onClick={clickOpen} />
            </div>


            <div id="query-box">
                {query.map(([key, value], idx) => (
                    <div key={idx}>
                        <input value={key} onChange={handleChangeQuery([idx, 0])}></input>
                        <input value={value} onChange={handleChangeQuery([idx, 1])}></input>
                    </div>
                ))}
            </div>

            <input id="add-query" type="button" value="+" />
            <input id="remove-query" type="button" value="-" />

            <br />

            <div id="history"></div>
        </>
    )
}