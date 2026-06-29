# Cadence — Real-Time Manufacturing Defect Detection



---

## What It Does

Cadence is a browser-based manufacturing defect detection system with a **3-agent swarm** architecture:

| Agent | Role | Speed |
|-------|------|-------|
| **Wing A** | Vision Inspectors — parallel quadrant scanning against golden master | ~100ms |
| **Wing B** | Root-Cause Analyst — cross-references defects against troubleshooting manual via Cerebras Gemma 4 | ~300ms |
| **Wing C** | Alert Dispatcher — rule-based actions + Cerebras-generated alert messages | ~200ms |

**Total pipeline: <1 second per PCB inspection**

### How It Works

1. **Upload a PCB image** or select from the demo gallery (10 pre-built images)
2. **Wing A** analyzes the image locally — detects color distribution, solder reflections, component presence
3. **Wing B** sends defect summary to Cerebras Gemma 4 which cross-references against a troubleshooting manual
4. **Wing C** determines actions (stop line, alert supervisor, quarantine batch, log defect) and generates alert messages
5. **Dashboard** shows: live defect feed, root cause analysis, tool calls, timing breakdown

### Supported Defect Types

- Solder bridges (critical)
- Missing components (critical)
- Cold solder joints (major)
- Component misalignment (major)
- Surface scratches (minor)
- Flux contamination (cosmetic/minor)

---

## Two Modes

| Mode | What It Does |
|------|-------------|
| **🏭 Cadence** | Manufacturing defect detection swarm |
| **⚡ CircuitScope** | Hardware debugging agent (3-agent pipeline for circuit analysis) |

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite

- **Image Analysis:** Local canvas-based pixel analysis
- **Demo Images:** 10 realistic PCB images generated with Node.js canvas (4 good + 6 defective)

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` — Cadence loads automatically with a demo inspection.

---

## Demo Images

The `public/demo-pcb/` folder contains 10 realistic PCB inspection images:

| Image | Type | Defect |
|-------|------|--------|
| `good_1-4.jpg` | ✅ Clean | None |
| `defective_1.jpg` | ❌ Defect | Solder bridge between IC pins |
| `defective_2.jpg` | ❌ Defect | Missing resistor R3 |
| `defective_3.jpg` | ❌ Defect | Cold joint on capacitor C2 |
| `defective_4.jpg` | ❌ Defect | Surface scratches near U2 |
| `defective_5.jpg` | ❌ Defect | IC U2 misaligned on pads |
| `defective_6.jpg` | ❌ Defect | Flux contamination |

Download all images: `public/demo-pcb.zip` (605KB)

Generate new images: `node scripts/gen-pcb.mjs`

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── CadenceDashboard.tsx    # Main Cadence UI
│   │   ├── CadenceDashboard.css    # Cadence styles
│   │   ├── CircuitDiagram.tsx      # SVG circuit schematics
│   │   ├── WaveformViewer.tsx      # Oscilloscope waveform renderer
│   │   ├── AnalysisPanel.tsx       # Circuit analysis display
│   │   ├── VerificationPanel.tsx   # Predicted vs actual comparison
│   │   ├── PipelineSteps.tsx       # Pipeline progress indicator
│   │   ├── NetlistViewer.tsx       # Component table + net list
│   │   ├── BringUpChecklist.tsx    # Guided bring-up wizard
│   │   └── NetContextPanel.tsx     # Component context panel
│   ├── services/
│   │   ├── cadenceManufacturing.ts # 3-agent swarm (vision + root cause + alerts)
│   │   └── circuitAnalysis.ts      # Circuit analysis + API layer
│   ├── types/index.ts              # TypeScript types
│   ├── App.tsx                     # Main app with view mode toggle
│   └── App.css                     # Global styles
├── public/
│   ├── demo-pcb/                   # Realistic PCB images
│   └── demo-pcb.zip                # Downloadable dataset
├── scripts/
│   └── gen-pcb.mjs                 # PCB image generator
└── package.json
```

---

## API Configuration

```typescript
// Cerebras Gemma 4 (only)
const CEREBRAS_API_KEY = 'csk_...'
const CEREBRAS_MODEL = 'gpt-oss-120b'
```

The app uses Cerebras exclusively for all LLM operations.

---

## License

MIT
