// 独立 CLI 入口：启动 Express 后端（供开发 / 独立部署使用）。
// 桌面端由 electron/main.js 直接 import buildApp() 内嵌，不再走本文件。
import { buildApp } from './app.js'

const PORT = process.env.PORT || 3457
const app = buildApp()

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  WorkBuddy 对话工作流编排器已启动\n  → http://127.0.0.1:${PORT}\n`)
})
