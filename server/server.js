// Express 后端：提供 /api 读取 WorkBuddy 真实数据 + serve 构建产物
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listWorkspaces, listConversations, getConversation, PROJECTS_DIR } from './wb-data.js'
import { listFlows, createFlow, getFlow, saveFlow, deleteFlow } from './flow-store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, projectsDir: PROJECTS_DIR }))
app.get('/api/workspaces', (req, res) => res.json(listWorkspaces()))

app.get('/api/workspaces/:wsId/conversations', (req, res) => {
  try { res.json(listConversations(req.params.wsId)) }
  catch (e) { res.status(400).json({ error: e.message }) }
})

app.get('/api/workspaces/:wsId/conversations/:uuid', (req, res) => {
  try { res.json(getConversation(req.params.wsId, req.params.uuid)) }
  catch (e) { res.status(404).json({ error: e.message }) }
})

// 多工作流 CRUD（含自动暂存 draft）
app.get('/api/workspaces/:wsId/flows', (req, res) => {
  try { res.json(listFlows(req.params.wsId)) }
  catch (e) { res.status(400).json({ error: e.message }) }
})

app.post('/api/workspaces/:wsId/flows', (req, res) => {
  try { res.json(createFlow(req.params.wsId, req.body || {})) }
  catch (e) { res.status(400).json({ error: e.message }) }
})

app.get('/api/workspaces/:wsId/flows/:flowId', (req, res) => {
  try { res.json(getFlow(req.params.wsId, req.params.flowId)) }
  catch (e) { res.status(404).json({ error: e.message }) }
})

app.put('/api/workspaces/:wsId/flows/:flowId', (req, res) => {
  try { res.json(saveFlow(req.params.wsId, req.params.flowId, req.body || {})) }
  catch (e) { res.status(400).json({ error: e.message }) }
})

app.delete('/api/workspaces/:wsId/flows/:flowId', (req, res) => {
  try { res.json(deleteFlow(req.params.wsId, req.params.flowId)) }
  catch (e) { res.status(400).json({ error: e.message }) }
})

// 生产：serve 前端构建产物
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' })
    res.sendFile(path.join(dist, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.type('html').send(
    `<div style="font-family:sans-serif;padding:40px;line-height:1.8">
      <h2>WorkBuddy 对话工作流编排器 · 后端已就绪</h2>
      <p>API 可用：<a href="/api/health">/api/health</a> · <a href="/api/workspaces">/api/workspaces</a></p>
      <p>前端尚未构建。开发模式请运行 <code>npm run dev</code>（Vite 5173，自动代理到本服务）。</p>
      <p>生产模式请运行 <code>npm run build</code> 后再 <code>npm start</code>。</p>
    </div>`
  ))
}

const PORT = process.env.PORT || 3457
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  WorkBuddy 对话工作流编排器已启动\n  → http://127.0.0.1:${PORT}\n  → 数据目录: ${PROJECTS_DIR}\n`)
})
