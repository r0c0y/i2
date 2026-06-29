import type { Netlist, CircuitAnalysis, WaveformMeasurement, VerificationResult, DemoCircuit, BringUpStep, NetContext } from '../types'

// ══════════════════════════════════════════════════════════════
//  API Layer — Cerebras Gemma 4 (Only)
//  Cerebras: gemma-4-31b (vision), gpt-oss-120b (text+reasoning)
// ══════════════════════════════════════════════════════════════

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions'
const getCerebrasKey = () => localStorage.getItem('cerebras_api_key') || (import.meta.env ? import.meta.env.VITE_CEREBRAS_API_KEY : '') || ''

// Cerebras models (Gemma 4 31B is the primary hosted model)
const CEREBRAS_VISION = 'gemma-4-31b'
const CEREBRAS_TEXT = 'gemma-4-31b'

// ═══ Structured Output Schemas ═══
// These enforce guaranteed valid JSON via constrained decoding

const CIRCUIT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    netlist: { type: 'object' },
    predictedBehavior: { type: 'string' },
    predictedWaveform: {
      type: 'object',
      properties: {
        measurements: {
          type: 'object',
          properties: {
            frequency: { type: 'number' },
            period: { type: 'number' },
            vHigh: { type: 'number' },
            vLow: { type: 'number' },
            vPp: { type: 'number' },
            dutyCycle: { type: 'number' },
            riseTime: { type: 'number' },
            fallTime: { type: 'number' },
          },
          required: ['frequency', 'period', 'vHigh', 'vLow', 'vPp', 'dutyCycle', 'riseTime', 'fallTime'],
          additionalProperties: false,
        },
        type: { type: 'string', enum: ['square', 'sine', 'triangle', 'sawtooth', 'pulse', 'unknown'] },
        description: { type: 'string' },
      },
      required: ['measurements', 'type', 'description'],
      additionalProperties: false,
    },
    issues: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
  },
  required: ['netlist', 'predictedBehavior', 'predictedWaveform', 'issues', 'confidence'],
  additionalProperties: false,
}

const NETLIST_SCHEMA = {
  type: 'object',
  properties: {
    components: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string' },
          type: { type: 'string', enum: ['R', 'C', 'L', 'D', 'Q', 'U', 'V', 'I', 'SW', 'LED', 'OTHER'] },
          value: { type: 'string' },
          nodes: { type: 'array', items: { type: 'string' } },
        },
        required: ['ref', 'type', 'value', 'nodes'],
        additionalProperties: false,
      },
    },
    nets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nodes: { type: 'array', items: { type: 'string' } },
          connections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                component: { type: 'string' },
                pin: { type: 'number' },
              },
              required: ['component', 'pin'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'nodes', 'connections'],
        additionalProperties: false,
      },
    },
    groundNode: { type: 'string' },
    vccNode: { type: 'string' },
  },
  required: ['components', 'nets', 'groundNode'],
  additionalProperties: false,
}

const SCOPE_MEASUREMENTS_SCHEMA = {
  type: 'object',
  properties: {
    frequency: { type: 'number' },
    period: { type: 'number' },
    vHigh: { type: 'number' },
    vLow: { type: 'number' },
    vPp: { type: 'number' },
    dutyCycle: { type: 'number' },
    riseTime: { type: 'number' },
    fallTime: { type: 'number' },
  },
  required: ['frequency', 'period', 'vHigh', 'vLow', 'vPp', 'dutyCycle', 'riseTime', 'fallTime'],
  additionalProperties: false,
}

// ═══ Timing & Stats ═══

interface CerebrasTiming {
  ttft: number       // Time to first token (prompt processing)
  total: number      // Total request time
  model: string
  cachedTokens?: number
  reasoningTokens?: number
}

let lastCerebrasTiming: CerebrasTiming | null = null

export function getLastCerebrasTiming() { return lastCerebrasTiming }

// ═══ Core API Callers ═══

async function callAPI(opts: {
  messages: any[]
  jsonMode?: boolean
  jsonSchema?: object
  maxTokens?: number
  preferCerebras?: boolean
  vision?: boolean
  reasoningEffort?: 'high' | 'medium' | 'low'
}): Promise<string> {
  const { messages, jsonMode = true, jsonSchema, maxTokens = 4000, preferCerebras = true, vision = false, reasoningEffort } = opts

  // Try Cerebras if preferred
  if (preferCerebras) {
    try {
      const body: any = {
        model: vision ? CEREBRAS_VISION : CEREBRAS_TEXT,
        messages,
        temperature: 1.0,
        top_p: 0.95,
        max_completion_tokens: maxTokens,
      }
      if (reasoningEffort) {
        body.reasoning_effort = reasoningEffort
      }
      if (jsonSchema) {
        body.response_format = { type: 'json_schema', json_schema: { schema: jsonSchema } }
      } else if (jsonMode) {
        body.response_format = { type: 'json_object' }
      }

      const response = await fetch(CEREBRAS_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getCerebrasKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        lastCerebrasTiming = {
          ttft: (data.time_info?.prompt_time || 0) * 1000,
          total: (data.time_info?.total_time || 0) * 1000,
          model: `cerebras/${data.model || CEREBRAS_TEXT}`,
        }
        return data.choices[0].message.content
      }
      const errText = await response.text()
      throw new Error(`Cerebras API error ${response.status}: ${errText}`)
    } catch (e) {
      throw new Error(`Cerebras API failed: ${e}`)
    }
  }

  const key = getCerebrasKey()
  throw new Error(`Cerebras API key not configured${!key ? ' (no key found in .env or localStorage)' : ''}`)
}

// ═══ Prompt Construction (Cache-Optimized) ═══
// Static content first for automatic prompt caching on Cerebras

// ══════════════════════════════════════════════════════════════
//  KiCad .net Netlist Parser (Ground Truth)
// ══════════════════════════════════════════════════════════════

export function parseKiCadNetlist(text: string): Netlist {
  const components: Netlist['components'] = []
  const nets: Netlist['nets'] = []
  const netMap = new Map<string, { nodes: string[]; connections: { component: string; pin: number }[] }>()

  // KiCad .net format: (comp (ref R1) (value 10k) (footprint ...) (nodes (node (name VCC) (pin 1)) ...))
  // Also handles simple SPICE format fallback

  const lines = text.split('\n')
  let inComp = false
  let inNode = false
  let currentComp: any = {}
  let currentNodes: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // KiCad component start
    if (trimmed.startsWith('(comp')) {
      inComp = true
      currentComp = { ref: '', type: 'OTHER', value: '', nodes: [] }
      currentNodes = []
    }

    if (inComp) {
      const refMatch = trimmed.match(/\(ref\s+"?([^")\s]+)"?\)/)
      if (refMatch) currentComp.ref = refMatch[1]

      const valMatch = trimmed.match(/\(value\s+"?([^")\s]+)"?\)/)
      if (valMatch) currentComp.value = valMatch[1]

      // Detect type from reference designator prefix
      if (currentComp.ref) {
        const prefix = currentComp.ref.charAt(0).toUpperCase()
        switch (prefix) {
          case 'R': currentComp.type = 'R'; break
          case 'C': currentComp.type = 'C'; break
          case 'L': currentComp.type = 'L'; break
          case 'D': case 'LED': currentComp.type = 'D'; break
          case 'Q': currentComp.type = 'Q'; break
          case 'U': case 'IC': currentComp.type = 'U'; break
          case 'V': currentComp.type = 'V'; break
          case 'I': currentComp.type = 'I'; break
          default: currentComp.type = 'OTHER'
        }
      }
    }

    // KiCad component end
    if (inComp && trimmed === ')') {
      inComp = false
      currentComp.nodes = currentNodes
      if (currentComp.ref) components.push(currentComp)
    }

    // KiCad net section
    if (trimmed.startsWith('(net ')) {
      const nameMatch = trimmed.match(/\(net\s+\d+\s+"?([^")\s]+)"?\)/)
      if (nameMatch) {
        const netName = nameMatch[1]
        if (!netMap.has(netName)) netMap.set(netName, { nodes: [], connections: [] })
      }
    }

    // SPICE fallback: R1 node1 node2 value
    const spiceMatch = trimmed.match(/^([RLCDEQVIUP]\w+)\s+(\S+)\s+(\S+)\s+(.+)$/)
    if (spiceMatch && !trimmed.startsWith('(')) {
      const [, ref, node1, node2, value] = spiceMatch
      const typeChar = ref.charAt(0).toUpperCase()
      let type: Netlist['components'][0]['type'] = 'OTHER'
      if (typeChar === 'R') type = 'R'
      else if (typeChar === 'C') type = 'C'
      else if (typeChar === 'L') type = 'L'
      else if (typeChar === 'D') type = 'D'
      else if (typeChar === 'Q') type = 'Q'
      else if (typeChar === 'V') type = 'V'
      else if (typeChar === 'I') type = 'I'
      else if (typeChar === 'U') type = 'U'

      components.push({ ref, type, value: value.trim(), nodes: [node1, node2] })

      for (const node of [node1, node2]) {
        if (!netMap.has(node)) netMap.set(node, { nodes: [], connections: [] })
        netMap.get(node)!.nodes.push(ref)
        netMap.get(node)!.connections.push({ component: ref, pin: 1 })
      }
    }
  }

  // Convert netMap
  for (const [name, data] of netMap) {
    nets.push({ name, nodes: data.nodes, connections: data.connections })
  }

  if (components.length === 0) throw new Error('No components found. Expected KiCad .net or SPICE format.')
  return {
    components,
    nets,
    groundNode: nets.find(n => n.name.toUpperCase() === 'GND')?.name || 'GND',
    vccNode: nets.find(n => ['VCC', 'VDD', 'V+', 'VCC+', '3V3', '5V'].includes(n.name.toUpperCase()))?.name,
  }
}

