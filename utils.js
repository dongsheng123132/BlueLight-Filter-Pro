// Promise wrapper for chrome.storage.local.get
function storageGet(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
            resolve(result);
        });
    });
}

// Promise wrapper for chrome.storage.local.set
function storageSet(items) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
}

// Promise wrapper for chrome.tabs.query
function tabsQuery(options) {
    return new Promise((resolve) => {
        chrome.tabs.query(options, (tabs) => {
            resolve(tabs);
        });
    });
}

// Promise wrapper for chrome.tabs.sendMessage
function tabsSendMessage(tabId, message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(response);
        });
    });
}

// Promise wrapper for chrome.scripting.executeScript
function scriptingExecute(options) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript(options, (results) => {
            resolve(results);
        });
    });
}

// Combined function to send a message to the active tab, injecting content script if necessary
async function sendMessageToActiveTab(message) {
    const tabs = await tabsQuery({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
        console.error('No active tab found.');
        return;
    }
    const activeTab = tabs[0];

    try {
        const response = await tabsSendMessage(activeTab.id, message);
        console.log('Message sent successfully:', response);
        return response;
    } catch (error) {
        console.warn('Failed to send message, attempting to inject content script:', error.message);
        try {
            await scriptingExecute({
                target: { tabId: activeTab.id },
                files: ['content.js'],
            });
            const retryResponse = await tabsSendMessage(activeTab.id, message);
            console.log('Message sent successfully on retry:', retryResponse);
            return retryResponse;
        } catch (injectionError) {
            console.error('Failed to inject content script or send message on retry:', injectionError);
            throw injectionError;
        }
    }
}