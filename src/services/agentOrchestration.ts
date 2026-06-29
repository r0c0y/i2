import type { AgentMessage, SwarmTelemetry } from '../types'

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions'
const GEMMA_MODEL = 'gemma-4-31b'
const getCerebrasKey = () => localStorage.getItem('cerebras_api_key') || (import.meta.env ? import.meta.env.VITE_CEREBRAS_API_KEY : '') || ''

export interface Agent {
  id: string
  name: string
  role: 'inspector' | 'specialist' | 'dispatcher' | 'lead'
  specialization?: string
  status: 'idle' | 'busy' | 'thinking' | 'waiting'
  tasksCompleted: number
  latency: number[]
}

export interface WorkItem {
  id: string
  type: 'inspect' | 'analyze' | 'debate' | 'dispatch'
  priority: 'high' | 'normal' | 'low'
  data: any
  assignedAgent?: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: any
  createdAt: number
  startedAt?: number
  completedAt?: number
}

export interface AgentPool {
  agents: Map<string, Agent>
  workQueue: WorkItem[]
  completedWork: WorkItem[]
  telemetry: SwarmTelemetry
}

export class AgentOrchestrator {
  private pool: AgentPool
  private abortControllers: Map<string, AbortController> = new Map()

  constructor() {
    this.pool = {
      agents: new Map(),
      workQueue: [],
      completedWork: [],
      telemetry: {
        activeAgents: 0,
        totalRPM: 0,
        averageTTFT: 0,
        tokensPerSec: 0,
        completedQueries: 0,
      },
    }
  }

  initializeSwarm(): Agent[] {
    const agents: Agent[] = []

    for (let i = 0; i < 100; i++) {
      const agent: Agent = {
        id: `inspector-${i}`,
        name: `Area Inspector ${i + 1}`,
        role: 'inspector',
        specialization: `Grid Zone ${Math.floor(i / 10)}-${i % 10}`,
        status: 'idle',
        tasksCompleted: 0,
        latency: [],
      }
      this.pool.agents.set(agent.id, agent)
      agents.push(agent)
    }

    const specializations = [
      'Solder Specialist',
      'IC Specialist',
      'Capacitor Specialist',
      'Resistor Specialist',
      'Traces Specialist',
      'Contamination Auditor',
      'Warp Analyst',
      'Connector Analyst',
      'QA Coordinator',
      'Process Engineer',
    ]
    for (let i = 0; i < 10; i++) {
      const agent: Agent = {
        id: `specialist-${i}`,
        name: specializations[i] || `Specialist ${i + 1}`,
        role: 'specialist',
        specialization: specializations[i],
        status: 'idle',
        tasksCompleted: 0,
        latency: [],
      }
      this.pool.agents.set(agent.id, agent)
      agents.push(agent)
    }

    const dispatchRoles = ['Line Controller', 'Alert Dispatcher', 'Inventory Manager', 'Audit Archivist', 'Safety Monitor']
    for (let i = 0; i < 5; i++) {
      const agent: Agent = {
        id: `dispatcher-${i}`,
        name: dispatchRoles[i] || `Dispatcher ${i + 1}`,
        role: 'dispatcher',
        specialization: dispatchRoles[i],
        status: 'idle',
        tasksCompleted: 0,
        latency: [],
      }
      this.pool.agents.set(agent.id, agent)
      agents.push(agent)
    }

    const leadRoles = ['QA Coordinator', 'Operations Director', 'Swarm Lead']
    for (let i = 0; i < 3; i++) {
      const agent: Agent = {
        id: `lead-${i}`,
        name: leadRoles[i] || `Lead ${i + 1}`,
        role: 'lead',
        specialization: leadRoles[i],
        status: 'idle',
        tasksCompleted: 0,
        latency: [],
      }
      this.pool.agents.set(agent.id, agent)
      agents.push(agent)
    }

    return agents
  }

  getIdleAgents(role?: string, specialization?: string): Agent[] {
    return Array.from(this.pool.agents.values()).filter(agent => {
      if (agent.status !== 'idle') return false
      if (role && agent.role !== role) return false
      if (specialization && agent.specialization !== specialization) return false
      return true
    })
  }

  queueWork(type: WorkItem['type'], data: any, priority: 'high' | 'normal' | 'low' = 'normal'): WorkItem {
    const work: WorkItem = {
      id: `work-${Date.now()}-${Math.random()}`,
      type,
      priority,
      data,
      status: 'pending',
      createdAt: Date.now(),
    }
    this.pool.workQueue.push(work)
    return work
  }

  async processWorkQueue(): Promise<void> {
    const workTasks: Promise<void>[] = []

    while (this.pool.workQueue.length > 0) {
      const work = this.pool.workQueue[0]

      let agent: Agent | undefined

      if (work.type === 'inspect') {
        agent = this.getIdleAgents('inspector')[0]
      } else if (work.type === 'analyze') {
        agent = this.getIdleAgents('specialist')[0]
      } else if (work.type === 'dispatch') {
        agent = this.getIdleAgents('dispatcher')[0]
      } else if (work.type === 'debate') {
        agent = this.getIdleAgents('specialist')[0]
      }

      if (!agent) {
        await new Promise(res => setTimeout(res, 50))
        continue
      }

      work.assignedAgent = agent.id
      work.status = 'executing'
      work.startedAt = Date.now()

      this.pool.workQueue.shift()
      agent.status = 'busy'

      const workTask = this.executeWork(work, agent)
      workTasks.push(workTask)

      this.pool.telemetry.activeAgents = Array.from(this.pool.agents.values()).filter(a => a.status !== 'idle').length
    }

    if (workTasks.length > 0) {
      await Promise.all(workTasks)
    }
  }

