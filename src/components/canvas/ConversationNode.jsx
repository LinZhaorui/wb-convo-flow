import { useMemo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore.js'
import { useFlowStore } from '../../store/useFlowStore.js'

function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ConversationNode({ id, data, selected }) {
  const openModal = useAppStore(s => s.openModal)
  const showToast = useAppStore(s => s.showToast)
  const conversations = useAppStore(s => s.conversations)

  const removeNode = useFlowStore(s => s.removeNode)
  const openPicker = useFlowStore(s => s.openPicker)
  const cancelConnect = useFlowStore(s => s.cancelConnect)
  const connectTo = useFlowStore(s => s.connectTo)
  const pendingConnectFrom = useFlowStore(s => s.pendingConnectFrom)
  const highlightNodeId = useFlowStore(s => s.highlightNodeId)
  const edges = useFlowStore(s => s.edges)

  const isPendingSource = pendingConnectFrom === id
  const isConnectable = !!pendingConnectFrom && !isPendingSource
  const isHighlighted = highlightNodeId === id

  // 时间上紧邻的下一个对话（相邻快速连接）
  const nextConvo = useMemo(() => {
    const cur = conversations.find(c => c.uuid === data.uuid)
    const curT = cur?.updatedAt || data.updatedAt || 0
    return [...(conversations || [])]
      .filter(c => c.uuid !== data.uuid && (c.updatedAt || 0) > curT)
      .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))[0] || null
  }, [conversations, data.uuid, data.updatedAt])

  const nextConnected = useMemo(() => {
    if (!nextConvo) return false
    return edges.some(e => e.source === id && e.target === `n-${nextConvo.uuid}`)
  }, [edges, id, nextConvo])

  const stop = (e) => e.stopPropagation()

  const connectNext = (e) => {
    stop(e)
    if (!nextConvo || nextConnected) return
    const r = connectTo(id, `n-${nextConvo.uuid}`)
    if (r.ok) showToast(`已连接 → ${nextConvo.title}`, 'success')
    else if (r.reason === 'cycle') showToast('该连线会形成循环，已拒绝', 'warn')
    else if (r.reason === 'dup') showToast('这两个节点已存在连线', 'warn')
  }

  return (
    <div
      className={[
        'cnode', data.size || 'sm',
        selected ? 'selected' : '',
        isConnectable ? 'connectable' : '',
        isPendingSource ? 'connecting' : '',
        isHighlighted ? 'highlight' : ''
      ].join(' ')}
      title={isConnectable ? '点击此节点完成连线' : undefined}
    >
      <Handle type="target" position={Position.Left} />

      <div className="cn-head">
        <span className={`cn-size ${data.size}`}>{data.size === 'lg' ? '大' : data.size === 'md' ? '中' : '小'}</span>
        <div className="cn-title" title={data.title}>{data.title || '未命名对话'}</div>
      </div>

      {data.excerpt && <div className="cn-excerpt">{data.excerpt}</div>}

      <div className="cn-meta">
        <span>{data.messageCount ?? 0} 条消息</span>
        <span>{fmtDate(data.updatedAt)}</span>
      </div>

      {nextConvo && (
        <div
          className={`cn-next ${nextConnected ? 'done' : ''}`}
          onClick={connectNext}
          title={nextConnected ? '已连接该相邻对话' : `一键连接时间上紧邻的下一个对话：${nextConvo.title}`}
        >
          <span className="lbl">下一</span>
          <span className="t">{nextConvo.title}</span>
          <span className="arr">{nextConnected ? '已连' : '→'}</span>
        </div>
      )}

      <div className="cn-actions" onClick={stop}>
        <button onClick={() => openModal(data.uuid)} title="在画布内预览完整对话（只读）">预览</button>
        {isPendingSource ? (
          <button className="cancel" onClick={cancelConnect} title="取消本次连线">取消</button>
        ) : (
          <button onClick={() => openPicker(id)} title="打开连接选择器（搜索 / 时间线），也可直接点击画布上的目标节点">连接→</button>
        )}
        <button className="del" onClick={() => removeNode(id)} title="从画布移除该节点">删除</button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
