// 获取DOM元素
const bgColorInput = document.getElementById('bgColor');
const textColorInput = document.getElementById('textColor');
const excludedUrlsInput = document.getElementById('excludedUrls');
const statusElement = document.getElementById('status');
const toggleBtn = document.getElementById('toggleBtn');
const presetModesContainer = document.getElementById('presetModes');
const settingsContainer = document.getElementById('settingsContainer');
const customModesContainer = document.getElementById('customModes');

// 预设模式配置
const presetModes = {
    '影院模式': {
        bgColor: '#000000',
        textColor: '#FFFFFF',
        description: '适合：观看视频/电影'
    },
    '自然绿': {
        bgColor: '#C7EDCC',
        textColor: '#000000',
        description: '适合：长时间阅读/办公'
    },
    '羊皮纸': {
        bgColor: '#F5E6CA',
        textColor: '#333333',
        description: '适合：文档编辑/夜间阅读'
    },
    '天空蓝': {
        bgColor: '#E8F4FF',
        textColor: '#000000',
        description: '适合：编程/数据分析'
    },
    '银河白': {
        bgColor: '#F5F5F5',
        textColor: '#333333',
        description: '适合：通用浏览/高对比需求'
    },
    '深豆沙绿': {
        bgColor: '#E3EDCD',
        textColor: '#333333',
        description: '适合：医疗/学术研究'
    },
    '青草绿': {
        bgColor: '#DCEED1',
        textColor: '#333333',
        description: '适合：设计/创意工作'
    },
    '暖橙光': {
        bgColor: '#FFF2E6',
        textColor: '#333333',
        description: '适合：夜间阅读/减少蓝光'
    }
};

// 自定义模式存储键
const CUSTOM_MODES_KEY = 'eyecare_custom_modes';

// 自定义模式数据结构
let customModes = [];

// 更新界面状态
function updateUIState(isEnabled) {
    if (isEnabled) {
        settingsContainer.classList.remove('settings-disabled');
    } else {
        settingsContainer.classList.add('settings-disabled');
    }
}

// 更新状态显示
function updateStatus(isEnabled) {
    statusElement.textContent = `状态：${isEnabled ? '已启用' : '未启用'}`;
    toggleBtn.textContent = isEnabled ? '禁用' : '启用';
    updateUIState(isEnabled);
}

// 初始化预设模式按钮
function initPresetModes() {
    presetModesContainer.innerHTML = '';
    Object.entries(presetModes).forEach(([name, config]) => {
        const button = document.createElement('button');
        button.className = 'mode-button';
        
        // 添加预览样式
        button.style.backgroundColor = config.bgColor;
        button.style.color = config.textColor;
        
        button.innerHTML = `
            <div>${name}</div>
            <div class="mode-info">${config.description}</div>
        `;
        button.onclick = () => applyPresetMode(name, config);
        presetModesContainer.appendChild(button);
    });
}

// 应用预设模式
function applyPresetMode(name, config) {
    bgColorInput.value = config.bgColor;
    textColorInput.value = config.textColor;
    
    // 更新按钮状态
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.querySelector('div').textContent === name) {
            btn.classList.add('active');
        }
    });
    
    saveSettings();
    applySettings();
}

// 应用设置到当前标签页
function applySettings() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            console.error('没有找到活动标签页');
            return;
        }

        const message = {
            action: 'applyEyeProtection',
            settings: {
                bgColor: bgColorInput.value,
                textColor: textColorInput.value
            }
        };

        // 先尝试直接发送消息（适用于已加载content script的情况）
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (chrome.runtime.lastError) {
                console.log('尝试直接发送消息失败，准备注入content script:', chrome.runtime.lastError);
                
                // 注入content script
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    files: ['content.js']
                }).then(() => {
                    console.log('content script注入成功');
                    // 注入成功后重试发送消息
                    chrome.tabs.sendMessage(tabs[0].id, message, (retryResponse) => {
                        if (chrome.runtime.lastError) {
                            console.error('重试发送消息失败:', chrome.runtime.lastError);
                        }
                    });
                }).catch(err => {
                    console.error('注入content script失败:', err);
                });
            }
        });
    });
}

// 保存设置
function saveSettings() {
    const settings = {
        bgColor: bgColorInput.value,
        textColor: textColorInput.value,
        excludedUrls: excludedUrlsInput.value.split('\n')
            .map(url => url.trim())
            .filter(url => url !== ''),
        isEnabled: document.getElementById('toggleBtn').textContent === '禁用'
    };
    
    chrome.storage.local.set(settings, () => {
        if (chrome.runtime.lastError) {
            console.error('保存设置失败:', chrome.runtime.lastError);
        }
    });
}

