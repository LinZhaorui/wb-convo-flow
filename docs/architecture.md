# 架构与数据契约

## 分层架构

```
React 前端 (Vite 构建, @xyflow/react + Zustand)
        │  HTTP /api (JSON)
Node + Express 后端
        │  fs 只读 / 读写
WorkBuddy 本地数据 (~/.workbuddy)
```

- **前端只负责"画"与"浏览"**：画布状态（节点/边/历史）全部在浏览器内存中，通过防抖自动暂存与显式保存落到后端。
- **后端是无状态文件适配层**：对话数据只读解析；工作流文件是插件唯一的可写区域（位于各工作空间目录下的 `wb-convo-flows/`），不触碰 WorkBuddy 自身数据。

## 目录结构

```
server/
  server.js       Express 路由：工作空间/对话只读 API + 多工作流 CRUD + 静态托管 dist
  wb-data.js      ~/.workbuddy/projects 只读访问层（工作空间发现、对话解析、标题/摘要提取）
  flow-store.js   多工作流存储（CRUD、draft 语义、旧版单文件迁移）
  mcp-server.js   MCP stdio 入口（open_flow_studio / list_workspaces）

scripts/
  setup.js        安装核心：幂等合并 ~/.workbuddy/mcp.json、安装技能、健康指引
  install.cmd     Windows 一键安装（检测 Node → 依赖 → 构建 → setup.js install）
  uninstall.cmd   一键卸载（移除 mcp.json 条目与技能目录，数据零触碰）

skill/对话工作流编排器/SKILL.md   WorkBuddy 技能：在内置浏览器面板唤起编排器

src/
  App.jsx         组装：ReactFlowProvider + 双模式路由 + 全局快捷键 + Toast
  api.js          后端客户端（fetch 封装）
  store/
    useAppStore.js   工作空间、模式(canvas|list)、对话列表、Tab、模态窗、Toast
    useFlowStore.js  工作流列表、节点/边、连线(含选择器/高亮)、批量串联、撤销/重做、自动暂存
  lib/layout.js   三档尺寸网格蛇形布局（全量/追加/重排）
  lib/deeplink.js workbuddy://chat/<uuid> 深链唤起
  components/
    Toolbar.jsx                顶部工具栏（模式切换、工作流菜单、画布操作）
    WorkspaceSidebar.jsx       工作空间侧栏（双模式共用）
    Toast.jsx                  全局轻量提示
    ConversationTabs.jsx       列表模式：Tab 栏
    ConversationViewer.jsx     列表模式：对话流渲染
    canvas/FlowCanvas.jsx      画布（交互绑定、批量串联条、快捷键、提示）
    canvas/ConversationNode.jsx 三档对话节点卡片（含相邻快速连接行）
    canvas/ConnectionPicker.jsx 连接选择器（搜索/时间线双 Tab，飞向目标）
    modal/ConversationModal.jsx 模态对话窗（含「在 WorkBuddy 打开」深链）
    workflow/FlowMenu.jsx      工作流选择/新建/重命名/删除/导出
```

## 嵌入 WorkBuddy 与深链

### 内置面板承载

WorkBuddy 主窗口自带内置浏览器/预览面板。通过 MCP 工具 `open_flow_studio`（或中文技能「对话工作流编排器」引导 agent 打开 `http://127.0.0.1:3457`），编排器即渲染在 WorkBuddy 界面中部，无需独立窗口。独立浏览器访问保留为兜底，两者共享同一后端。

### workbuddy:// 深度链接

安装 WorkBuddy 桌面端时注册了 `workbuddy://` 协议（应用包内可见 `workbuddy://chat/<uuid>`、`workbuddy://task?action=start&prompt=...&cwd=...`、`workbuddy://home` 等路由）。本插件：

- **双击对话节点** → `workbuddy://chat/<对话uuid>` 唤起主窗口并定位到该对话的原生完整形态（`lib/deeplink.js`；uuid 语义以 WorkBuddy 实际响应为准，若未响应 Toast 提示确认 WorkBuddy 已运行）。
- 模态对话窗头部提供「在 WorkBuddy 打开」等效入口。

> 注意：深链协议属 WorkBuddy 内部实现，未在官方文档承诺；插件对其做了失败兜底（预览模态），并跟踪官方开放 API 以便未来替换为受支持接口。

## WorkBuddy 数据契约（实测）

### 工作空间

- 目录：`~/.workbuddy/projects/<编码路径>/`
- 编码规则：盘符小写 + `:` 与 `\` 替换为 `-`
  - `d-workbuddy工作空间组织插件` ⇄ `D:\workbuddy工作空间组织插件`
- 解码见 `wb-data.js#decodeWsName`

