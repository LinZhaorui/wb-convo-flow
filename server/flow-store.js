// 多工作流存储层
// 布局：<工作空间>/wb-convo-flows/<flowId>.json
// 每个文件：{ name, nodes, edges, viewport, draft, updatedAt, savedAt }
// draft=true 表示"自动暂存"，savedAt 记录最近一次显式保存时间
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { safeWsDir, LEGACY_FLOW_FILE } from './wb-data.js'

const FLOWS_DIR = 'wb-convo-flows'

function flowsDir(wsId, create = true) {
  const dir = path.join(safeWsDir(wsId), FLOWS_DIR)
  if (create && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function safeFlowPath(wsId, flowId) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(flowId)) throw new Error('非法工作流标识')
  return path.join(flowsDir(wsId, false), flowId + '.json')
}

// 旧版单文件迁移：wb-convo-flow.json -> wb-convo-flows/legacy-default.json（幂等）
function migrateLegacy(wsId) {
  try {
    const wsDir = safeWsDir(wsId)
    const legacy = path.join(wsDir, LEGACY_FLOW_FILE)
    const dir = path.join(wsDir, FLOWS_DIR)
    if (!fs.existsSync(legacy)) return
    if (fs.existsSync(dir) && fs.readdirSync(dir).some(f => f.endsWith('.json'))) return
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const data = JSON.parse(fs.readFileSync(legacy, 'utf8'))
    fs.writeFileSync(path.join(dir, 'legacy-default.json'), JSON.stringify({
      name: '默认工作流',
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
      viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
      draft: false,
      updatedAt: Date.now(),
      savedAt: Date.now()
    }, null, 2), 'utf8')
  } catch { /* 迁移失败不影响主流程 */ }
}

function normalize(body = {}) {
  return {
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 60) : '未命名工作流',
    nodes: Array.isArray(body.nodes) ? body.nodes : [],
    edges: Array.isArray(body.edges) ? body.edges : [],
    viewport: body.viewport || { x: 0, y: 0, zoom: 1 },
    draft: !!body.draft
  }
}

export function listFlows(wsId) {
  migrateLegacy(wsId)
  const dir = flowsDir(wsId)
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
      return {
        id: f.replace(/\.json$/, ''),
        name: d.name || '未命名工作流',
        nodeCount: (d.nodes || []).length,
        edgeCount: (d.edges || []).length,
        draft: !!d.draft,
        updatedAt: d.updatedAt || 0,
        savedAt: d.savedAt || 0
      }
    } catch { return null }
  }).filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function createFlow(wsId, body = {}) {
  const id = crypto.randomUUID()
  const data = normalize(body)
  fs.writeFileSync(path.join(flowsDir(wsId), id + '.json'), JSON.stringify({
    ...data,
    updatedAt: Date.now(),
    savedAt: data.draft ? 0 : Date.now()
  }, null, 2), 'utf8')
  return { id, ...data }
}

export function getFlow(wsId, flowId) {
  const fp = safeFlowPath(wsId, flowId)
  if (!fs.existsSync(fp)) throw new Error('工作流不存在: ' + flowId)
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'))
  return {
    id: flowId,
    name: d.name || '未命名工作流',
    nodes: d.nodes || [],
    edges: d.edges || [],
    viewport: d.viewport || { x: 0, y: 0, zoom: 1 },
    draft: !!d.draft,
    updatedAt: d.updatedAt || 0,
    savedAt: d.savedAt || 0
  }
}

export function saveFlow(wsId, flowId, body = {}) {
  const fp = safeFlowPath(wsId, flowId)
  if (!fs.existsSync(fp)) throw new Error('工作流不存在: ' + flowId)
  const data = normalize(body)
  let prevSavedAt = 0
  try { prevSavedAt = JSON.parse(fs.readFileSync(fp, 'utf8')).savedAt || 0 } catch {}
  fs.writeFileSync(fp, JSON.stringify({
    ...data,
    updatedAt: Date.now(),
    savedAt: data.draft ? prevSavedAt : Date.now(),
    __app: 'wb-convo-flow'
  }, null, 2), 'utf8')
  return { ok: true, id: flowId, nodeCount: data.nodes.length }
}

export function deleteFlow(wsId, flowId) {
  const fp = safeFlowPath(wsId, flowId)
  if (!fs.existsSync(fp)) throw new Error('工作流不存在: ' + flowId)
  fs.unlinkSync(fp)
  return { ok: true }
}
