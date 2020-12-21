// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         // set the icon for the browser action from sendMessage() in content script
//         browser.browserAction.setIcon({
//             path: {
//                 "20": request.iconPath20,
//                 "40": request.iconPath40
//             },
//             tabId: sender.tab.id
//         });
//         // disable browser action for the current tab
//         browser.browserAction.disable(sender.tab.id);
//     });

// const VALID_URLS = ['microsoft.com'];

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (!tab.url) return;

//     if (
//         // changeInfo.title === "New tab" ||
//         // (tab.url && tab.url.indexOf('msn.com') > -1) ||
//         VALID_URLS.reduce((p, c) => p || tab.url.indexOf(c) > -1, false)
//     ) {
//         // chrome.tabs.insertCSS(tabId, {
//         //     code: `body { background: red !important; }`
//         // }, (...args) => {
//         //     alert(JSON.stringify(args))
//         // });

//         chrome.tabs.executeScript(tabId, {
//             code: `
//                 if (!document.getElementById("NTP_HELPER_URL")) {
//                     document.body.innerHTML = '<div id="NTP_HELPER_URL" style="font-size: 10px; background: #c1c1c1">${tab.url}</div>'
//                         + document.body.innerHTML;
//                 }
//             `
//         })

//         // chrome.runtime.sendMessage({
//         //     url: tab.url
//         // });

//         // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         //     chrome.tabs.sendMessage(
//         //         tabs[0].id,
//         //         { url: tab.url }
//         //     );
//         // });
//     }
// });

