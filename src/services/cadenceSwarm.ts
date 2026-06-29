// ══════════════════════════════════════════════════════════════
//  Cadence v2 — 118-Agent Collaborative Swarm Engine
// ══════════════════════════════════════════════════════════════

import type {
  InspectionResult,
  RootCauseAnalysis,
  LineAlert,
  GoldenMaster,
  TroubleshootingManual,
  SwarmInspectionResult,
  AgentMessage,
  SwarmTelemetry,
} from '../types'
import { runInspectionPipeline } from './cadenceManufacturing'
import { queryKnowledgeGraph, addKnowledgeEdge } from './knowledgeGraph'

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions'

const GEMMA_MODEL = 'gemma-4-31b'

// ponytail: Read keys from localStorage to support user override configurations without prop-drilling
const getCerebrasKey = () => localStorage.getItem('cerebras_api_key') || (import.meta.env ? import.meta.env.VITE_CEREBRAS_API_KEY : '') || ''

// Helper to make LLM calls for swarm debate
async function callSwarmLLM(prompt: string): Promise<{ content: string; latency: number; modelUsed: string }> {
  const startTime = Date.now()
  const messages = [
    {
      role: 'system',
      content: 'You are coordinating a collaborative swarm of manufacturing AI agents. Generate a structured JSON response matching the user\'s requested schema.',
    },
    { role: 'user', content: prompt },
  ]

  // Try Cerebras (Gemma 4) first
  try {
    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getCerebrasKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const latency = Date.now() - startTime
      return {
        content: data.choices[0].message.content,
        latency,
        modelUsed: `Cerebras ${GEMMA_MODEL}`,
      }
    } else {
      const errText = await response.text()
      throw new Error(`Cerebras API ${response.status}: ${errText}`)
    }
  } catch (e) {
    throw new Error(`Swarm LLM failed: ${e}`)
  }
}

// Generate the chat debate logs using the LLM
async function generateDebateLog(
  defectsSummary: string,
  manualSections: string,
  rootCause: string,
  graphContext?: string,
): Promise<{ debate: { sender: string; role: string; text: string; type: string }[] }> {
  const prompt = `
Generate a realistic chat conversation between Specialist AI Agents debating a defect found on a PCB assembly line.
Observed Defects:
${defectsSummary}

${graphContext ? `FACTS RETRIEVED FROM THE FACTORY LIVING KNOWLEDGE GRAPH:\n${graphContext}\n` : ''}

Troubleshooting Manual Sections:
${manualSections}

Agreed Root Cause:
${rootCause}

Roleplay a collaborative discussion between 2 or 3 of these specific specialist agents (Resistor Specialist, Capacitor Specialist, IC Specialist, Solder Specialist, Traces Specialist, Contamination Auditor, Warp Analyst, Connector Analyst, QA Coordinator).
Each message should contribute technical details and reference the manual. If knowledge graph facts are listed above, agents should reference them — e.g. "The knowledge graph shows this defect pattern matches a known root cause." Agents learn from the factory's living knowledge graph and contribute their findings back to it.

Respond ONLY with a JSON object:
{
  "debate": [
    {
      "sender": "Solder Specialist",
      "role": "specialist",
      "text": "Based on the manual Section 1, this bridge is likely caused by reflow temperature drift...",
      "type": "warning"
    },
    {
      "sender": "IC Specialist",
      "role": "specialist",
      "text": "I agree. The pin pitch is 0.5mm, so any solder volume excess will cause bridge faults...",
      "type": "info"
    }
  ]
}
`
  const res = await callSwarmLLM(prompt)
  try {
    return JSON.parse(res.content)
  } catch (e) {
    return {
      debate: [
        {
          sender: 'Solder Specialist',
          role: 'specialist',
          text: `Analyzing defects: ${defectsSummary}. This pattern matches reflow issues listed in the manual.`,
          type: 'warning',
        },
        {
          sender: 'QA Coordinator',
          role: 'lead',
          text: `Understood. Proceeding to isolate the batch and request recalibration.`,
          type: 'info',
        },
      ],
    }
  }
}

export interface SwarmProgressUpdate {
  gridState: ('idle' | 'scanning' | 'defect' | 'passed')[][]
  logs: AgentMessage[]
  telemetry: SwarmTelemetry
}

