import { useState } from 'react'
import type { Component } from '../types'

interface Props {
  components: Component[]
  onComponentClick?: (ref: string) => void
  selectedRef?: string | null
  circuitId?: string
}

export function CircuitDiagram({ components, onComponentClick, selectedRef, circuitId }: Props) {
  const [hoveredRef, setHoveredRef] = useState<string | null>(null)

  const highlightColor = (ref: string) => {
    if (selectedRef === ref) return 'var(--accent-bright)'
    if (hoveredRef === ref) return '#4ecdc4'
    return '#888'
  }

  if (circuitId === 'rc-lowpass') return <RCFilterDiagram highlightColor={highlightColor} onComponentClick={onComponentClick} setHoveredRef={setHoveredRef} hoveredRef={hoveredRef ?? null} selectedRef={selectedRef ?? null} components={components} />
  if (circuitId === 'cmos-inverter') return <InverterDiagram highlightColor={highlightColor} onComponentClick={onComponentClick} setHoveredRef={setHoveredRef} hoveredRef={hoveredRef ?? null} selectedRef={selectedRef ?? null} components={components} />
  if (circuitId === 'led-driver') return <LEDDriverDiagram highlightColor={highlightColor} onComponentClick={onComponentClick} setHoveredRef={setHoveredRef} hoveredRef={hoveredRef ?? null} selectedRef={selectedRef ?? null} components={components} />
  return <Timer555Diagram highlightColor={highlightColor} onComponentClick={onComponentClick} setHoveredRef={setHoveredRef} hoveredRef={hoveredRef ?? null} selectedRef={selectedRef ?? null} components={components} />
}

interface DiagramProps {
  highlightColor: (ref: string) => string
  onComponentClick?: (ref: string) => void
  setHoveredRef: (ref: string | null) => void
  hoveredRef: string | null
  selectedRef: string | null
  components: Component[]
}

function ComponentTooltip({ components, hoveredRef, selectedRef }: { components: Component[]; hoveredRef: string | null; selectedRef: string | null }) {
  const ref = hoveredRef || selectedRef
  if (!ref) return null
  const info = components.find(c => c.ref === ref)
  if (!info) return null
  return (
    <div className="component-tooltip">
      <span className="tooltip-ref">{info.ref}</span>
      <span className="tooltip-type">{info.type}</span>
      <span className="tooltip-value">{info.value}</span>
      <span className="tooltip-nodes">{info.nodes.join(' → ')}</span>
    </div>
  )
}

