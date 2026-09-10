// 画布状态：多工作流、节点/边、连线、撤销重做、自动暂存
import { create } from 'zustand'
import * as api from '../api'
import { gridLayout, appendMissing, relayout } from '../lib/layout'
import { useAppStore } from './useAppStore.js'

const HISTORY_LIMIT = 50
const AUTOSAVE_DELAY = 800

let autoSaveTimer = null
let highlightTimer = null

// 防环检测：若 target 已可达 source，则新增 source->target 会成环
function createsCycle(edges, sourceId, targetId) {
  const adj = new Map()
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source).push(e.target)
  }
  const seen = new Set()
  const stack = [targetId]
  while (stack.length) {
    const cur = stack.pop()
    if (cur === sourceId) return true
    if (seen.has(cur)) continue
    seen.add(cur)
    for (const next of adj.get(cur) || []) stack.push(next)
  }
  return false
}

export const useFlowStore = create((set, get) => ({
  workspaceId: null,
  flows: [],                 // 工作流元数据列表
  flowId: null,
  flowName: '未命名工作流',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  pendingConnectFrom: null,  // 点击连线模式的源节点
  pickerSourceNodeId: null,  // 连接选择器浮层（搜索器/时间线）的源节点
  highlightNodeId: null,     // 最近一次连线目标，短暂高亮
  dirty: false,
  saving: false,
  lastSavedAt: 0,
  undoStack: [],
  redoStack: [],

  // ---- 工作流生命周期 ----
  async ensureWorkspace(wsId, conversations) {
    if (!wsId || get().workspaceId === wsId) return
    set({
      workspaceId: wsId, flows: [], flowId: null, flowName: '未命名工作流',
      nodes: [], edges: [], selectedNodeId: null, pendingConnectFrom: null,
      pickerSourceNodeId: null, highlightNodeId: null,
      dirty: false, lastSavedAt: 0, undoStack: [], redoStack: []
    })
    const flows = await api.listFlows(wsId).catch(() => [])
    set({ flows })
    if (flows.length > 0) {
      await get().loadFlow(wsId, flows[0].id)
    } else {
      await get().newFlow(wsId, '未命名工作流', conversations)
    }
  },

  async refreshFlows() {
    const wsId = get().workspaceId
    if (!wsId) return
    const flows = await api.listFlows(wsId).catch(() => get().flows)
    set({ flows })
  },

  async loadFlow(wsId, flowId) {
    const f = await api.getFlowById(wsId, flowId).catch(() => null)
    if (!f) return
    set({
      flowId: f.id, flowName: f.name, nodes: f.nodes, edges: f.edges,
      draft: f.draft, lastSavedAt: f.savedAt || 0,
      selectedNodeId: null, pendingConnectFrom: null, dirty: false,
      undoStack: [], redoStack: []
    })
  },

  // 新建工作流：若提供 conversations，则自动网格铺开全部对话
  async newFlow(wsId, name, conversations) {
    const f = await api.createFlow(wsId, { name, nodes: [], edges: [] }).catch(() => null)
    if (!f) return
    const nodes = gridLayout(conversations || [])
    if (nodes.length) {
      await api.saveFlowById(wsId, f.id, { name: f.name, nodes, edges: [], draft: true }).catch(() => {})
    }
    set({
      flowId: f.id, flowName: f.name, nodes, edges: [],
      selectedNodeId: null, pendingConnectFrom: null, dirty: false, lastSavedAt: 0,
      undoStack: [], redoStack: []
    })
    await get().refreshFlows()
  },

  async renameFlow(name) {
    const { workspaceId, flowId } = get()
    if (!workspaceId || !flowId) return
    set({ flowName: name })
    await api.saveFlowById(workspaceId, flowId, {
      name, nodes: get().nodes, edges: get().edges, draft: true
    }).catch(() => {})
    await get().refreshFlows()
  },

  async removeFlow(flowId) {
    const wsId = get().workspaceId
    if (!wsId) return
    await api.deleteFlowById(wsId, flowId).catch(() => {})
    const flows = await api.listFlows(wsId).catch(() => [])
    set({ flows })
    if (get().flowId === flowId) {
      if (flows[0]) await get().loadFlow(wsId, flows[0].id)
      else await get().newFlow(wsId, '未命名工作流', [])
    }
  },

  async exportFlow() {
    const { workspaceId, flowId, flowName, nodes, edges } = get()
    if (!workspaceId || !flowId) return
    const payload = { name: flowName, nodes, edges, exportedAt: new Date().toISOString(), __app: 'wb-convo-flow' }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${flowName || '工作流'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  },

  // ---- 保存 ----
  scheduleAutosave() {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => get().saveFlow(true), AUTOSAVE_DELAY)
  },

  async saveFlow(draft = false) {
    const { workspaceId, flowId, flowName, nodes, edges } = get()
    if (!workspaceId || !flowId) return
    set({ saving: true })
    try {
      await api.saveFlowById(workspaceId, flowId, { name: flowName, nodes, edges, draft })
      set({ dirty: false, saving: false, lastSavedAt: draft ? get().lastSavedAt : Date.now() })
      if (!draft) await get().refreshFlows()
    } catch {
      set({ saving: false })
    }
  },

  // ---- 画布基础 ----
  setNodes(nodes) {
    set({ nodes, dirty: true })
    get().scheduleAutosave()
  },
  setEdges(edges) {
    set({ edges, dirty: true })
    get().scheduleAutosave()
  },

  pushHistory() {
    const { nodes, edges, undoStack } = get()
    const next = [...undoStack, { nodes, edges }].slice(-HISTORY_LIMIT)
    set({ undoStack: next, redoStack: [] })
  },

  undo() {
    const { undoStack, redoStack, nodes, edges } = get()
    if (!undoStack.length) return
    const prev = undoStack[undoStack.length - 1]
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, { nodes, edges }].slice(-HISTORY_LIMIT),
      nodes: prev.nodes, edges: prev.edges, dirty: true
    })
    get().scheduleAutosave()
  },

  redo() {
    const { undoStack, redoStack, nodes, edges } = get()
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, { nodes, edges }].slice(-HISTORY_LIMIT),
      nodes: next.nodes, edges: next.edges, dirty: true
    })
    get().scheduleAutosave()
  },

  // ---- 节点操作 ----
  addConversationNode(convo, position) {
    get().pushHistory()
    const id = `n-${convo.uuid}`
    if (get().nodes.some(n => n.id === id)) return
    const node = {
      id, type: 'conversation',
      position: position || { x: 60, y: 60 },
      data: {
        uuid: convo.uuid, title: convo.title, excerpt: convo.excerpt || '',
        messageCount: convo.messageCount || 0, updatedAt: convo.updatedAt || 0,
        size: (convo.messageCount || 0) >= 60 ? 'lg' : (convo.messageCount || 0) >= 20 ? 'md' : 'sm'
      }
    }
    get().setNodes([...get().nodes, node])
  },

  removeNode(id) {
    get().pushHistory()
    set({
      nodes: get().nodes.filter(n => n.id !== id),
      edges: get().edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: null, pendingConnectFrom: null
    })
    get().scheduleAutosave()
  },

  setSelectedNode(id) { set({ selectedNodeId: id }) },

  appendMissingConversations(conversations) {
    get().pushHistory()
    get().setNodes(appendMissing(conversations || [], get().nodes))
  },

  relayoutAll(conversations) {
    get().pushHistory()
    const { nodes, edges } = relayout(conversations || [], get().nodes, get().edges)
    set({ nodes, edges, dirty: true })
    get().scheduleAutosave()
  },

  // ---- 连线 ----
  canConnect(sourceId, targetId) {
    if (sourceId === targetId) return false
    const { edges } = get()
    const dup = edges.some(e => e.source === sourceId && e.target === targetId)
    return !dup && !createsCycle(edges, sourceId, targetId)
  },

  addEdgeSafe(source, target) {
    if (!get().canConnect(source, target)) return false
    const edge = {
      id: `e-${source}-${target}`,
      source, target,
      type: 'smoothstep', animated: true
    }
    get().setEdges([...get().edges, edge])
    return true
  },

  // 带用户反馈的连线：历史快照 + 目标高亮；返回 {ok, reason}
  connectTo(sourceId, targetId) {
    if (sourceId === targetId) return { ok: false, reason: 'self' }
    const { edges } = get()
    if (edges.some(e => e.source === sourceId && e.target === targetId)) return { ok: false, reason: 'dup' }
    if (createsCycle(edges, sourceId, targetId)) return { ok: false, reason: 'cycle' }
    get().pushHistory()
    get().addEdgeSafe(sourceId, targetId)
    get()._flashHighlight(targetId)
    return { ok: true }
  },

  _flashHighlight(nodeId) {
    set({ highlightNodeId: nodeId })
    clearTimeout(highlightTimer)
    highlightTimer = setTimeout(() => set({ highlightNodeId: null }), 2200)
  },

  // ---- 连接选择器（搜索器 / 时间线列表）----
  openPicker(nodeId) {
    set({ pickerSourceNodeId: nodeId, pendingConnectFrom: nodeId, selectedNodeId: nodeId })
  },

  closePicker() {
    set({ pickerSourceNodeId: null })
  },

  onConnect(connection) {
    get().pushHistory()
    if (get().addEdgeSafe(connection.source, connection.target)) {
      get()._flashHighlight(connection.target)
    }
  },

  // 点击连线模式
  startConnect(nodeId) {
    set({ pendingConnectFrom: nodeId, selectedNodeId: nodeId })
  },

  cancelConnect() {
    set({ pendingConnectFrom: null })
  },

  clickConnect(targetNodeId) {
    const from = get().pendingConnectFrom
    if (!from) return false
    if (from === targetNodeId) {
      set({ pendingConnectFrom: null })
      get().closePicker()
      return false
    }
    const r = get().connectTo(from, targetNodeId)
    set({ pendingConnectFrom: null })
    get().closePicker()
    return r.ok
  },

  // 框选/多选批量自动串联：按所选排序依次首尾相连（跳过重复与成环）
  autoChain(orderKey = 'updatedAtAsc') {
    const sel = get().nodes.filter(n => n.selected)
    if (sel.length < 2) return { linked: 0, total: sel.length }
    const convs = useAppStore.getState().conversations || []
    const startedMap = new Map(convs.map(c => [c.uuid, c.startedAt || 0]))
    const list = [...sel]
    if (orderKey === 'createdAtAsc') {
      list.sort((a, b) => (startedMap.get(a.data?.uuid) || 0) - (startedMap.get(b.data?.uuid) || 0))
    } else if (orderKey === 'messageCountDesc') {
      list.sort((a, b) => (b.data?.messageCount || 0) - (a.data?.messageCount || 0))
    } else {
      list.sort((a, b) => (a.data?.updatedAt || 0) - (b.data?.updatedAt || 0))
    }
    get().pushHistory()
    let linked = 0
    for (let i = 0; i < list.length - 1; i++) {
      if (get().addEdgeSafe(list[i].id, list[i + 1].id)) linked++
    }
    return { linked, total: list.length }
  }
}))
