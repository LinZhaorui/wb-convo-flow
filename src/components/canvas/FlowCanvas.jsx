import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore.js'
import { useFlowStore } from '../../store/useFlowStore.js'
import { openInWorkbuddy } from '../../lib/deeplink.js'
import ConversationNode from './ConversationNode.jsx'
import ConnectionPicker from './ConnectionPicker.jsx'

const nodeTypes = { conversation: ConversationNode }

const ORDER_OPTIONS = [
  { key: 'updatedAtAsc', label: '按更新时间（旧→新）' },
  { key: 'createdAtAsc', label: '按创建时间（旧→新）' },
  { key: 'messageCountDesc', label: '按消息数（多→少）' }
]

export default function FlowCanvas() {
  const nodes = useFlowStore(s => s.nodes)
  const edges = useFlowStore(s => s.edges)
  const setNodes = useFlowStore(s => s.setNodes)
  const setEdges = useFlowStore(s => s.setEdges)
  const onConnect = useFlowStore(s => s.onConnect)
  const clickConnect = useFlowStore(s => s.clickConnect)
  const cancelConnect = useFlowStore(s => s.cancelConnect)
  const pushHistory = useFlowStore(s => s.pushHistory)
  const pendingConnectFrom = useFlowStore(s => s.pendingConnectFrom)
  const autoChain = useFlowStore(s => s.autoChain)
  const showToast = useAppStore(s => s.showToast)

  const [orderKey, setOrderKey] = useState('updatedAtAsc')
  const selectedCount = nodes.filter(n => n.selected).length

  const onNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, useFlowStore.getState().nodes)),
    [setNodes]
  )
  const onEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, useFlowStore.getState().edges)),
    [setEdges]
  )

  // 单击：选中 / 完成点击连线；双击：唤起 WorkBuddy 打开原生对话
  const onNodeClick = useCallback((_, node) => {
    const st = useFlowStore.getState()
    if (st.pendingConnectFrom) {
      st.clickConnect(node.id)
      return
    }
    st.setSelectedNode(node.id)
  }, [])

  const onNodeDoubleClick = useCallback((_, node) => {
    if (useFlowStore.getState().pendingConnectFrom) return
    const uuid = node.data?.uuid
    if (!uuid) return
    const ok = openInWorkbuddy(uuid)
    showToast(
      ok ? '正在唤起 WorkBuddy 打开该对话…若未响应，请确认 WorkBuddy 已运行' : '深链唤起失败，可改用卡片「预览」查看',
      ok ? 'info' : 'warn'
    )
  }, [showToast])

  // 拖动节点：拖起前记录历史，支持撤销
  const onNodeDragStart = useCallback(() => pushHistory(), [pushHistory])

  // Esc 取消连线
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (pendingConnectFrom) cancelConnect()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingConnectFrom, cancelConnect])

  const handleAutoChain = () => {
    const r = autoChain(orderKey)
    showToast(
      r.linked > 0 ? `已串联 ${r.linked} 条连线（${r.total} 个节点）` : '没有可建立的新连线',
      r.linked > 0 ? 'success' : 'warn'
    )
  }

  return (
    <div className="flow-wrap">
      {pendingConnectFrom && (
        <div className="flow-hint warn">点击目标节点完成连线 · 或在连接选择器中搜索 / 点选 · Esc 取消</div>
      )}
      {!pendingConnectFrom && nodes.length === 0 && (
        <div className="flow-hint">该工作流还没有节点 · 可点击工具栏「重新铺开」自动排入全部对话</div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStart={onNodeDragStart}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
        connectionLineStyle={{ stroke: '#2f6df6', strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
        {selectedCount >= 2 && (
          <Panel position="bottom-center">
            <div className="bulk-bar">
              <span className="bulk-count">已选 {selectedCount} 个节点</span>
              <select value={orderKey} onChange={e => setOrderKey(e.target.value)} title="选择串联顺序">
                {ORDER_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <button className="btn primary" onClick={handleAutoChain}>自动串联</button>
            </div>
          </Panel>
        )}
      </ReactFlow>
      <ConnectionPicker />
    </div>
  )
}