### 对话

- 每个对话 = `<uuid>.jsonl`（消息事件流）+ `<uuid>/`（附件目录）+ `<uuid>.meta.json`（仅 hostKind/connectionId，**不含标题**）
- jsonl 每行一个事件：

```json
{
  "id": "...", "timestamp": 1789006739022,
  "type": "message",            // message | reasoning | function_call | function_call_result | file-history-snapshot
  "role": "user",               // message 事件: user | assistant
  "content": [{ "type": "input_text", "text": "..." }],   // output_text 为助手
  "providerData": { "model": "hy3", "requestModelName": "Hy3" },
  "cwd": "d:\\..."
}
```

- **标题**：第一条 user 消息 → 剥离 `<system-reminder>` 包裹 → 优先取 `<user_query>` 内文 → 截断 40 字
- **摘要（excerpt）**：同上但不截 40，截 120 字，供节点卡片两行预览

### 工作流（插件自有，可写）

- 目录：`~/.workbuddy/projects/<工作空间>/wb-convo-flows/<flowId>.json`
- flowId：UUID v4；文件内容：

```json
{
  "name": "工作流名称",
  "nodes": [
    { "id": "n-<uuid>", "type": "conversation", "position": { "x": 40, "y": 40 },
      "data": { "uuid": "...", "title": "...", "excerpt": "...", "messageCount": 51,
                 "updatedAt": 0, "size": "sm|md|lg" } }
  ],
  "edges": [ { "id": "e-...", "source": "n-<uuidA>", "target": "n-<uuidB>",
               "type": "smoothstep", "animated": true } ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "draft": false,
  "updatedAt": 1789026282695,
  "savedAt": 1789026282692,
  "__app": "wb-convo-flow"
}
```

- 节点 `id` 固定为 `n-<对话uuid>`，因此工作流与对话天然幂等关联
- `draft: true` 为自动暂存（编辑后 0.8s 防抖写入，不覆盖 `savedAt`）；显式"保存"写入正式版本并刷新 `savedAt`

## API 参考

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查（返回数据目录） |
| GET | `/api/workspaces` | 工作空间列表（id/可读名/对话数/最近活跃） |
| GET | `/api/workspaces/:wsId/conversations` | 对话列表（标题/摘要/消息数/创建时间 startedAt/更新时间） |
| GET | `/api/workspaces/:wsId/conversations/:uuid` | 单个对话（messages 已抽取为 role/text/ts/model） |
| GET | `/api/workspaces/:wsId/flows` | 工作流元数据列表 |
| POST | `/api/workspaces/:wsId/flows` | 新建工作流 `{name?}` |
| GET | `/api/workspaces/:wsId/flows/:flowId` | 读取工作流全量 |
| PUT | `/api/workspaces/:wsId/flows/:flowId` | 保存 `{name, nodes, edges, viewport?, draft}` |
| DELETE | `/api/workspaces/:wsId/flows/:flowId` | 删除工作流 |

安全约束：`wsId` 必须是 `projects/` 的直接子目录名（防目录穿越）；`flowId` 必须匹配 `^[A-Za-z0-9_-]{1,64}$`。

## 扩展新节点类型

当前仅注册了 `conversation` 一种节点（`FlowCanvas.jsx` 的 `nodeTypes`）。按 Langflow/Dify 的声明式思路扩展：

1. 在 `src/components/canvas/` 新增节点组件（Handle 左进右出保持一致）
2. 注册到 `nodeTypes`
3. 在 `useFlowStore` 增加 corresponding 的创建 action
4. 工作流 JSON 的 `nodes[].type` 即为注册名，后端无需改动

## 前端状态模型

- `useAppStore`：跨模式共享（工作空间、模式、模态窗、Toast）；不持有画布状态
- `useFlowStore`：画布专属；`ensureWorkspace()` 保证切换工作空间时幂等初始化；所有结构性变更先 `pushHistory()` 再变更，`scheduleAutosave()` 统一防抖暂存
- 连线统一入口：`addEdgeSafe`（纯建边，防环去重）→ `connectTo`（+历史快照/目标高亮，返回 `{ok, reason}`）→ `autoChain(orderKey)`（批量串联，整体一条历史）；连接选择器状态 `pickerSourceNodeId` 与画布点击连线 `pendingConnectFrom` 并行生效
- 布局算法（`lib/layout.js`）：`gridLayout`（全量蛇形）、`appendMissing`（追加缺失）、`relayout`（重排且保留连线与孤儿节点）
