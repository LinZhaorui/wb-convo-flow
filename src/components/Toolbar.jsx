import { useReactFlow } from '@xyflow/react'
import { useAppStore, MODE_CANVAS, MODE_LIST } from '../store/useAppStore.js'
import { useFlowStore } from '../store/useFlowStore.js'
import FlowMenu from './workflow/FlowMenu.jsx'

function fmtTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function Toolbar() {
  const mode = useAppStore(s => s.mode)
  const setMode = useAppStore(s => s.setMode)
  const currentWorkspaceId = useAppStore(s => s.currentWorkspaceId)
  const conversations = useAppStore(s => s.conversations)

  const flowId = useFlowStore(s => s.flowId)
  const dirty = useFlowStore(s => s.dirty)
  const saving = useFlowStore(s => s.saving)
  const lastSavedAt = useFlowStore(s => s.lastSavedAt)
  const nodesCount = useFlowStore(s => s.nodes.length)
  const saveFlow = useFlowStore(s => s.saveFlow)
  const undo = useFlowStore(s => s.undo)
  const redo = useFlowStore(s => s.redo)
  const undoDepth = useFlowStore(s => s.undoStack.length)
  const redoDepth = useFlowStore(s => s.redoStack.length)
  const appendMissingConversations = useFlowStore(s => s.appendMissingConversations)
  const relayoutAll = useFlowStore(s => s.relayoutAll)
  const { fitView } = useReactFlow()

  const saveState = saving
    ? '暂存中…'
    : dirty
      ? '未保存 · 将自动暂存'
      : lastSavedAt
        ? `已保存 ${fmtTime(lastSavedAt)}`
        : '自动暂存已开启'

  return (
    <div className="toolbar">
      <div className="logo">对话工作流编排器 <span className="accent">· WorkBuddy</span></div>

      <div className="seg">
        <button className={mode === MODE_CANVAS ? 'active' : ''} onClick={() => setMode(MODE_CANVAS)}>画布编排</button>
        <button className={mode === MODE_LIST ? 'active' : ''} onClick={() => setMode(MODE_LIST)}>列表浏览</button>
      </div>

      {mode === MODE_CANVAS && currentWorkspaceId && <FlowMenu />}

      <div className="spacer" />

      {mode === MODE_CANVAS && currentWorkspaceId && flowId && (
        <>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{nodesCount} 节点</span>
          <span className={`save-state ${dirty ? 'dirty' : ''}`} title="编辑后 0.8s 自动暂存；「保存」写入正式版本">{saveState}</span>
          <button className="btn icon" title="撤销 (Ctrl+Z)" disabled={!undoDepth} onClick={undo}>↶</button>
          <button className="btn icon" title="重做 (Ctrl+Shift+Z)" disabled={!redoDepth} onClick={redo}>↷</button>
          <button className="btn" title="把当前空间中尚未入画的对话按网格追加到画布末尾" onClick={() => appendMissingConversations(conversations)}>重新铺开</button>
          <button className="btn" title="按三档尺寸网格重排全部节点（保留连线）" onClick={() => relayoutAll(conversations)}>重排</button>
          <button className="btn" title="缩放至全部节点可见" onClick={() => fitView({ padding: 0.15, duration: 300 })}>适配</button>
          <button className="btn primary" title="保存为正式版本" onClick={() => saveFlow(false)}>保存</button>
        </>
      )}
    </div>
  )
}
