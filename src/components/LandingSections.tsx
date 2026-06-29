import { ScanEye, Zap, BarChart3, AlertCircle, TrendingUp, Package, ArrowRight } from 'lucide-react'

export function LandingStats() {
  const stats = [
    { value: '118', label: 'Parallel agents' },
    { value: '<3s', label: 'End-to-end time' },
    { value: '100+', label: 'Inspector threads' },
    { value: '10', label: 'Specialist roles' },
  ]

  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-12 sm:grid-cols-4 sm:gap-8 sm:py-16 sm:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{s.value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function LandingSwarm() {
  const layers = [
    {
      title: 'Inspector Agents',
      count: '100',
      icon: ScanEye,
      description: 'Scan 10×10 PCB grid in parallel, each processing one zone',
      color: 'text-primary',
    },
    {
      title: 'Specialist Agents',
      count: '10',
      icon: Zap,
      description: 'Solder, IC, Capacitor, Resistor, Traces — debate findings',
      color: 'text-brand',
    },
    {
      title: 'Dispatcher Agents',
      count: '5',
      icon: AlertCircle,
      description: 'Alert, Inventory, QA, Safety — execute consensus actions',
      color: 'text-critical',
    },
  ]

  return (
    <section id="swarm" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            118-Agent Architecture
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Swarm layers
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">
            Coordinated by 3 Lead agents. Each layer reports findings to the next via work queue.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {layers.map((l) => {
            const Icon = l.icon
            return (
              <div
                key={l.title}
                className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-6 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className={`text-sm font-semibold ${l.color}`}>{l.title}</div>
                    <div className="mt-1 font-display text-3xl font-extrabold">{l.count}</div>
                  </div>
                  <Icon className={`h-6 w-6 ${l.color} opacity-60`} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{l.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function LandingFeatures() {
  const features = [
    {
      title: 'Upload & Parse',
      description: 'KiCad netlist, schematic, or image upload. Vision agent extracts components.',
      icon: Package,
    },
    {
      title: 'Parallel Scanning',
      description: '100 inspectors scan 100 zones simultaneously via work queue orchestration.',
      icon: ScanEye,
    },
    {
      title: 'Specialist Debate',
      description: '10 specialists analyze findings, cross-verify, reach consensus.',
      icon: TrendingUp,
    },
    {
      title: 'Real-time Analysis',
      description: 'Live metrics dashboard with agent telemetry, work queue status, latency.',
      icon: BarChart3,
    },
    {
      title: 'Alerts & Actions',
      description: '5 dispatchers execute: send alerts, manage inventory, log to audit.',
      icon: AlertCircle,
    },
    {
      title: 'Cerebras Gemma 4',
      description: 'All reasoning powered by Cerebras Gemma 4 for instant inference.',
      icon: Zap,
    },
  ]

  return (
    <section id="features" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Capabilities
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Built for manufacturing
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function LandingStack() {
  const stack = [
    { name: 'React 19', icon: '⚛️' },
    { name: 'TypeScript', icon: '🔷' },
    { name: 'Cerebras Gemma 4', icon: '🧠' },
    { name: 'Canvas API', icon: '🖼️' },
    { name: 'Vite', icon: '⚙️' },
    { name: 'Tailwind CSS', icon: '🎨' },
  ]

  return (
    <section id="stack" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tech
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Modern stack
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
          {stack.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3 transition-colors hover:bg-surface"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingCTA() {
  return (
    <section className="border-t border-border bg-gradient-to-b from-surface to-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to see the swarm in action?
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Launch the 118-agent swarm now. Upload a PCB image or netlist and watch real agents collaborate on defect detection in under 3 seconds.
        </p>

        <a
          href="#launch"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
        >
          Launch swarm
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}
