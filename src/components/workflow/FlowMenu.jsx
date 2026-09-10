import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore.js'
import { useFlowStore } from '../../store/useFlowStore.js'

// 工作流选择器：切换 / 新建 / 重命名 / 删除 / 导出 JSON
export default function FlowMenu() {
  const flows = useFlowStore(s => s.flows)
  const flowId = useFlowStore(s => s.flowId)
  const flowName = useFlowStore(s => s.flowName)
  const workspaceId = useAppStore(s => s.currentWorkspaceId)
  const conversations = useAppStore(s => s.conversations)
  const loadFlow = useFlowStore(s => s.loadFlow)
  const newFlow = useFlowStore(s => s.newFlow)
  const renameFlow = useFlowStore(s => s.renameFlow)
  const removeFlow = useFlowStore(s => s.removeFlow)
  const exportFlow = useFlowStore(s => s.exportFlow)

  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if ((creating || renaming) && inputRef.current) inputRef.current.focus()
  }, [creating, renaming])

  const current = flows.find(f => f.id === flowId)

  const submitCreate = () => {
    const name = draftName.trim() || '未命名工作流'
    setCreating(false); setDraftName('')
    if (workspaceId) newFlow(workspaceId, name, conversations)
  }

  const submitRename = () => {
    const name = renameValue.trim() || flowName
    setRenaming(false)
    if (workspaceId && flowId) renameFlow(name)
  }

  const handleDelete = () => {
    if (!flowId) return
    const ok = window.confirm(`删除工作流「${flowName}」？该操作不可恢复。`)
    if (ok && workspaceId) removeFlow(flowId)
  }

  if (!workspaceId) return null

  return (
    <div className="flow-menu">
      <select
        className="flow-select"
        value={flowId || ''}
        onChange={e => loadFlow(workspaceId, e.target.value)}
        title="切换工作流"
      >
        {flows.length === 0 && <option value="">（暂无工作流）</option>}
        {flows.map(f => (
          <option key={f.id} value={f.id}>
            {f.name}（{f.nodeCount} 节点{f.draft ? ' · 暂存' : ''}）
          </option>
        ))}
      </select>

      {renaming ? (
        <input
          ref={inputRef}
          className="flow-input"
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false) }}
          onBlur={submitRename}
        />
      ) : (
        <button className="btn icon" title="重命名当前工作流" onClick={() => { setRenameValue(flowName); setRenaming(true) }}>✎</button>
      )}

      {creating ? (
        <input
          ref={inputRef}
          className="flow-input"
          placeholder="工作流名称，Enter 确认"
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitCreate(); if (e.key === 'Escape') setCreating(false) }}
          onBlur={submitCreate}
        />
      ) : (
        <button className="btn icon" title="新建工作流（自动铺开当前空间全部对话）" onClick={() => setCreating(true)}>＋</button>
      )}

      <button className="btn icon" title="删除当前工作流" onClick={handleDelete}>✕</button>
      <button className="btn" title="导出当前工作流为 JSON 文件" onClick={exportFlow}>导出</button>
      {current?.draft && <span className="draft-tag" title="存在未显式保存的自动暂存内容">暂存</span>}
    </div>
  )
}
