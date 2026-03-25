// 获取DOM元素
const bgColorInput = document.getElementById('bgColor');
const textColorInput = document.getElementById('textColor');
// const excludedUrlsInput = document.getElementById('excludedUrls'); // Removed
const statusElement = document.getElementById('status');
const statusText = document.getElementById('statusText'); // Get the span for status text
const toggleBtn = document.getElementById('toggleBtn');
const presetModesContainer = document.getElementById('presetModes');
const settingsContainer = document.getElementById('settingsContainer');
const customModesContainer = document.getElementById('customModes');
const customModeModal = document.getElementById('customModeModal');
const customModeNameInput = document.getElementById('customModeNameInput');
const customModeDescInput = document.getElementById('customModeDescInput');
const cancelCustomModeBtn = document.getElementById('cancelCustomModeBtn');
const saveCustomModeModalBtn = document.getElementById('saveCustomModeModalBtn');
const customModeNameError = document.getElementById('customModeNameError');
const optionsBtn = document.getElementById('optionsBtn');
// 新增站点提示相关元素
const siteThemeTip = document.getElementById('siteThemeTip');
const siteTipGoogle = document.getElementById('siteTipGoogle');
const siteTipYouTube = document.getElementById('siteTipYouTube');
const openGooglePrefsBtn = document.getElementById('openGooglePrefsBtn');
const openYouTubeBtn = document.getElementById('openYouTubeBtn');

// Preset modes now use message keys for name and description
const presetModes = {
    'presetCinema': { bgColor: '#000000', textColor: '#FFFFFF' },
    'presetNature': { bgColor: '#C7EDCC', textColor: '#000000' },
    'presetParchment': { bgColor: '#F5E6CA', textColor: '#333333' },
    'presetSkyBlue': { bgColor: '#E8F4FF', textColor: '#000000' },
    'presetGalaxyWhite': { bgColor: '#F5F5F5', textColor: '#333333' },
    'presetDeepBean': { bgColor: '#E3EDCD', textColor: '#333333' },
    'presetGrassGreen': { bgColor: '#DCEED1', textColor: '#333333' },
    'presetWarmOrange': { bgColor: '#FFF2E6', textColor: '#333333' }
};

// 自定义模式存储键
const CUSTOM_MODES_KEY = 'eyecare_custom_modes';

// 自定义模式数据结构
let customModes = [];
let currentCustomModeIndex = -1; // 用于存储当前正在保存的模式索引

// 更新界面状态
function updateUIState(isEnabled) {
    if (isEnabled) {
        settingsContainer.classList.remove('settings-disabled');
    } else {
        settingsContainer.classList.add('settings-disabled');
    }
}

// 更新状态显示 (Reverted: Use hardcoded text from HTML, just update the state text span)
function updateStatus(isEnabled) {
    const statusMsgKey = isEnabled ? 'statusEnabled' : 'statusDisabled';
    const buttonMsgKey = isEnabled ? 'disableButton' : 'enableButton';

    // 只设置 data-i18n，文本由 applyTranslations 统一刷新
    statusText.setAttribute('data-i18n', statusMsgKey); 
    toggleBtn.setAttribute('data-i18n', buttonMsgKey); 

    updateUIState(isEnabled);
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
    // 根据当前站点与启用状态显示站点主题提示
    showSiteThemeTipIfNeeded(isEnabled);
}

// 初始化预设模式按钮 (Use message keys)
function initPresetModes() {
    presetModesContainer.innerHTML = '';
    Object.entries(presetModes).forEach(([key, config]) => {
        const button = document.createElement('button');
        button.className = 'mode-button';
        button.style.backgroundColor = config.bgColor;
        button.style.color = config.textColor;
        
        const nameKey = key; // e.g., presetCinema
        const descKey = key + 'Desc'; // e.g., presetCinemaDesc
        
        button.innerHTML = `
            <div data-i18n="${nameKey}"></div>
            <div class="mode-info" data-i18n="${descKey}"></div>
        `;
        button.onclick = () => applyPresetMode(key, config);
        presetModesContainer.appendChild(button);
    });
    // Trigger translation for newly added elements
    if (typeof applyTranslations === 'function') { // Check if translations.js loaded
        applyTranslations(); 
    }
}

// 应用预设模式
async function applyPresetMode(key, config) {
    bgColorInput.value = config.bgColor;
    textColorInput.value = config.textColor;

    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.querySelector('div[data-i18n]')?.getAttribute('data-i18n') === key) {
            btn.classList.add('active');
        }
    });

    const settings = {
        isEnabled: true,
        bgColor: config.bgColor,
        textColor: config.textColor
    };

    try {
        await storageSet(settings);
        updateStatus(true);
        await applySettings();
    } catch (error) {
        console.error('Failed to apply preset mode:', error);
    }
}

