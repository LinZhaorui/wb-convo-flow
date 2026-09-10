# 贡献指南

感谢关注 wb-convo-flow！欢迎提交 Issue 与 Pull Request。

## 环境要求

- Node.js ≥ 18（推荐 20+，项目在 Node 22/24 上验证）
- npm ≥ 9
- 本机装有 WorkBuddy（插件从 `~/.workbuddy/projects` 读取数据；无 WorkBuddy 时 API 可运行但列表为空）

## 本地开发

```bash
npm install
npm run server   # API 服务 http://127.0.0.1:3457
npm run dev      # Vite 开发服务器 http://localhost:5173（/api 已代理）
```

生产验证：

```bash
npm run build && npm start
```

## 代码结构约定

- 前端：React 18 函数组件 + Zustand store；画布层组件放 `src/components/canvas/`，模态放 `modal/`，工作流管理放 `workflow/`
- 状态拆分：跨模式共享状态进 `useAppStore`，画布专属状态进 `useFlowStore`；两者不互相持有对方切片
- 后端：ESM（`"type": "module"`）；数据访问集中在 `wb-data.js`（只读）与 `flow-store.js`（工作流读写）；路由保持薄，逻辑下沉
- 样式：单文件 `src/styles.css`，BEM 风格类名（`cn-` 前缀为节点卡片、`modal-` 为模态窗）
- 布局算法集中在 `src/lib/layout.js`，不要在组件内散落坐标计算

## 提交规范

采用 Conventional Commits：

```
feat: 新增点击连线模式
fix: 修复撤销栈在切换工作流后未清空的问题
docs: 补充数据契约文档
refactor: 拆分 store 为 app/flow 两层
```

## Pull Request 流程

1. Fork 或新建特性分支（`feat/xxx`、`fix/xxx`）
2. 保证 `npm run build` 通过
3. 按 `.github/pull_request_template.md` 填写说明
4. 关联相关 Issue（`Closes #123`）

## 手动验证清单（提交前）

- [ ] 切换工作空间 → 画布自动铺开全部对话，三档尺寸正确
- [ ] 拉线与点击连线均可用；重复连线被忽略；成环被拒绝
- [ ] 双击节点打开模态；上/下节点导航按连线方向工作
- [ ] 编辑后 ~1s 出现"未保存 · 将自动暂存"，保存后变为"已保存"
- [ ] `Ctrl+Z` 可撤销连线/移动/删除
- [ ] 列表模式 Tab 浏览正常，与画布互切无状态残留
- [ ] 新建/重命名/删除/导出工作流正常

## 报告 Bug

请使用 Issue 模板并附上：复现步骤、期望行为、控制台报错、Node 版本。
