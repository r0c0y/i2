import { useEffect, useRef, useState } from 'react'
import type { GraphEdge } from '../types'

interface Node {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  isHovered: boolean
  type: 'defect' | 'resolution' | 'cause'
}

interface Link {
  source: Node
  target: Node
  relation: string
  origin: string
}

interface KnowledgeGraphViewerProps {
  edges: GraphEdge[]
  searchQuery?: string
  linkDistance?: number
  repulsionStrength?: number
  gravityStrength?: number
}

export function KnowledgeGraphViewer({ 
  edges, 
  searchQuery = '', 
  linkDistance = 100, 
  repulsionStrength = 120, 
  gravityStrength = 0.003 
}: KnowledgeGraphViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
  const nodesRef = useRef<Node[]>([])
  const animationFrameRef = useRef<number>(0)
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean; activeNode: Node | null }>({
    x: 0,
    y: 0,
    isDown: false,
    activeNode: null,
  })

  // Synchronize incoming edges to node/link physics structures
  useEffect(() => {
    const existingNodes = new Map<string, Node>()
    nodesRef.current.forEach(n => existingNodes.set(n.id, n))

    const newNodesMap = new Map<string, Node>()
    
    // Determine unique node entities
    edges.forEach(edge => {
      const srcId = edge.sourceNode.toLowerCase().trim()
      const tgtId = edge.targetNode.toLowerCase().trim()

      const getNodeType = (id: string, isSource: boolean): 'defect' | 'resolution' | 'cause' => {
        if (isSource) return 'defect'
        if (edge.relation.toLowerCase().includes('resolved')) return 'resolution'
        return 'cause'
      }

      // Source Node
      if (!newNodesMap.has(srcId)) {
        const old = existingNodes.get(srcId)
        newNodesMap.set(srcId, {
          id: srcId,
          label: edge.sourceNode,
          x: old?.x ?? (150 + Math.random() * 200),
          y: old?.y ?? (150 + Math.random() * 200),
          vx: old?.vx ?? 0,
          vy: old?.vy ?? 0,
          color: '#a78bfa', // Purple
          radius: 8,
          isHovered: false,
          type: getNodeType(srcId, true),
        })
      }

      // Target Node
      if (!newNodesMap.has(tgtId)) {
        const old = existingNodes.get(tgtId)
        const type = getNodeType(tgtId, false)
        newNodesMap.set(tgtId, {
          id: tgtId,
          label: edge.targetNode,
          x: old?.x ?? (150 + Math.random() * 200),
          y: old?.y ?? (150 + Math.random() * 200),
          vx: old?.vx ?? 0,
          vy: old?.vy ?? 0,
          color: type === 'resolution' ? '#34d399' : '#60a5fa', // Green or Blue
          radius: 7,
          isHovered: false,
          type,
        })
      }
    })

    nodesRef.current = Array.from(newNodesMap.values())
  }, [edges])

  // Simulation and Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500
      canvas.height = canvas.parentElement?.clientHeight || 400
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const runPhysicsAndRender = () => {
      const w = canvas.width
      const h = canvas.height
      const centerX = w / 2
      const centerY = h / 2

      ctx.clearRect(0, 0, w, h)

      // Draw beautiful grid background
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.02)'
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      const nodes = nodesRef.current

      // ── Physics: 1. Repulsion (Coulomb Force) ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i]
          const nodeB = nodes[j]
          const dx = nodeB.x - nodeA.x
          const dy = nodeB.y - nodeA.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          
          if (dist < 180) {
            const force = (repulsionStrength * 100) / (dist * dist)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            
            nodeA.vx -= fx
            nodeA.vy -= fy
            nodeB.vx += fx
            nodeB.vy += fy
          }
        }
      }

      // ── Physics: 2. Attraction (Spring Force along edges) ──
      const links: Link[] = []
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.sourceNode.toLowerCase().trim())
        const target = nodes.find(n => n.id === edge.targetNode.toLowerCase().trim())
        if (source && target) {
          links.push({ source, target, relation: edge.relation, origin: edge.origin })

          const dx = target.x - source.x
          const dy = target.y - source.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const restLength = linkDistance
          const k = 0.04 // Spring constant
          const force = k * (dist - restLength)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          source.vx += fx
          source.vy += fy
          target.vx -= fx
          target.vy -= fy
        }
      })

      // ── Physics: 3. Gravity and Updates ──
      nodes.forEach(node => {
        if (node === mouseRef.current.activeNode) return // Dragged node stays put

        // Gravitational pull toward center
        const dx = centerX - node.x
        const dy = centerY - node.y
        node.vx += dx * gravityStrength
        node.vy += dy * gravityStrength

        // Damping/friction
        node.vx *= 0.82
        node.vy *= 0.82

        // Update positions
        node.x += node.vx
        node.y += node.vy

        // Bound check
        node.x = Math.max(20, Math.min(w - 20, node.x))
        node.y = Math.max(20, Math.min(h - 20, node.y))
      })

      const hasSearch = searchQuery.trim().length > 0

      // ── Rendering: 1. Links (Lines) ──
      links.forEach(link => {
        const isLinkedToHover = hoveredNode && 
          (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id)
        
        const sourceMatch = hasSearch && link.source.label.toLowerCase().includes(searchQuery.toLowerCase())
        const targetMatch = hasSearch && link.target.label.toLowerCase().includes(searchQuery.toLowerCase())
        const isSearchLink = hasSearch && (sourceMatch || targetMatch)

        ctx.beginPath()
        ctx.moveTo(link.source.x, link.source.y)
        ctx.lineTo(link.target.x, link.target.y)
        
        if (isSearchLink) {
          ctx.strokeStyle = '#f59e0b' // Gold
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.8
        } else if (isLinkedToHover) {
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)'
          ctx.lineWidth = 2
          ctx.globalAlpha = 1.0
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
          ctx.lineWidth = 1
          ctx.globalAlpha = hasSearch ? 0.15 : 1.0
        }
        ctx.stroke()
        ctx.globalAlpha = 1.0

        // Render connection relation text on hover or search match
        if (isLinkedToHover || isSearchLink) {
          const midX = (link.source.x + link.target.x) / 2
          const midY = (link.source.y + link.target.y) / 2
          ctx.fillStyle = isSearchLink ? '#f59e0b' : 'rgba(167, 139, 250, 0.8)'
          ctx.font = '8px JetBrains Mono, monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(link.relation.replace('_', ' ').toUpperCase(), midX, midY - 6)
        }
      })

      // ── Rendering: 2. Nodes ──
      nodes.forEach(node => {
        const isHover = hoveredNode && node.id === hoveredNode.id
        const isMatch = hasSearch && node.label.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (hasSearch && !isMatch) {
          ctx.globalAlpha = 0.18 // Dim unmatched nodes
        } else {
          ctx.globalAlpha = 1.0
        }

        const rad = isMatch ? node.radius + 3 : node.radius

        // Outer glow
        if (isHover || isMatch) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, rad + 6, 0, Math.PI * 2)
          ctx.fillStyle = isMatch ? 'rgba(245, 158, 11, 0.15)' : 'rgba(167, 139, 250, 0.15)'
          ctx.fill()
        }

        // Inner circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, rad, 0, Math.PI * 2)
        ctx.fillStyle = isMatch ? '#f59e0b' : node.color
        ctx.fill()

        // Border outline
        ctx.lineWidth = 1.5
        ctx.strokeStyle = isMatch ? '#ffffff' : (isHover ? '#fafafa' : 'rgba(0, 0, 0, 0.5)')
        ctx.stroke()

        // Text Labels
        ctx.fillStyle = (isHover || isMatch) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
        ctx.font = (isHover || isMatch) ? '10px Inter, sans-serif' : '9px Inter, sans-serif'
        ctx.font = (isHover || isMatch) ? 'bold ' + ctx.font : ctx.font
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        
        // Draw text background on hover or search match
        if (isHover || isMatch) {
          const txt = node.label.replace('_', ' ')
          const metrics = ctx.measureText(txt)
          ctx.fillStyle = 'rgba(15, 15, 18, 0.95)'
          ctx.fillRect(node.x - metrics.width/2 - 4, node.y + rad + 2, metrics.width + 8, 14)
          ctx.strokeStyle = isMatch ? 'rgba(245, 158, 11, 0.3)' : 'rgba(167, 139, 250, 0.3)'
          ctx.lineWidth = 1
          ctx.strokeRect(node.x - metrics.width/2 - 4, node.y + rad + 2, metrics.width + 8, 14)
          ctx.fillStyle = '#ffffff'
        }

        ctx.fillText(node.label.replace('_', ' '), node.x, node.y + rad + 4)
      })
      
      ctx.globalAlpha = 1.0 // reset

      animationFrameRef.current = requestAnimationFrame(runPhysicsAndRender)
    }

    runPhysicsAndRender()

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [edges, hoveredNode, searchQuery])

  // Mouse Interaction handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    mouseRef.current.x = x
    mouseRef.current.y = y

    // Dragging active node
    if (mouseRef.current.isDown && mouseRef.current.activeNode) {
      mouseRef.current.activeNode.x = x
      mouseRef.current.activeNode.y = y
      return
    }

    // Check hovered node
    let foundHover: Node | null = null
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const dist = Math.hypot(node.x - x, node.y - y)
      if (dist < node.radius + 8) {
        foundHover = node
        break
      }
    }
    setHoveredNode(foundHover)
  }

  const handleMouseDown = () => {
    mouseRef.current.isDown = true
    if (hoveredNode) {
      mouseRef.current.activeNode = hoveredNode
    }
  }

  const handleMouseUp = () => {
    mouseRef.current.isDown = false
    mouseRef.current.activeNode = null
  }

  const handleMouseLeave = () => {
    mouseRef.current.isDown = false
    mouseRef.current.activeNode = null
    setHoveredNode(null)
  }

  return (
    <div className="canvas-graph-container" style={{ width: '100%', height: '360px', position: 'relative', background: '#030305', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <div className="graph-instructions" style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '8px', color: 'var(--text-dim)', pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
        🖱️ Drag nodes to organize • Hover to highlight semantic relationships
      </div>
    </div>
  )
}
