import { useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore.js'
import { useFlowStore } from '../../store/useFlowStore.js'
import { openInWorkbuddy } from '../../lib/deeplink.js'

// 模态大窗：放大查看完整对话（只读），底部可在相连节点间跳转
export default function ConversationModal() {
  const modalUuid = useAppStore(s => s.modalUuid)
  const conversation = useAppStore(s => s.modalConversation)
  const loading = useAppStore(s => s.modalLoading)
  const openModal = useAppStore(s => s.openModal)
  const closeModal = useAppStore(s => s.closeModal)

  const edges = useFlowStore(s => s.edges)

  // 相邻节点（按连线关系）
  const neighbors = useMemo(() => {
    if (!modalUuid) return { prev: null, next: null }
    const nodeId = `n-${modalUuid}`
    const prevEdge = edges.find(e => e.target === nodeId)
    const nextEdge = edges.find(e => e.source === nodeId)
    return {
      prev: prevEdge ? prevEdge.source.replace(/^n-/, '') : null,
      next: nextEdge ? nextEdge.target.replace(/^n-/, '') : null
    }
  }, [edges, modalUuid])

  // Esc 关闭
  useEffect(() => {
    if (!modalUuid) return
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalUuid, closeModal])

  if (!modalUuid) return null

  return (
    <div className="modal-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="modal-window">
        <div className="modal-head">
          <div className="modal-title" title={conversation?.title || ''}>
            {loading && !conversation ? '加载中…' : (conversation?.title || '对话详情')}
          </div>
          <div className="modal-meta">
            {conversation && (
              <>
                <span>{conversation.messages.length} 条消息</span>
                <span>·</span>
                <span>{conversation.eventCount} 个事件</span>
                {conversation.startedAt && (
                  <>
                    <span>·</span>
                    <span>{new Date(conversation.startedAt).toLocaleString('zh-CN')}</span>
                  </>
                )}
              </>
            )}
          </div>
          <button
            className="btn"
            title="通过 workbuddy:// 深链在 WorkBuddy 主窗口打开该对话"
            onClick={() => {
              if (!conversation?.uuid) return
              const ok = openInWorkbuddy(conversation.uuid)
              showToast(
                ok ? '正在唤起 WorkBuddy…若未响应请确认其已运行' : '深链唤起失败',
                ok ? 'info' : 'warn'
              )
            }}
          >在 WorkBuddy 打开</button>
          <button className="modal-close" onClick={closeModal} title="关闭 (Esc)">✕</button>
        </div>

        <div className="modal-body">
          {loading && !conversation && <div className="empty">加载对话内容中…</div>}
          {!loading && conversation && conversation.messages.length === 0 && (
            <div className="empty">（该对话无可显示文本消息）</div>
          )}
          {conversation && conversation.messages.map((m, i) => (
            <div key={i} className={'msg ' + m.role}>
              <div className="role">
                <span>{m.role === 'user' ? '我' : '助手'}</span>
                {m.model && <span className="model">{m.model}</span>}
                {m.ts && <span style={{ marginLeft: 'auto' }}>{new Date(m.ts).toLocaleString('zh-CN')}</span>}
              </div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>

        <div className="modal-foot">
          <button
            className="btn"
            disabled={!neighbors.prev}
            onClick={() => neighbors.prev && openModal(neighbors.prev)}
            title="上一节点（按连线方向）"
          >← 上一节点</button>
          <span className="hint">Esc 关闭 · 双击画布节点再次打开</span>
          <button
            className="btn"
            disabled={!neighbors.next}
            onClick={() => neighbors.next && openModal(neighbors.next)}
            title="下一节点（按连线方向）"
          >下一节点 →</button>
        </div>
      </div>
    </div>
  )
}
