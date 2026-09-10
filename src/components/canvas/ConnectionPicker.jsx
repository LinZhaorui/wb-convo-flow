import { useEffect, useMemo, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore.js'
import { useFlowStore } from '../../store/useFlowStore.js'

const TABS = [
  { key: 'search', label: '搜索' },
  { key: 'timeline', label: '时间线' }
]

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 连接选择器浮层：搜索 / 时间线两种找目标方式，选中即连线并飞向目标
export default function ConnectionPicker() {
  const sourceNodeId = useFlowStore(s => s.pickerSourceNodeId)
  const nodes = useFlowStore(s => s.nodes)
  const edges = useFlowStore(s => s.edges)
  const connectTo = useFlowStore(s => s.connectTo)
  const closePicker = useFlowStore(s => s.closePicker)
  const conversations = useAppStore(s => s.conversations)
  const showToast = useAppStore(s => s.showToast)
  const { fitView } = useReactFlow()

  const [tab, setTab] = useState('search')
  const [q, setQ] = useState('')

  const sourceNode = nodes.find(n => n.id === sourceNodeId)
  const sourceUuid = sourceNode?.data?.uuid

  useEffect(() => {
    if (!sourceNodeId) { setQ(''); setTab('search') }
  }, [sourceNodeId])

  // Esc 关闭
  useEffect(() => {
    if (!sourceNodeId) return
    const onKey = (e) => { if (e.key === 'Escape') closePicker() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sourceNodeId, closePicker])

  const candidates = useMemo(() => {
    if (!sourceUuid) return []
    const linkedTargets = new Set(edges.filter(e => e.source === sourceNodeId).map(e => e.target))
    return (conversations || [])
      .filter(c => c.uuid !== sourceUuid)
      .map(c => {
        const nodeId = `n-${c.uuid}`
        const nodeExists = nodes.some(n => n.id === nodeId)
        return {
          ...c,
          nodeId,
          nodeExists,
          connected: linkedTargets.has(nodeId)
        }
      })
      .filter(c => c.nodeExists || !q) // 未入画的对话仅在搜索时提示
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }, [conversations, sourceUuid, sourceNodeId, edges, nodes, q])

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return candidates
    return candidates.filter(c =>
      (c.title || '').toLowerCase().includes(kw) ||
      (c.excerpt || '').toLowerCase().includes(kw)
    )
  }, [candidates, q])

  if (!sourceNodeId || !sourceNode) return null

  const pick = (c) => {
    if (!c.nodeExists) {
      showToast('该对话尚未入画，请先「重新铺开」或手动添加', 'warn')
      return
    }
    const r = connectTo(sourceNodeId, c.nodeId)
    if (r.ok) {
      showToast(`已连接 → ${c.title}`, 'success')
      closePicker()
      // 飞向目标并短暂高亮
      setTimeout(() => fitView({ padding: 0.45, duration: 600, nodes: [{ id: c.nodeId }] }), 60)
    } else if (r.reason === 'dup') {
      showToast('这两个节点已存在连线', 'warn')
    } else if (r.reason === 'cycle') {
      showToast('该连线会形成循环，已拒绝', 'warn')
    }
  }

  return (
    <div className="cp-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) closePicker() }}>
      <div className="cp-window">
        <div className="cp-head">
          <div className="cp-title">连接到下一节点</div>
          <div className="cp-sub">源：{sourceNode.data?.title || '节点'}</div>
          <button className="modal-close" onClick={closePicker} title="关闭 (Esc)">✕</button>
        </div>

        <div className="cp-tabs">
          {TABS.map(t => (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
          {tab === 'search' && (
            <input
              autoFocus
              className="cp-search"
              placeholder="按标题 / 摘要搜索对话…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) pick(filtered[0]) }}
            />
          )}
        </div>

        <div className="cp-list">
          {filtered.length === 0 && <div className="cp-empty">没有匹配的对话</div>}
          {filtered.map(c => (
            <div
              key={c.uuid}
              className={`cp-item ${c.connected ? 'connected' : ''}`}
              onClick={() => pick(c)}
              title={c.connected ? '已连接（重复连线将被忽略）' : (c.title || '')}
            >
              <span className={`cn-size ${c.messageCount >= 60 ? 'lg' : c.messageCount >= 20 ? 'md' : 'sm'}`}>
                {c.messageCount >= 60 ? '大' : c.messageCount >= 20 ? '中' : '小'}
              </span>
              <div className="cp-item-main">
                <div className="cp-item-title">{c.title}</div>
                <div className="cp-item-meta">{c.messageCount} 条消息 · {fmtTime(c.updatedAt)}{!c.nodeExists ? ' · 未入画' : ''}</div>
              </div>
              {c.connected && <span className="cp-tag">已连</span>}
            </div>
          ))}
        </div>

        <div className="cp-foot">Enter 连第一个结果 · 点击列表项连接 · Esc 关闭 · 也可直接在画布上点击目标节点</div>
      </div>
    </div>
  )
}
