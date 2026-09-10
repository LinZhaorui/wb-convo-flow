# GitHub 同类项目调研报告 —— 可视化工作流 / AI 编排

> 调研目的：为 WorkBuddy「对话工作流编排插件」提供实现形态、交互设计、架构模式与开发方式的参考依据。
> 调研对象：Langflow、Dify、n8n、Flowise、Activepieces、Node-RED、Windmill 及底层画布库 React Flow(@xyflow/react)。

## 一、项目技术栈对比

| 项目 | 前端框架 | 画布库 | 状态管理 | UI/构建 | 后端 | 工作流定义 |
|---|---|---|---|---|---|---|
| **Langflow** | React 19 + TS | @xyflow/react (React Flow) | Zustand + TanStack Query | Vite + Tailwind + Radix/shadcn | Python FastAPI | 画布 JSON → Graph 拓扑执行 |
| **Dify** | Next.js 14 + React 18 + TS | @xyflow/react (v12) | Zustand + immer + nuqs | Vite + Tailwind + Radix/shadcn | Python FastAPI | JSON DSL → 自研 DAG 引擎 |
| **n8n** | Vue 3 | Vue Flow (XYFlow 的 Vue 移植) | Pinia | Vite + pnpm monorepo | Node.js (TS) | JSON workflow |
| **Flowise** | React + TS | React Flow | 内部 store | Vite + pnpm monorepo | Node/Express | JSON flow |
| **Activepieces** | React 18 + TS | XYFlow | Zustand + TanStack Query | Vite + Tailwind + shadcn | Node/TS | JSON pieces 流 |
| **Node-RED** | 原生(jQuery 时代) | 自研 SVG 画布 | 内部 | Grunt→npm 脚本 | Node.js | JSON flow 数组 |
| **Windmill** | SvelteKit | 代码优先(非节点画布为主) | Svelte store | Rust 执行引擎 | Rust + Node | 代码即工作流 |

## 二、实现形态结论

- **画布库高度收敛**：React 生态（Langflow/Dify/Flowise/Activepieces）几乎全部基于 **@xyflow/react**；Vue 生态（n8n）用其孪生 **Vue Flow**。React Flow 开箱提供拖拽、缩放/平移、多选、网格背景、Minimap、Controls、自定义节点与 Handle 连线点，边类型支持 `bezier / smoothstep / step / straight`。Node-RED 是特例——自研 SVG 画布，年代久远、扩展成本高。
- **状态管理**：Zustand 是 React 阵营主流（轻量、可分 store、配合 immer 做不可变更新）；Vue 阵营对应 Pinia。
- **UI 与构建**：Tailwind + Radix/shadcn 组合最常见；**Vite 是事实标准构建工具**；多仓库多采用 pnpm monorepo。

## 三、交互设计共性

1. **节点库侧边栏 + 拖拽落画布**：左侧面板列出节点类型，拖入或双击添加，节点自带连接 Handle。
2. **自定义节点渲染**：每种节点是一个组件，内部显示图标、标题、端口与运行状态（Dify 用 BaseNode 统一头部与端口样式）。
3. **连线交互**：从源 Handle 拖到目标 Handle；分支节点用 `sourceHandle` 区分 true/false 等多出口。
4. **画布操作**：滚轮缩放、空白拖拽平移、Minimap 导航、fit-view、框选；快捷键复制/粘贴/删除/撤销重做（n8n 有完整 history store）。
5. **配置面板**：选中节点后右侧 Panel 展示节点专属表单（Dify 的 NodeDetailsView、n8n 的 NDV）。
6. **运行时反馈**：SSE/WebSocket 流式推送节点执行状态，画布实时高亮进度。

## 四、架构模式共性

