# wb-convo-flow · WorkBuddy 对话工作流编排器

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

一个 WorkBuddy 插件：点击某个工作空间后，**所有对话自动以三档尺寸的节点卡片铺满画布**；单击选中、**双击放大为可浏览的完整对话**；通过**端口拉线或点击连线**把多个对话按逻辑顺序串联，组合成完整的可视化工作流。

> 交互形态参考 Langflow 与 Dify 的可视化编排画布（同为 `@xyflow/react` / React Flow 引擎），但节点不是抽象算子，而是**你真实存在的历史对话**。英文说明见 [README.en.md](./README.en.md)。

## 功能特性

| 模块 | 说明 |
|------|------|
| 🗂 工作空间侧栏 | 自动发现本机全部 WorkBuddy 工作空间（`~/.workbuddy/projects`），显示路径与对话数 |
| 🖥 嵌入 WorkBuddy | 编排器由 **WorkBuddy 内置浏览器面板**承载（MCP 工具 / 中文技能一句话拉起），真正位于主界面中部；**双击节点**经 `workbuddy://chat/<uuid>` 深链跳回 WorkBuddy 原生对话完整形态 |
| 🎨 画布编排 | 进入工作空间即自动铺开全部对话节点；按消息数分 **小 / 中 / 大** 三档卡片，网格蛇形排列；滚轮缩放、拖拽平移、Minimap、一键适配、框选多选 |
| 🏷 节点卡片 | 标题 + 消息数 + 最近更新时间 + 首条提问两行摘要；卡片提供「预览 / 连接→ / 删除」快捷操作与「下一对话」一键连接行 |
| 🔗 智能连线 | ① 端口拉线；②「连接→」打开连接选择器（**搜索 / 时间线双 Tab**，Enter 直连首个结果，选中自动飞向目标并高亮）；③ 相邻对话一键连接；④ 框选多节点**批量自动串联**（排序方式由你选择）。全程防环、去重 |
| 🔍 预览对话窗 | 卡片「预览」在画布内只读浏览完整消息流（角色气泡 / 模型名 / 时间），底部沿连线跳转上/下一节点，Esc 关闭 |
| 🗃 多工作流 | 每个工作空间可建多个命名工作流；编辑后 0.8s 自动暂存，"保存"写入正式版本；支持重命名 / 删除 / 导出 JSON |
| ⏪ 撤销重做 | `Ctrl+Z` / `Ctrl+Shift+Z`，覆盖移动 / 连线 / 删除 / 铺开等操作 |
| 📋 列表模式 | 保留经典的"Tab 标签页"浏览模式，与画布一键切换 |

## 快速开始

### 方式一：一键安装（Windows，推荐）

双击仓库中的 **`scripts/install.cmd`**——自动检测 Node → 安装依赖 → 构建 → 幂等写入 `~/.workbuddy/mcp.json`（不覆盖已有条目）→ 安装中文技能「对话工作流编排器」→ 输出启用指引。卸载运行 `scripts/uninstall.cmd`（对话与工作流数据零触碰）。

安装后：在 WorkBuddy「连接器管理 → 自定义连接器」中**信任** `wb-convo-flow`，然后在对话中说 **"打开对话工作流编排器"** 即可。

### 方式二：手动运行

```bash
git clone https://github.com/LinZhaorui/wb-convo-flow.git wb-convo-flow
cd wb-convo-flow
npm install
npm run build
npm start          # 打开 http://127.0.0.1:3457
```

开发模式（前端热更新）：

```bash
npm run server     # 终端 1：API 服务 (3457)
npm run dev        # 终端 2：Vite 开发服务器 (5173，已配置 /api 代理)
```

## 嵌入 WorkBuddy 的三种使用途径

