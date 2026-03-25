(function() {
    // 防止重复注入
    if (window.__BLFP_CONTENT_SCRIPT_LOADED__) {
        console.log('[BLFP] Content script already loaded, skipping...');
        return;
    }
    window.__BLFP_CONTENT_SCRIPT_LOADED__ = true;
    console.log('[BLFP] Content script loading...');

    // Debug mode
    const DEBUG_MODE = true;
    function debugLog(...args) {
        DEBUG_MODE && console.log('[BLFP DEBUG]', ...args);
    }

    // 全局变量
let currentSettings = null;
    let isProcessing = false;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 1000;

// 创建样式元素
const styleElement = document.createElement('style');
    styleElement.id = 'blfp-style';

    // 简化版的样式注入
    function safeAppendStyle(elementToAppend) {
        debugLog('Attempting to append style element...');
        if (document.head && !document.head.querySelector('#' + elementToAppend.id)) {
            document.head.appendChild(elementToAppend);
            debugLog('Style element successfully appended to head');
            return true;
        } else if (document.head) {
            debugLog('Style element already exists in head');
            return true;
        } else {
            debugLog('Document head not ready, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => {
                if (document.head && !document.head.querySelector('#' + elementToAppend.id)) {
                    document.head.appendChild(elementToAppend);
                    debugLog('Style element appended after DOMContentLoaded');
                }
            });
        return false;
    }
}

// 应用护眼模式
function applyEyeProtection(settings) {
    try {
            debugLog('Applying eye protection with settings:', settings);
            
        if (!settings || !settings.bgColor || !settings.textColor) {
                debugLog('Invalid settings provided:', settings);
            return;
        }

            // 确保样式元素已添加到文档中
            if (!document.head || !document.head.querySelector('#' + styleElement.id)) {
                debugLog('Style element not found in document, attempting to append...');
                safeAppendStyle(styleElement);
            }

            const css = `
                :root {
                    --blfp-bg-color: ${settings.bgColor} !important;
                    --blfp-text-color: ${settings.textColor} !important;
            }
                html {
                    background-color: var(--blfp-bg-color) !important;
                }
                body {
                    background-color: var(--blfp-bg-color) !important;
                    color: var(--blfp-text-color) !important;
            }
                div, p, span, h1, h2, h3, h4, h5, h6,
                a, input, textarea, select, button,
                table, tr, td, th {
                    background-color: var(--blfp-bg-color) !important;
                    color: var(--blfp-text-color) !important;
            }
        `;
        
        styleElement.textContent = css;
        currentSettings = settings;
            debugLog('Eye protection styles applied successfully');
            
            // 验证样式是否生效
            if (document.body) {
                const computedBgColor = window.getComputedStyle(document.body).backgroundColor;
                debugLog('Current computed background color:', computedBgColor);
            }
            
    } catch (error) {
            console.error('[BLFP ERROR] Failed to apply eye protection:', error);
    }
}

// 移除护眼模式
function removeEyeProtection() {
    debugLog('Removing eye protection...');
    if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
        debugLog('Style element removed from DOM');
    }
    currentSettings = null;
    debugLog('Eye protection removed successfully');
}

// 立即检查并应用设置
    async function immediatelyCheckAndApplySettings() {
        if (isProcessing || !shouldUpdate()) {
            debugLog('Skipping settings check - processing or too soon');
            return;
        }
        
        isProcessing = true;
        debugLog('Checking settings...');
        
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(null, resolve);
            });
            
            debugLog('Retrieved settings from storage:', result);
        
            // Removed excludedUrls
        const settings = {
                isEnabled: !!result.isEnabled,
                bgColor: result.bgColor || '#F0F3BD',
                textColor: result.textColor || '#4A4A4A'
        };

            debugLog('Processed settings:', settings);

        if (settings.isEnabled) {
                debugLog('Applying settings - enabled');
                applyEyeProtection(settings);
        } else {
                debugLog('Removing protection - disabled');
            removeEyeProtection();
        }
        } catch (error) {
            console.error('[BLFP ERROR] Failed to process settings:', error);
            chrome.storage.local.clear(() => {
                debugLog('Storage cleared due to error');
                chrome.storage.local.set({
                    isEnabled: false,
                    bgColor: '#FFFFFF',
                    textColor: '#000000'
                });
            });
        } finally {
            isProcessing = false;
        }
    }

    // 检查是否需要更新
    function shouldUpdate() {
        const now = Date.now();
        if (now - lastUpdate < UPDATE_INTERVAL) {
            return false;
        }
        lastUpdate = now;
        return true;
    }

    // 初始化
    safeAppendStyle(styleElement);
    immediatelyCheckAndApplySettings();
    
    // 添加消息监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog('Received message:', request);
    if (request.action === 'applyEyeProtection') {
        applyEyeProtection(request.settings);
        sendResponse({success: true});
    } else if (request.action === 'removeEyeProtection') {
        removeEyeProtection();
        sendResponse({success: true});
    }
    return true;
});

// 响应存储变化，确保所有 frame 同步
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.isEnabled || changes.bgColor || changes.textColor)) {
        chrome.storage.local.get(['isEnabled', 'bgColor', 'textColor'], (result) => {
            const settings = {
                isEnabled: !!result.isEnabled,
                bgColor: result.bgColor || '#F0F3BD',
                textColor: result.textColor || '#4A4A4A'
            };
            if (settings.isEnabled) {
                applyEyeProtection(settings);
            } else {
                removeEyeProtection();
            }
        });
    }
});
    debugLog('Content script initialization complete');
})();