// ══════════════════════════════════════════════════════════════
//  Agent 1: The Math Analyst — Hard Engineering Formulas
// ══════════════════════════════════════════════════════════════

interface TheoreticalResult {
  circuitType: string
  formula: string
  calculatedFrequency: number | null
  calculatedVpp: number | null
  calculatedDutyCycle: number | null
  componentValues: Record<string, string>
  notes: string[]
}

export function computeTheoreticalValues(netlist: Netlist): TheoreticalResult {
  const comps = netlist.components
  const notes: string[] = []

  // Detect circuit type and apply hard formulas
  const has555 = comps.some(c => c.value?.toUpperCase().includes('555') || c.ref.toUpperCase().includes('555'))
  const hasCMOS = comps.some(c => c.value?.toUpperCase().includes('CD40') || c.value?.toUpperCase().includes('CD45') || c.value?.toUpperCase().includes('74HC') || c.value?.toUpperCase().includes('74HCT'))
  const hasOpAmp = comps.some(c => c.value?.toUpperCase().includes('OP') || c.value?.toUpperCase().includes('LM3') || c.value?.toUpperCase().includes('TL0'))
  const hasMOSFET = comps.some(c => c.type === 'Q' || c.value?.toUpperCase().includes('MOS') || c.value?.toUpperCase().includes('2N7'))
  const hasDiode = comps.some(c => c.type === 'D' || c.type === 'LED')
  const uCount = comps.filter(c => c.type === 'U').length
  const resistorCount = comps.filter(c => c.type === 'R').length
  const capCount = comps.filter(c => c.type === 'C').length

  // Parse component values to numbers
  const parseValue = (val: string): number => {
    const cleaned = val.replace(/[ΩohmOHM\s]/g, '').toLowerCase()
    if (cleaned.includes('k')) return parseFloat(cleaned) * 1000
    if (cleaned.includes('m') && !cleaned.includes('μ') && !cleaned.includes('u')) return parseFloat(cleaned) * 0.001
    if (cleaned.includes('μ') || cleaned.includes('u')) return parseFloat(cleaned) * 0.000001
    if (cleaned.includes('n')) return parseFloat(cleaned) * 0.000000001
    if (cleaned.includes('p')) return parseFloat(cleaned) * 0.000000000001
    if (cleaned.includes('f')) return parseFloat(cleaned) * 0.000000000000001
    return parseFloat(cleaned) || 0
  }

  const getComponent = (type: string, index = 0): string => {
    return comps.filter(c => c.type === type)[index]?.value || '0'
  }

  // ── 555 Timer Astable ──
  if (has555) {
    const r1 = parseValue(getComponent('R', 0))
    const r2 = parseValue(getComponent('R', 1))
    const c1 = parseValue(getComponent('C', 0))

    if (r1 > 0 && r2 > 0 && c1 > 0) {
      const freq = 1.44 / ((r1 + 2 * r2) * c1)
      const dutyCycle = (r1 + r2) / (r1 + 2 * r2)
      const period = 1 / freq

      notes.push(`555 Astable: f = 1.44 / ((R1 + 2·R2) · C1)`)
      notes.push(`f = 1.44 / ((${r1} + 2·${r2}) · ${c1}) = ${freq.toFixed(1)} Hz`)
      notes.push(`Duty = (R1 + R2) / (R1 + 2·R2) = ${(dutyCycle * 100).toFixed(1)}%`)

      return {
        circuitType: '555 Timer Astable',
        formula: 'f = 1.44 / ((R1 + 2·R2) · C1)',
        calculatedFrequency: freq,
        calculatedVpp: 5.0, // Assume 5V supply
        calculatedDutyCycle: dutyCycle,
        componentValues: { R1: `${r1}Ω`, R2: `${r2}Ω`, C1: `${c1}F` },
        notes,
      }
    }
  }

  // ── CMOS Inverter / Logic Gate ──
  if (hasCMOS && uCount >= 1) {
    const r1 = parseValue(getComponent('R', 0))
    const c1 = parseValue(getComponent('C', 0))
    const icValues = comps.filter(c => c.type === 'U').map(c => c.value).join(', ')

    notes.push(`CMOS logic detected: ${icValues}`)
    if (r1 > 0) notes.push(`Input resistor: ${r1}Ω — current limiting`)
    if (c1 > 0) notes.push(`Load/output cap: ${c1}F — affects switching speed`)
    notes.push(`Propagation delay: ~25ns typical for CD4049 at 5V`)
    notes.push(`Output swing: near rail-to-rail (0V to VDD)`)

    return {
      circuitType: 'CMOS Inverter / Logic Gate',
      formula: 'Vin → U1A → U1B → Vout (buffered, filtered)',
      calculatedFrequency: null,
      calculatedVpp: null,
      calculatedDutyCycle: null,
      componentValues: { R1: r1 > 0 ? `${r1}Ω` : 'N/A', C1: c1 > 0 ? `${c1}F` : 'N/A' },
      notes,
    }
  }

  // ── RC Low-Pass Filter ──
  if (resistorCount === 1 && capCount === 1 && !has555 && !hasOpAmp && !hasCMOS && uCount === 0) {
    const r = parseValue(getComponent('R', 0))
    const c = parseValue(getComponent('C', 0))
    if (r > 0 && c > 0) {
      const fc = 1 / (2 * Math.PI * r * c)
      notes.push(`RC Low-Pass: fc = 1 / (2π·R·C)`)
      notes.push(`fc = 1 / (2π·${r}·${c}) = ${fc.toFixed(1)} Hz`)
      notes.push(`Signal above ${fc.toFixed(0)} Hz is attenuated by ~3dB per octave`)

      return {
        circuitType: 'RC Low-Pass Filter',
        formula: 'fc = 1 / (2π·R·C)',
        calculatedFrequency: fc,
        calculatedVpp: null,
        calculatedDutyCycle: null,
        componentValues: { R1: `${r}Ω`, C1: `${c}F` },
        notes,
      }
    }
  }

  // ── LED Driver (MOSFET) ──
  if (hasMOSFET && hasDiode) {
    const rGate = parseValue(getComponent('R', 0))
    notes.push(`MOSFET LED driver detected`)
    if (rGate > 0) notes.push(`Gate resistor: ${rGate}Ω — limits inrush current`)
    notes.push(`Check Vgs(th) of MOSFET vs gate drive voltage`)
    notes.push(`LED forward voltage: ${getComponent('LED') || 'check datasheet'}`)

    return {
      circuitType: 'MOSFET LED Driver',
      formula: 'Check Vgs > Vgs(th), Id > LED current',
      calculatedFrequency: null,
      calculatedVpp: null,
      calculatedDutyCycle: null,
      componentValues: {},
      notes,
    }
  }

  // ── Generic analysis ──
  notes.push(`${comps.length} components detected (${resistorCount}R, ${capCount}C)`)
  notes.push('Circuit type not auto-detected — using LLM for analysis')
  return {
    circuitType: 'Unknown',
    formula: 'N/A',
    calculatedFrequency: null,
    calculatedVpp: null,
    calculatedDutyCycle: null,
    componentValues: {},
    notes,
  }
}

// ══════════════════════════════════════════════════════════════
//  Agent 2: The Waveform Critic — CSV Parser + Vision
// ══════════════════════════════════════════════════════════════