  private async executeWork(work: WorkItem, agent: Agent): Promise<void> {
    const startTime = Date.now()

    try {
      const abortController = new AbortController()
      this.abortControllers.set(work.id, abortController)

      agent.status = 'thinking'

      const result = await this.callAgentLLM(work, agent, abortController.signal)

      work.result = {
        success: true,
        data: result,
        processedAt: Date.now(),
      }

      work.status = 'completed'
      work.completedAt = Date.now()

      const latency = Date.now() - startTime
      agent.latency.push(latency)
      agent.tasksCompleted++

      if (agent.latency.length > 100) {
        agent.latency.shift()
      }

      this.pool.telemetry.completedQueries++
      this.pool.telemetry.averageTTFT = Math.round(
        agent.latency.reduce((a, b) => a + b, 0) / agent.latency.length * 0.15,
      )

      this.pool.completedWork.push(work)
      agent.status = 'idle'

      this.abortControllers.delete(work.id)
    } catch (error) {
      work.status = 'failed'
      work.completedAt = Date.now()
      agent.status = 'idle'
      console.error(`Agent ${agent.id} failed on work ${work.id}:`, error)
    }
  }

  private async callAgentLLM(work: WorkItem, agent: Agent, signal?: AbortSignal): Promise<string> {
    const systemPrompt = `You are ${agent.name}, a ${agent.role} agent in a PCB manufacturing inspection swarm. Your specialization is ${agent.specialization || 'general inspection'}. Respond concisely with your findings in JSON format.`

    let userPrompt = ''
    switch (work.type) {
      case 'inspect':
        userPrompt = `Inspect grid zone ${agent.specialization}. ${work.data.imageHint ? `PCB context: ${work.data.imageHint}.` : ''} Report any solder defects, component misalignment, trace damage, or contamination in your zone. Respond: {"zone":"${agent.specialization}","status":"pass|fail","findings":[{"type":"defect_type","severity":"low|medium|high","description":"..."}],"confidence":0.95}`
        break
      case 'analyze':
        userPrompt = `As ${agent.specialization}, analyze these defects: ${work.data.defects || 'N/A'}. Reference manual: ${work.data.manual || 'N/A'}. Provide expert diagnosis. Respond: {"specialization":"${agent.specialization}","diagnosis":"...","recommendations":["..."],"confidence":0.95}`
        break
      case 'dispatch':
        userPrompt = `Dispatch action for: ${JSON.stringify(work.data)}. Choose: stop_line, alert_supervisor, quarantine_batch, or log_analysis. Respond: {"action":"...","reason":"...","parameters":{}}`
        break
      default:
        userPrompt = `Process work item: ${JSON.stringify(work.data)}`
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

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
          max_completion_tokens: 500,
          response_format: { type: 'json_object' },
        }),
        signal,
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0].message.content
      } else {
        const errText = await response.text()
        if (response.status === 401) {
          throw new Error('Invalid Cerebras API key. Set it in Dashboard settings.')
        }
        throw new Error(`Cerebras API ${response.status}: ${errText}`)
      }
    } catch (e: any) {
      if (e.name === 'AbortError') throw e
      throw e
    }
  }

  getTelemetry(): SwarmTelemetry {
    const activeAgents = Array.from(this.pool.agents.values()).filter(a => a.status !== 'idle')
    const totalTasks = this.pool.completedWork.length

    this.pool.telemetry.activeAgents = activeAgents.length
    this.pool.telemetry.totalRPM = Math.round(totalTasks * 60 / ((Date.now() - this.pool.telemetry.completedQueries) || 1))
    this.pool.telemetry.tokensPerSec = Math.round(
      activeAgents.reduce((sum, a) => sum + (450 / (a.latency[a.latency.length - 1] || 100 / 1000)), 0) / (activeAgents.length || 1),
    )

    return this.pool.telemetry
  }

  getAgents(): Agent[] {
    return Array.from(this.pool.agents.values())
  }

  getAgent(id: string): Agent | undefined {
    return this.pool.agents.get(id)
  }

  getPoolStatus() {
    return {
      totalAgents: this.pool.agents.size,
      idleAgents: Array.from(this.pool.agents.values()).filter(a => a.status === 'idle').length,
      busyAgents: Array.from(this.pool.agents.values()).filter(a => a.status !== 'idle').length,
      workQueued: this.pool.workQueue.length,
      workCompleted: this.pool.completedWork.length,
    }
  }

  cancelAllWork(): void {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()

    this.pool.agents.forEach(agent => {
      agent.status = 'idle'
    })

    this.pool.workQueue = []
  }

  getWorkQueueStatus() {
    return {
      pending: this.pool.workQueue.filter(w => w.status === 'pending').length,
      executing: this.pool.workQueue.filter(w => w.status === 'executing').length,
      completed: this.pool.completedWork.length,
    }
  }
}

let orchestrator: AgentOrchestrator | null = null

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestrator) {
    orchestrator = new AgentOrchestrator()
  }
  return orchestrator
}

export function resetOrchestrator(): void {
  if (orchestrator) {
    orchestrator.cancelAllWork()
  }
  orchestrator = null
}