// 应用设置到当前标签页
async function applySettings() {
    const settings = {
        isEnabled: true,
        bgColor: bgColorInput.value,
        textColor: textColorInput.value
    };

    const message = {
        action: 'applyEyeProtection',
        settings: settings
    };

    try {
        await sendMessageToActiveTab(message);
    } catch (error) {
        console.error('Failed to apply settings:', error);
    }
}

// 保存设置
async function saveSettings() {
    try {
        const result = await storageGet(['isEnabled']);
        const settings = {
            bgColor: bgColorInput.value,
            textColor: textColorInput.value,
            isEnabled: result.isEnabled
        };

        await storageSet(settings);

        if (settings.isEnabled) {
            await applySettings();
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// 移除护眼模式
async function removeEyeProtection() {
    const message = { action: 'removeEyeProtection' };
    try {
        await sendMessageToActiveTab(message);
    } catch (error) {
        console.error('Failed to remove eye protection:', error);
    }
}

// 初始化自定义模式
async function initCustomModes() {
    const result = await storageGet([CUSTOM_MODES_KEY]);
    customModes = result[CUSTOM_MODES_KEY] || [];
    renderCustomModes();
}

// 渲染自定义模式 (Use message keys for buttons/placeholders)
function renderCustomModes() {
    customModesContainer.innerHTML = '';
    
    // Add empty slots first, then overwrite with saved modes if they exist at that index
    for (let i = 0; i < 2; i++) {
        const slot = document.createElement('div');
        slot.className = 'custom-mode-slot empty';
        slot.innerHTML = `
            <span style="font-size: 24px; color: #999; margin-bottom: 8px;">+</span>
            <span data-i18n="saveCustomModePlaceholder"></span>
        `;
        slot.onclick = () => saveCustomMode(i);
        customModesContainer.appendChild(slot);
    }
    
    customModes.forEach((mode, index) => {
        if (index < 2) { // Ensure we only try to replace the 2 initially created slots
        const modeElement = document.createElement('div');
        modeElement.className = 'custom-mode-item';
            // Populate with mode details (name, desc, colors, buttons)
            // Using data-i18n for button text is already good
        modeElement.innerHTML = `
            <div class="custom-mode-name">${mode.name}</div>
                <div class="custom-mode-desc">${mode.description || ''}</div>
            <div class="custom-mode-colors">
                    <div class="custom-mode-color" style="background-color: ${mode.bgColor};"></div>
                    <div class="custom-mode-color" style="background-color: ${mode.textColor};"></div>
            </div>
            <div class="custom-mode-actions">
                     <button class="custom-mode-btn apply" data-i18n="customModeApply"></button> 
                     <button class="custom-mode-btn delete" data-i18n="customModeDelete"></button>
            </div>
        `;

        const applyBtn = modeElement.querySelector('.custom-mode-btn.apply');
        const deleteBtn = modeElement.querySelector('.custom-mode-btn.delete');
        
            applyBtn.addEventListener('click', (e) => { e.stopPropagation(); applyCustomMode(index); });
            deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteCustomMode(index); });
            modeElement.addEventListener('click', () => applyCustomMode(index)); // Click whole item to apply
        
            // Replace the empty slot with the populated mode item
            if (customModesContainer.children[index]) {
        customModesContainer.replaceChild(modeElement, customModesContainer.children[index]);
            }
        }
    });

    // Ensure translations are applied to newly added/re-rendered elements
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
}

// 显示自定义模式保存模态框
function showCustomModeModal(index) {
    currentCustomModeIndex = index;
    customModeNameInput.value = '';
    customModeDescInput.value = '';
    customModeNameError.textContent = '';
    customModeNameError.style.display = 'none';
    customModeModal.style.display = 'flex'; // 使用 flex 来居中
    customModeNameInput.focus();
    if (typeof applyTranslations === 'function') { // 确保模态框文本也被翻译
        applyTranslations();
    }
}

// 隐藏自定义模式保存模态框
function hideCustomModeModal() {
    customModeModal.style.display = 'none';
}

// 修改后的保存自定义模式逻辑
function saveCustomMode(index) { // 这个函数现在只负责显示模态框
    showCustomModeModal(index);
}

// 模态框保存按钮的事件处理
saveCustomModeModalBtn.addEventListener('click', async () => {
    const name = customModeNameInput.value.trim();
    const description = customModeDescInput.value.trim();

    if (!name) {
        customModeNameError.textContent = chrome.i18n.getMessage('errorCustomModeNameEmpty') || '模式名称不能为空';
        customModeNameError.style.display = 'block';
        return;
    }
    customModeNameError.style.display = 'none';

    const newMode = {
        name,
        description,
        bgColor: bgColorInput.value,
        textColor: textColorInput.value,
        timestamp: Date.now()
    };

    if (currentCustomModeIndex !== -1 && customModes[currentCustomModeIndex]) {
        customModes[currentCustomModeIndex] = newMode;
    } else if (customModes.length < 2) {
        let targetIndex = customModes.findIndex((_, idx) => !customModes[idx]);
        if (targetIndex === -1 && customModes.length < 2) targetIndex = customModes.length;

        if (targetIndex !== -1 && targetIndex < 2) {
            customModes[targetIndex] = newMode;
        } else {
            console.warn("Attempting to add to a non-existent or full custom mode slot");
            hideCustomModeModal();
            return;
        }
    }

    try {
        await storageSet({ [CUSTOM_MODES_KEY]: customModes.filter(Boolean) });
        renderCustomModes();
        hideCustomModeModal();
    } catch (error) {
        console.error('Failed to save custom mode:', error);
    }
});

// 模态框取消按钮的事件处理
cancelCustomModeBtn.addEventListener('click', hideCustomModeModal);

// 应用自定义模式
async function applyCustomMode(index) {
    const mode = customModes[index];
    if (!mode) return;

    bgColorInput.value = mode.bgColor;
    textColorInput.value = mode.textColor;

    await saveSettings();
    await applySettings();
}

// 删除自定义模式 (Use message key for confirm)
async function deleteCustomMode(index) {
    if (confirm(chrome.i18n.getMessage('confirmDeleteCustomMode'))) {
        customModes.splice(index, 1);
        try {
            await storageSet({ [CUSTOM_MODES_KEY]: customModes });
            renderCustomModes();
        } catch (error) {
            console.error('Failed to delete custom mode:', error);
        }
    }
}

// 初始化设置
async function initSettings() {
    const result = await storageGet(['bgColor', 'textColor', 'isEnabled']);
    bgColorInput.value = result.bgColor || '#FFFFFF';
    textColorInput.value = result.textColor || '#000000';
    updateStatus(result.isEnabled);
    await initCustomModes();
}

// 添加事件监听器
bgColorInput.addEventListener('change', saveSettings);
textColorInput.addEventListener('change', saveSettings);

toggleBtn.addEventListener('click', async function() {
    try {
        const result = await storageGet(['isEnabled']);
        const isEnabled = !result.isEnabled;

        const settings = {
            bgColor: bgColorInput.value,
            textColor: textColorInput.value,
            isEnabled: isEnabled
        };

        await storageSet(settings);
        updateStatus(isEnabled);

        if (isEnabled) {
            await applySettings();
        } else {
            await removeEyeProtection();
        }
    } catch (error) {
        console.error('Failed to toggle eye protection:', error);
    }
});

// Options button event listener
if (optionsBtn) {
    optionsBtn.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
}
// 站点提示按钮事件
if (openGooglePrefsBtn) {
    openGooglePrefsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.google.com/' });
    });
}
if (openYouTubeBtn) {
    openYouTubeBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.youtube.com/' });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initPresetModes();
    // 初始渲染后，根据当前状态与站点显示提示（initSettings 内会调用 updateStatus）
});