function Timer555Diagram({ highlightColor, onComponentClick, setHoveredRef, hoveredRef, selectedRef, components }: DiagramProps) {
  const R = (ref: string, x: number, y: number, label: string, val: string, vert = true) => (
    <g className="component" onClick={() => onComponentClick?.(ref)} onMouseEnter={() => setHoveredRef(ref)} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
      {vert ? (
        <>
          <line x1={x} y1={y} x2={x} y2={y+20} stroke={highlightColor(ref)} strokeWidth="2"/>
          <rect x={x-8} y={y+20} width={16} height={40} fill="none" stroke={highlightColor(ref)} strokeWidth="2"/>
          <line x1={x} y1={y+60} x2={x} y2={y+80} stroke={highlightColor(ref)} strokeWidth="2"/>
        </>
      ) : (
        <>
          <line x1={x} y1={y} x2={x+20} y2={y} stroke={highlightColor(ref)} strokeWidth="2"/>
          <rect x={x+20} y={y-8} width={40} height={16} fill="none" stroke={highlightColor(ref)} strokeWidth="2"/>
          <line x1={x+60} y1={y} x2={x+80} y2={y} stroke={highlightColor(ref)} strokeWidth="2"/>
        </>
      )}
      <text x={x+14} y={y+42} fill={highlightColor(ref)} fontSize="10" fontFamily="monospace">{label}</text>
      <text x={x+14} y={y+56} fill="#666" fontSize="8" fontFamily="monospace">{val}</text>
    </g>
  )

  return (
    <div className="circuit-diagram">
      <svg viewBox="0 0 600 400" className="circuit-svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a2a" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="600" height="400" fill="#0a0a0f"/>
        <rect width="600" height="400" fill="url(#grid)"/>

        {/* Rails */}
        <line x1="50" y1="40" x2="550" y2="40" stroke="var(--red)" strokeWidth="2" className="vcc-rail"/>
        <text x="20" y="44" fill="var(--red)" fontSize="12" fontFamily="monospace">VCC</text>
        <line x1="50" y1="360" x2="550" y2="360" stroke="var(--text-dim)" strokeWidth="2" className="gnd-rail"/>
        <text x="20" y="364" fill="var(--text-dim)" fontSize="12" fontFamily="monospace">GND</text>

        {/* R1 vertical */}
        {R('R1', 150, 40, 'R1', '1kΩ')}

        {/* R2 vertical */}
        {R('R2', 150, 140, 'R2', '10kΩ')}

        {/* DIS node */}
        <circle cx="150" cy="140" r="4" fill={highlightColor('R2')}/>
        <text x="110" y="145" fill="var(--orange)" fontSize="10" fontFamily="monospace">DIS</text>

        {/* C1 */}
        <g className="component" onClick={() => onComponentClick?.('C1')} onMouseEnter={() => setHoveredRef('C1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="150" y1="240" x2="150" y2="290" stroke={highlightColor('C1')} strokeWidth="2"/>
          <line x1="135" y1="290" x2="165" y2="290" stroke={highlightColor('C1')} strokeWidth="3"/>
          <line x1="135" y1="300" x2="165" y2="300" stroke={highlightColor('C1')} strokeWidth="3"/>
          <line x1="150" y1="300" x2="150" y2="360" stroke={highlightColor('C1')} strokeWidth="2"/>
          <text x="170" y="298" fill={highlightColor('C1')} fontSize="10" fontFamily="monospace">C1</text>
          <text x="170" y="313" fill="#666" fontSize="8" fontFamily="monospace">100nF</text>
        </g>

        {/* THR node */}
        <circle cx="150" cy="240" r="4" fill={highlightColor('C1')}/>
        <text x="110" y="245" fill="var(--orange)" fontSize="10" fontFamily="monospace">THR</text>

        {/* 555 IC */}
        <rect x="280" y="100" width="80" height="200" fill="#1a1a25" stroke="var(--green)" strokeWidth="2" rx="4"/>
        <text x="300" y="205" fill="var(--green)" fontSize="14" fontFamily="monospace" fontWeight="bold">NE555</text>

        {/* Pins */}
        <line x1="280" y1="120" x2="240" y2="120" stroke="var(--red)" strokeWidth="1.5"/><circle cx="240" cy="120" r="3" fill="var(--red)"/><text x="220" y="124" fill="var(--red)" fontSize="9" fontFamily="monospace">VCC</text>
        <line x1="280" y1="150" x2="240" y2="150" stroke="var(--red)" strokeWidth="1.5"/><circle cx="240" cy="150" r="3" fill="var(--red)"/><text x="220" y="154" fill="var(--red)" fontSize="9" fontFamily="monospace">RST</text>
        <line x1="360" y1="180" x2="400" y2="180" stroke="var(--orange)" strokeWidth="1.5"/><circle cx="400" cy="180" r="3" fill="var(--orange)"/><text x="410" y="184" fill="var(--orange)" fontSize="9" fontFamily="monospace">DIS</text>
        <line x1="360" y1="210" x2="400" y2="210" stroke="var(--orange)" strokeWidth="1.5"/><circle cx="400" cy="210" r="3" fill="var(--orange)"/><text x="410" y="214" fill="var(--orange)" fontSize="9" fontFamily="monospace">THR</text>
        <line x1="360" y1="240" x2="400" y2="240" stroke="var(--accent)" strokeWidth="1.5"/><circle cx="400" cy="240" r="3" fill="var(--accent)"/><text x="410" y="244" fill="var(--accent)" fontSize="9" fontFamily="monospace">TRI</text>
        <line x1="360" y1="270" x2="400" y2="270" stroke="var(--green)" strokeWidth="1.5"/><circle cx="400" cy="270" r="3" fill="var(--green)"/><text x="410" y="274" fill="var(--green)" fontSize="9" fontFamily="monospace">OUT</text>
        <line x1="280" y1="270" x2="240" y2="270" stroke="var(--yellow)" strokeWidth="1.5"/><circle cx="240" cy="270" r="3" fill="var(--yellow)"/><text x="220" y="274" fill="var(--yellow)" fontSize="9" fontFamily="monospace">CTRL</text>
        <line x1="280" y1="290" x2="240" y2="290" stroke="var(--text-dim)" strokeWidth="1.5"/><circle cx="240" cy="290" r="3" fill="var(--text-dim)"/>

        {/* C2 */}
        <g className="component" onClick={() => onComponentClick?.('C2')} onMouseEnter={() => setHoveredRef('C2')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="240" y1="270" x2="240" y2="310" stroke={highlightColor('C2')} strokeWidth="1.5"/>
          <line x1="225" y1="310" x2="255" y2="310" stroke={highlightColor('C2')} strokeWidth="2"/>
          <line x1="225" y1="318" x2="255" y2="318" stroke={highlightColor('C2')} strokeWidth="2"/>
          <line x1="240" y1="318" x2="240" y2="360" stroke={highlightColor('C2')} strokeWidth="1.5"/>
          <text x="260" y="316" fill={highlightColor('C2')} fontSize="10" fontFamily="monospace">C2</text>
          <text x="260" y="328" fill="#666" fontSize="8" fontFamily="monospace">10nF</text>
        </g>

        {/* Output */}
        <line x1="400" y1="270" x2="500" y2="270" stroke="var(--green)" strokeWidth="2"/>
        <text x="510" y="274" fill="var(--green)" fontSize="11" fontFamily="monospace">OUT</text>

        {/* Connections */}
        <line x1="150" y1="40" x2="240" y2="40" stroke="var(--red)" strokeWidth="1.5"/>
        <line x1="240" y1="40" x2="240" y2="120" stroke="var(--red)" strokeWidth="1.5"/>
        <line x1="150" y1="140" x2="240" y2="140" stroke="var(--orange)" strokeWidth="1.5"/>
        <line x1="240" y1="140" x2="280" y2="180" stroke="var(--orange)" strokeWidth="1.5"/>
        <line x1="150" y1="240" x2="400" y2="240" stroke="var(--accent)" strokeWidth="1.5"/>
        <line x1="400" y1="240" x2="400" y2="210" stroke="var(--orange)" strokeWidth="1.5"/>
        <line x1="150" y1="360" x2="240" y2="360" stroke="var(--text-dim)" strokeWidth="1.5"/>
        <line x1="240" y1="360" x2="240" y2="290" stroke="var(--text-dim)" strokeWidth="1.5"/>

        {/* Output waveform hint */}
        <g transform="translate(480, 300)">
          <text x="0" y="0" fill="var(--green)" fontSize="9" fontFamily="monospace">Expected:</text>
          <polyline points="0,20 10,20 10,0 20,0 20,20 30,20 30,0 40,0 40,20 50,20" fill="none" stroke="var(--green)" strokeWidth="1.5"/>
        </g>
      </svg>
      <ComponentTooltip components={components} hoveredRef={hoveredRef} selectedRef={selectedRef} />
    </div>
  )
}

function RCFilterDiagram({ highlightColor, onComponentClick, setHoveredRef, hoveredRef, selectedRef, components }: DiagramProps) {
  return (
    <div className="circuit-diagram">
      <svg viewBox="0 0 600 300" className="circuit-svg">
        <defs><pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a2a" strokeWidth="0.5"/></pattern></defs>
        <rect width="600" height="300" fill="#0a0a0f"/>
        <rect width="600" height="300" fill="url(#grid2)"/>

        {/* Input */}
        <text x="40" y="155" fill="var(--text-dim)" fontSize="12" fontFamily="monospace">IN</text>
        <line x1="70" y1="150" x2="140" y2="150" stroke="var(--accent)" strokeWidth="2"/>

        {/* R1 */}
        <g className="component" onClick={() => onComponentClick?.('R1')} onMouseEnter={() => setHoveredRef('R1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="140" y1="150" x2="170" y2="150" stroke={highlightColor('R1')} strokeWidth="2"/>
          <rect x="170" y="140" width="80" height="20" fill="none" stroke={highlightColor('R1')} strokeWidth="2"/>
          <line x1="250" y1="150" x2="300" y2="150" stroke={highlightColor('R1')} strokeWidth="2"/>
          <text x="190" y="138" fill={highlightColor('R1')} fontSize="11" fontFamily="monospace">R1</text>
          <text x="190" y="175" fill="#666" fontSize="9" fontFamily="monospace">1kΩ</text>
        </g>

        {/* Node dot */}
        <circle cx="300" cy="150" r="4" fill="var(--accent)"/>

        {/* C1 to ground */}
        <g className="component" onClick={() => onComponentClick?.('C1')} onMouseEnter={() => setHoveredRef('C1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="300" y1="154" x2="300" y2="190" stroke={highlightColor('C1')} strokeWidth="2"/>
          <line x1="280" y1="190" x2="320" y2="190" stroke={highlightColor('C1')} strokeWidth="3"/>
          <line x1="280" y1="200" x2="320" y2="200" stroke={highlightColor('C1')} strokeWidth="3"/>
          <line x1="300" y1="200" x2="300" y2="240" stroke={highlightColor('C1')} strokeWidth="2"/>
          <text x="330" y="198" fill={highlightColor('C1')} fontSize="11" fontFamily="monospace">C1</text>
          <text x="330" y="213" fill="#666" fontSize="9" fontFamily="monospace">100nF</text>
        </g>

        {/* GND */}
        <line x1="290" y1="240" x2="310" y2="240" stroke="var(--text-dim)" strokeWidth="2"/>
        <line x1="293" y1="245" x2="307" y2="245" stroke="var(--text-dim)" strokeWidth="2"/>
        <line x1="296" y1="250" x2="304" y2="250" stroke="var(--text-dim)" strokeWidth="2"/>
        <text x="315" y="248" fill="var(--text-dim)" fontSize="10" fontFamily="monospace">GND</text>

        {/* Output */}
        <line x1="300" y1="150" x2="430" y2="150" stroke="var(--green)" strokeWidth="2"/>
        <text x="440" y="155" fill="var(--green)" fontSize="12" fontFamily="monospace">OUT</text>

        {/* Cutoff freq */}
        <text x="200" y="280" fill="var(--text-dim)" fontSize="10" fontFamily="monospace">fc = 1/(2π·R·C) ≈ 1.59 kHz</text>

        {/* Waveform hint */}
        <g transform="translate(430, 170)">
          <text x="0" y="0" fill="var(--green)" fontSize="9" fontFamily="monospace">f &lt; fc: pass</text>
          <text x="0" y="14" fill="var(--green)" fontSize="9" fontFamily="monospace">f &gt; fc: attenuate</text>
        </g>
      </svg>
      <ComponentTooltip components={components} hoveredRef={hoveredRef} selectedRef={selectedRef} />
    </div>
  )
}

function InverterDiagram({ highlightColor, onComponentClick, setHoveredRef, hoveredRef, selectedRef, components }: DiagramProps) {
  return (
    <div className="circuit-diagram">
      <svg viewBox="0 0 600 300" className="circuit-svg">
        <defs><pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a2a" strokeWidth="0.5"/></pattern></defs>
        <rect width="600" height="300" fill="#0a0a0f"/>
        <rect width="600" height="300" fill="url(#grid3)"/>

        {/* VDD rail */}
        <line x1="50" y1="40" x2="550" y2="40" stroke="var(--red)" strokeWidth="2"/>
        <text x="20" y="44" fill="var(--red)" fontSize="12" fontFamily="monospace">VDD</text>

        {/* GND rail */}
        <line x1="50" y1="260" x2="550" y2="260" stroke="var(--text-dim)" strokeWidth="2"/>
        <text x="20" y="264" fill="var(--text-dim)" fontSize="12" fontFamily="monospace">GND</text>

        {/* Input */}
        <text x="30" y="155" fill="var(--text-dim)" fontSize="12" fontFamily="monospace">IN</text>
        <line x1="60" y1="150" x2="120" y2="150" stroke="var(--accent)" strokeWidth="2"/>

        {/* R1 pullup */}
        <g className="component" onClick={() => onComponentClick?.('R1')} onMouseEnter={() => setHoveredRef('R1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="120" y1="150" x2="120" y2="80" stroke={highlightColor('R1')} strokeWidth="2"/>
          <rect x="112" y="60" width="16" height="40" fill="none" stroke={highlightColor('R1')} strokeWidth="2"/>
          <line x1="120" y1="60" x2="120" y2="40" stroke={highlightColor('R1')} strokeWidth="2"/>
          <line x1="120" y1="40" x2="240" y2="40" stroke="var(--red)" strokeWidth="1.5"/>
          <text x="135" y="82" fill={highlightColor('R1')} fontSize="10" fontFamily="monospace">R1 10kΩ</text>
        </g>

        {/* First inverter U1A */}
        <g className="component" onClick={() => onComponentClick?.('U1A')} onMouseEnter={() => setHoveredRef('U1A')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <polygon points="180,120 180,180 240,150" fill="none" stroke={highlightColor('U1A')} strokeWidth="2"/>
          <circle cx="244" cy="150" r="4" fill="none" stroke={highlightColor('U1A')} strokeWidth="2"/>
          <text x="195" y="155" fill={highlightColor('U1A')} fontSize="10" fontFamily="monospace">U1A</text>
          <text x="195" y="170" fill="#666" fontSize="8" fontFamily="monospace">CD4049</text>
        </g>

        {/* Wire between inverters */}
        <line x1="248" y1="150" x2="310" y2="150" stroke="var(--green)" strokeWidth="2"/>
        <text x="265" y="142" fill="var(--green)" fontSize="9" fontFamily="monospace">OUT1</text>

        {/* Second inverter U1B */}
        <g className="component" onClick={() => onComponentClick?.('U1B')} onMouseEnter={() => setHoveredRef('U1B')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <polygon points="310,120 310,180 370,150" fill="none" stroke={highlightColor('U1B')} strokeWidth="2"/>
          <circle cx="374" cy="150" r="4" fill="none" stroke={highlightColor('U1B')} strokeWidth="2"/>
          <text x="325" y="155" fill={highlightColor('U1B')} fontSize="10" fontFamily="monospace">U1B</text>
          <text x="325" y="170" fill="#666" fontSize="8" fontFamily="monospace">CD4049</text>
        </g>

        {/* C1 load cap */}
        <g className="component" onClick={() => onComponentClick?.('C1')} onMouseEnter={() => setHoveredRef('C1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="400" y1="150" x2="400" y2="190" stroke={highlightColor('C1')} strokeWidth="2"/>
          <line x1="385" y1="190" x2="415" y2="190" stroke={highlightColor('C1')} strokeWidth="3"/>
          <line x1="385" y1="200" x2="415" y2="200" stroke={highlightColor('C1')} strokeWidth="3"/>
          <line x1="400" y1="200" x2="400" y2="260" stroke={highlightColor('C1')} strokeWidth="2"/>
          <text x="420" y="198" fill={highlightColor('C1')} fontSize="10" fontFamily="monospace">C1 100pF</text>
        </g>

        {/* Output */}
        <line x1="378" y1="150" x2="460" y2="150" stroke="var(--green)" strokeWidth="2"/>
        <text x="470" y="155" fill="var(--green)" fontSize="12" fontFamily="monospace">OUT</text>
      </svg>
      <ComponentTooltip components={components} hoveredRef={hoveredRef} selectedRef={selectedRef} />
    </div>
  )
}

function LEDDriverDiagram({ highlightColor, onComponentClick, setHoveredRef, hoveredRef, selectedRef, components }: DiagramProps) {
  return (
    <div className="circuit-diagram">
      <svg viewBox="0 0 600 300" className="circuit-svg">
        <defs><pattern id="grid4" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a2a" strokeWidth="0.5"/></pattern></defs>
        <rect width="600" height="300" fill="#0a0a0f"/>
        <rect width="600" height="300" fill="url(#grid4)"/>

        {/* VCC */}
        <line x1="50" y1="40" x2="300" y2="40" stroke="var(--red)" strokeWidth="2"/>
        <text x="20" y="44" fill="var(--red)" fontSize="12" fontFamily="monospace">VCC</text>

        {/* R1 */}
        <g className="component" onClick={() => onComponentClick?.('R1')} onMouseEnter={() => setHoveredRef('R1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="200" y1="40" x2="200" y2="60" stroke={highlightColor('R1')} strokeWidth="2"/>
          <rect x="192" y="60" width="16" height="40" fill="none" stroke={highlightColor('R1')} strokeWidth="2"/>
          <line x1="200" y1="100" x2="200" y2="120" stroke={highlightColor('R1')} strokeWidth="2"/>
          <text x="215" y="82" fill={highlightColor('R1')} fontSize="10" fontFamily="monospace">R1 220Ω</text>
        </g>

        {/* LED1 */}
        <g className="component" onClick={() => onComponentClick?.('LED1')} onMouseEnter={() => setHoveredRef('LED1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="200" y1="120" x2="200" y2="130" stroke={highlightColor('LED1')} strokeWidth="2"/>
          <polygon points="190,130 210,130 200,150" fill="none" stroke="var(--red)" strokeWidth="2"/>
          <line x1="190" y1="150" x2="210" y2="150" stroke="var(--red)" strokeWidth="2"/>
          <line x1="200" y1="150" x2="200" y2="160" stroke={highlightColor('LED1')} strokeWidth="2"/>
          <text x="215" y="142" fill="var(--red)" fontSize="10" fontFamily="monospace">LED1</text>
          <text x="215" y="156" fill="#666" fontSize="8" fontFamily="monospace">Red 2V</text>
        </g>

        {/* Q1 MOSFET */}
        <g className="component" onClick={() => onComponentClick?.('Q1')} onMouseEnter={() => setHoveredRef('Q1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <rect x="180" y="170" width="40" height="60" fill="none" stroke={highlightColor('Q1')} strokeWidth="2" rx="2"/>
          <text x="188" y="205" fill={highlightColor('Q1')} fontSize="9" fontFamily="monospace">Q1</text>
          <text x="182" y="240" fill="#666" fontSize="8" fontFamily="monospace">2N7000</text>
          {/* G */}
          <line x1="140" y1="200" x2="180" y2="200" stroke={highlightColor('Q1')} strokeWidth="1.5"/>
          <text x="130" y="204" fill="var(--accent)" fontSize="9" fontFamily="monospace">G</text>
          {/* D */}
          <line x1="200" y1="160" x2="200" y2="170" stroke={highlightColor('Q1')} strokeWidth="1.5"/>
          <text x="205" y="168" fill="var(--text-dim)" fontSize="9" fontFamily="monospace">D</text>
          {/* S */}
          <line x1="200" y1="230" x2="200" y2="260" stroke={highlightColor('Q1')} strokeWidth="1.5"/>
          <text x="205" y="245" fill="var(--text-dim)" fontSize="9" fontFamily="monospace">S</text>
        </g>

        {/* GND */}
        <line x1="180" y1="260" x2="220" y2="260" stroke="var(--text-dim)" strokeWidth="2"/>
        <text x="175" y="275" fill="var(--text-dim)" fontSize="10" fontFamily="monospace">GND</text>

        {/* R2 gate resistor */}
        <g className="component" onClick={() => onComponentClick?.('R2')} onMouseEnter={() => setHoveredRef('R2')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="60" y1="200" x2="90" y2="200" stroke={highlightColor('R2')} strokeWidth="2"/>
          <rect x="90" y="192" width="50" height="16" fill="none" stroke={highlightColor('R2')} strokeWidth="2"/>
          <text x="98" y="188" fill={highlightColor('R2')} fontSize="10" fontFamily="monospace">R2 1kΩ</text>
        </g>

        {/* PWM input */}
        <text x="20" y="205" fill="var(--accent)" fontSize="12" fontFamily="monospace">PWM</text>
        <line x1="60" y1="200" x2="60" y2="200" stroke="var(--accent)" strokeWidth="2"/>

        {/* C1 gate cap */}
        <g className="component" onClick={() => onComponentClick?.('C1')} onMouseEnter={() => setHoveredRef('C1')} onMouseLeave={() => setHoveredRef(null)} style={{ cursor: 'pointer' }}>
          <line x1="140" y1="200" x2="140" y2="230" stroke={highlightColor('C1')} strokeWidth="1.5"/>
          <line x1="130" y1="230" x2="150" y2="230" stroke={highlightColor('C1')} strokeWidth="2"/>
          <line x1="130" y1="238" x2="150" y2="238" stroke={highlightColor('C1')} strokeWidth="2"/>
          <line x1="140" y1="238" x2="140" y2="260" stroke={highlightColor('C1')} strokeWidth="1.5"/>
          <text x="155" y="236" fill={highlightColor('C1')} fontSize="9" fontFamily="monospace">C1 10nF</text>
        </g>
      </svg>
      <ComponentTooltip components={components} hoveredRef={hoveredRef} selectedRef={selectedRef} />
    </div>
  )
}