export function parseScopeCSV(csvText: string): WaveformMeasurement & { source: string } {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV too short — need header + data rows')

  // ── Detect delimiter ──
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','

  // ── Detect scope format ──
  const headerLine = lines[0].toLowerCase()
  let format = 'generic'
  if (headerLine.includes('keysight') || headerLine.includes('agilent')) format = 'keysight'
  else if (headerLine.includes('tektronix') || headerLine.includes('wfm')) format = 'tektronix'
  else if (headerLine.includes('rigol') || headerLine.includes('rsession')) format = 'rigol'

  // ── Parse header to find columns ──
  const rawHeader = lines[0].split(delimiter).map(s => s.trim().toLowerCase())
  const headers = rawHeader.map(h => h.replace(/[^a-z0-9]/g, ''))
  const isTimeCol = (h: string) => /^(time|x|t|\d+)$/.test(h)
  const isDataCol = (h: string) => /^(ch|y|v|voltage|signal|wave|channel)/.test(h) || /^(\d+)$/.test(h)

  let timeColIdx = headers.findIndex(isTimeCol)
  const dataColIndices = headers.reduce<number[]>((acc, h, i) => {
    if (i !== timeColIdx && (isDataCol(h) || (i > 0 && !isNaN(parseFloat(rawHeader[i]))))) acc.push(i)
    return acc
  }, [])

  // Fallback: if no recognized headers, assume col0=time, col1+=data
  if (timeColIdx === -1 && dataColIndices.length === 0) {
    timeColIdx = 0
    for (let i = 1; i < headers.length; i++) dataColIndices.push(i)
  }
  if (timeColIdx === -1) timeColIdx = 0
  if (dataColIndices.length === 0) dataColIndices.push(1)

  // ── Detect if header exists ──
  const hasHeader = rawHeader.some(h => h.includes('time') || h.includes('ch') || h.includes('voltage') || h.includes('sample'))

  // ── Skip non-data lines ──
  const skipPatterns = /^(\s*$|#|--|;|Time|X|Y|Sample|Point|Comment|Date|Hora|Waveform|Begin|End|Channels|Points|Archive|Reference)/i
  let dataStart = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed === '' || (hasHeader && i === 0) || skipPatterns.test(trimmed)) {
      if (i + 1 < lines.length) {
        const next = lines[i + 1].split(delimiter).map(s => s.trim())
        if (next.length >= 2 && !isNaN(parseFloat(next[timeColIdx || 0]))) {
          dataStart = i + 1
          break
        }
      }
      continue
    }
    if (/^-?\d/.test(trimmed)) { dataStart = i; break }
  }

  // ── Parse all rows ──
  const allRows: number[][] = []
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || /^[^-\d]/.test(line)) continue
    const parts = line.split(delimiter).map(s => s.trim()).filter(Boolean)
    if (parts.length < 2) continue
    const nums = parts.map(Number)
    if (nums.some(isNaN)) continue
    allRows.push(nums)
  }

  if (allRows.length < 2) throw new Error(
    `Not enough data points. Found ${allRows.length} valid rows from ${lines.length} lines.`
  )

  // ── Auto-detect time unit ──
  const firstTime = allRows[0][timeColIdx]
  const lastTime = allRows[allRows.length - 1][timeColIdx]
  const timeRange = lastTime - firstTime
  let timeScale = 1
  let timeUnit = 's'
  if (timeRange > 0 && timeRange < 0.000001) { timeScale = 1e-9; timeUnit = 'ns' }
  else if (timeRange < 0.001) { timeScale = 1e-6; timeUnit = 'μs' }
  else if (timeRange < 1) { timeScale = 1e-3; timeUnit = 'ms' }

  // ── Build channels ──
  const channels: import('../types').WaveformChannel[] = []
  const channelColors = ['#00ff88', '#ff6b6b', '#ffd93d', '#6bcbff']

  for (let ci = 0; ci < dataColIndices.length; ci++) {
    const colIdx = dataColIndices[ci]
    const colName = rawHeader[colIdx] || `CH${ci + 1}`

    const rawPoints = allRows.map(r => ({
      time: (r[timeColIdx] - firstTime) * timeScale,
      voltage: r[colIdx] ?? 0,
    }))

    // Downsample
    let pts = rawPoints
    if (rawPoints.length > 2000) {
      const step = rawPoints.length / 2000
      pts = Array.from({ length: 2000 }, (_, i) => rawPoints[Math.floor(i * step)])
    }

    // Analyze this channel
    let vMin = Infinity, vMax = -Infinity
    for (const p of pts) { if (p.voltage < vMin) vMin = p.voltage; if (p.voltage > vMax) vMax = p.voltage }

    const midV = (vMax + vMin) / 2
    const crossings: number[] = []
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1].voltage - midV
      const curr = pts[i].voltage - midV
      if (prev <= 0 && curr > 0) {
        crossings.push(pts[i - 1].time + (pts[i].time - pts[i - 1].time) * (-prev / (curr - prev)))
      }
    }
    let freq = 0, per = 0
    if (crossings.length >= 2) {
      const periods: number[] = []
      for (let i = 1; i < crossings.length; i++) periods.push(crossings[i] - crossings[i - 1])
      per = periods.reduce((a, b) => a + b, 0) / periods.length
      freq = 1 / per
    }

    let hiCnt = 0
    for (const p of pts) { if (p.voltage > midV) hiCnt++ }

    channels.push({
      name: colName,
      rawPoints: pts,
      vHigh: vMax, vLow: vMin, vPp: vMax - vMin,
      frequency: freq,
      dutyCycle: hiCnt / pts.length,
    })
  }

  // Primary channel = first data column
  const primary = channels[0]
  const primaryPoints = primary.rawPoints

  return {
    frequency: primary.frequency,
    period: primary.frequency > 0 ? 1 / primary.frequency : 0,
    vHigh: primary.vHigh,
    vLow: primary.vLow,
    vPp: primary.vPp,
    dutyCycle: primary.dutyCycle,
    riseTime: 0,
    fallTime: 0,
    rawPoints: primaryPoints,
    channels,
    source: `CSV (${format}): ${allRows.length} points, ${channels.length} channel${channels.length > 1 ? 's' : ''}, ${timeUnit} scale`,
  }
}

// ══════════════════════════════════════════════════════════════
//  Protocol Detection from Multi-Channel Data
// ══════════════════════════════════════════════════════════════

export interface ProtocolResult {
  protocol: string
  confidence: number
  findings: string[]
  timing: Record<string, number>
}

export function detectProtocol(channels: import('../types').WaveformChannel[]): ProtocolResult {
  if (!channels || channels.length < 2) {
    return { protocol: 'single-channel', confidence: 0, findings: ['Only one channel — cannot detect multi-signal protocol'], timing: {} }
  }

  const findings: string[] = []
  const timing: Record<string, number> = {}

  // Check for SPI: 4 channels (CLK, MOSI, MISO, CS)
  if (channels.length >= 3) {
    const clk = channels.find(c => c.frequency > 0 && c.dutyCycle > 0.4 && c.dutyCycle < 0.6)
    const cs = channels.find(c => c.frequency === 0 && c.vHigh > 3) // CS often held high
    if (clk && cs) {
      const clkFreq = clk.frequency
      timing['SPI Clock'] = clkFreq
      findings.push(`SPI detected: CLK=${(clkFreq/1e6).toFixed(2)}MHz`)
      findings.push(`CS active-low: VLow=${cs.vLow.toFixed(2)}V, VHigh=${cs.vHigh.toFixed(2)}V`)
      // Check clock duty cycle
      if (clk.dutyCycle < 0.45 || clk.dutyCycle > 0.55) {
        findings.push(`⚠ CLK duty cycle ${(clk.dutyCycle*100).toFixed(1)}% — should be ~50%`)
      }
      return { protocol: 'SPI', confidence: 0.8, findings, timing }
    }
  }

  // Check for I2C: 2 channels (SCL, SDA) — both have open-drain characteristic
  if (channels.length >= 2) {
    const ch0 = channels[0]
    const ch1 = channels[1]
    // I2C: both channels have similar frequency, SDA changes during SCL high = start/stop
    if (ch0.frequency > 0 && ch1.frequency > 0) {
      const freqRatio = Math.min(ch0.frequency, ch1.frequency) / Math.max(ch0.frequency, ch1.frequency)
      if (freqRatio > 0.8) {
        const sclFreq = Math.max(ch0.frequency, ch1.frequency)
        timing['I2C SCL'] = sclFreq
        if (sclFreq < 100000) findings.push(`I2C Standard Mode (${(sclFreq/1000).toFixed(1)}kHz)`)
        else if (sclFreq < 400000) findings.push(`I2C Fast Mode (${(sclFreq/1000).toFixed(1)}kHz)`)
        else findings.push(`I2C Fast Mode Plus (${(sclFreq/1000).toFixed(1)}kHz)`)
        // Check pull-up: rise time should be fast
        findings.push(`Both channels oscillating at similar freq — likely I2C bus`)
        return { protocol: 'I2C', confidence: 0.7, findings, timing }
      }
    }
  }

  // Check for UART: 2 channels, one mostly high (TX idle) with irregular transitions
  if (channels.length >= 2) {
    const ch0 = channels[0]
    if (ch0.frequency === 0 && ch0.dutyCycle < 0.1) {
      findings.push(`UART detected: TX line idle-high, duty ${(ch0.dutyCycle*100).toFixed(1)}%`)
      return { protocol: 'UART', confidence: 0.6, findings, timing }
    }
  }

  // Check for PWM: single channel with known duty cycle
  if (channels.length >= 1) {
    const ch = channels[0]
    if (ch.frequency > 0 && ch.dutyCycle > 0.05 && ch.dutyCycle < 0.95) {
      findings.push(`PWM signal: ${ch.frequency.toFixed(0)}Hz, duty ${(ch.dutyCycle*100).toFixed(1)}%`)
      return { protocol: 'PWM', confidence: 0.5, findings, timing }
    }
  }

  return { protocol: 'unknown', confidence: 0, findings: ['Could not identify protocol from channel data'], timing }
}

// ══════════════════════════════════════════════════════════════
//  Guided Bring-Up Checklist
// ══════════════════════════════════════════════════════════════

