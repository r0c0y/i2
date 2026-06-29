// ══════════════════════════════════════════════════════════════
//  Cadence — Real-Time Generative Assembly Line
//  Types for manufacturing defect detection + circuit analysis
// ══════════════════════════════════════════════════════════════

// ── Circuit Analysis (existing) ──

export interface Component {
  ref: string
  type: 'R' | 'C' | 'L' | 'D' | 'Q' | 'U' | 'V' | 'I' | 'SW' | 'LED' | 'OTHER'
  value: string
  nodes: string[]
}

export interface Net {
  name: string
  nodes: string[]
  connections: { component: string; pin: number }[]
}

export interface Netlist {
  components: Component[]
  nets: Net[]
  groundNode: string
  vccNode?: string
}

export interface WaveformMeasurement {
  frequency: number
  period: number
  vHigh: number
  vLow: number
  vPp: number
  dutyCycle: number
  riseTime: number
  fallTime: number
  rawPoints?: { time: number; voltage: number }[]
  channels?: WaveformChannel[]
}

export interface WaveformChannel {
  name: string
  rawPoints: { time: number; voltage: number }[]
  vHigh: number
  vLow: number
  vPp: number
  frequency: number
  dutyCycle: number
}

export interface WaveformAnalysis {
  measurements: WaveformMeasurement
  type: 'square' | 'sine' | 'triangle' | 'sawtooth' | 'pulse' | 'unknown'
  description: string
}

export interface CircuitAnalysis {
  netlist: Netlist
  predictedBehavior: string
  predictedWaveform?: WaveformAnalysis
  issues: string[]
  confidence: number
}

export interface VerificationResult {
  match: boolean
  score: number
  differences: string[]
  recommendations: string[]
  diagnosedFaults?: { component: string; probability: number; description: string }[]
  crossRunTip?: string
}

export type AnalysisStep =
  | 'upload'
  | 'extracting'
  | 'extracted'
  | 'analyzing'
  | 'analyzed'
  | 'verifying'
  | 'verified'

export interface DemoCircuit {
  id: string
  name: string
  description: string
  icon: string
  netlist: Netlist
  matchingWaveform: WaveformAnalysis
  mismatchedWaveform: WaveformAnalysis
}

export interface BringUpStep {
  id: string
  title: string
  instruction: string
  probePoints?: string[]
  expectedValues?: string[]
  warning?: string
  passCondition: string
}

export interface NetContext {
  component: Component
  connectedNets: Net[]
  expectedVoltages: { net: string; expected: string; range: string }[]
  failureModes: string[]
  probeSuggestions: string[]
}

// ══════════════════════════════════════════════════════════════
//  Cadence Manufacturing Types
// ══════════════════════════════════════════════════════════════

export type DefectSeverity = 'critical' | 'major' | 'minor' | 'cosmetic'
export type DefectCategory = 'missing_component' | 'solder_bridge' | 'cold_joint' | 'misalignment' | 'scratch' | 'crack' | 'warped' | 'wrong_value' | 'polarity' | 'contamination' | 'none'
export type LineStatus = 'running' | 'warning' | 'stopped'

export interface DefectFinding {
  id: string
  category: DefectCategory
  severity: DefectSeverity
  description: string
  location: { x: number; y: number; width: number; height: number }
  confidence: number
  quadrant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'full'
}

export interface InspectionResult {
  id: string
  timestamp: number
  imageUrl: string
  defects: DefectFinding[]
  overallScore: number  // 0-100, 100 = perfect
  quadrantResults: QuadrantResult[]
  processingTimeMs: number
}

export interface QuadrantResult {
  quadrant: string
  score: number
  defects: DefectFinding[]
  inspector: string
}

export interface RootCauseAnalysis {
  inspectionId: string
  rootCause: string
  evidence: string[]
  affectedComponents: string[]
  recommendedFix: string
  estimatedDowntime: string
  preventRecurrence: string
  confidence: number
  triplets?: { subject: string; predicate: string; object: string }[]
}

export interface LineAlert {
  id: string
  inspectionId: string
  timestamp: number
  severity: DefectSeverity
  title: string
  message: string
  rootCause?: RootCauseAnalysis
  actionTaken: string
  lineStatus: LineStatus
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  arguments: Record<string, any>
  result?: string
}

export interface AssemblyLine {
  id: string
  name: string
  status: LineStatus
  totalInspections: number
  defectsFound: number
  alerts: LineAlert[]
  goldenMasterUrl?: string
}

export interface GoldenMaster {
  id: string
  name: string
  imageUrl: string
  description: string
  referenceComponents: { ref: string; position: { x: number; y: number }; expected: string }[]
}

export interface TroubleshootingManual {
  id: string
  name: string
  content: string
  sections: { title: string; content: string }[]
}

// ── Swarm v2 Telemetry & State Types ──

export interface SwarmAgent {
  id: string
  name: string
  role: 'inspector' | 'lead' | 'specialist' | 'dispatcher'
  status: 'idle' | 'scanning' | 'defect' | 'passed'
  currentTask?: string
}

export interface AgentMessage {
  id: string
  timestamp: number
  sender: string
  role: string
  text: string
  type: 'info' | 'warning' | 'error' | 'success'
}

export interface SwarmTelemetry {
  activeAgents: number
  totalRPM: number
  averageTTFT: number
  tokensPerSec: number
  completedQueries: number
}

export interface SwarmInspectionResult {
  inspectionId: string
  timestamp: number
  gridState: ('idle' | 'scanning' | 'defect' | 'passed')[][] // 10x10 grid
  logs: AgentMessage[]
  inspection: InspectionResult
  rootCause: RootCauseAnalysis
  alert: LineAlert
  timings: {
    gridScan: number
    consensus: number
    actionDispatch: number
    total: number
  }
  telemetry: SwarmTelemetry
}

export interface GraphEdge {
  id: string
  sourceNode: string
  relation: string
  targetNode: string
  timestamp: number
  origin: 'agent_consensus' | 'human_override'
}


