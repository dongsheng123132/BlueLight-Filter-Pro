# MCP 批量截图 + 性能跟踪（可直接粘贴到 MCP 客户端）

目标：
- 在本地项目页面与真实网站上，进行批量截图与性能跟踪；
- 保存截图与追踪结果到仓库中，便于发布与对比。

前置准备：
- Node.js 22.12+、Chrome 稳定版；
- MCP 客户端已接入 Chrome DevTools MCP 服务器（建议配置）：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--isolated=true",
        "--headless=false",
        "--channel=stable"
      ]
    }
  }
}
```

使用说明（在 MCP 客户端中发送此提示）：

---

系统指令：
- 使用浏览器自动化与性能工具，对如下目标执行批量截图与性能跟踪；
- 截图请保存到 `store-assets/output/auto/`（若目录不存在请创建）；
- 截图文件名统一为 kebab-case；
- 对真实网站执行一次启用滤镜的交互（若扩展已加载），并围绕该交互记录性能追踪；
- 导出追踪洞察文本到 `store-assets/output/auto/perf-insights.txt`。

具体步骤：
1) 打开本地素材页并截图
- navigate_page: `http://127.0.0.1:5501/store-assets.html`
- wait_for: `Store Assets`（若不可用，改为等待 `output` 文本或页面任何可见元素）
- take_screenshot(filePath=`store-assets/output/auto/store-assets-page.png`, fullPage=true)

- navigate_page: `http://127.0.0.1:5501/store-assets/output/`
- wait_for: `localized-1280x800-zh-1.png`
- take_screenshot(filePath=`store-assets/output/auto/output-listing.png`, fullPage=true)

2) 打开推广横幅并截图
- navigate_page: `http://127.0.0.1:5501/store-assets/output/promo-marquee-1400x560.png`
- wait_for: `1400x560`（或页面可见）
- take_screenshot(filePath=`store-assets/output/auto/promo-marquee-preview.png`, fullPage=false)

3) 在真实网站进行性能跟踪与截图（示例：Chrome 开发者官网）
- navigate_page: `https://developers.chrome.com`
- wait_for: `Chrome for Developers`
- performance_start_trace(reload=false, autoStop=false)

- 若扩展已加载：
  - evaluate_script: 模拟点击扩展图标触发滤镜开关（如果无法直接点击扩展图标，则在页面上执行一次滚动与交互以形成稳定追踪片段）
  - hover 或 click: 页面主导航，滚动几次，等待 2 秒

- performance_stop_trace
- performance_analyze_insight: `LCPBreakdown`（或其它可用洞察名称）
- take_screenshot(filePath=`store-assets/output/auto/developers-home.png`, fullPage=true)
- list_network_requests: 保存最近请求列表（输出到 `store-assets/output/auto/network.txt`）
- list_console_messages: 保存最近控制台信息（输出到 `store-assets/output/auto/console.txt`）

4) 在本地 `popup.html` 做一次外观截图（静态预览，非扩展环境）
- navigate_page: `http://127.0.0.1:5501/uploadtochrome/popup.html`
- wait_for: `BlueLight`（或页面任一可见元素）
- take_screenshot(filePath=`store-assets/output/auto/popup-static-preview.png`, fullPage=false)

产出：
- 截图：`store-assets/output/auto/*.png`
- 性能洞察：`store-assets/output/auto/perf-insights.txt`
- 网络与控制台：`store-assets/output/auto/network.txt`, `store-assets/output/auto/console.txt`

注意：
- 若 `chrome.*` API 不可用（静态预览），仅进行 UI 外观截图；功能验证请在已加载扩展的浏览器会话内完成。
- 如需连接到已有浏览器，请为 MCP 服务器提供 `--browserUrl`。