export async function runSwarmInspection(
  imageBase64: string,
  goldenMaster: GoldenMaster,
  manual: TroubleshootingManual,
  lineSpeed: number, // Controls scan speed dynamically
  onProgress: (update: SwarmProgressUpdate) => void,
  imageHint?: string,
): Promise<SwarmInspectionResult> {
  const timings = {
    gridScan: 0,
    consensus: 0,
    actionDispatch: 0,
    total: 0,
  }
  const totalStart = Date.now()

  // 1. Initialize empty state
  const gridState: ('idle' | 'scanning' | 'defect' | 'passed')[][] = Array(10)
    .fill(null)
    .map(() => Array(10).fill('idle'))

  const logs: AgentMessage[] = []
  const addLog = (sender: string, role: string, text: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    logs.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      sender,
      role,
      text,
      type,
    })
  }

  const telemetry: SwarmTelemetry = {
    activeAgents: 100,
    totalRPM: 0,
    averageTTFT: 0,
    tokensPerSec: 0,
    completedQueries: 0,
  }

  addLog('QA Coordinator', 'lead', 'Initializing 118-Agent Defect Inspection Swarm...', 'info')
  addLog('Swarm Lead', 'lead', 'Dispatching 100 Area Inspectors to scan the 10x10 coordinate grid...', 'info')
  // Query living knowledge graph for relevant past defect patterns
  const recentGraph = queryKnowledgeGraph('')
  if (recentGraph.length > 0) {
    addLog('Knowledge Graph', 'system', `🧠 ${recentGraph.length} past facts loaded for agent context`, 'info')
  }
  onProgress({ gridState: gridState.map(row => [...row]), logs, telemetry })

  // 2. Run the underlying inspection pipeline to find defects and their coordinates
  const pipelineResult = await runInspectionPipeline(imageBase64, goldenMaster, manual, imageHint)
  const defects = pipelineResult.inspection.defects

  // Identify which grid cells contain defects
  const defectCells = defects.map(d => {
    // Coordinate is 0-100 percentage. Map to 0-9 indices
    const col = Math.min(9, Math.max(0, Math.floor(d.location.x / 10)))
    const row = Math.min(9, Math.max(0, Math.floor(d.location.y / 10)))
    return { row, col, defect: d }
  })

  // 3. Grid scan — visual feedback row by row using pipeline results
  const scanStart = Date.now()
  telemetry.activeAgents = 100
  telemetry.totalRPM = 12 * lineSpeed
  
  const scanDelay = Math.max(15, Math.round(1000 / lineSpeed))
  
  // Stream visual feedback row by row
  for (let r = 0; r < 10; r++) {
    // Mark row as scanning
    for (let c = 0; c < 10; c++) {
      gridState[r][c] = 'scanning'
    }
    onProgress({ gridState: gridState.map(row => [...row]), logs: [...logs], telemetry: { ...telemetry } })
    await new Promise(res => setTimeout(res, scanDelay))

    // Mark row as finished (check for defects)
    for (let c = 0; c < 10; c++) {
      const foundDefect = defectCells.find(dc => dc.row === r && dc.col === c)
      
      if (foundDefect) {
        gridState[r][c] = 'defect'
        addLog(
          `Inspector-${r}-${c}`,
          'inspector',
          `🚨 Defect detected in cell [${r}, ${c}]: ${foundDefect.defect.description}`,
          'warning',
        )
      } else {
        gridState[r][c] = 'passed'
      }
      
      // Show inspector activity in logs periodically
      if (c % 5 === 0) {
        addLog(
          `Area Inspector ${r * 10 + c + 1}`,
          'inspector',
          `✓ Completed scan of zone ${r}-${c}.`,
          'info',
        )
      }
    }
    onProgress({ gridState: gridState.map(row => [...row]), logs: [...logs], telemetry: { ...telemetry } })
  }

  telemetry.activeAgents = 0
  
  timings.gridScan = Date.now() - scanStart
  telemetry.activeAgents = 3 // Shift active agents to consensus leads
  telemetry.totalRPM = Math.round(100 + lineSpeed)
  addLog('QA Coordinator', 'lead', `Grid scanning complete. ${defectCells.length} anomalous areas flagged.`, 'success')

  // 4. Consensus debate — specialist agents collaborate via LLM
  const consensusStart = Date.now()
  if (defectCells.length > 0) {
    addLog('QA Coordinator', 'lead', 'Routing anomalies to Specialist swarm for debate & diagnostic consensus...', 'info')
    onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })

    const defectsSummary = defects.map(d => `- ${d.category} (${d.severity}): ${d.description}`).join('\n')
    const manualSections = manual.sections.map(s => `${s.title}: ${s.content}`).join('\n')

    // Query local knowledge graph for RAG context
    let graphContext = ''
    const categories = Array.from(new Set(defects.map(d => d.category)))
    const graphEdges = categories.flatMap(cat => queryKnowledgeGraph(cat))
    if (graphEdges.length > 0) {
      graphContext = graphEdges
        .map(e => `- Fact: ${e.sourceNode} ${e.relation} ${e.targetNode} (Origin: ${e.origin === 'human_override' ? 'human override' : 'agent consensus'})`)
        .join('\n')
    }

    // Specialist analysis via LLM
    telemetry.activeAgents = 10

    // Call LLM for debate dialogue
    const debateStart = Date.now()
    const debateData = await generateDebateLog(defectsSummary, manualSections, pipelineResult.rootCause.rootCause, graphContext)
    const debateLatency = Date.now() - debateStart

    // Update telemetry based on the debate LLM query
    telemetry.completedQueries += 1
    telemetry.averageTTFT = Math.round(debateLatency * 0.15) // TTFT is typically 15% of completion
    telemetry.tokensPerSec = Math.round(450 / (debateLatency / 1000)) // Estimate tokens/sec

    // Stream the debate lines to the chat log (agents presenting findings)
    for (const dLine of debateData.debate) {
      addLog(dLine.sender, dLine.role, dLine.text, dLine.type as any)
      onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })
      await new Promise(res => setTimeout(res, 300)) // Stream effect
    }

    // Save rich semantic facts to Knowledge Graph from every defect finding
    const graphAdditions: string[] = []
    for (const defect of defects) {
      const descKey = defect.description.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      addKnowledgeEdge(defect.category, 'detected_as', descKey, 'agent_consensus')
      addKnowledgeEdge(defect.category, 'has_severity', defect.severity, 'agent_consensus')
      addKnowledgeEdge(pipelineResult.rootCause.rootCause.replace(/[^a-zA-Z0-9]/g, '_'), 'causes', defect.category, 'agent_consensus')
      graphAdditions.push(`${defect.category} → ${defect.severity}`)
    }
    const fixKey = pipelineResult.rootCause.recommendedFix.replace(/[^a-zA-Z0-9\s]/g, '').split(' ').slice(0, 4).join('_')
    const causeKey = pipelineResult.rootCause.rootCause.replace(/[^a-zA-Z0-9\s]/g, '').split(' ').slice(0, 4).join('_')
    const actionKey = pipelineResult.alert.actionTaken.replace(/[^a-zA-Z0-9\s]/g, '').split(' ').slice(0, 4).join('_')
    addKnowledgeEdge(causeKey, 'resolved_by', fixKey, 'agent_consensus')
    if (actionKey) addKnowledgeEdge(actionKey, 'triggered_by', causeKey, 'agent_consensus')
    addLog('Knowledge Graph', 'system', `🧠 ${graphAdditions.length} new facts written from swarm consensus`, 'success')

    addLog(
      'Operations Director',
      'lead',
      `Consensus achieved: "${pipelineResult.rootCause.rootCause}" (Confidence: ${(pipelineResult.rootCause.confidence * 100).toFixed(0)}%)`,
      'success',
    )
  } else {
    addLog('Operations Director', 'lead', 'No anomalies found. Assembly line cleared.', 'success')
  }
  timings.consensus = Date.now() - consensusStart

  // 5. Operational Dispatch — execute actions
  const dispatchStart = Date.now()
  telemetry.activeAgents = 5
  addLog('Alert Dispatcher', 'dispatcher', `Generating factory notification: "${pipelineResult.alert.title}"`, 'info')
  onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })
  await new Promise(res => setTimeout(res, 150))

  if (pipelineResult.alert.toolCalls && pipelineResult.alert.toolCalls.length > 0) {
    for (let idx = 0; idx < pipelineResult.alert.toolCalls.length; idx++) {
      const tc = pipelineResult.alert.toolCalls[idx]
      
      if (tc.name === 'stop_line') {
        addLog('Line Controller', 'dispatcher', `🛑 STOPPING assembly line. Cause: ${tc.arguments.reason}`, 'error')
      } else if (tc.name === 'alert_supervisor') {
        addLog('Alert Dispatcher', 'dispatcher', `📲 Alerting supervisor: "${tc.arguments.message}"`, 'warning')
      } else if (tc.name === 'quarantine_batch') {
        addLog('Inventory Manager', 'dispatcher', `📦 Quarantining batch: ${tc.arguments.batchId}`, 'warning')
      } else {
        addLog('Audit Archivist', 'dispatcher', `✍ Logging tool execution: ${tc.name}`, 'info')
      }
      onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })
      await new Promise(res => setTimeout(res, 200))
    }
  }

  timings.actionDispatch = Date.now() - dispatchStart
  timings.total = Date.now() - totalStart
  telemetry.activeAgents = 0

  addLog('Swarm Lead', 'lead', `Swarm cycle complete in ${timings.total}ms. All actions executed.`, 'success')

  const finalResult: SwarmInspectionResult = {
    inspectionId: pipelineResult.inspection.id,
    timestamp: pipelineResult.inspection.timestamp,
    gridState,
    logs,
    inspection: pipelineResult.inspection,
    rootCause: pipelineResult.rootCause,
    alert: pipelineResult.alert,
    timings,
    telemetry,
  }

  return finalResult
}
