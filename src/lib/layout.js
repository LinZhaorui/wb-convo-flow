// 三档尺寸网格蛇形布局
// 档位：sm(<20 条) / md(20~60 条) / lg(>60 条)，档位越高卡片越大
export const NODE_W = { sm: 200, md: 240, lg: 280 }
export const NODE_H = { sm: 104, md: 128, lg: 148 }
const GAP = 32
const COLS = 4
const ORIGIN = { x: 40, y: 40 }

export function sizeOf(messageCount) {
  const n = messageCount || 0
  if (n >= 60) return 'lg'
  if (n >= 20) return 'md'
  return 'sm'
}

function toNode(c, position) {
  const size = sizeOf(c.messageCount)
  return {
    id: `n-${c.uuid}`,
    type: 'conversation',
    position,
    data: {
      uuid: c.uuid,
      title: c.title,
      excerpt: c.excerpt || '',
      messageCount: c.messageCount || 0,
      updatedAt: c.updatedAt || 0,
      size
    }
  }
}

// 全量网格布局（蛇形：奇数行反向），大对话优先占前排
export function gridLayout(conversations) {
  const sorted = [...(conversations || [])].sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0))
  const cells = sorted.map(c => ({ c, size: sizeOf(c.messageCount) }))
  const nodes = []
  let y = ORIGIN.y
  for (let i = 0; i < cells.length; i += COLS) {
    const row = cells.slice(i, i + COLS)
    const rowH = Math.max(...row.map(x => NODE_H[x.size]))
    const ordered = (rows(i) % 2 === 1) ? [...row].reverse() : row
    ordered.forEach((cell, col) => {
      const colX = ORIGIN.x + col * (NODE_W.lg + GAP)
      const cx = colX + (NODE_W.lg - NODE_W[cell.size]) / 2
      const cy = y + (rowH - NODE_H[cell.size]) / 2
      nodes.push(toNode(cell.c, { x: cx, y: cy }))
    })
    y += rowH + GAP
  }
  return nodes
}

function rows(index) { return Math.floor(index / COLS) }

// 追加缺失对话到现有节点之后（不移动已有节点）
export function appendMissing(conversations, existingNodes) {
  const have = new Set(existingNodes.map(n => n.data?.uuid))
  const missing = (conversations || []).filter(c => !have.has(c.uuid))
  if (!missing.length) return existingNodes
  const bottomY = existingNodes.reduce((m, n) => Math.max(m, n.position?.y || 0), 0)
  const appended = gridLayout(missing).map(n => ({
    ...n,
    position: { x: n.position.x, y: n.position.y + bottomY + NODE_H.lg + GAP }
  }))
  return [...existingNodes, ...appended]
}

// 重排全部节点（保留连线，位置重算）
export function relayout(conversations, existingNodes, existingEdges) {
  const byId = new Map(existingNodes.map(n => [n.id, n]))
  const laidOut = gridLayout(conversations)
  // 保留不在 conversations 里的"孤儿节点"（对话可能已被删除），追加在末尾
  const knownIds = new Set(laidOut.map(n => n.id))
  const orphans = existingNodes.filter(n => !knownIds.has(n.id))
  const maxY = laidOut.reduce((m, n) => Math.max(m, n.position.y), 0)
  const orphansLaid = orphans.map((n, i) => ({
    ...n,
    position: { x: ORIGIN.x + i * (NODE_W.sm + GAP), y: maxY + NODE_H.lg + GAP }
  }))
  void byId
  return { nodes: [...laidOut, ...orphansLaid], edges: existingEdges }
}
