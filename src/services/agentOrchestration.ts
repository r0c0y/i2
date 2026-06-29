// ═══════════════════════════════════════════════════════════════
//  Agent Orchestration Layer — 118-Agent Swarm Infrastructure
// ═══════════════════════════════════════════════════════════════

import type { AgentMessage, SwarmTelemetry } from '../types'

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

  /**
   * Initialize the 118-agent swarm:
   * - 100 Inspector agents (grid scan)
   * - 10 Specialist agents (debate & analysis)
   * - 5 Dispatcher agents (action execution)
   * - 3 Lead agents (coordination)
   */
  initializeSwarm(): Agent[] {
    const agents: Agent[] = []

    // 100 Area Inspectors
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

    // 10 Specialist Agents
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

    // 5 Dispatcher Agents
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

    // 3 Lead Agents
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

  /**
   * Get idle agents matching a role/specialization
   */
  getIdleAgents(role?: string, specialization?: string): Agent[] {
    return Array.from(this.pool.agents.values()).filter(agent => {
      if (agent.status !== 'idle') return false
      if (role && agent.role !== role) return false
      if (specialization && agent.specialization !== specialization) return false
      return true
    })
  }

  /**
   * Queue work item for execution
   */
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

  /**
   * Dispatch all pending work to available agents
   * Returns a promise that resolves when all work is done
   */
  async processWorkQueue(): Promise<void> {
    const workTasks: Promise<void>[] = []

    while (this.pool.workQueue.length > 0) {
      const work = this.pool.workQueue[0]

      // Find appropriate agent
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
        // Wait for an agent to become available
        await new Promise(res => setTimeout(res, 50))
        continue
      }

      // Assign and process work
      work.assignedAgent = agent.id
      work.status = 'executing'
      work.startedAt = Date.now()

      this.pool.workQueue.shift()
      agent.status = 'busy'

      const workTask = this.executeWork(work, agent)
      workTasks.push(workTask)

      // Update telemetry
      this.pool.telemetry.activeAgents = Array.from(this.pool.agents.values()).filter(a => a.status !== 'idle').length
    }

    // Wait for all work to complete
    if (workTasks.length > 0) {
      await Promise.all(workTasks)
    }
  }

  /**
   * Execute a single work item on an agent
   */
  private async executeWork(work: WorkItem, agent: Agent): Promise<void> {
    const startTime = Date.now()

    try {
      // Simulate agent thinking/processing time based on work type
      let processingTime = 50
      if (work.type === 'analyze' || work.type === 'debate') {
        processingTime = 100 + Math.random() * 200
      } else if (work.type === 'inspect') {
        processingTime = 30 + Math.random() * 70
      }

      // Create abort controller for this work
      const abortController = new AbortController()
      this.abortControllers.set(work.id, abortController)

      agent.status = 'thinking'
      await new Promise(res => setTimeout(res, processingTime))

      // Simulate work result
      work.result = {
        success: true,
        data: work.data,
        processedAt: Date.now(),
      }

      work.status = 'completed'
      work.completedAt = Date.now()

      const latency = Date.now() - startTime
      agent.latency.push(latency)
      agent.tasksCompleted++

      // Keep only last 100 latency samples
      if (agent.latency.length > 100) {
        agent.latency.shift()
      }

      // Update telemetry
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

  /**
   * Get current pool telemetry
   */
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

  /**
   * Get all agents
   */
  getAgents(): Agent[] {
    return Array.from(this.pool.agents.values())
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.pool.agents.get(id)
  }

  /**
   * Get pool status
   */
  getPoolStatus() {
    return {
      totalAgents: this.pool.agents.size,
      idleAgents: Array.from(this.pool.agents.values()).filter(a => a.status === 'idle').length,
      busyAgents: Array.from(this.pool.agents.values()).filter(a => a.status !== 'idle').length,
      workQueued: this.pool.workQueue.length,
      workCompleted: this.pool.completedWork.length,
    }
  }

  /**
   * Cancel all work
   */
  cancelAllWork(): void {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()

    // Reset all agents to idle
    this.pool.agents.forEach(agent => {
      agent.status = 'idle'
    })

    // Clear work queue
    this.pool.workQueue = []
  }

  /**
   * Get work queue status
   */
  getWorkQueueStatus() {
    return {
      pending: this.pool.workQueue.filter(w => w.status === 'pending').length,
      executing: this.pool.workQueue.filter(w => w.status === 'executing').length,
      completed: this.pool.completedWork.length,
    }
  }
}

// Singleton instance
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
