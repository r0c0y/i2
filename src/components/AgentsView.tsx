import { useState } from 'react'

type Agent = {
  id: string; name: string; role: string; model: string; speed: string; verification: string; group: string
}

const AGENTS: Agent[] = [
  { id: 'wing-a', name: 'Vision Inspectors', role: '4-quadrant PCB defect detection via pixel analysis + Cerebras vision', model: 'Cerebras Gemma 4 31B + local heuristics', speed: '50-150ms local · 500-4000ms vision API', verification: '8 defect categories (solder_bridge, cold_joint, missing_component, misalignment, scratch, crack, polarity, contamination) with confidence 0-1', group: 'Cadence · Analysis Wings' },
  { id: 'wing-b', name: 'Root-Cause Analyst', role: 'Cross-references defects against troubleshooting manual to diagnose root cause', model: 'Cerebras Gemma 4 31B (structured JSON schema)', speed: '500-3000ms', verification: 'ROOT_CAUSE_SCHEMA validation — produces root cause, evidence, affected components, recommended fix, confidence score, knowledge graph triplets', group: 'Cadence · Analysis Wings' },
  { id: 'wing-c', name: 'Alert Dispatcher', role: 'Determines line actions and formats alerts based on defect severity', model: 'Rule engine + Cerebras Gemma 4 31B (alert formatting)', speed: '150-200ms rule · 300-1500ms LLM', verification: 'Severity rules trigger tool calls (stop_line, alert_supervisor, quarantine_batch). LLM only formats alert text.', group: 'Cadence · Analysis Wings' },
  { id: 'specialist-0', name: 'Solder Specialist', role: 'Solder joint defect analysis and classification', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms (part of debate LLM)', verification: 'Debate references Troubleshooting Manual sections and Knowledge Graph facts', group: 'Cadence · Specialists' },
  { id: 'specialist-1', name: 'IC Specialist', role: 'IC/pin-level defect analysis and placement verification', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Cross-references golden master component positions', group: 'Cadence · Specialists' },
  { id: 'specialist-2', name: 'Capacitor Specialist', role: 'Capacitor fault analysis (value drift, polarity, damage)', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Compares against expected capacitor characteristics', group: 'Cadence · Specialists' },
  { id: 'specialist-3', name: 'Resistor Specialist', role: 'Resistor tolerance analysis and value verification', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Validates resistor markings and color codes', group: 'Cadence · Specialists' },
  { id: 'specialist-4', name: 'Traces Specialist', role: 'PCB trace/path integrity analysis', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Detects open/short circuits in trace paths', group: 'Cadence · Specialists' },
  { id: 'specialist-5', name: 'Contamination Auditor', role: 'Flux/residue/contamination detection on PCB surface', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Flags areas with unusual reflectivity or residue patterns', group: 'Cadence · Specialists' },
  { id: 'specialist-6', name: 'Warp Analyst', role: 'PCB warpage and mechanical deformation analysis', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Measures board flatness against golden master', group: 'Cadence · Specialists' },
  { id: 'specialist-7', name: 'Connector Analyst', role: 'Connector integrity and pin alignment verification', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Checks connector seating and pin visibility', group: 'Cadence · Specialists' },
  { id: 'specialist-8', name: 'QA Coordinator', role: 'Quality assurance lead — champions consensus on defect severity', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Synthesizes specialist opinions into unified verdict', group: 'Cadence · Specialists' },
  { id: 'specialist-9', name: 'Process Engineer', role: 'Manufacturing process optimization recommendations', model: 'Cerebras Gemma 4 31B (debate generation)', speed: '500-3000ms', verification: 'Correlates defects with process parameters', group: 'Cadence · Specialists' },
  { id: 'dispatcher-0', name: 'Line Controller', role: 'Executes line stop/start based on defect criticality', model: 'Rule-based thresholds', speed: '~150ms', verification: 'eStopThreshold config — critical defects trigger immediate stop_line', group: 'Cadence · Dispatchers' },
  { id: 'dispatcher-1', name: 'Alert Dispatcher', role: 'Sends supervisor notifications with defect summaries', model: 'Rule-based + Cerebras Gemma 4 31B', speed: '~150-200ms', verification: 'Severity-based routing: critical → page supervisor, major → log', group: 'Cadence · Dispatchers' },
  { id: 'dispatcher-2', name: 'Inventory Manager', role: 'Quarantines defective batches and tracks inventory impact', model: 'Rule-based', speed: '~150ms', verification: 'Triggers quarantine_batch tool for critical defects', group: 'Cadence · Dispatchers' },
  { id: 'dispatcher-3', name: 'Audit Archivist', role: 'Logs all tool executions and defect history for traceability', model: 'Rule-based logging', speed: '~150ms', verification: 'Persists every action to audit trail', group: 'Cadence · Dispatchers' },
  { id: 'dispatcher-4', name: 'Safety Monitor', role: 'Monitors for safety-critical events and escalates', model: 'Rule-based monitoring', speed: '~150ms', verification: 'Flags critical defects with safety implications', group: 'Cadence · Dispatchers' },
  { id: 'lead-0', name: 'QA Coordinator (Lead)', role: 'Coordination and routing between swarm agents', model: 'Routing only', speed: 'Instant', verification: 'Logs state transitions and announces final consensus', group: 'Cadence · Leads' },
  { id: 'lead-1', name: 'Operations Director', role: 'Announces final verdict and orchestrates dispatch phase', model: 'Routing only', speed: 'Instant', verification: 'Reports final pass/fail verdict with confidence score', group: 'Cadence · Leads' },
  { id: 'lead-2', name: 'Swarm Lead', role: 'Initializes swarm, dispatches work items, collects results', model: 'Orchestration', speed: 'Instant', verification: 'Initializes 100 inspector work items in parallel via Promise.all', group: 'Cadence · Leads' },
  { id: 'circuit-vision', name: 'Vision Agent (Netlist Extractor)', role: 'OCR + parse: extracts netlist from schematic images or KiCad files', model: 'Cerebras Gemma 4 31B multimodal + local KiCad parser', speed: '~10ms (KiCad) · 500-4000ms (image)', verification: 'NETLIST_SCHEMA validation — ensures components have ref, type, value, nodes', group: 'CircuitScope · Pipeline' },
  { id: 'circuit-theory', name: 'Theory Agent (Math + LLM Predictor)', role: 'Calculates circuit math (frequency, duty cycle, Vpp) + LLM behavior prediction', model: 'Local JS formulas + Cerebras Gemma 4 31B text', speed: '~1ms math · 500-4000ms LLM', verification: 'Dual: hard formulas for 555 timer, RC filters, MOSFET drivers. LLM predicts waveform type and issues. Math overrides LLM frequency.', group: 'CircuitScope · Pipeline' },
  { id: 'circuit-verify', name: 'Verification Agent (Synthesizer Judge)', role: 'Compares theoretical predictions vs oscilloscope telemetry, diagnoses faults', model: 'Local rule-based comparison engine', speed: '~1-10ms', verification: 'Weighted scoring (frequency ±50%, duty cycle ±20%, voltage, rise/fall). Cross-run memory via localStorage history.', group: 'CircuitScope · Pipeline' },
]

const GROUPS = ['Cadence · Analysis Wings', 'Cadence · Specialists', 'Cadence · Dispatchers', 'Cadence · Leads', 'CircuitScope · Pipeline']
const GROUP_ICONS: Record<string, string> = {
  'Cadence · Analysis Wings': 'eye',
  'Cadence · Specialists': 'brain',
  'Cadence · Dispatchers': 'zap',
  'Cadence · Leads': 'shield',
  'CircuitScope · Pipeline': 'cpu',
}

export function AgentsView() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div style={{ padding: '2rem', overflow: 'auto', height: 'calc(100vh - 48px)', background: 'oklch(0.165 0.022 285)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'oklch(0.64 0.2 300)', marginBottom: '0.5rem' }}>Agent Network</div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>121 agents. One unified swarm.</h1>
          <p style={{ marginTop: '0.75rem', color: 'oklch(0.76 0.022 285)', maxWidth: '36rem', lineHeight: 1.7 }}>
            Every agent, its backing model, speed, and verification method — from the 100 area inspectors scanning PCB quadrants to the CircuitScope pipeline debugging hardware.
          </p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Agents', value: '121' },
            { label: 'Cerebras-backed', value: '15' },
            { label: 'Rule-based', value: '106' },
            { label: 'Inspection Wings', value: '3' },
            { label: 'Avg Inspection', value: '<1s' },
            { label: 'Verification Engines', value: '3' },
          ].map(s => (
            <div key={s.label} style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid oklch(0.33 0.03 285 / 0.6)', background: 'oklch(0.135 0.02 285 / 0.5)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'oklch(0.64 0.2 300)' }}>{s.value}</div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'oklch(0.76 0.022 285)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Agent groups */}
        {GROUPS.map(group => {
          const agents = AGENTS.filter(a => a.group === group)
          const isOpen = expanded === group
          return (
            <div key={group} style={{ marginBottom: '1.5rem', borderRadius: '1rem', border: '1px solid oklch(0.33 0.03 285 / 0.6)', overflow: 'hidden', background: 'oklch(0.135 0.02 285 / 0.3)' }}>
              <button onClick={() => setExpanded(isOpen ? null : group)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', border: 'none', background: 'oklch(0.21 0.028 285 / 0.5)', color: 'oklch(0.97 0.008 285)', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IconAgentGroup type={GROUP_ICONS[group]} />
                  {group}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'oklch(0.64 0.2 300)', fontFamily: "'JetBrains Mono', monospace" }}>{agents.length} agents</span>
                </span>
                <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {isOpen && (
                <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
                  {group === 'Cadence · Analysis Wings' && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'oklch(0.64 0.2 300 / 0.08)', border: '1px solid oklch(0.64 0.2 300 / 0.2)', fontSize: '0.8125rem', color: 'oklch(0.76 0.022 285)', lineHeight: 1.6 }}>
                      <strong style={{ color: 'oklch(0.97 0.008 285)' }}>Architecture:</strong> The 100 Area Inspectors delegate to Wing A (Vision). The 10 Specialists delegate to Wing B (Root Cause). The 5 Dispatchers delegate to Wing C (Alert). Each wing is a single Cerebras-backed function, not 100 independent API calls.
                    </div>
                  )}
                  {agents.map(a => (
                    <div key={a.id} style={{ marginBottom: '0.5rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid oklch(0.33 0.03 285 / 0.4)', background: 'oklch(0.165 0.022 285 / 0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <strong style={{ fontSize: '0.9375rem' }}>{a.name}</strong>
                            <ModelBadge model={a.model} />
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'oklch(0.76 0.022 285)' }}>{a.role}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'oklch(0.64 0.2 300)' }}>{a.speed}</div>
                        </div>
                      </div>
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'oklch(0.64 0.2 300)', fontFamily: "'JetBrains Mono', monospace" }}>Verification & Logic</summary>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'oklch(0.76 0.022 285)', lineHeight: 1.6 }}>{a.verification}</p>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom CTA */}
        <div style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '1rem', border: '1px solid oklch(0.64 0.2 300 / 0.3)', background: 'oklch(0.64 0.2 300 / 0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'oklch(0.76 0.022 285)', margin: 0 }}>
            <strong style={{ color: 'white' }}>Every agent runs on Cerebras Gemma 4 31B</strong> — the fastest inference hardware available. No GPU bottlenecks. No rate limiting. Sub-50ms TTFT for every agent call.
          </p>
        </div>
      </div>
    </div>
  )
}

function IconAgentGroup({ type }: { type: string }) {
  const props = { width: 18, height: 18, fill: 'none', stroke: 'oklch(0.64 0.2 300)', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'eye': return <svg {...props} viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'brain': return <svg {...props} viewBox="0 0 24 24"><path d="M12 5a3 3 0 10-5.997.125 4 4 0 00-2.526 5.77 4 4 0 00.556 6.588A4 4 0 1012 18z" /><path d="M12 5a3 3 0 115.997.125 4 4 0 012.526 5.77 4 4 0 01-.556 6.588A4 4 0 1112 18z" /><path d="M15 13a4.5 4.5 0 01-3-4 4.5 4.5 0 01-3 4" /></svg>
    case 'zap': return <svg {...props} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    case 'shield': return <svg {...props} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'cpu': return <svg {...props} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /></svg>
    default: return null
  }
}

function ModelBadge({ model }: { model: string }) {
  const isCerebras = model.includes('Cerebras')
  const isRule = model.includes('Rule') || model.includes('Routing') || model.includes('Orchestration') || model.includes('rule-based')
  const isLocal = model.includes('local') || model.includes('Local')
  const bg = isCerebras ? 'oklch(0.64 0.2 300 / 0.12)' : isRule ? 'oklch(0.8 0.16 75 / 0.1)' : 'oklch(0.82 0.16 162 / 0.1)'
  const color = isCerebras ? 'oklch(0.64 0.2 300)' : isRule ? 'oklch(0.8 0.16 75)' : 'oklch(0.82 0.16 162)'
  const label = isCerebras ? 'Cerebras' : isRule ? 'Rule' : 'Local'
  return <span style={{ fontSize: '0.6rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", padding: '0.125rem 0.375rem', borderRadius: '0.25rem', background: bg, color, border: `1px solid ${color}40`, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
}
