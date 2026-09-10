import { useAppStore } from '../store/useAppStore.js'

export default function ConversationTabs() {
  const conversations = useAppStore(s => s.conversations)
  const activeTabUuid = useAppStore(s => s.activeTabUuid)
  const openConversation = useAppStore(s => s.openConversation)
  const currentWorkspaceId = useAppStore(s => s.currentWorkspaceId)

  if (!currentWorkspaceId) {
    return <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }} />
  }
  if (conversations.length === 0) {
    return <div style={{ height: 36, borderBottom: '1px solid var(--border)', background: 'var(--panel)' }} />
  }

  return (
    <div className="convo-tabs">
      {conversations.map(c => (
        <div
          key={c.uuid}
          className={'convo-tab' + (c.uuid === activeTabUuid ? ' active' : '')}
          onClick={() => openConversation(c.uuid)}
          title={c.title}
        >
          <span className="dot" />
          <span className="label">{c.title}</span>
        </div>
      ))}
    </div>
  )
}
