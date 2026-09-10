import { useAppStore } from '../store/useAppStore.js'

export default function ConversationViewer() {
  const c = useAppStore(s => s.currentConversation)
  const loading = useAppStore(s => s.currentConversationLoading)
  const currentWorkspaceId = useAppStore(s => s.currentWorkspaceId)
  const activeTabUuid = useAppStore(s => s.activeTabUuid)

  if (!currentWorkspaceId) {
    return (
      <div className="convo-viewer">
        <div className="empty">← 从左侧选择一个工作空间，<br />中间区域将以标签形式展示该空间的每一个对话</div>
      </div>
    )
  }
  if (!activeTabUuid) {
    return <div className="convo-viewer"><div className="empty">该工作空间暂无对话</div></div>
  }
  if (loading || !c) {
    return <div className="convo-viewer"><div className="loading">加载对话内容中…</div></div>
  }

  return (
    <div className="convo-viewer">
      <div className="convo-inner">
        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 18 }}>
          {c.title} · 共 {c.messages.length} 条消息 · {c.eventCount} 个事件
        </div>
        {c.messages.length === 0 && <div className="empty">（该对话无可显示文本消息）</div>}
        {c.messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            <div className="role">
              <span>{m.role === 'user' ? '🧑 我' : '🤖 助手'}</span>
              {m.model && <span className="model">{m.model}</span>}
              {m.ts && <span style={{ marginLeft: 'auto' }}>{new Date(m.ts).toLocaleString('zh-CN')}</span>}
            </div>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