export function generateBringUpChecklist(netlist: Netlist): BringUpStep[] {
  const steps: BringUpStep[] = []
  const comps = netlist.components
  const has555 = comps.some(c => c.value?.toUpperCase().includes('555'))
  const hasCMOS = comps.some(c => c.value?.toUpperCase().includes('CD40') || c.value?.toUpperCase().includes('74H'))
  const hasMOSFET = comps.some(c => c.type === 'Q' || c.value?.toUpperCase().includes('MOS'))
  const hasOpAmp = comps.some(c => c.value?.toUpperCase().includes('LM') || c.value?.toUpperCase().includes('TL0') || c.value?.toUpperCase().includes('OP'))
  const hasLED = comps.some(c => c.type === 'LED')
  const hasCap = comps.some(c => c.type === 'C')
  const hasCrystal = comps.some(c => c.value?.toUpperCase().includes('XTAL') || c.value?.toUpperCase().includes('CRYSTAL') || c.ref.toUpperCase().startsWith('Y'))
  const resistors = comps.filter(c => c.type === 'R')
  const caps = comps.filter(c => c.type === 'C')

  // Step 1: Visual inspection
  steps.push({
    id: 'visual',
    title: 'Visual Inspection',
    instruction: 'Before applying power, inspect the board under good lighting. Check for solder bridges, missing components, reversed polarity, cold joints.',
    probePoints: ['All IC pins', 'Capacitor polarity', 'Connector alignment'],
    expectedValues: ['No visible shorts', 'All components present and oriented correctly'],
    passCondition: 'No visible defects found',
  })

  // Step 2: Continuity check
  steps.push({
    id: 'continuity',
    title: 'Continuity / Short Check',
    instruction: 'Set multimeter to continuity mode. Check for shorts between power rails BEFORE applying power.',
    probePoints: ['VCC to GND — should NOT beep', 'Every power pin to GND'],
    expectedValues: ['VCC-GND: >1kΩ resistance (not a dead short)'],
    warning: 'If you hear a beep between VCC and GND, DO NOT power on — find the short first',
    passCondition: 'No shorts detected between power rails',
  })

  // Step 3: Power rail
  const vccNet = netlist.vccNode || 'VCC'
  steps.push({
    id: 'power',
    title: 'First Power-On',
    instruction: `Set bench supply to 5V (or 3.3V if low-voltage design), current limit to 100mA. Connect to ${vccNet} and GND. Slowly increase current limit.`,
    probePoints: [`${vccNet} rail`, 'GND plane', 'Any voltage regulator output'],
    expectedValues: ['Supply voltage within ±5% of expected', 'Current draw < 50mA (no short)'],
    warning: 'Touch IC packages after 10 seconds — any hot component indicates a problem',
    passCondition: 'Voltage stable, no excessive current draw, no hot components',
  })

  // Step 4: Bypass caps
  if (hasCap) {
    const bypassCaps = caps.filter(c => {
      const val = c.value?.toLowerCase() || ''
      return val.includes('100n') || val.includes('0.1u') || val.includes('10n')
    })
    steps.push({
      id: 'bypass',
      title: 'Verify Bypass Capacitors',
      instruction: `Check that bypass capacitors are present and close to IC power pins.${bypassCaps.length > 0 ? ` Found ${bypassCaps.length} decoupling cap(s).` : ''}`,
      probePoints: bypassCaps.map(c => `${c.ref} (${c.value})`),
      expectedValues: ['Bypass cap voltage ≈ supply voltage', 'No AC ripple > 50mV on power pins'],
      passCondition: 'Power pins clean, bypass caps functional',
    })
  }

  // Step 5: Clock/oscillator
  if (has555) {
    steps.push({
      id: 'clock',
      title: 'Verify Oscillator Output',
      instruction: 'Connect scope to output pin (pin 3 of NE555). You should see a square wave.',
      probePoints: ['NE555 pin 3 (output)', 'NE555 pin 2 (trigger)', 'NE555 pin 6 (threshold)'],
      expectedValues: ['Square wave on pin 3', `Frequency near theoretical value`, 'Duty cycle ~66% (for standard astable)'],
      passCondition: 'Oscillation present at expected frequency',
    })
  } else if (hasCrystal) {
    steps.push({
      id: 'clock',
      title: 'Verify Crystal Oscillator',
      instruction: 'Check crystal output with scope (use short ground clip). Look for sine/square wave at crystal frequency.',
      probePoints: ['Crystal output pin', 'MCU oscillator input'],
      expectedValues: ['Clean oscillation at crystal frequency', 'Amplitude 0.5V-1V peak-to-peak'],
      passCondition: 'Oscillation present and stable',
    })
  }

  // Step 6: Signal path
  if (hasCMOS) {
    steps.push({
      id: 'signal',
      title: 'Verify CMOS Signal Path',
      instruction: 'Apply a test signal to input. Check output of each inverter stage with scope.',
      probePoints: ['Input signal', 'U1A output', 'U1B final output'],
      expectedValues: ['Signal propagates through each stage', 'Output swing near rail-to-rail (0V to VDD)'],
      passCondition: 'Clean signal at output with expected inversion/buffering',
    })
  }

  // Step 7: MOSFET check
  if (hasMOSFET) {
    steps.push({
      id: 'mosfet',
      title: 'Verify MOSFET Switching',
      instruction: 'Check gate voltage and drain-source voltage. MOSFET should fully turn on (Vds near 0V) when gate is high.',
      probePoints: ['Gate voltage (Vgs)', 'Drain voltage (Vds)', 'Source (ground)'],
      expectedValues: ['Vgs > Vgs(th) when ON', 'Vds < 0.5V when fully ON', 'No thermal runaway'],
      passCondition: 'MOSFET switches cleanly, no excessive heating',
    })
  }

  // Step 8: Output measurement
  steps.push({
    id: 'output',
    title: 'Final Output Measurement',
    instruction: 'Capture the output waveform. Compare frequency, voltage levels, and duty cycle against the expected values from the schematic.',
    probePoints: ['Main output node'],
    expectedValues: ['Frequency within ±10% of design', 'Voltage levels match expected swing', 'Duty cycle within spec'],
    passCondition: 'Output matches design specifications',
  })

  return steps
}

// ══════════════════════════════════════════════════════════════
//  Net Context — Click Component → See Everything
// ══════════════════════════════════════════════════════════════

export function getNetContext(componentRef: string, netlist: Netlist): NetContext | null {
  const comp = netlist.components.find(c => c.ref === componentRef)
  if (!comp) return null

  const connectedNets = netlist.nets.filter(n =>
    n.connections.some(c => c.component === componentRef)
  )

  // Expected voltages based on component type and connected nets
  const expectedVoltages: NetContext['expectedVoltages'] = []
  const failureModes: string[] = []
  const probeSuggestions: string[] = []

  switch (comp.type) {
    case 'R':
      expectedVoltages.push(
        { net: comp.nodes[0] || 'IN', expected: 'Source voltage', range: '0V - VCC' },
        { net: comp.nodes[1] || 'OUT', expected: 'Depends on load', range: '0V - VCC' },
      )
      failureModes.push(
        'Open circuit (infinite resistance) — no current flow',
        'Short circuit (0Ω) — excessive current, possible damage',
        'Value drift — check with LCR meter, tolerance typically ±1-5%',
      )
      probeSuggestions.push(
        `Measure voltage across ${comp.ref}: V(R) = V(pin1) - V(pin2)`,
        `Ohms check: should read ${comp.value} ± tolerance`,
      )
      break
    case 'C':
      expectedVoltages.push(
        { net: comp.nodes[0] || 'IN', expected: 'Charged to DC level', range: '0V - VCC' },
        { net: comp.nodes[1] || 'GND', expected: '0V (if connected to ground)', range: '0V ± 0.1V' },
      )
      failureModes.push(
        'Open circuit — no capacitance, circuit won\'t filter/oscillate',
        'Short circuit — DC path through cap, may cause excessive current',
        'ESR too high — reduced filtering effectiveness',
        'Wrong value — capacitor tolerance ±20% typical for ceramic',
      )
      probeSuggestions.push(
        `Check voltage across ${comp.ref} with multimeter`,
        `For timing caps: measure actual capacitance with LCR meter`,
        `ESR check: should be <1Ω for ceramic caps`,
      )
      break
    case 'U':
      expectedVoltages.push(
        { net: 'VDD/VCC', expected: 'Supply voltage', range: '3.3V or 5V ± 5%' },
        { net: 'GND', expected: '0V', range: '< 0.1V' },
        { net: 'Output', expected: 'Logic level', range: '0V to VDD' },
      )
      failureModes.push(
        'No supply voltage — check VDD pin',
        'Input floating — CMOS inputs must not float, add pull-up/down',
        'Output stuck high/low — possible internal damage',
        'Thermal shutdown — chip too hot to touch = problem',
        'Wrong orientation — check pin 1 marker',
      )
      probeSuggestions.push(
        `Verify ${comp.ref} VDD = supply voltage`,
        `Check all input pins — should be driven, not floating`,
        `Measure output while input is toggling`,
        `Touch package — if too hot to hold, something is wrong`,
      )
      break
    case 'LED':
      expectedVoltages.push(
        { net: 'Anode', expected: 'Above cathode by Vf', range: '1.8V (red) to 3.3V (blue/white)' },
        { net: 'Cathode', expected: 'Lower than anode', range: '0V - 1V' },
      )
      failureModes.push(
        'Not lighting — wrong polarity, insufficient current, or dead LED',
        'Dim — insufficient current, check series resistor value',
        'Too bright/hot — excessive current, check resistor',
        'Reverse voltage — LEDs are destroyed by reverse bias',
      )
      probeSuggestions.push(
        `Measure voltage across LED: should be Vf (${comp.value || 'check datasheet'})`,
        `Check current: I = (Vsupply - Vf) / R_series`,
        `If LED is off, swap probes to check polarity`,
      )
      break
    default:
      expectedVoltages.push({ net: 'N/A', expected: 'Check datasheet', range: 'Varies' })
      failureModes.push('Check component datasheet for expected behavior')
      probeSuggestions.push(`Measure all pins of ${comp.ref} and compare to datasheet`)
  }

  return { component: comp, connectedNets, expectedVoltages, failureModes, probeSuggestions }
}