// 移除护眼模式
function removeEyeProtection() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            console.error('没有找到活动标签页');
            return;
        }

        const message = {
            action: 'removeEyeProtection'
        };

        // 先尝试注入content script
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('注入content script失败:', chrome.runtime.lastError);
                return;
            }

            // 等待content script加载完成
            setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('发送消息失败:', chrome.runtime.lastError.message);
                    } else if (!response || !response.success) {
                        console.error('移除护眼模式失败:', response);
                    } else {
                        console.log('护眼模式已移除');
                    }
                });
            }, 100);
        });
    });
}

// 初始化自定义模式
function initCustomModes() {
    chrome.storage.local.get([CUSTOM_MODES_KEY], (result) => {
        customModes = result[CUSTOM_MODES_KEY] || [];
        renderCustomModes();
    });
}

// 渲染自定义模式
function renderCustomModes() {
    customModesContainer.innerHTML = '';
    
    // 添加空槽位
    for (let i = 0; i < 2; i++) {
        const slot = document.createElement('div');
        slot.className = 'custom-mode-slot empty';
        slot.onclick = () => saveCustomMode(i);
        customModesContainer.appendChild(slot);
    }
    
    // 渲染已保存的模式
    customModes.forEach((mode, index) => {
        const modeElement = document.createElement('div');
        modeElement.className = 'custom-mode-item';
        modeElement.innerHTML = `
            <div class="custom-mode-name">${mode.name}</div>
            <div class="custom-mode-desc">${mode.description}</div>
            <div class="custom-mode-colors">
                <div class="custom-mode-color" style="background-color: ${mode.bgColor}"></div>
                <div class="custom-mode-color" style="background-color: ${mode.textColor}"></div>
            </div>
            <div class="custom-mode-actions">
                <button class="custom-mode-btn apply">应用</button>
                <button class="custom-mode-btn delete">删除</button>
            </div>
        `;

        // 绑定事件
        const applyBtn = modeElement.querySelector('.custom-mode-btn.apply');
        const deleteBtn = modeElement.querySelector('.custom-mode-btn.delete');
        
        applyBtn.addEventListener('click', () => applyCustomMode(index));
        deleteBtn.addEventListener('click', () => deleteCustomMode(index));
        
        customModesContainer.replaceChild(modeElement, customModesContainer.children[index]);
    });
}

// 保存自定义模式
function saveCustomMode(index) {
    const name = prompt('请输入模式名称：');
    if (!name) return;
    
    const description = prompt('请输入模式描述：');
    if (!description) return;
    
    const newMode = {
        name,
        description,
        bgColor: bgColorInput.value,
        textColor: textColorInput.value,
        timestamp: Date.now()
    };
    
    if (customModes[index]) {
        customModes[index] = newMode;
    } else {
        customModes.push(newMode);
    }
    
    chrome.storage.local.set({ [CUSTOM_MODES_KEY]: customModes }, () => {
        renderCustomModes();
    });
}

// 应用自定义模式
function applyCustomMode(index) {
    const mode = customModes[index];
    if (!mode) return;
    
    bgColorInput.value = mode.bgColor;
    textColorInput.value = mode.textColor;
    
    saveSettings();
    applySettings();
}

// 删除自定义模式
function deleteCustomMode(index) {
    if (confirm('确定要删除这个自定义模式吗？')) {
        customModes.splice(index, 1);
        chrome.storage.local.set({ [CUSTOM_MODES_KEY]: customModes }, () => {
            renderCustomModes();
        });
    }
}

// 初始化设置
function initSettings() {
    chrome.storage.local.get(['bgColor', 'textColor', 'excludedUrls', 'isEnabled'], (result) => {
        bgColorInput.value = result.bgColor || '#FFFFFF';
        textColorInput.value = result.textColor || '#000000';
        excludedUrlsInput.value = Array.isArray(result.excludedUrls) ? result.excludedUrls.join('\n') : '';
        updateStatus(result.isEnabled);
        initCustomModes();
    });
}

// 添加事件监听器
bgColorInput.addEventListener('change', saveSettings);
textColorInput.addEventListener('change', saveSettings);
excludedUrlsInput.addEventListener('change', saveSettings);

toggleBtn.addEventListener('click', function() {
    chrome.storage.local.get(['isEnabled'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('获取状态失败:', chrome.runtime.lastError);
            return;
        }
        const isEnabled = !result.isEnabled;
        
        // 保存所有设置，包括新的启用状态
        const settings = {
            bgColor: bgColorInput.value,
            textColor: textColorInput.value,
            excludedUrls: excludedUrlsInput.value.split('\n')
                .map(url => url.trim())
                .filter(url => url !== ''),
            isEnabled: isEnabled
        };
        
        chrome.storage.local.set(settings, () => {
            if (chrome.runtime.lastError) {
                console.error('保存状态失败:', chrome.runtime.lastError);
                return;
            }
            
            // 更新UI状态
            updateStatus(isEnabled);
            
            // 根据状态执行相应操作
            if (isEnabled) {
                applySettings();
            } else {
                removeEyeProtection();
            }
        });
    });
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initPresetModes();
});

chrome.storage.onChanged.addListener((changes) => {
    console.log('存储变化:', changes);
});