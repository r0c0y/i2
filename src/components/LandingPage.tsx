import { useState, useEffect, useRef } from 'react'
import './LandingPage.css'

// ── Inline SVG icons (zero dep) ──────────────────────────────
function IconActivity() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
function IconX({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
  { num: '01', title: 'Upload a PCB',        desc: 'Drop an image or pick from the 10-image demo gallery.' },
  { num: '02', title: 'Local vision scan',   desc: 'Wing A detects defects via canvas pixel analysis.' },
  { num: '03', title: 'Root-cause analysis', desc: 'Wing B reasons against the troubleshooting manual.' },
  { num: '04', title: 'Action dispatch',     desc: 'Wing C decides what to do and writes the alert.' },
  { num: '05', title: 'Live dashboard',      desc: 'Defect feed, tool calls, and timing breakdown.' },
]

const DEFECTS = [
  { name: 'Solder bridges',       sev: 'Critical', tone: 'critical' as const, desc: 'Short circuit between pads — stop the line immediately.' },
  { name: 'Missing components',   sev: 'Critical', tone: 'critical' as const, desc: 'Component absent from designated location on board.' },
  { name: 'Cold solder joints',   sev: 'Major',    tone: 'major'    as const, desc: 'Dull joint indicating poor wetting and weak connection.' },
  { name: 'Component misalignment', sev: 'Major',  tone: 'major'    as const, desc: 'Offset placement causing potential open or short circuit.' },
  { name: 'Surface scratches',    sev: 'Minor',    tone: 'minor'    as const, desc: 'Cosmetic trace damage — log and monitor.' },
  { name: 'Flux contamination',   sev: 'Cosmetic', tone: 'minor'    as const, desc: 'Residue affecting aesthetics; clean and rework.' },
]

const STACK = [
  { k: 'Frontend',    v: 'React + TypeScript + Vite' },
  { k: 'Primary AI',  v: 'Cerebras Gemma 4 31B' },
  { k: 'Vision',      v: 'Cerebras Vision API' },
  { k: 'Demo set',    v: '10 realistic PCB images' },
  { k: 'Latency',     v: 'Sub-second end to end' },
  { k: 'Agents',      v: '118-agent swarm' },
]

// ── Component ─────────────────────────────────────────────────
interface LandingPageProps {
  onEnterCadence:      () => void
  onEnterCircuitScope: () => void
}

export function LandingPage({ onEnterCadence, onEnterCircuitScope }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
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
            <span className="lp-logo-icon"><IconActivity /></span>
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

            {/* macOS PCB card */}
            <figure className="lp-hero-card" aria-label="Cadence inspecting a PCB with highlighted defect bounding boxes">
              <div className="lp-hero-card-bar" aria-hidden="true">
                <span className="lp-traffic-dot red" />
                <span className="lp-traffic-dot yellow" />
                <span className="lp-traffic-dot green" />
                <span className="lp-hero-card-label">cadence · inspection #78492-001</span>
              </div>
              <img
                src="/hero-pcb.jpg"
                alt="A PCB undergoing AI defect inspection with highlighted bounding boxes"
                width={1280}
                height={800}
              />
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
                <article key={w.tag} className={`lp-wing-card lp-reveal lp-reveal-d${i + 1}`}>
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
            <ol className="lp-steps" aria-label="Inspection pipeline steps">
              {PIPELINE_STEPS.map((s, i) => (
                <li key={s.num} className={`lp-step lp-reveal lp-reveal-d${i + 1}`}>
                  <span className="lp-step-num" aria-hidden="true">{s.num}</span>
                  <strong className="lp-step-title">{s.title}</strong>
                  <p className="lp-step-desc">{s.desc}</p>
                </li>
              ))}
            </ol>
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
                  <span className={`lp-defect-badge ${d.tone}`}>{d.sev}</span>
                  <strong className="lp-defect-name">{d.name}</strong>
                  <p className="lp-defect-desc">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
            <div style={{ display: 'grid', gap: '1px', marginTop: '3rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--border-color)', gridTemplateColumns: 'repeat(2, 1fr)' }}>
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
              border: '1px solid oklch(0.64 0.2 300 / 0.3)', background: 'var(--card)',
              padding: '5rem 2rem', textAlign: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, color-mix(in oklab, var(--primary) 7%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 7%, transparent) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.4 }} />
              <div aria-hidden="true" style={{ position: 'absolute', bottom: '-8rem', left: '50%', width: '18rem', height: '18rem', transform: 'translateX(-50%)', borderRadius: '50%', background: 'oklch(0.64 0.2 300 / 0.2)', filter: 'blur(100px)' }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', textWrap: 'balance', maxWidth: '40rem', margin: '0 auto' }}>
                  Inspect your first board in{' '}
                  <span className="lp-text-gradient">seconds.</span>
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
            <span className="lp-logo-icon" style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem' }}><IconActivity /></span>
            <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>Cadence</span>
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
    </div>
  )
}