| 途径 | 说明 |
|------|------|
| **内置面板（推荐）** | 在 WorkBuddy 对话中调用 MCP 工具 `open_flow_studio`（或说"打开对话工作流编排器"触发技能）→ 编排器渲染在 **WorkBuddy 内置浏览器面板**中，即主界面中部，无需离开 WorkBuddy |
| 独立浏览器兜底 | 直接访问 `http://127.0.0.1:3457`，与内置面板数据完全一致 |
| 深链双向联动 | 在编排器中**双击任意对话节点** → 通过 `workbuddy://chat/<uuid>` 深链唤起 WorkBuddy 主窗口并定位到该对话的原生完整形态；若 WorkBuddy 未运行会给出提示 |

> MCP 手动注册（等价于安装脚本写入的内容）：在 `~/.workbuddy/mcp.json` 的 `mcpServers` 中加入（不要覆盖已有条目）：
>
> ```json
> {
>   "mcpServers": {
>     "wb-convo-flow": {
>       "command": "node",
>       "args": ["<本仓库绝对路径>/server/mcp-server.js"]
>     }
>   }
> }
> ```
>
> 保存后在 WorkBuddy「连接器管理」页点击**信任**启用。可用工具：`open_flow_studio`（拉起服务并返回地址）、`list_workspaces`（工作空间概览）。

## 桌面端原生安装包

本项目同时提供 **Windows / macOS / Linux** 三平台桌面安装包（Electron 封装，自带运行时，开箱即用）。

### 下载

前往 GitHub **Releases** 页面下载对应平台安装包：

| 平台 | 文件 | 说明 |
|------|------|------|
| Windows | `WB Convo Flow-0.3.0-setup.exe` | NSIS 安装包，可改安装目录、建桌面快捷方式 |
| macOS | `WB Convo Flow-0.3.0-x64.dmg` / `...-arm64.dmg`（及同名 `.zip`） | 支持 Intel 与 Apple Silicon；**未签名**，首次打开见下方提示 |
| Linux | `WB Convo Flow-0.3.0-x64.AppImage` / `...-x64.deb` | AppImage 直接运行；`.deb` 可 `dpkg -i` 安装 |

> macOS 未签名说明：由于仓库未配置 Apple 开发者证书，macOS 安装包为未签名构建。首次打开若被 Gatekeeper 拦截，请在「访达」中**右键 → 打开**，或执行 `xattr -cr /Applications/WB\ Convo\ Flow.app` 后重新打开。

### 从源码构建

```bash
npm install
npm run build          # 构建前端到 dist/
npm run dist           # 当前平台打包（输出到 release/）
# 或指定平台：
npm run dist:win       # Windows: release/*.exe
npm run dist:mac       # macOS:   release/*.dmg + *.zip
npm run dist:linux     # Linux:   release/*.AppImage + *.deb
```

### 自动发布

推送版本标签即触发 GitHub Actions 在三个平台 runner 自动构建并发布到 Releases：

```bash
git tag v0.3.0 && git push origin v0.3.0
```

## 交互速查

| 操作 | 方式 |
|------|------|
| 铺开全部对话 | 进入画布模式自动执行；之后可用工具栏「重新铺开」补齐缺失对话 |
| 选中节点 | 单击（Shift 多选） |
| 在 WorkBuddy 打开原生对话 | **双击节点**（`workbuddy://` 深链）；模态窗内也有「在 WorkBuddy 打开」按钮 |
| 画布内预览对话 | 卡片「预览」→ 模态窗（底部沿连线导航上/下一节点） |
| 连线（拉线） | 从节点右侧端口拖到目标节点左侧端口 |
| 连线（连接选择器） | 点卡片「连接→」→ 搜索框实时过滤（Enter 连第一个）或切「时间线」点选 → 自动飞向目标并高亮 |
| 相邻快速连接 | 点卡片「下一」行，一键连接时间上紧邻的下一个对话（已连自动标记） |
| 批量自动串联 | Shift/框选 ≥2 个节点 → 底部操作条选择排序（更新时间/创建时间/消息数）→「自动串联」 |
| 删除节点 / 连线 | 卡片「删除」按钮，或选中后按 `Delete` |
| 撤销 / 重做 | `Ctrl+Z` / `Ctrl+Shift+Z` |
| 缩放 / 平移 | 滚轮 / 空白处拖拽；Minimap 可导航 |

