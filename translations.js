// 获取所有需要翻译的元素
const elements = document.querySelectorAll('[data-i18n]');
const placeholders = document.querySelectorAll('[data-i18n-placeholder]');

// 处理翻译
function processTranslation(element, message) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = message;
    } else {
        element.textContent = message;
    }
}

// 应用翻译
function applyTranslations() {
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            processTranslation(element, message);
        }
    });

    placeholders.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.placeholder = message;
        }
    });
}

// 当DOM加载完成后应用翻译
document.addEventListener('DOMContentLoaded', applyTranslations); 