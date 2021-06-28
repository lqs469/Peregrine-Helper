import React, { useEffect, useState, useCallback, createRef, useMemo } from 'react';

const LS_KEY = 'NTP_HISTORY';

const SUGGESTION = {
    spalink: ['/debug'],
    flights: [',prg-webcomp', ',prg-webcomp-s']
};

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

    const [currFocus, setCurrFocus] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
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

    const queryFocus = useCallback((idx, qKey, qValue) => {
        return () => {
            setCurrFocus(idx);

            for (let key in SUGGESTION) {
                if (qValue.includes(key)) {
                    setSuggestions(SUGGESTION[key]);
                    return;
                }
            }
            setSuggestions([]);
        }
    }, [url]);

    const Suggestions = useMemo(() => {
        if(suggestions.length === 0) {
          return null;
        }
     
        return (
          <div className="srchList">
            <ul>
                {
                    suggestions.map((item) => <li key={item} onMouseDown={() => {
                        if (query[currFocus][1].includes(item)) {
                            query[currFocus][1] = query[currFocus][1].replace(new RegExp(item), '');
                        } else {
                            query[currFocus][1] += item;
                        }
                        const host = url.split('?')[0];
                        setUrl(buildQuery(host, query));
                    }}>{item}</li>)
                }
            </ul>
          </div>
        );
    }, [suggestions, url, setUrl, query, currFocus, setCurrFocus]);

    return (
        <>
            <h2>🐱‍💻 NTP Helper</h2>
            <div>
                <textarea className="url" ref={urlInput} id="url" rows="3" onChange={handleTextareaChange} value={url}></textarea>
            </div>

            <div>
                <button id="new" onClick={clickNew}>New</button>
                <button id="copy" onClick={clickCopy}>Copy</button>
                <button id="open" onClick={clickOpen}>Open</button>
            </div>

            <h3>Query</h3>

            <div id="query-box">
                {query.map(([key, value], idx) => (
                    <div key={idx}>
                        <button className="query-btn_rm" onClick={rmQuery(idx)}>&times;</button>
                        <input className="key-input" value={key} onChange={handleChangeQuery([idx, 0])} />
                        <div className="value-input">
                            <input
                                value={value}
                                onChange={handleChangeQuery([idx, 1])}
                                onFocus={queryFocus(idx, key, value)}
                                onBlur={() => setCurrFocus()}
                            />
                            {idx === currFocus ? Suggestions : null}
                        </div>
                    </div>
                ))}
            </div>


            <button id="add-query" onClick={addQuery}>+</button>

            <h3>History</h3>

            <div id="history">
                {
                    Array.from(historyList).map(url => (
                        <div className="history-item" key={url}>
                            <button className="history-item-close" onClick={rmHistory(url)}>&times;</button>
                            <span className="history-item-url" onClick={clickHistory(url)}>{url}</span>
                        </div>
                    ))
                }
            </div>
        </>
    )
}