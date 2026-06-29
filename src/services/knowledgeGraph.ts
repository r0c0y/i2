import type { GraphEdge } from '../types'

const GRAPH_STORAGE_KEY = 'cadence_knowledge_graph'

const DEFAULT_SEEDS: GraphEdge[] = [
  { id: 'seed-1', sourceNode: 'solder_bridge', relation: 'caused_by', targetNode: 'Reflow Temperature Drift', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-2', sourceNode: 'solder_bridge', relation: 'resolved_by', targetNode: 'Stencil Wipe & Printer Calibration', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-3', sourceNode: 'cold_joint', relation: 'caused_by', targetNode: 'Insufficient Reflow Heating', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-4', sourceNode: 'cold_joint', relation: 'resolved_by', targetNode: 'Reheat with Profile Calibration', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-5', sourceNode: 'missing_component', relation: 'caused_by', targetNode: 'Pick-and-Place Nozzle Clog', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-6', sourceNode: 'missing_component', relation: 'resolved_by', targetNode: 'Nozzle Clean & Feeder Calibrate', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-7', sourceNode: 'misalignment', relation: 'caused_by', targetNode: 'P&P Vision System Drift', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-8', sourceNode: 'misalignment', relation: 'resolved_by', targetNode: 'Vision System Calibration', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-9', sourceNode: 'polarity', relation: 'caused_by', targetNode: 'Feeder Reel Loaded Backwards', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-10', sourceNode: 'polarity', relation: 'resolved_by', targetNode: 'Feeder Reload & Reel Visual Audit', timestamp: Date.now(), origin: 'human_override' },
]

export function getKnowledgeGraph(): GraphEdge[] {
  const data = localStorage.getItem(GRAPH_STORAGE_KEY)
  if (!data) {
    localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(DEFAULT_SEEDS))
    return DEFAULT_SEEDS
  }
  try {
    return JSON.parse(data)
  } catch (e) {
    return DEFAULT_SEEDS
  }
}

export function addKnowledgeEdge(
  source: string,
  relation: string,
  target: string,
  origin: 'agent_consensus' | 'human_override'
): GraphEdge {
  const graph = getKnowledgeGraph()
  
  // Prevent exact duplicates
  const existing = graph.find(
    e => e.sourceNode.toLowerCase() === source.toLowerCase() &&
         e.relation.toLowerCase() === relation.toLowerCase() &&
         e.targetNode.toLowerCase() === target.toLowerCase()
  )
  if (existing) return existing

  const newEdge: GraphEdge = {
    id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sourceNode: source,
    relation,
    targetNode: target,
    timestamp: Date.now(),
    origin,
  }

  graph.push(newEdge)
  localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph))
  return newEdge
}

export function queryKnowledgeGraph(term: string): GraphEdge[] {
  const graph = getKnowledgeGraph()
  const lowerTerm = term.toLowerCase()
  return graph.filter(
    e => e.sourceNode.toLowerCase().includes(lowerTerm) ||
         e.targetNode.toLowerCase().includes(lowerTerm) ||
         e.relation.toLowerCase().includes(lowerTerm)
  )
}

export function clearKnowledgeGraph(): void {
  localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(DEFAULT_SEEDS))
}
