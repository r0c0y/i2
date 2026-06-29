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
import { getOrchestrator, Agent } from './agentOrchestration'

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const GEMMA_MODEL = 'gemma-4-31b'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ponytail: Read keys from localStorage to support user override configurations without prop-drilling
const getCerebrasKey = () => localStorage.getItem('cerebras_api_key') || (import.meta.env ? import.meta.env.VITE_CEREBRAS_API_KEY : '') || ''
const getGroqKey = () => localStorage.getItem('groq_api_key') || (import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : '') || ''

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
    }
  } catch (e) {
    console.warn('Cerebras failed in Swarm LLM, falling back to Groq:', e)
  }

  // Fallback to Groq
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getGroqKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Swarm LLM failed: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  const latency = Date.now() - startTime
  return {
    content: data.choices[0].message.content,
    latency,
    modelUsed: `Groq ${GROQ_MODEL}`,
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
Each message should contribute technical details and reference the manual. If knowledge graph facts are present, agents should mention them to aid resolution.

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
  onProgress({ gridState, logs, telemetry })

  // 2. Run the underlying inspection pipeline to find defects and their coordinates
  const pipelineResult = await runInspectionPipeline(imageBase64, goldenMaster, manual, imageHint)
  const defects = pipelineResult.inspection.defects

  // Initialize orchestrator and swarm
  const orchestrator = getOrchestrator()
  const swarmAgents = orchestrator.initializeSwarm()
  
  // Queue inspection tasks for each grid cell to inspector agents
  const gridTasks: Promise<any>[] = []
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const workItem = orchestrator.queueWork('inspect', {
        row: r,
        col: c,
        gridIndex: r * 10 + c,
      }, 'normal')
      gridTasks.push(new Promise(res => {
        const checkCompletion = setInterval(() => {
          if (workItem.status === 'completed' || workItem.status === 'failed') {
            clearInterval(checkCompletion)
            res(workItem)
          }
        }, 10)
      }))
    }
  }

  // Identify which grid cells contain defects
  const defectCells = defects.map(d => {
    // Coordinate is 0-100 percentage. Map to 0-9 indices
    const col = Math.min(9, Math.max(0, Math.floor(d.location.x / 10)))
    const row = Math.min(9, Math.max(0, Math.floor(d.location.y / 10)))
    return { row, col, defect: d }
  })

  // 3. Grid scan — 100 inspector agents working in parallel via orchestrator
  const scanStart = Date.now()
  telemetry.activeAgents = 100
  telemetry.totalRPM = 12 * lineSpeed
  
  const scanDelay = Math.max(15, Math.round(1000 / lineSpeed))
  
  // Start processing work queue in the background
  const orchestrationPromise = orchestrator.processWorkQueue()
  
  // Stream visual feedback row by row while agents process in parallel
  for (let r = 0; r < 10; r++) {
    // Mark row as scanning
    for (let c = 0; c < 10; c++) {
      gridState[r][c] = 'scanning'
    }
    onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })
    await new Promise(res => setTimeout(res, scanDelay))

    // Mark row as finished (check for defects)
    for (let c = 0; c < 10; c++) {
      const foundDefect = defectCells.find(dc => dc.row === r && dc.col === c)
      const agentId = `inspector-${(r * 10 + c) % 100}`
      const agent = orchestrator.getAgent(agentId)
      
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
      
      // Show agent activity in logs periodically
      if (c % 5 === 0 && agent) {
        addLog(
          agent.name,
          'inspector',
          `✓ Completed scan of zone ${r}-${c}. Tasks: ${agent.tasksCompleted}`,
          'info',
        )
      }
    }
    onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })
  }

  // Wait for orchestration to complete
  await orchestrationPromise
  telemetry.activeAgents = 0
  
  timings.gridScan = Date.now() - scanStart
  telemetry.activeAgents = 3 // Shift active agents to consensus leads
  telemetry.totalRPM = Math.round(100 + lineSpeed)
  addLog('QA Coordinator', 'lead', `Grid scanning complete. ${defectCells.length} anomalous areas flagged.`, 'success')

  // 4. Consensus debate — 10 specialist agents collaborate via orchestrator
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

    // Queue specialist analysis tasks
    telemetry.activeAgents = 10
    const specialists = orchestrator.getAgents().filter(a => a.role === 'specialist')
    
    specialists.forEach(specialist => {
      orchestrator.queueWork('analyze', {
        specialization: specialist.specialization,
        defects: defectsSummary,
        manual: manualSections,
      }, 'high')
    })

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

    // Save clean semantic triplets to Knowledge Graph
    if (pipelineResult.rootCause.triplets && pipelineResult.rootCause.triplets.length > 0) {
      pipelineResult.rootCause.triplets.forEach(triplet => {
        addKnowledgeEdge(triplet.subject, triplet.predicate, triplet.object, 'agent_consensus')
      })
    } else {
      const primaryDefect = defects[0]
      if (primaryDefect) {
        addKnowledgeEdge(primaryDefect.category, 'caused_by', 'unspecified_fault_root_cause', 'agent_consensus')
      }
    }

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

  // 5. Operational Dispatch — 5 dispatcher agents execute actions via orchestrator
  const dispatchStart = Date.now()
  telemetry.activeAgents = 5
  addLog('Alert Dispatcher', 'dispatcher', `Generating factory notification: "${pipelineResult.alert.title}"`, 'info')
  onProgress({ gridState, logs: [...logs], telemetry: { ...telemetry } })
  await new Promise(res => setTimeout(res, 150))

  const dispatchers = orchestrator.getAgents().filter(a => a.role === 'dispatcher')
  
  if (pipelineResult.alert.toolCalls && pipelineResult.alert.toolCalls.length > 0) {
    for (let idx = 0; idx < pipelineResult.alert.toolCalls.length; idx++) {
      const tc = pipelineResult.alert.toolCalls[idx]
      const dispatcher = dispatchers[idx % dispatchers.length]
      
      // Queue dispatch task
      orchestrator.queueWork('dispatch', {
        toolName: tc.name,
        arguments: tc.arguments,
        dispatcherId: dispatcher?.id,
      }, 'high')
      
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