- **前后端分离，JSON 为契约**：前端只负责"画"，把画布序列化为标准 JSON（Dify 称 DSL）提交后端；后端解析 JSON 构建 DAG，按拓扑序调度（Langflow `Graph.from_payload` + 拓扑排序 + 环检测；Dify 自研轻量 DAG 引擎并原生支持 token 流式）。
- **统一节点接口**：每个节点有 `type / inputs / outputs / execute`；Langflow 的 `Component` 基类通过自省生成前端表单 schema；n8n 用 `INodeTypeDescription` 元数据驱动渲染。
- **执行引擎语言**：AI 类（Langflow/Dify）多用 Python（贴近 LLM 生态）；通用自动化（n8n/Activepieces）用 Node/TS；Windmill 用 Rust 求性能。
- **部署**：普遍 docker / docker-compose；Langflow 另有 `uv run` 与桌面版。
- **扩展节点**：注册新节点 = 写一个继承基类的组件 + 元数据声明，UI 由元数据自省生成。

## 五、社区主流做法归纳

> **React + @xyflow/react + Zustand + 前后端分离 + 标准 JSON DAG 工作流定义 + Docker 部署**

这是 Langflow、Dify、Activepieces 共同验证过的"黄金模板"；Vue 阵营对应 Vue 3 + Vue Flow + Pinia。

### 方案权衡

- **React Flow vs 自研画布**：自研（Node-RED）可控但成本高、难维护；React Flow 生态成熟（周下载千万级）、可深度定制节点，是当前默认选择；仅追求极致性能或特殊交互才自研。
- **单体 vs 前后端分离**：AI 编排强烈建议分离——前端专注交互，后端跑 LLM/DAG 调度。"代码即工作流"（Windmill）是另一条路线，不适合对话节点编排。

## 六、对本插件的落地决策

| 决策点 | 社区主流 | 本插件采用 | 理由 |
|---|---|---|---|
| 画布 | @xyflow/react | ✅ 同款 v12 | 与 Langflow/Dify 同构，交互开箱即用 |
| 状态 | Zustand 分 store | ✅ zustand 单 store（规模小） | 保持精简，接口与 Langflow 一致便于扩展 |
| 工作流定义 | JSON DAG | ✅ `{nodes, edges, viewport}` | 与 Dify DSL 同构，未来可对接执行引擎 |
| 前后端 | 分离 | ✅ Vite/React + Express | Express 直读 WorkBuddy 本地数据，绕开浏览器文件限制 |
| 节点扩展 | 声明式元数据 | ✅ 预留 nodeTypes 注册表 | 后续加 condition/tool 节点零重构 |
| 执行引擎 | 后端 DAG 调度 | ⏸ 预留（需 WorkBuddy 会话 API） | 当前先交付"编排+持久化"闭环 |

### 五条核心借鉴（已落实）

1. 直接采用 @xyflow/react 作为画布引擎，自定义 `ConversationNode` 显示对话标题、消息数、更新时间，Handle 表达前后继关系；复用 Minimap/缩放/框选，不自研画布。
2. Zustand 管理节点/边/视口，配合 `applyNodeChanges/applyEdgeChanges` 与主 store 同步，保留撤销重做扩展位。
3. 统一工作流 JSON 契约，前端只序列化，"执行"由后端按拓扑序重放——保持"前端画、后端跑"解耦。
4. 交互对齐主流：左侧节点库拖拽落画布、双击删除、smoothstep 连线、未保存标记、fitView。
5. 先做最小闭环（拖拽→连线→保存→加载），再按声明式元数据模式扩展节点类型。

## 七、参考链接

- Langflow: https://github.com/langflow-ai/langflow
- Dify: https://github.com/langgenius/dify
- n8n: https://github.com/n8n-io/n8n
- Flowise: https://github.com/FlowiseAI/Flowise
- Activepieces: https://github.com/activepieces/activepieces
- Node-RED: https://github.com/node-red/node-red
- React Flow (xyflow): https://github.com/xyflow/xyflow
- Windmill: https://github.com/windmill-labs/windmill
