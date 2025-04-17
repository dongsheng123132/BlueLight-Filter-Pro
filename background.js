// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('护眼助手已安装/更新');
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSettings') {
        // 获取设置并发送回content script
        chrome.storage.local.get(null, (settings) => {
            sendResponse(settings);
        });
        return true; // 保持消息通道开放
    }
}); 