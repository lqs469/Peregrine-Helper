import React, { useEffect, useState, useCallback, createRef, useMemo } from 'react';

const LS_KEY = 'NTP_HISTORY';

const LOCALE = [
    "es-us",
    "en-ca",
    "en-gb",
    "zh-cn",
    "fr-fr",
    "ar-ae",
    "ar-eg",
    "ar-sa",
    "bn-in",
    "cs-cz",
    "da-dk",
    "de-at",
    "de-ch",
    "de-de",
    "el-gr",
    "en-ae",
    "en-au",
    "en-ie",
    "en-in",
    "en-my",
    "en-nz",
    "en-ph",
    "en-sg",
    "en-xl",
    "en-za",
    "es-ar",
    "es-cl",
    "es-co",
    "es-es",
    "es-mx",
    "es-pe",
    "es-ve",
    "es-xl",
    "fi-fi",
    "fr-be",
    "fr-ca",
    "fr-ch",
    "fr-xl",
    "he-il",
    "hi-in",
    "hu-hu",
    "id-id",
    "it-it",
    "ja-jp",
    "ko-kr",
    "mr-in",
    "nb-no",
    "nl-be",
    "nl-nl",
    "pl-pl",
    "pt-br",
    "pt-pt",
    "ru-ru",
    "sv-se",
    "te-in",
    "th-th",
    "tr-tr",
    "vi-vn",
    "zh-hk",
    "zh-tw"
];

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
            url: "https://ntp.msn.com/edge/ntp?spalink=latest"
        });
    }, []);

    const clickCopy = useCallback(() => {
        urlInput.current.select();
        document.execCommand("copy");
        urlInput.current.blur();
        setCurrFocus();
    }, [url, urlInput]);

    const clickOpen = useCallback(() => {
        chrome.tabs.update(tabId, { url });
        historyList.add(url);
        localStorage.setItem(LS_KEY, JSON.stringify([...historyList]));
        setHistoryList(new Set([...historyList]));
        setSuggestions(Array.from(historyList));
    }, [tabId, url, historyList]);

    const query = useMemo(() => parseQuery(url), [url]);

    const handleChangeQuery = useCallback(([idx, item]) => {
        return (e) => {
            query[idx][item] = e.target.value;
            const host = url.split('?')[0];
            setUrl(buildQuery(host, query));
        }
    }, [url]);

    const addQuery = useCallback((type) => {
        return () => {
            switch (type) {
                case "spalink":
                    query.push(["item", "spalink:latest"]);
                    break;
                case "flights":
                    query.push(["item", "flights:prg-"]);
                    break;
                case "locale":
                    query.push(["locale", "en-us"]);
                    break;
                case "enterprise":
                    query.push(["query", "enterprise"]);
                    break;
                case "kids":
                    query.push(["query", "kids"]);
                    break;
                default:
                    query.push(["item", ""]);
                    break;
            }

            setUrl(buildQuery(url.split('?')[0], query));
        }
    }, [url, setUrl]);

    const rmQuery = useCallback((idx) => {
        return () => {
            query.splice(idx, 1);
            const host = url.split('?')[0];
            setUrl(buildQuery(host, query));
        }
    }, [url, setUrl]);

    const clickHistory = useCallback((url) => {
        chrome.tabs.update(tabId, { url });
        setUrl(url)
        setCurrFocus();
    }, [tabId, setUrl]);

    const rmHistory = useCallback((currUrl) => {
        if (historyList.has(currUrl)) {
            historyList.delete(currUrl);
            localStorage.setItem(LS_KEY, JSON.stringify([...historyList]));
            setHistoryList(new Set([...historyList]));
            setSuggestions(Array.from(historyList));
        }
    }, [historyList]);

    const handleFocusUrl = useCallback(() => {
        setCurrFocus(-1);
        setSuggestions(Array.from(historyList));
    }, [url, historyList, setCurrFocus, setSuggestions]);

    const queryFocus = useCallback((idx, key, val) => {
        return () => {
            setCurrFocus(idx);

            if (val.includes("spalink")) {
                setSuggestions(["/debug"]);
            } else if (/flights:.*/g.test(val)) {
                setSuggestions(["prg-webcomp"]);
            } else if (key === "locale") {
                setSuggestions(LOCALE);
            } else {
                setSuggestions([]);
            }
        }
    }, [url]);

    const queryOptionClick = useCallback((option) => {
        const [inputKey, inputVal] = query[currFocus];

        if (inputVal.includes("spalink")) {
            if (inputVal.includes("/debug")) {
                query[currFocus][1] = inputVal.replace(new RegExp("/debug"), "");
            } else {
                query[currFocus][1] += "/debug";
            }
        } else if (/flights:.*/g.test(inputVal)) {
            const flights = new Set(inputVal.replace(/flights:?/g, "").split(",").filter(id => id));
            if (flights.has(option)) {
                flights.delete(option);
            } else {
                flights.add(option);
            }

            query[currFocus][1] = `flights:${Array.from(flights).join(",")}`
        } else if (inputKey === "locale") {
            query[currFocus][1] = option;
            setCurrFocus();
        } else {
            setCurrFocus();
            return;
        }

        const host = url.split('?')[0];
        setUrl(buildQuery(host, query));
    }, [currFocus, setUrl, url]);

    return (
        <>
            <h2>🐱‍💻 NTP Helper</h2>
            <div
                style={{ position: 'relative' }}
                onMouseLeave={() => {
                    setCurrFocus();
                    urlInput.current.blur();
                }}
            >
                <textarea
                    className="url"
                    ref={urlInput}
                    id="url"
                    rows="3"
                    onChange={handleTextareaChange}
                    onFocus={handleFocusUrl}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            clickOpen();
                        }
                    }}
                    value={url}
                ></textarea>
                {
                    currFocus === -1
                        ? <Suggestions
                            suggestions={suggestions}
                            onClickFn={clickHistory}
                            onRemoveFn={rmHistory}
                        />
                        : null
                }
            </div>
            {historyList.size ? <small>Click input to browse history</small> : ""}

            <div className="action-btn-container">
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
                        <div
                            className="value-input"
                            onMouseLeave={(e) => {
                                setCurrFocus();
                                e.target.blur();
                            }}
                        >
                            <input
                                value={value}
                                onChange={handleChangeQuery([idx, 1])}
                                onFocus={queryFocus(idx, key, value)}
                            />
                            {
                                idx === currFocus
                                    ? <Suggestions
                                        suggestions={suggestions}
                                        onClickFn={queryOptionClick}
                                    />
                                    : null
                            }
                        </div>
                    </div>
                ))}
            </div>


            <button id="add-query" onClick={addQuery("item")}>+</button>
            <button id="add-query" onClick={addQuery("spalink")}>+splink</button>
            <button id="add-query" onClick={addQuery("flights")}>+flights</button>
            <button id="add-query" onClick={addQuery("locale")}>+locale</button>
            <button id="add-query" onClick={addQuery("enterprise")}>+enterprise</button>
            <button id="add-query" onClick={addQuery("kids")}>+kids</button>
        </>
    )
}

const Suggestions = ({ suggestions, onClickFn, onRemoveFn }) => {
    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="srchList">
            <ul>
                {
                    suggestions.map((item) => (

                        <li key={item}>
                            {
                                onRemoveFn
                                    ? <button className="history-item-close" onClick={() => onRemoveFn(item)}>
                                        &times;
                                    </button>
                                    : ""
                            }
                            <span onClick={() => onClickFn(item)}>{item}</span>
                        </li>
                    ))
                }
            </ul>
        </div>
    );
}