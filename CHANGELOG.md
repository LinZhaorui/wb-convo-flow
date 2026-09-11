# Changelog

## 0.3.0 (2026-09-10)

### 桌面端原生安装包
- 采用 **Electron + electron-builder** 封装，自带 Chromium + Node 运行时，**开箱即用、无需额外环境依赖**
- 后端 Express 重构为可内嵌的 `buildApp()` 工厂（`server/app.js`），Electron 主进程直接挂载，避免跨 asar 子进程启动问题
- 双击对话节点产生的 `workbuddy://chat/<uuid>` 深链在桌面端由主进程拦截并通过 `shell.openExternal` 唤起 WorkBuddy 原生窗口
- 新增 `.github/workflows/release.yml`：推送 `v*` 标签时在 Windows / macOS / Linux 三平台 runner 自动构建并发布到 GitHub Releases（含清晰版本号与本文更新说明）
- 安装包产出：Windows `WB Convo Flow-0.3.0-setup.exe`（NSIS）、macOS `.dmg` + `.zip`（x64 / arm64）、Linux `.AppImage` + `.deb`（x64）
- 注：macOS 安装包为**未签名**构建（仓库未配置 Apple 证书），首次打开需在「访达」中右键 → 打开，或执行 `xattr -cr /Applications/WB\ Convo\ Flow.app`

### 嵌入 WorkBuddy
- 编排器可由 WorkBuddy **内置浏览器面板**承载（MCP 工具 `open_flow_studio` / 中文技能「对话工作流编排器」拉起），真正嵌入主界面中部，独立浏览器访问保留为兜底
- **双击节点**通过 `workbuddy://chat/<uuid>` 深链唤起 WorkBuddy 主窗口并定位到原生对话；模态窗保留为画布内「预览」，并新增「在 WorkBuddy 打开」入口
- 一键安装：`scripts/install.cmd`（检测环境 → 依赖 → 构建 → 幂等合并 mcp.json → 安装中文命名技能 → 启用指引）；`uninstall.cmd` 对应卸载；数据零触碰

### 连线交互优化
- **连接选择器**：点「连接→」弹出双 Tab 浮层（按标题/摘要实时**搜索** / 按更新时间倒序**时间线**），选中即连线并自动飞行定位到目标节点（高亮 2 秒）；搜索时 Enter 直连第一个结果
- **相邻快速连接**：卡片新增「下一」行，一键连接时间上紧邻的下一个对话，已连自动标记
- **框选批量自动串联**：Shift 多选 / 框选 ≥2 节点后底部浮出操作条，排序方式由使用者当场选择（更新时间 / 创建时间 / 消息数），确认后按序自动串联，自动跳过重复与成环
- 连线方向完全自由（保留防环检查）；全线接入 Toast 反馈

## 0.2.0 (2026-09-10)
- 画布重构：三档尺寸节点卡片（按消息数）自动网格铺开；双击模态对话窗；多命名工作流 + 自动暂存 + 导出 JSON；撤销/重做；列表 Tab 双模式保留
- 开源文档套件：中英 README、docs/（架构/交互/调研）、MIT、CONTRIBUTING、.github 模板

## 0.1.0 (2026-09-10)
- 首个可用版本：工作空间对话标签化浏览、React Flow 工作流编排、WorkBuddy 真实数据读取、MCP stdio 入口
