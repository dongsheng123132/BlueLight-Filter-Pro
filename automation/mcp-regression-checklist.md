# MCP 安装与回归测试清单（每次发版一条提示即可）

目标：
- 规范扩展的安装与关键功能回归。
- 保留截图与性能数据作为发布记录。

前置条件：
- `uploadtochrome/` 已生成（manifest 版本 v1.33）。
- 在 Chrome 中加载未打包扩展：`chrome://extensions` → 开发者模式 → 加载已解压的扩展程序 → 选择 `uploadtochrome/` 目录。
- 可选：通过 MCP 连接到该浏览器会话（如使用 `--browserUrl`）。

流程（在 MCP 客户端中执行此清单）：

1) 安装确认
- 打开 `chrome://extensions`，确认 BlueLight Filter Pro 已加载、版本号为 v1.33。
- 对该页面截图：`store-assets/output/auto/extensions-list.png`。

2) Popup 外观与交互（静态或真实会话）
- 若在真实扩展环境：点击工具栏扩展图标，弹出 Popup；否则访问 `http://127.0.0.1:5501/uploadtochrome/popup.html` 进行外观检查。
- 切换 2–3 个预设色彩模式（若在真实扩展环境）。
- 截图保存：`store-assets/output/auto/popup-modes.png`。

3) Options 页面设置回归
- 打开 Options（真实扩展：`chrome-extension://<extension-id>/options.html`，或静态：`http://127.0.0.1:5501/options.html`）。
- 修改一项设置并保存，确认 UI 无错误。
- 截图保存：`store-assets/output/auto/options-page.png`。

4) 内容脚本效果（真实网站）
- 打开 `https://developers.chrome.com` 或任意新闻站，启用/禁用滤镜各一次。
- 记录性能追踪：`performance_start_trace` → 执行启用/禁用 → `performance_stop_trace` → `performance_analyze_insight`。
- 截图保存：`store-assets/output/auto/filter-on-off.png`。

5) 调试与稳定性
- 导出本次会话的网络请求：`store-assets/output/auto/network.txt`。
- 导出控制台消息：`store-assets/output/auto/console.txt`。

通过标准：
- 无控制台错误（或仅为非阻断性日志）。
- 性能追踪无明显卡顿（如长任务/LCP 激增）。
- 截图可覆盖 Popup/Options/真实站点三类场景。

备注：
- 静态预览缺少 `chrome.*` 扩展 API，上述交互将以 UI 外观检查为主；功能性验证需在真实扩展会话完成。
- 建议将 `store-assets/output/auto` 纳入版本发布记录，便于后续迭代比对。