import { useState, useEffect, useRef } from 'react'
import './LandingPage.css'

// ── Inline SVG icons (zero dep) ──────────────────────────────
function IconLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2" />
      <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="7" y1="3" x2="7" y2="7" />
      <line x1="17" y1="3" x2="17" y2="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M9 12l-2 2M15 12l2 2" />
    </svg>
  )
}
function IconArrowRight({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
function IconCheck({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconZap({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
function IconScan({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <circle cx="12" cy="12" r="1" />
      <path d="M5 12h2M17 12h2M12 5v2M12 17v2" />
    </svg>
  )
}
function IconBrain({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5a3 3 0 10-5.997.125 4 4 0 00-2.526 5.77 4 4 0 00.556 6.588A4 4 0 1012 18z" />
      <path d="M12 5a3 3 0 115.997.125 4 4 0 012.526 5.77 4 4 0 01-.556 6.588A4 4 0 1112 18z" />
      <path d="M15 13a4.5 4.5 0 01-3-4 4.5 4.5 0 01-3 4M17.599 6.5a3 3 0 00.399-1.375M6.003 5.125A3 3 0 006.401 6.5M3.477 10.896a4 4 0 01.585-.396M19.938 10.5a4 4 0 01.585.396M6 18a4 4 0 01-1.967-.516M19.967 17.484A4 4 0 0118 18" />
    </svg>
  )
}
function IconSiren({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 15H7a4 4 0 00-4 4v2h18v-2a4 4 0 00-4-4h-4.5z" />
      <path d="M8 15V7a4 4 0 018 0v8" />
      <line x1="12" y1="3" x2="12" y2="2" />
      <path d="M17.66 5.34L18.37 4.63" />
      <path d="M6.34 5.34L5.63 4.63" />
    </svg>
  )
}
function IconFactory({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7 5V8l-7 5V4a2 2 0 00-2-2H4a2 2 0 00-2 2z" />
      <path d="M17 18h1M13 18h1M9 18h1M5 18h1" />
    </svg>
  )
}
function IconCpu({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  )
}
function IconMenu({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
function IconUpload({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}
function IconSearch({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}
function IconFileSearch({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><circle cx="11.5" cy="14.5" r="2.5" /><path d="M13.5 16.5 12 15" />
    </svg>
  )
}
function IconBellSiren({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 003.4 0" />
    </svg>
  )
}
function IconLayoutDashboard({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
function IconX({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function IconPlay({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
function IconRotateCcw({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  )
}
function IconShieldAlert({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
  )
}
function IconShieldCheck({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
function IconActivity({ size = 16 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function IconClock({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IconBell({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 003.4 0" />
    </svg>
  )
}

// ── Scroll-reveal hook ────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }) },
      { threshold: 0.12, rootMargin: '-60px' }
    )
    el.querySelectorAll('.lp-reveal').forEach(node => obs.observe(node))
    return () => obs.disconnect()
  }, [])
  return ref
}

// ── Data ─────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Try it',       href: '#try' },
  { label: 'How it works', href: '#how' },
  { label: 'Defects',      href: '#defects' },
  { label: 'Modes',        href: '#modes' },
  { label: 'Stack',        href: '#stack' },
]

const STATS = [
  { value: '<1s',    label: 'Full inspection pipeline' },
  { value: '~100ms', label: 'Vision quadrant scan' },
  { value: '3',      label: 'Coordinated AI agents' },
  { value: '6',      label: 'Defect classes detected' },
]

const WINGS = [
  { Icon: IconScan,   tag: 'Wing A', title: 'Vision Inspectors',   speed: '~100ms', desc: 'Parallel quadrant scanning against a golden master — color distribution, solder reflections, and component presence, all locally.' },
  { Icon: IconBrain,  tag: 'Wing B', title: 'Root-Cause Analyst',  speed: '~300ms', desc: 'Cross-references every detected defect against the troubleshooting manual using the Cerebras LLM to explain why it happened.' },
  { Icon: IconSiren,  tag: 'Wing C', title: 'Alert Dispatcher',    speed: '~200ms', desc: 'Rule-based actions plus AI-generated alert messages — stop the line, page a supervisor, or quarantine the batch.' },
]

const PIPELINE_STEPS = [
  { num: '01', icon: IconUpload,          title: 'Upload a PCB',        desc: 'Drop an image or pick from the 10-image demo gallery.' },
  { num: '02', icon: IconSearch,          title: 'Local vision scan',   desc: 'Wing A detects defects via canvas pixel analysis.' },
  { num: '03', icon: IconFileSearch,      title: 'Root-cause analysis', desc: 'Wing B reasons against the troubleshooting manual.' },
  { num: '04', icon: IconBellSiren,       title: 'Action dispatch',     desc: 'Wing C decides what to do and writes the alert.' },
  { num: '05', icon: IconLayoutDashboard, title: 'Live dashboard',      desc: 'Defect feed, tool calls, and timing breakdown.' },
]

const DEFECTS = [
  { name: 'Solder bridges',       sev: 'Critical', tone: 'critical' as const, desc: 'Short circuit between pads — stop the line immediately.' },
  { name: 'Missing components',   sev: 'Critical', tone: 'critical' as const, desc: 'Component absent from designated location on board.' },
  { name: 'Cold solder joints',   sev: 'Major',    tone: 'major'    as const, desc: 'Dull joint indicating poor wetting and weak connection.' },
  { name: 'Component misalignment', sev: 'Major',  tone: 'major'    as const, desc: 'Offset placement causing potential open or short circuit.' },
  { name: 'Surface scratches',    sev: 'Minor',    tone: 'minor'    as const, desc: 'Cosmetic trace damage — log and monitor.' },
  { name: 'Flux contamination',   sev: 'Cosmetic', tone: 'minor'    as const, desc: 'Residue affecting aesthetics; clean and rework.' },
]

type TrySeverity = 'Critical' | 'Major' | 'Minor'
type TryBox = { id: string; label: string; severity: TrySeverity; x: number; y: number; w: number; h: number }
type TryResult = { boxes: TryBox[]; rootCause: string; action: string; verdict: 'fail' | 'pass'; timings: { stage: string; ms: number }[] }
type DemoBoard = { id: string; name: string; src: string; result: TryResult }

const DEMO_BOARDS: DemoBoard[] = [
  { id: 'demo-1', name: 'Logic board A', src: '/demo-pcb/good_1.jpg', result: { verdict: 'fail', boxes: [{ id: 'b1', label: 'Missing component', severity: 'Critical', x: 58, y: 30, w: 16, h: 18 }, { id: 'b2', label: 'Solder bridge', severity: 'Major', x: 16, y: 50, w: 14, h: 16 }, { id: 'b3', label: 'Flux contamination', severity: 'Minor', x: 70, y: 62, w: 12, h: 14 }], rootCause: 'Pick-and-place head likely skipped a placement cycle; reflow profile ran hot enough to cause minor flux residue near the affected quadrant.', action: 'Stop the line · quarantine batch #78492 · page line supervisor', timings: [{ stage: 'Vision scan', ms: 104 }, { stage: 'Root cause', ms: 287 }, { stage: 'Dispatch', ms: 198 }] } },
  { id: 'demo-2', name: 'Sensor board B', src: '/demo-pcb/good_2.jpg', result: { verdict: 'fail', boxes: [{ id: 'b1', label: 'Component misalignment', severity: 'Major', x: 46, y: 36, w: 20, h: 24 }, { id: 'b2', label: 'Cold solder joint', severity: 'Major', x: 12, y: 20, w: 14, h: 16 }], rootCause: 'Central IC rotated ~6° off its land pattern during placement; insufficient preheat produced a dull cold joint on the upper-left capacitor.', action: 'Flag for rework · log to defect feed · notify QA', timings: [{ stage: 'Vision scan', ms: 98 }, { stage: 'Root cause', ms: 261 }, { stage: 'Dispatch', ms: 176 }] } },
  { id: 'demo-3', name: 'Processor board C', src: '/demo-pcb/good_3.jpg', result: { verdict: 'pass', boxes: [{ id: 'b1', label: 'Surface scratch', severity: 'Minor', x: 30, y: 58, w: 22, h: 10 }], rootCause: 'Cosmetic handling scratch on the solder mask, away from any pad or trace. No electrical impact detected — within tolerance.', action: 'Pass with note · continue line · archive image', timings: [{ stage: 'Vision scan', ms: 91 }, { stage: 'Root cause', ms: 243 }, { stage: 'Dispatch', ms: 142 }] } },
]

const UPLOAD_RESULT: TryResult = { verdict: 'fail', boxes: [{ id: 'u1', label: 'Solder bridge', severity: 'Critical', x: 40, y: 38, w: 18, h: 18 }, { id: 'u2', label: 'Component misalignment', severity: 'Major', x: 18, y: 60, w: 16, h: 16 }, { id: 'u3', label: 'Surface scratch', severity: 'Minor', x: 66, y: 24, w: 14, h: 12 }], rootCause: 'Simulated analysis: detected a probable solder bridge plus a misaligned component. Connect Cadence\'s vision engine to score your real board.', action: 'Stop the line · quarantine board · page supervisor', timings: [{ stage: 'Vision scan', ms: 110 }, { stage: 'Root cause', ms: 298 }, { stage: 'Dispatch', ms: 205 }] }

const STACK = [
  { k: 'Frontend',    v: 'React + TypeScript + Vite' },
  { k: 'Primary AI',  v: 'Cerebras Gemma 4 31B' },
  { k: 'Vision',      v: 'Cerebras Vision API' },
  { k: 'Demo set',    v: '10 realistic PCB images' },
  { k: 'Latency',     v: 'Sub-second end to end' },
  { k: 'Agents',      v: '118-agent swarm' },
]

// ── Component ─────────────────────────────────────────────────
// ── Try It Now Section ───────────────────────────────────────
type TryPhase = 'idle' | 'scanning' | 'done'
function TryItNow() {
  const [activeSrc, setActiveSrc] = useState(DEMO_BOARDS[0].src)
  const [activeName, setActiveName] = useState(DEMO_BOARDS[0].name)
  const [result, setResult] = useState(DEMO_BOARDS[0].result)
  const [phase, setPhase] = useState<TryPhase>('idle')
  const fileRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const pickDemo = (d: DemoBoard) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActiveSrc(d.src); setActiveName(d.name)
    setResult(d.result); setPhase('idle')
  }
  const onFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    const url = URL.createObjectURL(file)
    blobUrlRef.current = url
    setActiveSrc(url); setActiveName(file.name)
    setResult(UPLOAD_RESULT); setPhase('idle')
  }
  const runInspection = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('scanning')
    timerRef.current = setTimeout(() => setPhase('done'), 1900)
  }
  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('idle')
  }
  const totalMs = result.timings.reduce((a, b) => a + b.ms, 0)
  const sevClass = (s: TrySeverity) => s === 'Critical' ? 'critical' : s === 'Major' ? 'major' : 'minor'

  return (
    <section id="try" className="lp-try lp-section">
      <div className="lp-container">
        <div className="lp-section-heading lp-reveal">
          <span className="lp-try-eyebrow">Try it now</span>
          <h2 className="lp-try-title">Inspect a board <span>right here.</span></h2>
          <p className="lp-try-sub">Upload a PCB image or pick a demo board, then run the swarm to see defects, root cause, and the dispatched action — live.</p>
        </div>

        <div className="lp-try-grid">
          {/* Viewport */}
          <div className="lp-try-viewport">
            <div className="lp-try-bar">
              <span className="lp-try-bar-left">
                <IconActivity size={16} />
                <span className="lp-try-bar-name">{activeName}</span>
              </span>
              <span className="lp-try-status" aria-live="polite">
                {phase === 'idle' && 'Ready'}
                {phase === 'scanning' && 'Scanning…'}
                {phase === 'done' && (result.verdict === 'fail' ? 'Defects found' : 'Passed')}
              </span>
            </div>

            <div className={`lp-try-image-wrap${phase === 'scanning' ? ' lp-scan-active' : ''}`}>
              <img src={activeSrc} alt={`PCB under inspection: ${activeName}`} width={800} height={550} />

              {/* Scanning grid overlay */}
              {phase === 'scanning' && (
                <div className="lp-try-scan-grid" aria-hidden="true">
                  <div className="lp-try-scan-line-h" />
                  <div className="lp-try-scan-line-v" />
                  {[...Array(9)].map((_, i) => (
                    <div key={`h${i}`} className="lp-try-scan-gridline-h" style={{ top: `${(i + 1) * 10}%` }} />
                  ))}
                  {[...Array(9)].map((_, i) => (
                    <div key={`v${i}`} className="lp-try-scan-gridline-v" style={{ left: `${(i + 1) * 10}%` }} />
                  ))}
                  <div className="lp-try-scan-corners">
                    <span className="lp-scan-corner tl" /><span className="lp-scan-corner tr" />
                    <span className="lp-scan-corner bl" /><span className="lp-scan-corner br" />
                  </div>
                  <div className="lp-try-scan-status">
                    <span className="lp-scan-pulse" />
                    <span className="lp-scan-text">118 agents scanning</span>
                  </div>
                </div>
              )}

              {phase === 'done' && result.boxes.map((b, i) => (
                <div key={b.id} className={`lp-try-box lp-try-box-${sevClass(b.severity)}`} style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, animationDelay: `${i * 0.12}s` }}>
                  <span className={`lp-try-box-label lp-try-box-label-${sevClass(b.severity)}`}>{b.label}</span>
                </div>
              ))}

              {phase === 'idle' && (
                <div className="lp-try-idle-overlay">
                  <span className="lp-try-idle-pill">Press "Run inspection" to scan</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="lp-try-controls">
              {phase !== 'done' ? (
                <button type="button" onClick={runInspection} disabled={phase === 'scanning'} className="lp-try-btn-primary">
                  <IconPlay size={16} />
                  {phase === 'scanning' ? 'Inspecting…' : 'Run inspection'}
                </button>
              ) : (
                <button type="button" onClick={reset} className="lp-try-btn-secondary">
                  <IconRotateCcw size={16} />
                  Run again
                </button>
              )}
              <button type="button" onClick={() => fileRef.current?.click()} className="lp-try-btn-secondary">
                <IconUpload size={16} />
                Upload PCB image
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="lp-sr-only" aria-label="Upload a PCB image to inspect" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {/* Gallery */}
            <div className="lp-try-gallery">
              <p className="lp-try-gallery-label">Or pick a demo board</p>
              <div className="lp-try-gallery-grid" role="group" aria-label="Demo PCB boards">
                {DEMO_BOARDS.map((d) => (
                  <button key={d.id} type="button" onClick={() => pickDemo(d)} aria-pressed={activeSrc === d.src} className="lp-try-gallery-btn" style={{ borderColor: activeSrc === d.src ? 'var(--primary)' : 'var(--border-color)' }}>
                    <img src={d.src} alt={`Select demo board: ${d.name}`} loading="lazy" />
                    <span className="lp-try-gallery-btn-label">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lp-try-results" aria-live="polite">
            {phase !== 'done' ? (
              <div className="lp-try-results-placeholder">
                <span className="lp-try-results-placeholder-icon"><IconCpu size={28} /></span>
                <p className="lp-try-results-placeholder-title">Inspection report</p>
                <p className="lp-try-results-placeholder-desc">
                  {phase === 'scanning'
                    ? 'The swarm is scanning quadrants, reasoning about root cause, and preparing an action…'
                    : 'Run an inspection to see the full report appear here.'}
                </p>
              </div>
            ) : (
              <>
                <div className="lp-try-verdict">
                  <div className="lp-try-verdict-left">
                    <span className={`lp-try-verdict-icon ${result.verdict === 'fail' ? 'lp-try-verdict-icon-fail' : 'lp-try-verdict-icon-pass'}`}>
                      {result.verdict === 'fail' ? <IconShieldAlert size={20} /> : <IconShieldCheck size={20} />}
                    </span>
                    <div>
                      <p className="lp-try-verdict-title">{result.verdict === 'fail' ? 'Defects detected' : 'Board passed'}</p>
                      <p className="lp-try-verdict-sub">{result.boxes.length} finding{result.boxes.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <span className="lp-try-verdict-timing"><IconClock size={14} />{totalMs}ms</span>
                </div>

                <ul className="lp-try-findings">
                  {result.boxes.map((b) => (
                    <li key={b.id} className="lp-try-finding">
                      <span className="lp-try-finding-label">{b.label}</span>
                      <span className={`lp-try-finding-chip lp-try-box-label-${sevClass(b.severity)}`}>{b.severity}</span>
                    </li>
                  ))}
                </ul>

                <div className="lp-try-root-cause">
                  <p className="lp-try-root-cause-header"><IconCpu size={14} /> Root cause</p>
                  <p className="lp-try-root-cause-text">{result.rootCause}</p>
                </div>

                <div className="lp-try-action">
                  <p className="lp-try-action-header"><IconBell size={14} /> Dispatched action</p>
                  <p className="lp-try-action-text">{result.action}</p>
                </div>

                <div className="lp-try-timings">
                  {result.timings.map((t) => (
                    <div key={t.stage} className="lp-try-timing">
                      <div className="lp-try-timing-value">{t.ms}ms</div>
                      <div className="lp-try-timing-label">{t.stage}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

interface LandingPageProps {
  onEnterCadence:      () => void
  onEnterCircuitScope: () => void
}

export function LandingPage({ onEnterCadence, onEnterCircuitScope }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const revealRef = useReveal()

  return (
    <div className="landing-page" ref={revealRef}>
      {/* Skip-to-content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:bg-primary focus:text-primary-foreground">
        Skip to content
      </a>

      {/* ── Header ── */}
      <header className="lp-header" role="banner">
        <div className="lp-header-inner">
          <a href="#" className="lp-logo" aria-label="Cadence home">
            <span className="lp-logo-icon"><IconLogo /></span>
            <span className="lp-logo-name">Cadence</span>
          </a>

          <nav className="lp-nav" aria-label="Primary">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="lp-nav-link">{l.label}</a>
            ))}
          </nav>

          <div className="lp-header-actions">
            <button className="lp-btn-ghost" onClick={onEnterCadence}>Live demo</button>
            <button className="lp-btn-primary" onClick={onEnterCadence}>Start inspecting</button>
            <button
              className="lp-menu-btn"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" className="lp-mobile-nav" aria-label="Mobile">
            <ul>
              {NAV_LINKS.map(l => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main id="main-content">
        {/* ── Hero ── */}
        <section className="lp-hero" aria-labelledby="hero-heading">
          <div className="lp-grid-texture" aria-hidden="true" />
          <div className="lp-bloom" aria-hidden="true" />

          <div className="lp-container">
            <div className="lp-hero-content">
              <span className="lp-eyebrow-badge">
                <span className="lp-eyebrow-ping" aria-hidden="true">
                  <span className="lp-eyebrow-ping-ring" />
                  <span className="lp-eyebrow-ping-dot" />
                </span>
                3-agent swarm · &lt;1s per inspection
              </span>

              <h1 id="hero-heading" className="lp-hero-h1">
                Catch every defect
                <span>before it leaves the line.</span>
              </h1>

              <p className="lp-hero-sub">
                Cadence is an AI inspection swarm for assembly lines. It scans each PCB, pinpoints
                the root cause, and dispatches the right action — in under a second.
              </p>

              <div className="lp-hero-ctas">
                <button className="lp-btn-hero-primary" onClick={onEnterCadence}>
                  Start inspecting <IconArrowRight />
                </button>
                <button className="lp-btn-hero-secondary" onClick={onEnterCircuitScope}>
                  Try CircuitScope
                </button>
              </div>

              <div className="lp-hero-social-proof" aria-label="Product highlights">
                <span className="lp-proof-item"><IconCheck size={14} /> Browser-based</span>
                <span className="lp-proof-item"><IconZap size={14} /> Cerebras gemma-4-31b</span>
                <span className="lp-proof-item"><IconCheck size={14} /> 6 defect classes</span>
              </div>
            </div>

            {/* macOS PCB card — video thumbnail */}
            <figure className="lp-hero-card lp-hero-card-video" aria-label="Watch Cadence inspect a PCB" onClick={() => setVideoOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setVideoOpen(true) }}>
              <div className="lp-hero-card-bar" aria-hidden="true">
                <span className="lp-traffic-dot red" />
                <span className="lp-traffic-dot yellow" />
                <span className="lp-traffic-dot green" />
                <span className="lp-hero-card-label">cadence · inspection #78492-001</span>
              </div>
              <img
                src="/hero-pcb.jpg"
                alt="Click to watch Cadence inspect a PCB with AI defect detection"
                width={1280}
                height={800}
              />
              <div className="lp-hero-play-overlay">
                <div className="lp-hero-play-btn">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M8 5.14v14l11-7-11-7z" fill="currentColor"/></svg>
                </div>
                <span className="lp-hero-play-label">Watch 1-min demo</span>
              </div>
            </figure>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-stats" aria-label="Key metrics">
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={s.label} className={`lp-stat lp-reveal lp-reveal-d${i + 1}`}>
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Swarm ── */}
        <section id="how" className="lp-section" aria-labelledby="swarm-heading">
          <div className="lp-container">
            <div className="lp-section-heading lp-reveal">
              <span className="lp-eyebrow">The swarm</span>
              <h2 id="swarm-heading" className="lp-section-h2">Three agents. One verdict.</h2>
              <p className="lp-section-sub">Cadence splits inspection across a specialized agent swarm so each stage stays fast and focused.</p>
            </div>

            <div className="lp-wings-grid">
              {WINGS.map((w, i) => (
                <article key={w.tag} className={`lp-wing-card lp-reveal lp-reveal-d${i + 1}`} onClick={onEnterCadence} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEnterCadence() }}>
                  <div className="lp-wing-top">
                    <div className="lp-wing-icon"><w.Icon size={24} /></div>
                    <span className="lp-wing-tag">{w.tag}</span>
                  </div>
                  <h3 className="lp-wing-title">{w.title}</h3>
                  <p className="lp-wing-desc">{w.desc}</p>
                  <div className="lp-wing-speed">
                    <span className="lp-speed-dot" aria-hidden="true" />
                    {w.speed}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section className="lp-section lp-pipeline" aria-labelledby="pipeline-heading">
          <div className="lp-container">
            <div className="lp-section-heading lp-reveal">
              <span className="lp-eyebrow">Pipeline</span>
              <h2 id="pipeline-heading" className="lp-section-h2">From image to action in five steps</h2>
            </div>
            <div className="lp-steps-grid" aria-label="Inspection pipeline steps">
              {PIPELINE_STEPS.map((s, i) => (
                <div key={s.num} className={`lp-step-card lp-reveal lp-reveal-d${i + 1}`}>
                  <span className="lp-step-num" aria-hidden="true">{s.num}</span>
                  <s.icon size={22} />
                  <strong className="lp-step-title">{s.title}</strong>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Defects ── */}
        <section id="defects" className="lp-section" aria-labelledby="defects-heading">
          <div className="lp-container">
            <div className="lp-section-heading lp-reveal">
              <span className="lp-eyebrow">Coverage</span>
              <h2 id="defects-heading" className="lp-section-h2">Six defect classes, severity-ranked</h2>
              <p className="lp-section-sub">Cadence grades each find so the right ones stop the line — and the rest just get logged.</p>
            </div>
            <div className="lp-defects-grid" role="list">
              {DEFECTS.map((d, i) => (
                <div key={d.name} className={`lp-defect-card lp-reveal lp-reveal-d${(i % 3) + 1}`} role="listitem">
                  <div className="lp-defect-row">
                    <strong className="lp-defect-name">{d.name}</strong>
                    <span className={`lp-defect-badge ${d.tone}`}>{d.sev}</span>
                  </div>
                  <p className="lp-defect-desc">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Try It Now ── */}
        <TryItNow />

        {/* ── Modes ── */}
        <section id="modes" className="lp-section lp-pipeline" aria-labelledby="modes-heading">
          <div className="lp-container">
            <div className="lp-section-heading lp-reveal">
              <span className="lp-eyebrow">Two modes</span>
              <h2 id="modes-heading" className="lp-section-h2">One workspace, two missions</h2>
            </div>
            <div className="lp-modes-grid">
              <article className="lp-mode-card lp-reveal lp-reveal-d1">
                <div className="lp-mode-icon-wrap"><IconFactory size={24} /></div>
                <h3 className="lp-mode-title">Cadence</h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Manufacturing defect detection
                </p>
                <p className="lp-mode-sub">The full inspection swarm for assembly lines — vision, root cause, and alert dispatch working in concert.</p>
                <ul className="lp-mode-features">
                  {['10×10 grid swarm scan', 'Golden master comparison', 'Human-in-the-loop override', 'Live knowledge graph', 'E-Stop severity control'].map(f => (
                    <li key={f}><IconCheck size={14} />{f}</li>
                  ))}
                </ul>
                <button className="lp-mode-cta" onClick={onEnterCadence}>
                  Open Cadence <IconArrowRight size={14} />
                </button>
              </article>

              <article className="lp-mode-card lp-reveal lp-reveal-d2">
                <div className="lp-mode-icon-wrap"><IconCpu size={24} /></div>
                <h3 className="lp-mode-title">CircuitScope</h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Hardware debugging agent
                </p>
                <p className="lp-mode-sub">A 3-agent pipeline for circuit analysis — schematics, waveforms, and guided bring-up for hardware teams.</p>
                <ul className="lp-mode-features">
                  {['KiCad netlist upload', 'Theory agent formulaic math', 'Waveform verification', 'Bring-up checklist', 'Net context explorer'].map(f => (
                    <li key={f}><IconCheck size={14} />{f}</li>
                  ))}
                </ul>
                <button className="lp-mode-cta" onClick={onEnterCircuitScope}>
                  Open CircuitScope <IconArrowRight size={14} />
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* ── Stack ── */}
        <section id="stack" className="lp-section" aria-labelledby="stack-heading">
          <div className="lp-container">
            <div className="lp-section-heading lp-reveal">
              <span className="lp-eyebrow">Under the hood</span>
              <h2 id="stack-heading" className="lp-section-h2">Built fast, runs faster</h2>
              <p className="lp-section-sub">A lean stack tuned for low-latency inference at the edge of the line.</p>
            </div>
            <div className="lp-stack-grid">
              {STACK.map((s, i) => (
                <div key={s.k} className={`lp-reveal lp-reveal-d${(i % 3) + 1}`} style={{ background: 'var(--card)', padding: '1.75rem' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{s.k}</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '1.0625rem', fontWeight: 600 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-section" style={{ paddingBottom: '6rem' }} aria-label="Get started">
          <div className="lp-container">
            <div className="lp-reveal" style={{
              position: 'relative', overflow: 'hidden', borderRadius: '2rem',
              border: '1px solid oklch(0.64 0.2 300 / 0.3)', background: 'oklch(0.15 0.022 285 / 0.6)',
              padding: '5rem 2rem', textAlign: 'center',
              boxShadow: 'var(--shadow-glow), 0 0 80px oklch(0.64 0.2 300 / 0.08)',
            }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px)', backgroundSize: '36px 36px', opacity: 0.9 }} />
              <div aria-hidden="true" style={{ position: 'absolute', bottom: '-6rem', left: '50%', width: '22rem', height: '22rem', transform: 'translateX(-50%)', borderRadius: '50%', background: 'oklch(0.64 0.2 300 / 0.25)', filter: 'blur(120px)' }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', textWrap: 'balance', maxWidth: '40rem', margin: '0 auto' }}>
                  Inspect your first board in{' '}
                  <span className="lp-text-animate">seconds.</span>
                </h2>
                <p style={{ marginTop: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '28rem', margin: '1.25rem auto 0', lineHeight: 1.7 }}>
                  No setup. Open Cadence in the browser and run a live demo inspection from the gallery.
                </p>
                <div className="lp-cta-btns">
                  <button className="lp-btn-hero-primary" onClick={onEnterCadence}>
                    Try a live inspection <IconArrowRight />
                  </button>
                  <button className="lp-btn-hero-secondary" onClick={onEnterCircuitScope}>
                    Try CircuitScope
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <span className="lp-logo-icon"><IconLogo /></span>
            <span style={{ fontWeight: 700, color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', background: 'linear-gradient(135deg, var(--foreground) 40%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Cadence</span>
            <span style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>·</span>
            <span className="lp-footer-copy">Real-time defect detection</span>
          </div>
          <p className="lp-footer-copy" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
            Built for the Cerebras × Google Gemma hackathon · MIT
          </p>
          <div className="lp-footer-links" role="navigation" aria-label="Footer">
            <a href="https://github.com/r0c0y/i2" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/r0c0y/cadence-vision-ai" target="_blank" rel="noopener noreferrer">OSS reference</a>
          </div>
        </div>
      </footer>

      {/* ── Video Demo Modal ── */}
      {videoOpen && (
        <div className="lp-video-modal" role="dialog" aria-modal="true" aria-label="Demo video" onClick={() => setVideoOpen(false)}>
          <div className="lp-video-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lp-video-modal-close" onClick={() => setVideoOpen(false)} aria-label="Close video">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div className="lp-video-player">
              <div className="lp-video-placeholder">
                <img src="/hero-pcb.jpg" alt="Cadence demo" className="lp-video-poster" />
                <div className="lp-video-overlay">
                  <div className="lp-video-scan-line" />
                  <div className="lp-video-hud">
                    <div className="lp-hud-line"><span className="lp-hud-label">MODE:</span> SCAN</div>
                    <div className="lp-hud-line"><span className="lp-hud-label">PCB ID:</span> 78492-001</div>
                    <div className="lp-hud-line"><span className="lp-hud-label">COMPONENTS:</span> 1287</div>
                    <div className="lp-hud-line"><span className="lp-hud-label">STATUS:</span> <span className="lp-hud-blink">ANALYZING</span></div>
                  </div>
                  <div className="lp-video-defects">
                    <div className="lp-video-defect-box" style={{ left: '22%', top: '35%' }}>
                      <span className="lp-defect-tag">DEFECT 01</span>
                      <span className="lp-defect-type">MISSING COMPONENT</span>
                    </div>
                    <div className="lp-video-defect-box" style={{ left: '65%', top: '28%' }}>
                      <span className="lp-defect-tag">DEFECT 02</span>
                      <span className="lp-defect-type">SOLDER BRIDGE</span>
                    </div>
                    <div className="lp-video-defect-box" style={{ left: '18%', top: '70%' }}>
                      <span className="lp-defect-tag">DEFECT 03</span>
                      <span className="lp-defect-type">MISALIGNED COMPONENT</span>
                    </div>
                  </div>
                  <div className="lp-video-coords">
                    <span>X: 5294 Y: 7382</span>
                    <span>ZOOM: 4.35x</span>
                  </div>
                </div>
                <div className="lp-video-progress">
                  <div className="lp-video-progress-bar" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
