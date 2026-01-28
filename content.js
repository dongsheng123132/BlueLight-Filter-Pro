(function() {
    // 防止重复注入导致变量重声明错误
    if (window.hasRunBlueLightFilter) {
        // 如果已经注入过，尝试复用现有的监听器
        // 这里我们只需要确保不会重复声明变量
        // 但为了响应新的注入请求（虽然不推荐这样做），我们实际上应该什么都不做，
        // 因为现有的 content script 已经可以通过消息机制工作了。
        console.log('[BlueLight] Content script already injected, skipping initialization.');
        return;
    }
    window.hasRunBlueLightFilter = true;

    // 全局变量用于存储当前的样式设置
    let currentSettings = null;
    let isProcessing = false;
    let debugMode = false;

    // 日志工具
    const logger = {
        log: (...args) => {
            if (debugMode) console.log('[BlueLight]', ...args);
        },
        error: (...args) => {
            console.error('[BlueLight Error]', ...args);
        }
    };

    // 创建样式元素
    // 使用 ID 查找，防止重复创建
    let styleElement = document.getElementById('bluelight-filter-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'bluelight-filter-style';
        (document.head || document.documentElement).appendChild(styleElement);
    }

    // 创建 Overlay 元素 (滤镜模式)
    let overlayElement = null;

    function createOrGetOverlay() {
        if (!overlayElement) {
            overlayElement = document.getElementById('bluelight-filter-overlay');
        }
        if (!overlayElement) {
            overlayElement = document.createElement('div');
            overlayElement.id = 'bluelight-filter-overlay';
            overlayElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 2147483647;
                mix-blend-mode: multiply;
                transition: background-color 0.3s ease;
                display: none;
            `;
            document.documentElement.appendChild(overlayElement);
        }
        return overlayElement;
    }

    // 检查当前网址是否在排除列表中
    function isUrlExcluded(excludedUrls) {
        if (!Array.isArray(excludedUrls) || excludedUrls.length === 0) {
            return false;
        }
        
        const currentHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
        return excludedUrls.some(url => {
            const trimmedUrl = url.toLowerCase().trim().replace(/^www\./, '');
            if (trimmedUrl.startsWith('*.')) {
                const base = trimmedUrl.slice(2);
                return currentHost === base || currentHost.endsWith('.' + base);
            }
            return currentHost === trimmedUrl || currentHost.endsWith('.' + trimmedUrl);
        });
    }

    // 应用护眼模式
    function applyEyeProtection(settings) {
        try {
            if (!settings || !settings.bgColor || !settings.textColor) {
                logger.error('无效的设置:', settings);
                return;
            }

            // 策略1：CSS 强制变色 (夜间模式/高对比度)
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
                /* 排除图片和视频反色，避免看起来很怪 */
                img, video {
                    filter: none !important;
                }
            `;
            
            styleElement.textContent = css;
            
            // 策略2：Overlay 滤镜 (备选或增强)
            const overlay = createOrGetOverlay();
            overlay.style.display = 'none';

            currentSettings = settings;
            logger.log('护眼模式已应用:', settings);
        } catch (error) {
            logger.error('应用护眼模式时发生错误:', error);
        }
    }

    // 移除护眼模式
    function removeEyeProtection() {
        // 清空样式内容
        styleElement.textContent = '';
        
        // 确保隐藏 Overlay
        if (overlayElement) {
            overlayElement.style.display = 'none';
        } else {
            // 尝试查找 DOM 元素，防止变量丢失
            const existingOverlay = document.getElementById('bluelight-filter-overlay');
            if (existingOverlay) {
                existingOverlay.style.display = 'none';
            }
        }
        
        currentSettings = null;
        logger.log('护眼模式已移除');
    }

    // 立即检查并应用设置
    function immediatelyCheckAndApplySettings() {
        if (isProcessing) return;
        
        // 检查扩展上下文是否有效
        if (!chrome.runtime?.id) {
            // 扩展已被重新加载或卸载，停止运行以避免报错
            return;
        }

        isProcessing = true;
        logger.log('开始检查设置...');
        
        try {
            chrome.storage.local.get(null, (result) => {
                // 再次检查错误（处理异步期间的失效）
                if (chrome.runtime.lastError) {
                    logger.log('读取设置时出错（通常是因为扩展已重载）:', chrome.runtime.lastError);
                    isProcessing = false;
                    return;
                }

                try {
                    logger.log('获取到的设置:', result);
                    
                    // 启用调试模式
                    if (result.debugMode) {
                        debugMode = true;
                    }
                    
                    const settings = {
                        isEnabled: result.isEnabled !== undefined ? result.isEnabled : true, // 默认启用
                        bgColor: result.bgColor || '#FFFFFF',
                        textColor: result.textColor || '#000000',
                        excludedUrls: Array.isArray(result.excludedUrls) ? result.excludedUrls : []
                    };

                    logger.log('处理后的设置:', settings);

                    if (settings.isEnabled) {
                        if (isUrlExcluded(settings.excludedUrls)) {
                            logger.log('当前网址在排除列表中，移除护眼模式');
                            removeEyeProtection();
                        } else {
                            logger.log('应用护眼模式设置');
                            applyEyeProtection(settings);
                        }
                    } else {
                        logger.log('护眼模式未启用，移除效果');
                        removeEyeProtection();
                    }
                } catch (error) {
                    logger.error('处理设置时发生错误:', error);
                } finally {
                    isProcessing = false;
                }
            });
        } catch (e) {
            // 捕获同步调用的上下文失效错误
            logger.log('扩展上下文已失效，停止操作');
            isProcessing = false;
        }
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

    const debouncedCheckSettings = debounce(immediatelyCheckAndApplySettings, 300);

    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        logger.log('收到消息:', request);
        if (request.action === 'applyEyeProtection') {
            applyEyeProtection(request.settings);
            sendResponse({success: true});
        } else if (request.action === 'removeEyeProtection') {
            removeEyeProtection();
            sendResponse({success: true});
        }
        return true;
    });

    // 初始化
    logger.log('脚本开始执行');
    immediatelyCheckAndApplySettings();

    // DOM 生命周期监听
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            logger.log('DOMContentLoaded');
            debouncedCheckSettings();
        });
    }

    window.addEventListener('load', () => {
        logger.log('Window Loaded');
        debouncedCheckSettings();
    });

    // 存储和状态监听
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            logger.log('存储变化:', changes);
            debouncedCheckSettings();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            debouncedCheckSettings();
        }
    });

    window.addEventListener('focus', () => {
        debouncedCheckSettings();
    });

    logger.log('Content script ready', new Date().toISOString());

})();
