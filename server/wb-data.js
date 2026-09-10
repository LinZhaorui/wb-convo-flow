// WorkBuddy 本地数据访问层
// 只读读取 ~/.workbuddy/projects 下工作空间与对话(jsonl)，并读写插件自己的工作流文件。
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const PROJECTS_DIR = path.join(os.homedir(), '.workbuddy', 'projects')
const FLOW_FILE = 'wb-convo-flow.json' // 插件工作流存储文件名（放在工作空间目录下）

// 安全校验：wsId 必须是 PROJECTS_DIR 的直接子目录，禁止目录穿越
function safeWsDir(wsId) {
  const dir = path.join(PROJECTS_DIR, wsId)
  const rel = path.relative(PROJECTS_DIR, dir)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('非法工作空间标识')
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error('工作空间不存在: ' + wsId)
  }
  return dir
}

// 工作空间目录名 -> 可读路径：d-workbuddy工作空间组织插件 -> D:\workbuddy工作空间组织插件
function decodeWsName(id) {
  const m = id.match(/^([a-z])-(.*)$/)
  if (!m) return id
  const drive = m[1].toUpperCase() + ':'
  const rest = m[2].split('-').join('\\')
  return drive + '\\' + rest
}

// 从一条 user 消息事件中提取可读标题
function extractTitle(ev) {
  const raw = extractText(ev)
  if (!raw) return '未命名对话'
  let t = raw
  // 取 <user_query>...</user_query> 内容（若有）
  const uq = t.match(/<user_query>([\s\S]*?)<\/user_query>/)
  if (uq) t = uq[1].trim()
  // 剥离 system-reminder 等包裹
  t = t.replace(/<system-reminder[\s\S]*?<\/system-reminder>/g, '').trim()
  // 去首尾换行空白
  t = t.replace(/\s+/g, ' ').trim()
  if (!t) return '未命名对话'
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

// 首条用户提问摘要（节点卡片两行预览用）
function extractExcerpt(ev) {
  const raw = extractText(ev) || ''
  let t = raw.replace(/<system-reminder[\s\S]*?<\/system-reminder>/g, '').trim()
  const uq = t.match(/<user_query>([\s\S]*?)<\/user_query>/)
  if (uq) t = uq[1].trim()
  t = t.replace(/\s+/g, ' ').trim()
  return t.length > 120 ? t.slice(0, 120) + '…' : t
}

// 从 message 事件提取纯文本（content 数组里 input_text/output_text）
function extractText(ev) {
  if (!Array.isArray(ev.content)) return ''
  return ev.content
    .filter(c => c && (c.type === 'input_text' || c.type === 'output_text') && typeof c.text === 'string')
    .map(c => c.text)
    .join('\n')
}

// 解析单个 jsonl 文件，返回概要 + 完整事件与消息
function parseConversationFile(fp) {
  const events = []
  const messages = []
  let title = '未命名对话'
  let excerpt = ''
  let messageCount = 0
  let startedAt = null
  let cwd = null
  const raw = fs.readFileSync(fp, 'utf8')
  const lines = raw.split(/\r?\n/).filter(Boolean)
  for (const line of lines) {
    let ev
    try {
      ev = JSON.parse(line)
    } catch {
      continue
    }
    events.push(ev)
    if (!cwd && ev.cwd) cwd = ev.cwd
    if (ev.type === 'message') {
      messageCount++
      if (!startedAt && ev.timestamp) startedAt = ev.timestamp
      if (ev.role === 'user' && title === '未命名对话') {
        title = extractTitle(ev)
        excerpt = extractExcerpt(ev)
      }
      if (ev.role === 'user' || ev.role === 'assistant') {
        messages.push({
          role: ev.role,
          text: extractText(ev),
          ts: ev.timestamp,
          model: ev.providerData?.requestModelName || ev.providerData?.model || null
        })
      }
    }
  }
  return { events, messages, title, excerpt, messageCount, startedAt, cwd }
}

export function listWorkspaces() {
  if (!fs.existsSync(PROJECTS_DIR)) return []
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
  const list = entries.map(e => {
    const id = e.name
    const dir = path.join(PROJECTS_DIR, id)
    let conversationCount = 0
    let lastActive = 0
    try {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))
      conversationCount = files.length
      for (const f of files) {
        try {
          const mt = fs.statSync(path.join(dir, f)).mtimeMs
          if (mt > lastActive) lastActive = mt
        } catch {}
      }
    } catch {}
    return {
      id,
      name: decodeWsName(id),
      conversationCount,
      lastActive
    }
  })
  list.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
  return list
}

export function listConversations(wsId) {
  const dir = safeWsDir(wsId)
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))
  const list = files.map(f => {
    const uuid = f.replace(/\.jsonl$/, '')
    const fp = path.join(dir, f)
    let stat
    try { stat = fs.statSync(fp) } catch { stat = { mtimeMs: 0, size: 0 } }
    let info = { title: '未命名对话', excerpt: '', messageCount: 0, startedAt: null }
    try { info = parseConversationFile(fp) } catch {}
    return {
      uuid,
      title: info.title,
      excerpt: info.excerpt || '',
      messageCount: info.messageCount,
      startedAt: info.startedAt || null,
      updatedAt: stat.mtimeMs,
      size: stat.size
    }
  })
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return list
}

export function getConversation(wsId, uuid) {
  const dir = safeWsDir(wsId)
  const fp = path.join(dir, uuid + '.jsonl')
  if (!fs.existsSync(fp)) throw new Error('对话不存在: ' + uuid)
  const info = parseConversationFile(fp)
  return {
    uuid,
    workspaceId: wsId,
    title: info.title,
    messageCount: info.messageCount,
    startedAt: info.startedAt,
    cwd: info.cwd,
    messages: info.messages,
    eventCount: info.events.length
  }
}

// 工作流读写已迁移至 flow-store.js（多工作流 + 自动暂存）
export { PROJECTS_DIR, safeWsDir, FLOW_FILE as LEGACY_FLOW_FILE }
