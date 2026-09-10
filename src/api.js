// 前端 API 客户端：与后端 Express /api 通信
const BASE = '/api'

async function json(r) {
  if (!r.ok) {
    let msg = 'API 错误 ' + r.status
    try { msg = (await r.json()).error || msg } catch { /* keep */ }
    throw new Error(msg)
  }
  return r.json()
}

function post(method, url, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  }).then(json)
}

const ws = (wsId) => `${BASE}/workspaces/${encodeURIComponent(wsId)}`

// ---- 工作空间与对话（只读） ----
export const getWorkspaces = () => fetch(`${BASE}/workspaces`).then(json)
export const getConversations = (wsId) => fetch(`${ws(wsId)}/conversations`).then(json)
export const getConversation = (wsId, uuid) => fetch(`${ws(wsId)}/conversations/${encodeURIComponent(uuid)}`).then(json)

// ---- 多工作流 CRUD ----
export const listFlows = (wsId) => fetch(`${ws(wsId)}/flows`).then(json)
export const createFlow = (wsId, body) => post('POST', `${ws(wsId)}/flows`, body)
export const getFlowById = (wsId, flowId) => fetch(`${ws(wsId)}/flows/${encodeURIComponent(flowId)}`).then(json)
export const saveFlowById = (wsId, flowId, body) => post('PUT', `${ws(wsId)}/flows/${encodeURIComponent(flowId)}`, body)
export const deleteFlowById = (wsId, flowId) => post('DELETE', `${ws(wsId)}/flows/${encodeURIComponent(flowId)}`)