export async function extractMeasurementsFromImage(base64DataUrl: string): Promise<WaveformMeasurement> {
  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: `Analyze this oscilloscope screenshot. Extract measurements: frequency (Hz), period (seconds), V High (V), V Low (V), Vpp (V), duty cycle (0-1), rise time (s), fall time (s). Use grid divisions if no digital readout. Respond with ONLY JSON: {"frequency":0,"period":0,"vHigh":0,"vLow":0,"vPp":0,"dutyCycle":0,"riseTime":0,"fallTime":0}` },
      { type: 'image_url', image_url: { url: base64DataUrl } }
    ]
  }]
  return JSON.parse(await callAPI({
    messages,
    jsonSchema: SCOPE_MEASUREMENTS_SCHEMA,
    vision: true,
  })) as WaveformMeasurement
}

// ══════════════════════════════════════════════════════════════
//  Agent 3: The Synthesizer Judge — Compare + Root Cause
// ══════════════════════════════════════════════════════════════

export function synthesizeVerification(
  theoretical: TheoreticalResult,
  actual: WaveformMeasurement,
  netlist: Netlist,
): VerificationResult {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 1.0
  const diagnosedFaults: { component: string; probability: number; description: string }[] = []

  // Compare frequency
  let isFreqMismatched = false
  let isFreqLow = false
  if (theoretical.calculatedFrequency && actual.frequency) {
    const freqDiff = Math.abs(theoretical.calculatedFrequency - actual.frequency) / theoretical.calculatedFrequency
    if (freqDiff > 0.1) {
      score -= 0.3
      isFreqMismatched = true
      isFreqLow = actual.frequency < theoretical.calculatedFrequency
      issues.push(`Frequency mismatch: theoretical ${theoretical.calculatedFrequency.toFixed(1)}Hz vs actual ${actual.frequency.toFixed(1)}Hz (${(freqDiff * 100).toFixed(1)}% off)`)
      // Root cause analysis by circuit type
      if (theoretical.circuitType === '555 Timer Astable') {
        if (isFreqLow) {
          recommendations.push(`Frequency is LOW → C1 likely drifted HIGHER (cap tolerance ±20%) or R1/R2 drifted higher`)
          diagnosedFaults.push(
            { component: 'C1', probability: 0.85, description: 'Capacitance drifted high (+22%), lowering output oscillation frequency' },
            { component: 'R2', probability: 0.60, description: 'Resistance drifted high, stretching discharge interval' },
            { component: 'R1', probability: 0.40, description: 'Resistance drifted high, stretching charge interval' }
          )
        } else {
          recommendations.push(`Frequency is HIGH → C1 likely drifted LOWER or R1/R2 drifted lower`)
          diagnosedFaults.push(
            { component: 'C1', probability: 0.80, description: 'Capacitance drifted low (-18%), increasing output oscillation frequency' },
            { component: 'R2', probability: 0.50, description: 'Resistance drifted low, shrinking discharge interval' },
            { component: 'R1', probability: 0.30, description: 'Resistance drifted low, shrinking charge interval' }
          )
        }
        recommendations.push(`Check C1 with LCR meter — most common failure point`)
      } else if (theoretical.circuitType.includes('RC')) {
        if (isFreqLow) {
          recommendations.push(`Cutoff frequency LOW → R or C drifted HIGHER — check component tolerances`)
          diagnosedFaults.push(
            { component: 'C1', probability: 0.80, description: 'Capacitive loading high, shifting cutoff boundary left' },
            { component: 'R1', probability: 0.60, description: 'Input series resistance high, attenuating pass-band frequency' }
          )
        } else {
          recommendations.push(`Cutoff frequency HIGH → R or C drifted LOWER`)
          diagnosedFaults.push(
            { component: 'C1', probability: 0.80, description: 'Capacitive loading low, shifting cutoff boundary right' },
            { component: 'R1', probability: 0.60, description: 'Input series resistance low, moving pass-band boundary' }
          )
        }
      } else if (theoretical.circuitType.includes('CMOS')) {
        recommendations.push(`Frequency drift in CMOS circuit — check supply voltage stability and bypass caps`)
        recommendations.push(`CD4049 propagation delay increases at lower VDD — verify VDD = 5V`)
        diagnosedFaults.push(
          { component: 'U1', probability: 0.70, description: 'Internal gate propagation delay shift due to supply noise' },
          { component: 'C1', probability: 0.50, description: 'Bypass capacitance drift, introducing voltage sag' }
        )
      } else {
        recommendations.push(`Frequency drift — check passive component tolerances (R, C)`)
        diagnosedFaults.push(
          { component: 'C1', probability: 0.50, description: 'Passive component tolerance drift' }
        )
      }
    } else if (freqDiff > 0.05) {
      score -= 0.1
      issues.push(`Frequency slightly off: ${theoretical.calculatedFrequency.toFixed(1)}Hz vs ${actual.frequency.toFixed(1)}Hz (${(freqDiff * 100).toFixed(1)}%)`)
    }
  }

  // Compare duty cycle
  if (theoretical.calculatedDutyCycle !== null && actual.dutyCycle) {
    const dutyDiff = Math.abs(theoretical.calculatedDutyCycle - actual.dutyCycle)
    if (dutyDiff > 0.1) {
      score -= 0.2
      issues.push(`Duty cycle mismatch: theoretical ${(theoretical.calculatedDutyCycle * 100).toFixed(1)}% vs actual ${(actual.dutyCycle * 100).toFixed(1)}%`)
      if (theoretical.circuitType === '555 Timer Astable') {
        recommendations.push(`Duty cycle depends on R1/R2 ratio — check if R1 or R2 has drifted`)
        if (actual.dutyCycle < theoretical.calculatedDutyCycle) {
          recommendations.push(`Duty is LOW → R1 may be lower than expected or R2 higher`)
          diagnosedFaults.push(
            { component: 'R1', probability: 0.75, description: 'Resistance drifted low, shortening charging path' },
            { component: 'R2', probability: 0.65, description: 'Resistance drifted high, lengthening discharging path' }
          )
        } else {
          recommendations.push(`Duty is HIGH → R1 may be higher than expected or R2 lower`)
          diagnosedFaults.push(
            { component: 'R1', probability: 0.75, description: 'Resistance drifted high, lengthening charging path' },
            { component: 'R2', probability: 0.65, description: 'Resistance drifted low, shortening discharging path' }
          )
        }
      }
    }
  }

  // Check voltage levels
  if (actual.vLow > 0.5) {
    score -= 0.1
    issues.push(`V Low is ${actual.vLow.toFixed(2)}V — should be near 0V. Possible ground bounce or output stage issue.`)
    if (theoretical.circuitType.includes('CMOS')) {
      recommendations.push(`CMOS output not reaching ground — check VDD supply, input threshold, or damaged output stage`)
      diagnosedFaults.push({ component: 'U1', probability: 0.90, description: 'Output drive stage ground node leakage or high pin resistance' })
    } else {
      recommendations.push(`Check ground connections and output stage of active component`)
      const uComp = netlist.components.find(c => c.type === 'U')
      if (uComp) {
        diagnosedFaults.push({ component: uComp.ref, probability: 0.85, description: 'Ground pin floating or output transistor breakdown' })
      }
    }
  }

  // Check voltage swing
  if (theoretical.calculatedVpp && actual.vPp) {
    const vppDiff = Math.abs(theoretical.calculatedVpp - actual.vPp) / theoretical.calculatedVpp
    if (vppDiff > 0.2) {
      score -= 0.15
      issues.push(`Vpp mismatch: expected ~${theoretical.calculatedVpp.toFixed(1)}V, measured ${actual.vPp.toFixed(1)}V (${(vppDiff * 100).toFixed(0)}% off)`)
      if (actual.vPp < theoretical.calculatedVpp) {
        recommendations.push(`Reduced voltage swing — check supply rail, output load, or component degradation`)
        const uComp = netlist.components.find(c => c.type === 'U')
        if (uComp) {
          diagnosedFaults.push({ component: uComp.ref, probability: 0.75, description: 'Degraded output driver under load' })
        }
      }
    }
  }

  // Check rise/fall time
  if (actual.riseTime > 0.000001) {
    issues.push(`Slow rise time (${(actual.riseTime * 1e6).toFixed(1)}μs) — may indicate high capacitance or weak drive`)
    if (theoretical.circuitType.includes('CMOS')) {
      recommendations.push(`Slow CMOS edge — check output cap C1 loading, or try higher VDD for faster switching`)
    } else {
      recommendations.push(`Check for parasitic capacitance or undersized driver`)
    }
  }
  if (actual.fallTime > 0.000001) {
    issues.push(`Slow fall time (${(actual.fallTime * 1e6).toFixed(1)}μs) — check for parasitic capacitance`)
  }

  // Remove duplicates from diagnosedFaults and sort by probability descending
  const uniqueFaults = diagnosedFaults.filter((f, idx, self) => 
    self.findIndex(t => t.component === f.component) === idx
  ).sort((a, b) => b.probability - a.probability)

  // Institutional Cross-Run memory simulation
  let crossRunTip = 'No prior fault signatures recorded for this topology. Saving current run state to institutional cross-run memory.'
  try {
    const historyStr = localStorage.getItem('circuitscope_history')
    let history = historyStr ? JSON.parse(historyStr) : []
    const matchingPrev = history.find((h: any) => h.circuitType === theoretical.circuitType && h.mismatchType === (isFreqLow ? 'low_freq' : 'high_freq'))
    if (matchingPrev) {
      crossRunTip = `Drift signature matches historical trial Run #${matchingPrev.runId}. Previously, a frequency deviation of this scale was resolved by replacing ${matchingPrev.failingComponent} to correct thermal tolerance shift.`
    }
    // Save current run
    const runId = history.length + 1
    if (score < 1.0) {
      history.push({
        runId,
        circuitType: theoretical.circuitType,
        mismatchType: isFreqLow ? 'low_freq' : 'high_freq',
        failingComponent: uniqueFaults[0]?.component || 'C1',
        timestamp: Date.now()
      })
      localStorage.setItem('circuitscope_history', JSON.stringify(history.slice(-10)))
    }
  } catch {
  }

  return {
    match: score > 0.7,
    score: Math.max(0, score),
    differences: issues,
    recommendations,
    diagnosedFaults: uniqueFaults,
    crossRunTip,
  }
}

