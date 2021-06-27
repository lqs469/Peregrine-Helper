import React, { useEffect, useState, useCallback, createRef, useMemo } from 'react';

const LS_KEY = 'NTP_HISTORY';

const parseQuery = (url) => {
    const res = [];
    if (url.indexOf('?') < 0) return res;

    url.split('?')[1].split('&').forEach(kv => {
        const [key, value] = kv.split('=');
        if (key !== '' || value !== '') {
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
    const [historyList, setHistoryList] = useState([]);

    useEffect(() => {
        chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            setTabId(tabs[0].id);

            chrome.tabs.get(tabs[0].id, (tab) => {
                setUrl(decodeURIComponent(tab.url));

                try {
                    const historyListFromLS = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
                    setHistoryList(historyListFromLS);
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
    }, [url, urlInput]);

    const clickOpen = useCallback(() => {
        chrome.tabs.update(tabId, { url });
        historyList.add(url);
        localStorage.setItem(LS_KEY, JSON.stringify([...historyList]));
        setHistoryList(new Set([...historyList]));
    }, [tabId, url, historyList]);

    const query = useMemo(() => parseQuery(url), [url]);

    const handleChangeQuery = useCallback(([idx, item]) => {
        return (e) => {
            query[idx][item] = e.target.value;
            const host = url.split('?')[0];
            setUrl(buildQuery(host, query));
        }
    }, [url]);

    const addQuery = useCallback(() => {
        setUrl(url + '&item=');
    }, [url, setUrl]);

    const rmQuery = useCallback((idx) => {
        return () => {
            query.splice(idx, 1);
            const host = url.split('?')[0];
            setUrl(buildQuery(host, query));
        }
    }, [url, setUrl]);

    const clickHistory = useCallback((currUrl) => {
        return () => {
            chrome.tabs.update(tabId, { url: currUrl });
        }
    }, [tabId]);

    const rmHistory = useCallback((currUrl) => {
        return () => {
            if (historyList.has(currUrl)) {
                historyList.delete(currUrl);
                localStorage.setItem(LS_KEY, JSON.stringify([...historyList]));
                setHistoryList(new Set([...historyList]));
            }
        }
    }, [historyList]);

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
                        <button onClick={rmQuery(idx)}>&times;</button>
                        <input value={key} onChange={handleChangeQuery([idx, 0])}></input>
                        <input value={value} onChange={handleChangeQuery([idx, 1])}></input>
                    </div>
                ))}
            </div>

            <input id="add-query" type="button" value="+" onClick={addQuery} />

            <br />

            <div id="history">
                {
                    Array.from(historyList).map(url => (
                        <div className="history-item" key={url}>
                            <div className="history-item-url">
                                <span onClick={clickHistory(url)}>{url}</span>
                            </div>
                            <span className="history-item-close" onClick={rmHistory(url)}>&times;</span>
                        </div>
                    ))
                }
            </div>
        </>
    )
}