// 全局变量用于存储当前的样式设置
let currentSettings = null;
let isProcessing = false; // 添加处理状态标志

// 创建样式元素
const styleElement = document.createElement('style');
document.head.appendChild(styleElement);

// 检查当前网址是否在排除列表中
function isUrlExcluded(excludedUrls) {
    if (!Array.isArray(excludedUrls) || excludedUrls.length === 0) {
        return false;
    }
    
    const currentHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
    return excludedUrls.some(url => {
        const trimmedUrl = url.toLowerCase().trim().replace(/^www\./, '');
        return currentHost === trimmedUrl || currentHost.endsWith('.' + trimmedUrl);
    });
}

// 应用护眼模式
function applyEyeProtection(settings) {
    try {
        if (!settings || !settings.bgColor || !settings.textColor) {
            console.error('无效的设置:', settings);
            return;
        }

        const css = `
            html, body {
                background-color: ${settings.bgColor} !important;
                color: ${settings.textColor} !important;
            }
            * {
                color: ${settings.textColor} !important;
                border-color: ${settings.textColor} !important;
            }
            a, a:visited, a:hover, a:active {
                color: ${settings.textColor} !important;
            }
            input, textarea, select {
                background-color: ${settings.bgColor} !important;
                color: ${settings.textColor} !important;
            }
        `;
        
        styleElement.textContent = css;
        currentSettings = settings;
        console.log('护眼模式已应用:', settings);
    } catch (error) {
        console.error('应用护眼模式时发生错误:', error);
    }
}

// 移除护眼模式
function removeEyeProtection() {
    styleElement.textContent = '';
    currentSettings = null;
    console.log('护眼模式已移除');
}

// 立即检查并应用设置
function immediatelyCheckAndApplySettings() {
    // 如果正在处理中，则跳过
    if (isProcessing) {
        return;
    }
    
    isProcessing = true;
    console.log('开始检查设置...');
    
    chrome.storage.local.get(null, (result) => {
        try {
            console.log('获取到的设置:', result);
            
            // 确保获取到所有必要设置
            const settings = {
                isEnabled: result.isEnabled !== undefined ? result.isEnabled : false,
                bgColor: result.bgColor || '#FFFFFF',
                textColor: result.textColor || '#000000',
                excludedUrls: Array.isArray(result.excludedUrls) ? result.excludedUrls : []
            };

            console.log('处理后的设置:', settings);

            if (settings.isEnabled) {
                if (isUrlExcluded(settings.excludedUrls)) {
                    console.log('当前网址在排除列表中，移除护眼模式');
                    removeEyeProtection();
                } else {
                    console.log('应用护眼模式设置');
                    applyEyeProtection(settings);
                }
            } else {
                console.log('护眼模式未启用，移除效果');
                removeEyeProtection();
            }
        } catch (error) {
            console.error('处理设置时发生错误:', error);
        } finally {
            isProcessing = false;
        }
    });
}

// 使用防抖函数来优化事件处理
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 创建防抖版本的设置检查函数
const debouncedCheckSettings = debounce(immediatelyCheckAndApplySettings, 300);

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'applyEyeProtection') {
        applyEyeProtection(request.settings);
        sendResponse({success: true});
    } else if (request.action === 'removeEyeProtection') {
        removeEyeProtection();
        sendResponse({success: true});
    }
    return true;
});

// 在页面加载的不同阶段检查设置
console.log('脚本开始执行');

// 立即执行一次检查
immediatelyCheckAndApplySettings();

// 在 DOM 开始构建时执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded 事件触发');
        debouncedCheckSettings();
    });
}

// 在页面完全加载后再次检查
window.addEventListener('load', () => {
    console.log('load 事件触发');
    debouncedCheckSettings();
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('存储变化:', changes);
        debouncedCheckSettings();
    }
});

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('页面变为可见状态');
        debouncedCheckSettings();
    }
});

// 监听页面焦点变化
window.addEventListener('focus', () => {
    console.log('页面获得焦点');
    debouncedCheckSettings();
});

console.log('护眼助手内容脚本加载', new Date().toISOString());