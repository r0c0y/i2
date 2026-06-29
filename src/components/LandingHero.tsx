import { ArrowRight, CheckCircle2, Zap, ScanEye, Brain, Siren } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 font-mono text-xs font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            118-agent swarm · &lt;3s end-to-end
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Real-time defect detection
            <span className="block text-primary">with 118-agent swarm intelligence.</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            100 inspectors scan in parallel. 10 specialists debate. 5 dispatchers act. All coordinated by 3 leads via Cerebras Gemma 4 — under 3 seconds.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#launch"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
            >
              Launch swarm
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#swarm"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              See how it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Browser-based
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" /> Cerebras Gemma 4
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> 118 real agents
            </span>
          </div>
        </div>

        <div className="scanline glow-ring mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-critical/80" />
            <span className="h-3 w-3 rounded-full bg-major/80" />
            <span className="h-3 w-3 rounded-full bg-primary/80" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              i2 · swarm inspection #2024-118
            </span>
          </div>
          <div className="relative aspect-video bg-background/50 flex flex-col items-center justify-center gap-6">
            <div className="animate-pulse">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-brand mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">118 agents scanning...</p>
            </div>
            <div className="flex gap-8 text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <ScanEye className="h-5 w-5 text-primary/60" />
                <span>100 Inspectors</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Brain className="h-5 w-5 text-primary/60" />
                <span>10 Specialists</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Siren className="h-5 w-5 text-primary/60" />
                <span>5 Dispatchers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
