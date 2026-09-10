import { useAppStore } from '../store/useAppStore.js'

function baseName(p) {
  if (!p) return ''
  const parts = p.split('\\')
  return parts[parts.length - 1] || p
}

export default function WorkspaceSidebar() {
  const workspaces = useAppStore(s => s.workspaces)
  const currentWorkspaceId = useAppStore(s => s.currentWorkspaceId)
  const selectWorkspace = useAppStore(s => s.selectWorkspace)
  const loading = useAppStore(s => s.workspacesLoading)

  return (
    <aside className="sidebar">
      <div className="head">工作空间 ({workspaces.length})</div>
      <div className="list">
        {loading && <div className="loading">加载中…</div>}
        {!loading && workspaces.length === 0 && (
          <div className="palette-empty">未发现 WorkBuddy 工作空间。<br />目录：~/.workbuddy/projects</div>
        )}
        {workspaces.map(ws => (
          <div
            key={ws.id}
            className={'ws-item' + (ws.id === currentWorkspaceId ? ' active' : '')}
            onClick={() => selectWorkspace(ws.id)}
            title={ws.name}
          >
            <div className="name">{baseName(ws.name)}</div>
            <div className="path">{ws.name}</div>
            <div className="meta">{ws.conversationCount} 个对话{ws.lastActive ? ' · ' + new Date(ws.lastActive).toLocaleDateString('zh-CN') : ''}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