chrome.storage.onChanged.addListener((changes) => {
    console.log('存储变化:', changes);
});

// 语言下拉框切换逻辑
var langSelect = document.getElementById('langSelect');
if (langSelect) {
    var current = localStorage.getItem('ui_lang') || ((typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') ? chrome.i18n.getUILanguage() : 'zh_CN');
    langSelect.value = current;
    langSelect.onchange = function() {
        localStorage.setItem('ui_lang', langSelect.value);
        if (typeof applyTranslations === 'function') { applyTranslations(); }
        // 重新渲染预设按钮以更新文本
        initPresetModes();
    };
}
async function showSiteThemeTipIfNeeded(isEnabled) {
    if (!siteThemeTip) return;
    // 仅在扩展关闭时提示
    if (isEnabled) { siteThemeTip.style.display = 'none'; return; }

    try {
        const tabs = await tabsQuery({ active: true, currentWindow: true });
        const url = tabs[0]?.url || '';
        let host = '';
        try { host = new URL(url).hostname; } catch (e) { host = ''; }
        const isGoogle = host.includes('google.') || /(^|\.)google\.[a-z.]+$/i.test(host);
        const isYouTube = /(^|\.)youtube\.com$/i.test(host);

        if (isGoogle || isYouTube) {
            siteThemeTip.style.display = 'block';
            if (siteTipGoogle) siteTipGoogle.style.display = isGoogle ? 'block' : 'none';
            if (siteTipYouTube) siteTipYouTube.style.display = isYouTube ? 'block' : 'none';
            if (openGooglePrefsBtn) openGooglePrefsBtn.style.display = isGoogle ? 'inline-block' : 'none';
            if (openYouTubeBtn) openYouTubeBtn.style.display = isYouTube ? 'inline-block' : 'none';
            if (typeof applyTranslations === 'function') applyTranslations();
        } else {
            siteThemeTip.style.display = 'none';
        }
    } catch (err) {
        console.warn('Failed to determine active domain for site tip:', err);
        siteThemeTip.style.display = 'none';
    }
}