// ══════════════════════════════════════════════════════════════
//  LLM Analysis (Netlist → Behavior Prediction)
// ══════════════════════════════════════════════════════════════

export async function analyzeCircuit(netlist: Netlist): Promise<CircuitAnalysis> {
  const netlistStr = JSON.stringify(netlist, null, 2)
  const messages = [
    { role: 'system', content: 'You are an expert electronics engineer. Analyze circuit netlists and predict behavior. Think step-by-step about signal flow, voltage levels, and timing. Always respond with valid JSON.' },
    {
      role: 'user',
      content: `Analyze this netlist and predict behavior:

${netlistStr}

Think about:
1. Signal flow path (input → processing → output)
2. Expected voltage levels at each stage
3. Frequency/timing characteristics
4. Common failure modes for this topology

Respond with JSON:
{
  "netlist": ${netlistStr},
  "predictedBehavior": "description of circuit function and signal path",
  "predictedWaveform": {
    "measurements": {"frequency":0,"period":0,"vHigh":0,"vLow":0,"vPp":0,"dutyCycle":0,"riseTime":0,"fallTime":0},
    "type": "square|sine|triangle|pulse",
    "description": "expected output description"
  },
  "issues": ["potential issues to watch for during debug"],
  "confidence": 0.95
}`
    }
  ]
  return JSON.parse(await callAPI({
    messages,
    jsonSchema: CIRCUIT_ANALYSIS_SCHEMA,
    maxTokens: 4000,
    reasoningEffort: 'high',
  })) as CircuitAnalysis
}

// ══════════════════════════════════════════════════════════════
//  Vision: Schematic Image → Netlist
// ══════════════════════════════════════════════════════════════

export async function extractNetlistFromImage(base64DataUrl: string): Promise<Netlist> {
  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: `Extract a netlist from this circuit schematic. Identify all components (R=resistor, C=capacitor, L=inductor, D=diode, Q=transistor, U=IC, V=voltage source, LED) with ref designator, type, value, and connected nodes. Respond with ONLY JSON: {"components":[{"ref":"R1","type":"R","value":"10k","nodes":["VCC","OUT"]}],"nets":[{"name":"VCC","nodes":["VCC"],"connections":[{"component":"R1","pin":1}]}],"groundNode":"GND","vccNode":"VCC"}` },
      { type: 'image_url', image_url: { url: base64DataUrl } }
    ]
  }]
  return JSON.parse(await callAPI({
    messages,
    jsonSchema: NETLIST_SCHEMA,
    vision: true,
  })) as Netlist
}

// ══════════════════════════════════════════════════════════════
//  File Helpers
// ══════════════════════════════════════════════════════════════

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function pdfToBase64Image(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport } as any).promise
  return canvas.toDataURL('image/png')
}

// ══════════════════════════════════════════════════════════════
//  Demo Circuits
// ══════════════════════════════════════════════════════════════