> 说明：连线方向完全自由（仅阻止成环）；「预览」为只读浏览，"继续向该对话发消息"需 WorkBuddy 开放会话 API（Roadmap 跟踪中）；深链跳转需 WorkBuddy 桌面端正在运行。

## 工作流数据

- 存储位置：`~/.workbuddy/projects/<工作空间>/wb-convo-flows/<flowId>.json`
- 文件结构：`{ name, nodes, edges, viewport, draft, updatedAt, savedAt }`
- `draft: true` 表示自动暂存；`savedAt` 为最近一次显式保存时间
- 旧版单文件 `wb-convo-flow.json` 会在首次访问时自动迁移为「默认工作流」
- 「导出」按钮可把当前工作流下载为 JSON，便于分享与备份

完整数据契约与 API 参考见 [docs/architecture.md](./docs/architecture.md)，交互设计规范见 [docs/interaction.md](./docs/interaction.md)。

## 架构一览

```
┌─ 前端 React 18 + @xyflow/react v12 + Zustand ──────────────┐
│ Toolbar(模式/工作流/画布操作)  WorkspaceSidebar             │
│ 画布模式: FlowCanvas + ConversationNode(三档) + Modal      │
│ 列表模式: ConversationTabs + ConversationViewer            │
│ 状态: useAppStore(空间/模式/模态) useFlowStore(画布/历史)   │
│ 布局: lib/layout.js(三档网格蛇形)                          │
└──────────────┬─────────────────────────────────────────────┘
               │ /api JSON
┌──────────────▼─ 后端 Node + Express ───────────────────────┐
│ wb-data.js    工作空间/对话只读解析(jsonl)                  │
│ flow-store.js 多工作流 CRUD + 自动暂存 + 旧版迁移           │
│ mcp-server.js WorkBuddy 插件入口(stdio)                    │
└────────────────────────────────────────────────────────────┘
```

## 目录结构

```
wb-convo-flow/
├─ README.md / README.en.md / LICENSE / CONTRIBUTING.md / CHANGELOG.md
├─ docs/                    # architecture / interaction / research
├─ .github/                 # Issue 模板 / PR 模板
├─ scripts/
│  ├─ install.cmd           # Windows 一键安装（双击运行）
│  ├─ uninstall.cmd         # 一键卸载
│  └─ setup.js              # 安装核心逻辑（幂等合并 mcp.json / 装技能）
├─ skill/对话工作流编排器/
│  └─ SKILL.md              # WorkBuddy 技能：一句话在内置面板唤起编排器
├─ server/
│  ├─ server.js             # Express 路由 + 静态托管
│  ├─ wb-data.js            # WorkBuddy 数据只读层
│  ├─ flow-store.js         # 多工作流存储
│  └─ mcp-server.js         # MCP stdio 入口
└─ src/
   ├─ App.jsx / api.js / main.jsx / styles.css
   ├─ store/                # useAppStore / useFlowStore
   ├─ lib/                  # layout.js 布局算法 / deeplink.js 深链
   └─ components/
      ├─ Toolbar.jsx  WorkspaceSidebar.jsx  Toast.jsx
      ├─ ConversationTabs.jsx  ConversationViewer.jsx
      ├─ canvas/   # FlowCanvas / ConversationNode / ConnectionPicker
      ├─ modal/    # ConversationModal
      └─ workflow/ # FlowMenu
```

## Roadmap

- [ ] **执行工作流**：按拓扑序串联重放各对话上下文（需 WorkBuddy 会话 API）
- [ ] 更多节点类型：条件分支、注释便签、外部工具（声明式元数据注册）
- [ ] 撤销历史持久化与工作流版本快照
- [ ] 工作流导入（与导出对偶）与跨工作空间复制
- [ ] 超大对话（>5MB jsonl）分页加载

## License

[MIT](./LICENSE)
