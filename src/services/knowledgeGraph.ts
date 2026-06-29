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
  { id: 'seed-11', sourceNode: 'open_circuit', relation: 'caused_by', targetNode: 'Via Fracture from Thermal Stress', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-12', sourceNode: 'open_circuit', relation: 'resolved_by', targetNode: 'Via Repair & Reflow Cycle', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-13', sourceNode: 'op_amp_oscillation', relation: 'caused_by', targetNode: 'Insufficient Phase Margin', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-14', sourceNode: 'op_amp_oscillation', relation: 'resolved_by', targetNode: 'Add Compensation Capacitor', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-15', sourceNode: 'ground_bounce', relation: 'caused_by', targetNode: 'Excessive di/dt in Return Path', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-16', sourceNode: 'ground_bounce', relation: 'resolved_by', targetNode: 'Reduce Inductance & Add Decoupling', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-17', sourceNode: 'decoupling_missing', relation: 'caused_by', targetNode: 'BOM Omission / Value Skipped', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-18', sourceNode: 'decoupling_missing', relation: 'resolved_by', targetNode: 'Add MLCC per IC per Power Pin', timestamp: Date.now(), origin: 'agent_consensus' },
  { id: 'seed-19', sourceNode: 'solder_bridge', relation: 'related_to', targetNode: 'open_circuit', timestamp: Date.now(), origin: 'human_override' },
  { id: 'seed-20', sourceNode: 'cold_joint', relation: 'related_to', targetNode: 'intermittent_failure', timestamp: Date.now(), origin: 'human_override' },
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
  try { localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph)) } catch (e) { /* quota exceeded */ }
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