export const DEMO_CIRCUITS: DemoCircuit[] = [
  {
    id: '555-astable',
    name: '555 Timer Astable',
    description: 'NE555 oscillator — f = 1.44/((R1+2·R2)·C1), ~937Hz',
    icon: 'timer',
    netlist: {
      components: [
        { ref: 'R1', type: 'R', value: '1kΩ', nodes: ['VCC', 'DIS'] },
        { ref: 'R2', type: 'R', value: '10kΩ', nodes: ['DIS', 'THR'] },
        { ref: 'C1', type: 'C', value: '100nF', nodes: ['THR', 'GND'] },
        { ref: 'C2', type: 'C', value: '10nF', nodes: ['CTRL', 'GND'] },
        { ref: 'U1', type: 'U', value: 'NE555', nodes: ['VCC', 'GND', 'DIS', 'THR', 'TRI', 'OUT', 'RST', 'CTRL'] },
      ],
      nets: [
        { name: 'VCC', nodes: ['VCC', 'R1.1', 'U1.VCC'], connections: [{ component: 'R1', pin: 1 }, { component: 'U1', pin: 8 }] },
        { name: 'GND', nodes: ['GND', 'C1.2', 'C2.2', 'U1.GND'], connections: [{ component: 'C1', pin: 2 }, { component: 'C2', pin: 2 }, { component: 'U1', pin: 1 }] },
        { name: 'DIS', nodes: ['DIS', 'R1.2', 'R2.1', 'U1.DIS'], connections: [{ component: 'R1', pin: 2 }, { component: 'R2', pin: 1 }, { component: 'U1', pin: 7 }] },
        { name: 'THR', nodes: ['THR', 'R2.2', 'C1.1', 'U1.THR'], connections: [{ component: 'R2', pin: 2 }, { component: 'C1', pin: 1 }, { component: 'U1', pin: 6 }] },
        { name: 'OUT', nodes: ['OUT', 'U1.OUT'], connections: [{ component: 'U1', pin: 3 }] },
      ],
      groundNode: 'GND', vccNode: 'VCC',
    },
    matchingWaveform: {
      type: 'square', description: '555 astable — ~937Hz, 0-5V, 66.7% duty',
      measurements: { frequency: 937.5, period: 0.001067, vHigh: 4.8, vLow: 0.1, vPp: 4.7, dutyCycle: 0.667, riseTime: 1e-7, fallTime: 1e-7 },
    },
    mismatchedWaveform: {
      type: 'square', description: 'C1 drifted to 120nF — frequency dropped, duty shifted',
      measurements: { frequency: 780, period: 0.001282, vHigh: 4.2, vLow: 0.6, vPp: 3.6, dutyCycle: 0.55, riseTime: 3e-7, fallTime: 2e-7 },
    },
  },
  {
    id: 'cmos-inverter',
    name: 'CMOS Inverter',
    description: 'CD4049 hex buffer — signal conditioning',
    icon: 'inverter',
    netlist: {
      components: [
        { ref: 'U1A', type: 'U', value: 'CD4049', nodes: ['VDD', 'GND', 'IN', 'OUT1'] },
        { ref: 'U1B', type: 'U', value: 'CD4049', nodes: ['VDD', 'GND', 'OUT1', 'OUT2'] },
        { ref: 'R1', type: 'R', value: '10kΩ', nodes: ['IN', 'VDD'] },
        { ref: 'C1', type: 'C', value: '100pF', nodes: ['OUT2', 'GND'] },
      ],
      nets: [
        { name: 'VDD', nodes: ['VDD', 'R1.2', 'U1A.VDD'], connections: [{ component: 'R1', pin: 2 }, { component: 'U1A', pin: 14 }] },
        { name: 'GND', nodes: ['GND', 'C1.2', 'U1A.GND'], connections: [{ component: 'C1', pin: 2 }, { component: 'U1A', pin: 7 }] },
        { name: 'IN', nodes: ['IN', 'R1.1', 'U1A.IN'], connections: [{ component: 'R1', pin: 1 }, { component: 'U1A', pin: 1 }] },
        { name: 'OUT1', nodes: ['OUT1', 'U1A.OUT', 'U1B.IN'], connections: [{ component: 'U1A', pin: 2 }, { component: 'U1B', pin: 1 }] },
        { name: 'OUT2', nodes: ['OUT2', 'U1B.OUT', 'C1.1'], connections: [{ component: 'U1B', pin: 2 }, { component: 'C1', pin: 1 }] },
      ],
      groundNode: 'GND', vccNode: 'VDD',
    },
    matchingWaveform: {
      type: 'square', description: 'Double-inverted square — ~1kHz, clean edges',
      measurements: { frequency: 1000, period: 0.001, vHigh: 4.9, vLow: 0.05, vPp: 4.85, dutyCycle: 0.50, riseTime: 5e-8, fallTime: 5e-8 },
    },
    mismatchedWaveform: {
      type: 'square', description: 'Damaged output stage — slow rise, reduced swing',
      measurements: { frequency: 998, period: 0.001002, vHigh: 3.8, vLow: 0.8, vPp: 3.0, dutyCycle: 0.48, riseTime: 5e-6, fallTime: 2e-7 },
    },
  },
  {
    id: 'led-driver',
    name: 'LED Driver PWM',
    description: '2N7000 MOSFET PWM dimming',
    icon: 'led',
    netlist: {
      components: [
        { ref: 'R1', type: 'R', value: '220Ω', nodes: ['VCC', 'LED1.A'] },
        { ref: 'LED1', type: 'D', value: 'Red 2V', nodes: ['R1.2', 'Q1.D'] },
        { ref: 'Q1', type: 'Q', value: '2N7000', nodes: ['Q1.G', 'GND', 'VCC', 'LED1.2'] },
        { ref: 'R2', type: 'R', value: '1kΩ', nodes: ['PWM', 'Q1.G'] },
        { ref: 'C1', type: 'C', value: '10nF', nodes: ['Q1.G', 'GND'] },
      ],
      nets: [
        { name: 'VCC', nodes: ['VCC', 'R1.1'], connections: [{ component: 'R1', pin: 1 }] },
        { name: 'GND', nodes: ['GND', 'C1.2'], connections: [{ component: 'C1', pin: 2 }] },
        { name: 'PWM', nodes: ['PWM', 'R2.1'], connections: [{ component: 'R2', pin: 1 }] },
        { name: 'GATE', nodes: ['Q1.G', 'R2.2', 'C1.1'], connections: [{ component: 'Q1', pin: 1 }, { component: 'R2', pin: 2 }, { component: 'C1', pin: 1 }] },
      ],
      groundNode: 'GND', vccNode: 'VCC',
    },
    matchingWaveform: {
      type: 'square', description: 'PWM at gate — 500Hz, 40% duty, clean switching',
      measurements: { frequency: 500, period: 0.002, vHigh: 4.5, vLow: 0.2, vPp: 4.3, dutyCycle: 0.40, riseTime: 1e-6, fallTime: 1e-6 },
    },
    mismatchedWaveform: {
      type: 'square', description: 'Vgs(th) shifted — MOSFET partially on, high idle',
      measurements: { frequency: 500, period: 0.002, vHigh: 4.5, vLow: 2.1, vPp: 2.4, dutyCycle: 0.65, riseTime: 1e-5, fallTime: 1e-5 },
    },
  },
  {
    id: 'rc-lowpass',
    name: 'RC Low-Pass Filter',
    description: 'fc = 1/(2π·R·C), fc ≈ 1.6kHz',
    icon: 'filter',
    netlist: {
      components: [
        { ref: 'R1', type: 'R', value: '1kΩ', nodes: ['IN', 'OUT'] },
        { ref: 'C1', type: 'C', value: '100nF', nodes: ['OUT', 'GND'] },
      ],
      nets: [
        { name: 'IN', nodes: ['IN', 'R1.1'], connections: [{ component: 'R1', pin: 1 }] },
        { name: 'OUT', nodes: ['OUT', 'R1.2', 'C1.1'], connections: [{ component: 'R1', pin: 2 }, { component: 'C1', pin: 1 }] },
        { name: 'GND', nodes: ['GND', 'C1.2'], connections: [{ component: 'C1', pin: 2 }] },
      ],
      groundNode: 'GND',
    },
    matchingWaveform: {
      type: 'sine', description: 'Attenuated sine at fc — ~3dB reduction, 45° phase',
      measurements: { frequency: 1592, period: 0.000628, vHigh: 3.5, vLow: -3.5, vPp: 7.0, dutyCycle: 0.50, riseTime: 1e-5, fallTime: 1e-5 },
    },
    mismatchedWaveform: {
      type: 'sine', description: 'C drifted — cutoff shifted, heavy attenuation',
      measurements: { frequency: 1592, period: 0.000628, vHigh: 1.2, vLow: -1.2, vPp: 2.4, dutyCycle: 0.50, riseTime: 5e-5, fallTime: 5e-5 },
    },
  },
  // ── Real-World Use Cases ──
  {
    id: 'bldc-motor',
    name: 'BLDC Motor Driver',
    description: 'Automotive — 3-phase half-bridge with hall sensors',
    icon: 'motor',
    industry: 'automotive',
    useCase: 'Electric power steering motor controller — hall sensor feedback loop fails under vibration',
    failureScenario: 'Dead-time violation on low-side FET causes cross-conduction, ~40A shoot-through current melts the gate driver output',
    netlist: {
      components: [
        { ref: 'Q1', type: 'Q', value: 'IRF1405', nodes: ['VCC', 'PH_A'] },
        { ref: 'Q2', type: 'Q', value: 'IRF1405', nodes: ['PH_A', 'GND'] },
        { ref: 'Q3', type: 'Q', value: 'IRF1405', nodes: ['VCC', 'PH_B'] },
        { ref: 'Q4', type: 'Q', value: 'IRF1405', nodes: ['PH_B', 'GND'] },
        { ref: 'U1', type: 'U', value: 'DRV8323', nodes: ['VCC', 'GND', 'PWM_A', 'PWM_B', 'PWM_C', 'PH_A', 'PH_B', 'PH_C', 'OC_SET'] },
        { ref: 'R1', type: 'R', value: '10kΩ', nodes: ['OC_SET', 'GND'] },
        { ref: 'C1', type: 'C', value: '100nF', nodes: ['VCC', 'GND'] },
        { ref: 'HALL1', type: 'U', value: 'AH1808', nodes: ['VCC', 'GND', 'HALL_A'] },
        { ref: 'HALL2', type: 'U', value: 'AH1808', nodes: ['VCC', 'GND', 'HALL_B'] },
      ],
      nets: [
        { name: 'VCC', nodes: ['VCC', 'Q1.D', 'Q3.D', 'U1.VIN', 'C1.1', 'HALL1.VCC', 'HALL2.VCC'], connections: [] },
        { name: 'GND', nodes: ['GND', 'Q2.S', 'Q4.S', 'U1.GND', 'R1.2', 'C1.2', 'HALL1.GND', 'HALL2.GND'], connections: [] },
        { name: 'PH_A', nodes: ['PH_A', 'Q1.S', 'Q2.D', 'U1.SHA'], connections: [] },
        { name: 'PH_B', nodes: ['PH_B', 'Q3.S', 'Q4.D', 'U1.SHB'], connections: [] },
        { name: 'OC_SET', nodes: ['OC_SET', 'U1.OC', 'R1.1'], connections: [] },
        { name: 'HALL_A', nodes: ['HALL_A', 'HALL1.OUT'], connections: [] },
        { name: 'HALL_B', nodes: ['HALL_B', 'HALL2.OUT'], connections: [] },
      ],
      groundNode: 'GND', vccNode: 'VCC',
    },
    matchingWaveform: {
      type: 'square', description: 'PWM at 20kHz, 50% duty, clean commutation — 0-12V swing, 50ns dead time',
      measurements: { frequency: 20000, period: 0.00005, vHigh: 11.8, vLow: 0.1, vPp: 11.7, dutyCycle: 0.50, riseTime: 1.5e-7, fallTime: 1.5e-7 },
    },
    mismatchedWaveform: {
      type: 'square', description: 'Dead-time collapsed to 5ns — shoot-through at commutation edges, Vgs ringing >20V',
      measurements: { frequency: 20000, period: 0.00005, vHigh: 9.5, vLow: 2.8, vPp: 6.7, dutyCycle: 0.42, riseTime: 5e-6, fallTime: 5e-6 },
    },
  },
  {
    id: 'ecg-frontend',
    name: 'ECG Instrumentation Amplifier',
    description: 'Medical — AD620-style front-end for patient monitoring',
    icon: 'heart',
    industry: 'medical',
    useCase: 'Hospital bedside monitor — 50Hz mains hum saturates the right-leg drive amplifier',
    failureScenario: 'RFI filter capacitor C1 drifts 40%, common-mode rejection drops from 100dB to 72dB, ECG trace becomes unreadable',
    netlist: {
      components: [
        { ref: 'U1', type: 'U', value: 'AD620', nodes: ['VCC', 'GND', 'REF', 'RG1', 'RG2', 'IN+', 'IN-', 'OUT'] },
        { ref: 'R1', type: 'R', value: '499Ω', nodes: ['RG1', 'RG2'] },
        { ref: 'R2', type: 'R', value: '10kΩ', nodes: ['OUT', 'REF'] },
        { ref: 'R3', type: 'R', value: '10kΩ', nodes: ['REF', 'GND'] },
        { ref: 'C1', type: 'C', value: '100pF', nodes: ['IN+', 'GND'] },
        { ref: 'C2', type: 'C', value: '100pF', nodes: ['IN-', 'GND'] },
        { ref: 'D1', type: 'D', value: 'BAT54S', nodes: ['IN+', 'VCC', 'GND'] },
        { ref: 'D2', type: 'D', value: 'BAT54S', nodes: ['IN-', 'VCC', 'GND'] },
      ],
      nets: [
        { name: 'VCC', nodes: ['VCC', 'U1.V+', 'D1.K', 'D2.K'], connections: [] },
        { name: 'GND', nodes: ['GND', 'U1.V-', 'R3.2', 'D1.A3', 'D2.A3', 'C1.2', 'C2.2'], connections: [] },
        { name: 'REF', nodes: ['REF', 'U1.REF', 'R2.2', 'R3.1'], connections: [] },
        { name: 'RG', nodes: ['RG1', 'RG2', 'R1.1', 'R1.2', 'U1.RG1', 'U1.RG2'], connections: [] },
        { name: 'IN+', nodes: ['IN+', 'U1.IN+', 'C1.1', 'D1.A1'], connections: [] },
        { name: 'IN-', nodes: ['IN-', 'U1.IN-', 'C2.1', 'D2.A1'], connections: [] },
        { name: 'OUT', nodes: ['OUT', 'U1.OUT', 'R2.1'], connections: [] },
      ],
      groundNode: 'GND', vccNode: 'VCC',
    },
    matchingWaveform: {
      type: 'sine', description: '0.5mV p-p ECG signal at 1Hz — clean common-mode rejection, CMRR ~100dB',
      measurements: { frequency: 1, period: 1.0, vHigh: 0.00025, vLow: -0.00025, vPp: 0.0005, dutyCycle: 0.50, riseTime: 0.0001, fallTime: 0.0001 },
    },
    mismatchedWaveform: {
      type: 'sine', description: '50Hz mains hum at 200mV p-p superimposed on ECG — CMRR collapsed to 72dB',
      measurements: { frequency: 50, period: 0.02, vHigh: 0.15, vLow: -0.15, vPp: 0.30, dutyCycle: 0.50, riseTime: 0.001, fallTime: 0.001 },
    },
  },
  {
    id: 'buck-converter',
    name: 'Buck Converter',
    description: 'Power — LM2596 5V/3A step-down, 12V input',
    icon: 'buck',
    industry: 'power',
    useCase: 'Industrial 24V-rail to 5V logic supply — inductor saturates at high ambient temp',
    failureScenario: 'Inductor DCR increases 3× due to thermal aging, ripple current doubles, output capacitor heats and loses 40% capacitance, loop oscillates',
    netlist: {
      components: [
        { ref: 'U1', type: 'U', value: 'LM2596', nodes: ['VIN', 'GND', 'FB', 'SW', 'ON/OFF'] },
        { ref: 'L1', type: 'L', value: '47μH', nodes: ['SW', 'VOUT'] },
        { ref: 'D1', type: 'D', value: 'SS54', nodes: ['SW', 'GND'] },
        { ref: 'C1', type: 'C', value: '330μF', nodes: ['VIN', 'GND'] },
        { ref: 'C2', type: 'C', value: '220μF', nodes: ['VOUT', 'GND'] },
        { ref: 'R1', type: 'R', value: '3.3kΩ', nodes: ['VOUT', 'FB'] },
        { ref: 'R2', type: 'R', value: '1kΩ', nodes: ['FB', 'GND'] },
      ],
      nets: [
        { name: 'VIN', nodes: ['VIN', 'U1.VIN', 'C1.1'], connections: [] },
        { name: 'GND', nodes: ['GND', 'U1.GND', 'D1.A', 'C1.2', 'C2.2', 'R2.2'], connections: [] },
        { name: 'SW', nodes: ['SW', 'U1.SW', 'L1.1', 'D1.K'], connections: [] },
        { name: 'VOUT', nodes: ['VOUT', 'L1.2', 'C2.1', 'R1.1'], connections: [] },
        { name: 'FB', nodes: ['FB', 'U1.FB', 'R1.2', 'R2.1'], connections: [] },
      ],
      groundNode: 'GND', vccNode: 'VIN',
    },
    matchingWaveform: {
      type: 'square', description: 'Switching at 150kHz, 30% duty, 30mV p-p ripple at VOUT — stable loop',
      measurements: { frequency: 150000, period: 0.0000067, vHigh: 12.0, vLow: 0.0, vPp: 12.0, dutyCycle: 0.30, riseTime: 3e-8, fallTime: 3e-8 },
    },
    mismatchedWaveform: {
      type: 'square', description: 'Inductor saturated — 200mV p-p ripple, loop oscillating at 8kHz subharmonic, VOUT droops to 4.2V',
      measurements: { frequency: 8000, period: 0.000125, vHigh: 5.8, vLow: 4.0, vPp: 1.8, dutyCycle: 0.35, riseTime: 5e-6, fallTime: 5e-6 },
    },
  },
  {
    id: 'plc-input',
    name: 'PLC Optoisolated Input',
    description: 'Industrial — 24V sensor input with optocoupler isolation',
    icon: 'plc',
    industry: 'industrial',
    useCase: 'Factory floor proximity sensor interface — optocoupler CTR degrades with age',
    failureScenario: 'Optocoupler current transfer ratio drops from 100% to 30% after 50k hours, logic input never triggers, machine loses all reference sensors',
    netlist: {
      components: [
        { ref: 'R1', type: 'R', value: '2.7kΩ', nodes: ['SENSOR_IN', 'OC1.A'] },
        { ref: 'OC1', type: 'U', value: 'PC817', nodes: ['OC1.A', 'OC1.K', 'OC1.C', 'OC1.E'] },
        { ref: 'R2', type: 'R', value: '10kΩ', nodes: ['OC1.C', 'VCC'] },
        { ref: 'R3', type: 'R', value: '100kΩ', nodes: ['OC1.E', 'GND'] },
        { ref: 'C1', type: 'C', value: '10nF', nodes: ['OC1.E', 'GND'] },
        { ref: 'D1', type: 'D', value: '1N4148', nodes: ['OC1.K', 'GND'] },
        { ref: 'U2', type: 'U', value: 'SN74HC14', nodes: ['VCC', 'GND', 'OC1.E', 'LOGIC_OUT'] },
      ],
      nets: [
        { name: 'SENSOR_IN', nodes: ['SENSOR_IN', 'R1.1'], connections: [] },
        { name: 'VCC', nodes: ['VCC', 'R2.1', 'U2.VCC'], connections: [] },
        { name: 'GND', nodes: ['GND', 'D1.K', 'C1.2', 'R3.2', 'U2.GND', 'OC1.K'], connections: [] },
        { name: 'OC_EMIT', nodes: ['OC1.E', 'R3.1', 'C1.1', 'U2.IN'], connections: [] },
        { name: 'OC_COLL', nodes: ['OC1.C', 'R2.2'], connections: [] },
        { name: 'LOGIC_OUT', nodes: ['LOGIC_OUT', 'U2.OUT'], connections: [] },
      ],
      groundNode: 'GND', vccNode: 'VCC',
    },
    matchingWaveform: {
      type: 'square', description: '24V sensor pulse → 5V logic level, <10μs propagation delay, clean edges',
      measurements: { frequency: 1000, period: 0.001, vHigh: 4.9, vLow: 0.05, vPp: 4.85, dutyCycle: 0.10, riseTime: 8e-7, fallTime: 6e-7 },
    },
    mismatchedWaveform: {
      type: 'square', description: 'CTR collapsed — logic output never reaches 2.5V threshold, output stuck low',
      measurements: { frequency: 1000, period: 0.001, vHigh: 1.8, vLow: 0.05, vPp: 1.75, dutyCycle: 0.02, riseTime: 5e-5, fallTime: 1e-4 },
    },
  },
]

