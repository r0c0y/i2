# I2 — Agentic Hardware Verification Agent

## What It Does

**CircuitScope** is a browser-based tool that analyzes circuit schematics and oscilloscope waveforms using an LLM (Gemma 4 via Groq). It follows a **hybrid pipeline** pattern — the same approach used by SINA (96.47% accuracy), CircuitVision, and Phosphor.

### Two Modes

**1. Real Upload Mode** — upload your own images:
- Upload a circuit schematic image → Vision model extracts netlist → Text model predicts behavior
- Upload an oscilloscope capture → Vision model reads measurements → Compares against prediction
- Full end-to-end: image in → verification report out

**2. Demo Mode** — pick from 4 pre-loaded circuits:
- 555 Timer, CMOS Inverter, LED Driver, RC Low-Pass Filter
- Each has matching + mismatched waveform data for quick testing

### The Pipeline

```
Schematic Image → [Groq Vision: Llama 4 Scout] → Netlist → [Groq Text: Llama 3.3 70B] → Predicted Waveform
                                                                                              ↓
Oscilloscope Image → [Groq Vision: Llama 4 Scout] → Measurements ──────────────────────→ Verification Report
```

1. **Upload schematic** (or pick demo) — PNG/JPG of any circuit drawing
2. **Vision extraction** — Llama 4 Scout reads the image, identifies components, values, connections → outputs structured netlist JSON
3. **Text analysis** — Llama 3.3 70B receives the netlist, predicts expected behavior, calculates frequency/voltage/duty cycle
4. **Upload oscilloscope** (or pick correct/mismatched) — Llama 4 Scout reads the scope screen, extracts measurements
5. **Verification** — compares predicted vs actual, shows pass/fail with root causes

### Why Hybrid Pipeline?

Pure vision-based circuit reading is unreliable. The proven approach (SINA, CircuitVision, etc.) splits the work:
- **Vision** does a small, reliable job (detect components, read labels, trace connections)
- **Structured data** (netlist) goes to the LLM for reasoning
- LLM doesn't try to "see" pixels — it reasons over clean data

This app implements the full pipeline end-to-end with real Groq Vision API calls.

### What's Real vs Demo

| Feature | Real | Demo |
|---------|------|------|
| Schematic image → netlist | ✅ Groq Vision (PNG, JPG, BMP, TIFF, PPM) | Pre-loaded netlists |
| Schematic PDF → netlist | ✅ pdf.js + Groq Vision | — |
| Paste SPICE netlist | ✅ Local text parser | — |
| Netlist → behavior prediction | ✅ Groq Text API | Same |
| Oscilloscope image → measurements | ✅ Groq Vision | — |
| Scope CSV → measurements | ✅ Local CSV parser | Pre-loaded measurements |
| Predicted vs actual comparison | ✅ Local calculation | Same |
| Verification report | ✅ Local calculation | Same |

---

## Architecture

