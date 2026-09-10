#!/usr/bin/env node
// WorkBuddy 插件 MCP 入口（stdio 传输）
// 通过 ~/.workbuddy/mcp.json 注册后，WorkBuddy 可调用：
//   - open_flow_studio : 启动/复用本地 Web 服务并返回访问地址
//   - list_workspaces  : 列出本机 WorkBuddy 工作空间概览
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { listWorkspaces } from './wb-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.WB_FLOW_PORT || 3457
const BASE_URL = `http://127.0.0.1:${PORT}`

let serverProc = null

async function isUp() {
  try {
    const r = await fetch(`${BASE_URL}/api/health`)
    return r.ok
  } catch { return false }
}

async function ensureServer() {
  if (await isUp()) return { started: false }
  const entry = path.join(__dirname, 'server.js')
  serverProc = spawn(process.execPath, [entry], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
    detached: true
  })
  serverProc.unref()
  for (let i = 0; i < 40; i++) {
    if (await isUp()) return { started: true }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('服务启动超时')
}

const server = new Server(
  { name: 'wb-convo-flow', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'open_flow_studio',
      description: '启动 WorkBuddy 对话工作流编排器并返回地址 http://127.0.0.1:3457。请用 WorkBuddy 内置浏览器/预览面板打开该地址，编排器即嵌入主界面中部；用户可在其中双击对话节点，经 workbuddy:// 深链跳回原生对话。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'list_workspaces',
      description: '列出本机 WorkBuddy 的所有工作空间（可读路径与对话数量）。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    }
  ]
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name } = req.params
  try {
    if (name === 'open_flow_studio') {
      const { started } = await ensureServer()
      return {
        content: [{ type: 'text', text: `WorkBuddy 对话工作流编排器已${started ? '启动' : '在运行中'}。请用 present_files/内置浏览器面板打开：${BASE_URL} ，即可嵌入 WorkBuddy 界面中部使用。提示：双击对话节点会通过 workbuddy://chat/<uuid> 深链跳回原生对话；「连接→」提供搜索/时间线选择器；多选节点可批量自动串联。` }]
      }
    }
    if (name === 'list_workspaces') {
      const ws = listWorkspaces()
      const lines = ws.map(w => `- ${w.name} · ${w.conversationCount} 个对话`)
      return { content: [{ type: 'text', text: lines.join('\n') || '（未发现工作空间）' }] }
    }
    return { content: [{ type: 'text', text: '未知工具: ' + name }], isError: true }
  } catch (e) {
    return { content: [{ type: 'text', text: '错误: ' + (e.message || e) }], isError: true }
  }
})

await server.connect(new StdioServerTransport())
console.error('[wb-convo-flow] MCP server ready (stdio)')