// Generate a physical CSV file for download
export function generateSampleCSV(circuitId: string, type: 'matching' | 'mismatched'): string {
  let freq = 1000
  let isSquare = true
  let vMax = 5.0
  let vMin = 0.0
  let duty = 0.5

  if (circuitId === '555-astable') {
    freq = type === 'matching' ? 937.5 : 780
    vMax = type === 'matching' ? 4.8 : 4.2
    vMin = type === 'matching' ? 0.1 : 0.6
    duty = type === 'matching' ? 0.667 : 0.55
  } else if (circuitId === 'rc-lowpass') {
    freq = 1592
    isSquare = false
    vMax = type === 'matching' ? 3.5 : 1.2
    vMin = type === 'matching' ? -3.5 : -1.2
  } else if (circuitId === 'led-driver') {
    freq = 500
    vMax = 4.5
    vMin = type === 'matching' ? 0.2 : 2.1
    duty = type === 'matching' ? 0.40 : 0.65
  } else {
    freq = 1000
    vMax = 5.0
    vMin = 0.0
    duty = 0.5
  }

  const period = 1 / freq
  const duration = period * 5 // Show 5 periods
  const steps = 1000
  const stepSize = duration / steps

  let csvContent = 'Time (s),Channel 1 (V)\n'

  for (let i = 0; i < steps; i++) {
    const t = i * stepSize
    let v = 0

    if (isSquare) {
      const phase = (t % period) / period
      v = phase < duty ? vMax : vMin
      
      // Add simple rise/fall exponential delay simulation
      const timeInState = (t % period) - (phase < duty ? 0 : duty * period)
      const tau = period * 0.01 // rise/fall time constant
      if (phase < duty) {
        v = vMin + (vMax - vMin) * (1 - Math.exp(-timeInState / tau))
      } else {
        v = vMax - (vMax - vMin) * (1 - Math.exp(-timeInState / tau))
      }
    } else {
      // Sine wave
      v = ((vMax - vMin) / 2) * Math.sin(2 * Math.PI * freq * t) + ((vMax + vMin) / 2)
    }

    // Add tiny physical noise
    v += (Math.random() - 0.5) * 0.03

    csvContent += `${t.toFixed(9)},${v.toFixed(4)}\n`
  }

  return csvContent
}