```
CxG4/i2/
├── src/
│   ├── App.tsx              — Main app, stage machine, demo flow
│   ├── App.css              — Full dark theme, animations, gradients
│   ├── types/index.ts       — TypeScript interfaces (Component, Netlist, WaveformMeasurement, etc.)
│   ├── services/
│   │   └── circuitAnalysis.ts  — Groq API calls, demo circuits, waveform comparison
│   └── components/
│       ├── CircuitDiagram.tsx   — 4 unique SVG schematics (555, inverter, LED driver, RC filter)
│       ├── AnalysisPanel.tsx    — Shows LLM's predicted behavior + waveform params
│       ├── VerificationPanel.tsx — Predicted vs actual comparison grid
│       ├── WaveformViewer.tsx   — Animated canvas waveform renderer
│       ├── NetlistViewer.tsx    — Component table, net list, SPICE output
│       └── PipelineSteps.tsx    — Visual progress indicator
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

---

## Supported Formats

### Circuit Schematic Input
| Format | Extension | How It Works |
|--------|-----------|--------------|
| **Images** | `.png`, `.jpg`, `.jpeg`, `.bmp`, `.tiff`, `.tif`, `.ppm`, `.gif`, `.webp` | Vision model reads components, values, connections → netlist JSON |
| **PDF** | `.pdf` | pdf.js renders first page to image → Vision model extracts netlist |
| **Paste Netlist** | (text) | Direct SPICE format text — skip vision, go straight to analysis |
| **Demo circuits** | — | 4 pre-loaded: 555 Timer, CMOS Inverter, LED Driver, RC Filter |

### Oscilloscope Measurement Input
| Format | Extension | How It Works |
|--------|-----------|--------------|
| **Images** | `.png`, `.jpg`, `.bmp`, `.tiff`, `.ppm` | Vision model reads scope screen → extracts frequency, Vpp, duty cycle |
| **CSV** | `.csv`, `.tsv`, `.txt` | Parses time, voltage columns → calculates measurements locally |
| **Demo data** | — | Pre-loaded matching + mismatched waveforms for each circuit |

### SPICE Netlist Format (paste)
```
R1 VCC DIS 1k
R2 DIS THR 10k
C1 THR GND 100n
C2 CTRL GND 10n
U1 VCC GND DIS THR TRI OUT RST CTRL NE555
```

| Circuit | Icon | What It Does | Expected Output |
|---------|------|--------------|-----------------|
| 555 Timer Astable | ⏱️ | NE555 oscillating at ~937Hz | Square wave, 0-5V, 66.7% duty |
| CMOS Inverter | 🔄 | CD4049 double-inverting buffer | Clean square wave, ~1kHz |
| LED Driver PWM | 💡 | 2N7000 MOSFET PWM dimming | Square wave at gate, 40% duty |
| RC Low-Pass Filter | 📉 | Passive 1kΩ + 100nF filter | Attenuated sine at cutoff |

Each has:
- **Matching waveform** — what you'd see on a real scope (100% verification)
- **Mismatched waveform** — simulates a drifted component (e.g., C1 drifted from 100nF to 120nF)

---

## User Flow (Step by Step)

### Stage 1: Intro
- Full-screen landing page with title "Schematic → Netlist → Reason → Verify"
- 4 circuit cards to pick from
- Tech pills: "Cerebras Gemma 4", "Hybrid Pipeline", "Vision + Structured Data"

### Stage 2: Schematic
- Click a circuit card → loads SVG schematic + netlist data
- Panel layout: Schematic (left) | Gemma Analysis (right)
- "Analyze with Gemma" button appears

### Stage 3: Analyzing
- Click "Analyze with Gemma" → spinner shows
- Netlist is sent to Groq API (llama-3.3-70b-versatile)
- Response parsed as JSON → CircuitAnalysis object
- Speed badge shows inference time (e.g., "⚡ 247ms Gemma")

### Stage 4: Analysis
- Results appear: predicted behavior, expected waveform params (frequency, Vpp, duty cycle), issues, confidence
- Toggle "Show Netlist" to see component table + SPICE format
- Two buttons appear: "✓ Correct" and "✗ Mismatched"

### Stage 5: Waveform
- Click one of the waveform buttons → animated canvas shows the waveform
- Predicted (dashed) vs Actual (solid) overlay

### Stage 6: Verified
- Verification grid shows: Frequency, Vpp, Duty Cycle — each with predicted/actual/diff/status
- Overall match score (0-100%) with color coding
- If mismatch: "Possible Causes" section with actionable diagnostics

---

## Key Files Explained

### `types/index.ts`
All TypeScript interfaces:
- `Component` — a circuit component (R, C, L, U, LED, etc.) with ref, value, nodes
- `Netlist` — list of components + nets (connections between pins)
- `WaveformMeasurement` — frequency, period, vHigh, vLow, vPp, dutyCycle, riseTime, fallTime
- `WaveformAnalysis` — wraps measurements with type (square/sine/etc) and description
- `CircuitAnalysis` — full LLM response: predictedBehavior, predictedWaveform, issues, confidence
- `VerificationResult` — match boolean, score, differences, recommendations
- `DemoCircuit` — complete demo: name, netlist, matching waveform, mismatched waveform

### `services/circuitAnalysis.ts`
- `analyzeCircuit(netlist)` — sends netlist to Groq API, returns CircuitAnalysis
- `compareWaveforms(predicted, actual)` — local comparison, no API needed
- `DEMO_CIRCUITS[]` — 4 pre-built circuits with all data

### `components/CircuitDiagram.tsx`
- Renders 4 different SVG schematics based on `circuitId`
- Each diagram has clickable components with hover tooltips
- Color-coded nets: VCC=red, GND=gray, DIS/THR=orange, TRI=purple, OUT=green

### `components/WaveformViewer.tsx`
- Canvas-based animated waveform renderer
- Green solid line = actual, green dashed = predicted
- Grid, voltage labels, time markers, duty cycle annotation

### `components/VerificationPanel.tsx`
- Side-by-side comparison: predicted vs actual
- Each parameter shows match/mismatch with percentage diff
- Overall score with color bar
- Root cause suggestions for mismatches

---

## API

**Vision (image → JSON):**
- Model: `meta-llama/llama-4-scout-17b-16e-instruct`
- `extractNetlistFromImage(base64DataUrl)` — reads schematic → netlist JSON
- `extractMeasurementsFromImage(base64DataUrl)` — reads oscilloscope → measurements JSON
- `pdfToBase64Image(file)` — converts PDF first page to PNG via pdf.js

**Text (netlist → analysis):**
- Primary: `llama-3.3-70b-versatile`
- Fallback: `llama-3.1-8b-instant`
- `analyzeCircuit(netlist)` — predicts behavior + expected waveform

**Local parsers (no API needed):**
- `parseScopeCSV(text)` — parses time/voltage CSV → WaveformMeasurement
- `parseNetlistText(text)` — parses SPICE format netlist → Netlist
- `compareWaveforms(predicted, actual)` — local comparison

All API calls use `response_format: { type: 'json_object' }` for structured output.

API key is in `services/circuitAnalysis.ts`. When Cerebras credits arrive, swap to `gemma-4-31b` for sub-300ms inference.

---

## Running

```bash
cd CxG4/i2
npm install
npm run dev
# Open http://localhost:5173
```

---

## Hackathon Context

**Cerebras x Google Gemma 4**

This is I2 (project 2) of two hackathon projects:
- **I1** — 3D spatial design app with live camera tracking + voice commands
- **I2** (this) — Agentic hardware verification agent

Both use the same Groq API placeholder until Cerebras credits are issued.

The hybrid pipeline pattern is validated by:
- **SINA** — 96.47% netlist accuracy (academic, EMNLP 2024)
- **CircuitVision** — open source, YOLO + SAM + Gemini
- **Phosphor** — commercial desktop app ($$$)
- **NVIDIA Netlistify** — Best Artifact Award, DAC 2025
