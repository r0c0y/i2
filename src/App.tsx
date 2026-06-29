import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CircuitDiagram } from './components/CircuitDiagram';
import { WaveformViewer } from './components/WaveformViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { VerificationPanel } from './components/VerificationPanel';
import { PipelineSteps } from './components/PipelineSteps';
import { NetlistViewer } from './components/NetlistViewer';
import { BringUpChecklist } from './components/BringUpChecklist';
import { NetContextPanel } from './components/NetContextPanel';
import { CadenceDashboard } from './components/CadenceDashboard';
import { GlassIcon } from './components/GlassIcon';
import { LandingPage } from './components/LandingPage';
import { AgentsView } from './components/AgentsView';
import { KnowledgeGraphViewer } from './components/KnowledgeGraphViewer';
import { getKnowledgeGraph, addKnowledgeEdge } from './services/knowledgeGraph';
import type {
  CircuitAnalysis,
  VerificationResult,
  DemoCircuit,
  Netlist,
  WaveformMeasurement,
  BringUpStep,
  NetContext,
} from './types';
import {
  analyzeCircuit,
  computeTheoreticalValues,
  parseScopeCSV,
  extractMeasurementsFromImage,
  extractNetlistFromImage,
  synthesizeVerification,
  parseKiCadNetlist,
  fileToBase64,
  generateBringUpChecklist,
  getNetContext,
  detectProtocol,
  getLastCerebrasTiming,
  DEMO_CIRCUITS,
  generateSampleCSV,
} from './services/circuitAnalysis';
import './App.css';

type DemoStage = 'landing' | 'intro' | 'schematic' | 'analyzing' | 'analysis' | 'waveform' | 'verified';
type SchematicTab = 'kicad' | 'image' | 'paste' | 'demo';
type InternalTab = 'dashboard' | 'agents' | 'circuitscope' | 'knowledge';

function App() {
  const [internalTab, setInternalTab] = useState<InternalTab>('dashboard');
  const [selectedCircuit, setSelectedCircuit] = useState<DemoCircuit | null>(null);
  const [netlist, setNetlist] = useState<Netlist | null>(null);
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [waveform, setWaveform] = useState<WaveformMeasurement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<DemoStage>('landing');
  const [analysisTime, setAnalysisTime] = useState<number>(0);
  const [showNetlist, setShowNetlist] = useState(false);
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [schematicTab, setSchematicTab] = useState<SchematicTab>('demo');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [agentResults, setAgentResults] = useState<{
    theoretical?: any;
    waveformSource?: string;
  }>({});
  const [bringUpSteps, setBringUpSteps] = useState<BringUpStep[]>([]);
  const [netContext, setNetContext] = useState<NetContext | null>(null);
  const [protocolResult, setProtocolResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'bringup' | 'context'>('analysis');
  const [graphSearchQuery, setGraphSearchQuery] = useState('');
  
  // Collaborative Agent Swarm states
  const [agentChatLines, setAgentChatLines] = useState<{ sender: string; text: string; role: 'vision' | 'theory' | 'verification' }[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<('idle' | 'active' | 'done')[]>(['idle', 'idle', 'idle']);

  const addAgentLog = useCallback((sender: string, text: string, role: 'vision' | 'theory' | 'verification') => {
    setAgentChatLines(prev => [...prev, { sender, text, role }]);
  }, []);
  const analysisStartTime = useRef(0);
  const kicadInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scopeImageRef = useRef<HTMLInputElement>(null);
  const scopeCsvRef = useRef<HTMLInputElement>(null);
  const autoShowDefect = useRef(false);

  // Listen for cross-product navigation events
  useEffect(() => {
    const handleSwitchToCircuitScope = () => {
      setInternalTab('circuitscope');
      setStage('intro');
    };
    window.addEventListener('switchToCircuitScope', handleSwitchToCircuitScope);
    return () => window.removeEventListener('switchToCircuitScope', handleSwitchToCircuitScope);
  }, []);

  const reset = useCallback(() => {
    setSelectedCircuit(null);
    setNetlist(null);
    setAnalysis(null);
    setVerification(null);
    setWaveform(null);
    setShowNetlist(false);
    setSelectedComp(null);
    setStatusMsg('');
    setAnalysisTime(0);
    setPasteText('');
    setPasteError('');
    setAgentResults({});
  }, []);

  const currentNetlist = selectedCircuit?.netlist || netlist;

  // ── Run 3-Agent Pipeline ──

  const runAgentPipeline = useCallback(async (inputNetlist: Netlist) => {
    setIsProcessing(true);
    setStage('analyzing');
    setAgentChatLines([]);
    setAgentStatuses(['active', 'idle', 'idle']);
    analysisStartTime.current = Date.now();

    // Agent 1: Vision Netlist Extractor
    addAgentLog('Vision Agent', 'Initiating netlist extraction on incoming circuit...', 'vision');
    await new Promise(r => setTimeout(r, 600));
    addAgentLog('Vision Agent', `Extraction complete. Detected ${inputNetlist.components.length} SMT components and ${inputNetlist.nets.length} interconnecting nets.`, 'vision');
    setAgentStatuses(['done', 'active', 'idle']);

    // Agent 2: Theoretical Predictor (Theory Agent)
    addAgentLog('Theory Agent', 'Calculating mathematical limits & nominals using node equations...', 'theory');
    await new Promise(r => setTimeout(r, 650));
    const theoretical = computeTheoreticalValues(inputNetlist);
    setAgentResults(prev => ({ ...prev, theoretical }));

    // Generate checklist
    const steps = generateBringUpChecklist(inputNetlist);
    setBringUpSteps(steps);

    addAgentLog('Theory Agent', `Formula analysis complete: f = ${theoretical.calculatedFrequency ? theoretical.calculatedFrequency.toFixed(1) + 'Hz' : 'N/A'}, Vpp = ${theoretical.calculatedVpp != null ? theoretical.calculatedVpp.toFixed(1) + 'V' : 'N/A'}.`, 'theory');
    addAgentLog('Theory Agent', 'Triggering Gemma 4 vision/behavior prediction on Cerebras API...', 'theory');
    
    let llmAnalysis: CircuitAnalysis;
    try {
      llmAnalysis = await analyzeCircuit(inputNetlist);
    } catch (err: any) {
      addAgentLog('Theory Agent', `LLM analysis failed: ${err.message}. Using fallback.`, 'theory');
      llmAnalysis = {
        netlist: inputNetlist,
        predictedBehavior: 'Analysis unavailable — LLM call failed',
        predictedWaveform: {
          measurements: { frequency: 0, period: 0, vHigh: 5, vLow: 0, vPp: 5, dutyCycle: 0.5, riseTime: 0, fallTime: 0 },
          type: 'unknown',
          description: 'Could not predict waveform',
        },
        issues: ['LLM analysis failed — check API key and network'],
        confidence: 0,
      };
    }

    // Merge
    if (theoretical.calculatedFrequency && llmAnalysis.predictedWaveform) {
      llmAnalysis.predictedWaveform.measurements.frequency = theoretical.calculatedFrequency;
      llmAnalysis.predictedWaveform.measurements.dutyCycle = theoretical.calculatedDutyCycle ?? llmAnalysis.predictedWaveform.measurements.dutyCycle;
    }
    setAnalysis(llmAnalysis);

    addAgentLog('Theory Agent', 'Behavior model loaded. Nominals established.', 'theory');
    setAgentStatuses(['done', 'done', 'active']);

    // Save circuit analysis to knowledge graph for cross-product integration
    try {
      const circuitType = inputNetlist.components.some(c => c.value?.toUpperCase().includes('555')) ? '555_timer' :
        inputNetlist.components.some(c => c.value?.toUpperCase().includes('CD40')) ? 'CMOS' :
        inputNetlist.components.some(c => c.type === 'Q') ? 'transistor_circuit' : 'general_circuit';
      
      addKnowledgeEdge(circuitType, 'analyzed_by', 'CircuitScope', 'agent_consensus');
      if (theoretical.calculatedFrequency) {
        addKnowledgeEdge(circuitType, 'has_frequency', `${theoretical.calculatedFrequency.toFixed(1)}Hz`, 'agent_consensus');
      }
      addKnowledgeEdge(circuitType, 'circuit_type', theoretical.circuitType, 'agent_consensus');
      addAgentLog('Knowledge Graph', 'system', `Circuit analysis saved to knowledge graph`, 'info');
    } catch (e) {
      // Knowledge graph save failed, continue
    }

    // Agent 3: Signal Verification Agent
    addAgentLog('Verification Agent', 'Awaiting physical oscilloscope telemetry input (CSV/image)...', 'verification');

    // Use actual Cerebras API timing if available
    const cerebrasTiming = getLastCerebrasTiming();
    setAnalysisTime(cerebrasTiming ? Math.round(cerebrasTiming.total) : Date.now() - analysisStartTime.current);
    setStage('analysis');
    setIsProcessing(false);
  }, [addAgentLog]);

  // Auto-show mismatched waveform when launched from case study card
  useEffect(() => {
    if (stage === 'analysis' && autoShowDefect.current && selectedCircuit && analysis?.predictedWaveform && currentNetlist) {
      autoShowDefect.current = false;
      const { theoretical } = agentResults;
      if (!theoretical) return;
      const demoWave = selectedCircuit.mismatchedWaveform;
      setWaveform(demoWave.measurements);
      setAgentResults(prev => ({ ...prev, waveformSource: 'Demo: industry case study' }));
      const result = synthesizeVerification(theoretical, demoWave.measurements, currentNetlist);
      setVerification(result);
      setStage('verified');
      addAgentLog('System', `[Auto] Loaded mismatched waveform — defect detected (score: ${(result.score * 100).toFixed(0)}%)`, 'verification');
    }
  }, [stage, selectedCircuit, analysis, currentNetlist, agentResults, addAgentLog]);

  // ── Demo Flow ──

  const handleSelectCircuit = useCallback((circuit: DemoCircuit) => {
    reset();
    setSelectedCircuit(circuit);
    runAgentPipeline(circuit.netlist);
  }, [reset, runAgentPipeline]);

  const handleDownloadSampleCSV = useCallback((matching: boolean) => {
    if (!selectedCircuit) return;
    const csvContent = generateSampleCSV(selectedCircuit.id, matching ? 'matching' : 'mismatched');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCircuit.id}_${matching ? 'matching' : 'mismatched'}_waveform.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedCircuit]);

  // ── KiCad .net Upload ──

  const handleKiCadUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    setSchematicTab('kicad');

    try {
      setStatusMsg('Parsing KiCad netlist...');
      const text = await file.text();
      const parsed = parseKiCadNetlist(text);
      setNetlist(parsed);
      setStage('schematic');
      await runAgentPipeline(parsed);
    } catch (err: any) {
      setPasteError(err.message || 'Failed to parse KiCad netlist');
      setStatusMsg('');
    }
  }, [reset, runAgentPipeline]);

  // ── Image Upload ──

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    setSchematicTab('image');

    try {
      setStatusMsg('Reading schematic with vision model...');
      const base64 = await fileToBase64(file);
      const parsed = await extractNetlistFromImage(base64);
      setNetlist(parsed);
      setStage('schematic');
      await runAgentPipeline(parsed);
    } catch (err: any) {
      setPasteError(err.message || 'Failed to extract netlist from image');
      setStatusMsg('');
    }
  }, [reset, runAgentPipeline]);

  // ── Paste Netlist ──

  const handlePasteNetlist = useCallback(async () => {
    if (!pasteText.trim()) { setPasteError('Paste a netlist first'); return; }
    setPasteError('');
    reset();
    setSchematicTab('paste');

    try {
      const parsed = parseKiCadNetlist(pasteText);
      setNetlist(parsed);
      setStage('schematic');
      await runAgentPipeline(parsed);
    } catch (err: any) {
      setPasteError(err.message || 'Failed to parse netlist');
    }
  }, [pasteText, reset, runAgentPipeline]);

  // ── Scope Image ──

  const handleScopeImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !analysis) return;
    setIsProcessing(true);
    setStage('waveform');
    try {
      setStatusMsg('Reading oscilloscope with vision model...');
      const base64 = await fileToBase64(file);
      const measurements = await extractMeasurementsFromImage(base64);
      setWaveform(measurements);
      setAgentResults(prev => ({ ...prev, waveformSource: 'Vision model (image)' }));

      // Agent 3: Synthesize
      if (analysis.predictedWaveform && currentNetlist) {
        const theoretical = computeTheoreticalValues(currentNetlist);
        const result = synthesizeVerification(theoretical, measurements, currentNetlist);
        setVerification(result);
        setStage('verified');
      }
    } catch (err) { console.error(err); setStage('analysis'); }
    finally { setIsProcessing(false); setStatusMsg(''); }
  }, [analysis, currentNetlist]);

  // ── Scope CSV ──

  const handleScopeCsvUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !analysis) return;
    setIsProcessing(true);
    setStage('waveform');
    try {
      setStatusMsg('Parsing oscilloscope CSV...');
      const text = await file.text();
      const result = parseScopeCSV(text);
      setWaveform(result);
      setAgentResults(prev => ({ ...prev, waveformSource: result.source }));

      // Detect protocol from multi-channel
      if (result.channels && result.channels.length > 1) {
        const proto = detectProtocol(result.channels);
        setProtocolResult(proto);
      }

      // Agent 3: Synthesize
      if (currentNetlist) {
        const theoretical = computeTheoreticalValues(currentNetlist);
        const synthResult = synthesizeVerification(theoretical, result, currentNetlist);
        setVerification(synthResult);
        setStage('verified');
      }
    } catch (err: any) { setPasteError(err.message); setStage('analysis'); }
    finally { setIsProcessing(false); setStatusMsg(''); }
  }, [analysis, currentNetlist]);

  // ── Demo Waveform ──

  const handleLoadDemoWaveform = useCallback((isMatching: boolean) => {
    if (!selectedCircuit || !analysis?.predictedWaveform || !currentNetlist) return;
    const demoWave = isMatching ? selectedCircuit.matchingWaveform : selectedCircuit.mismatchedWaveform;
    setWaveform(demoWave.measurements);
    setAgentResults(prev => ({ ...prev, waveformSource: isMatching ? 'Demo: matching' : 'Demo: mismatched' }));

    const theoretical = computeTheoreticalValues(currentNetlist);
    const result = synthesizeVerification(theoretical, demoWave.measurements, currentNetlist);
    setVerification(result);
    setStage('verified');

    // Save verification results to knowledge graph
    try {
      addKnowledgeEdge(selectedCircuit.id, 'verification_score', `${(result.score * 100).toFixed(0)}%`, 'agent_consensus');
      addKnowledgeEdge(selectedCircuit.id, 'has_defects', result.differences.length > 0 ? 'yes' : 'no', 'agent_consensus');
      if (result.differences.length > 0) {
        result.differences.forEach(diff => {
          addKnowledgeEdge(selectedCircuit.id, 'issue_found', diff.substring(0, 50), 'agent_consensus');
        });
      }
    } catch (e) {
      // Knowledge graph save failed
    }
  }, [selectedCircuit, analysis, currentNetlist]);

  // ── Pipeline Steps ──

  const steps = [
    { key: 'upload', label: 'Input' },
    { key: 'extracting', label: 'Parse' },
    { key: 'netlist-ready', label: 'Netlist' },
    { key: 'analyzing', label: 'Agent 1: Math' },
    { key: 'analysis-done', label: 'Agent 2: LLM' },
    { key: 'verifying', label: 'Agent 3: Synth' },
    { key: 'verified', label: 'Verified' },
  ];

  const getStepIndex = () => {
    switch (stage) {
      case 'intro': return -1;
      case 'schematic': return 2;
      case 'analyzing': return 4;
      case 'analysis': return 5;
      case 'waveform': return 6;
      case 'verified': return 6;
      default: return -1;
    }
  };

  const handleTriggerProbeTest = useCallback((circuitId: string) => {
    const circuit = DEMO_CIRCUITS.find(c => c.id === circuitId);
    if (circuit) {
      setSelectedCircuit(circuit);
      runAgentPipeline(circuit.netlist);
      setInternalTab('circuitscope');
    }
  }, [runAgentPipeline]);

  return (
    <ErrorBoundary>
    <div className="app">
      {/* Landing Page - full scrollable page */}
      {stage === 'landing' && (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <LandingPage
            onEnterCadence={() => { setStage('intro'); setInternalTab('dashboard'); }}
            onEnterCircuitScope={() => { setStage('intro'); setInternalTab('circuitscope'); }}
          />
        </div>
      )}

      {/* App View (non-landing) */}
      {stage !== 'landing' && (
        <>
          {/* Top navigation bar */}
          <div className="app-topnav">
            <div className="app-topnav-left">
              <button className="app-topnav-home" onClick={() => { reset(); setStage('landing'); }} aria-label="Back to home">
                <GlassIcon name="bolt" size={14} variant="purple" />
                <span className="app-topnav-logo">Cadence</span>
              </button>
            </div>
            <nav className="app-topnav-tabs" role="tablist" aria-label="Main navigation">
              <button role="tab" aria-selected={internalTab === 'dashboard'} className={`app-topnav-tab ${internalTab === 'dashboard' ? 'active' : ''}`} onClick={() => setInternalTab('dashboard')}>
                <GlassIcon name="factory" size={13} variant={internalTab === 'dashboard' ? 'purple' : 'gray'} />
                Dashboard
              </button>
              <button role="tab" aria-selected={internalTab === 'agents'} className={`app-topnav-tab ${internalTab === 'agents' ? 'active' : ''}`} onClick={() => setInternalTab('agents')}>
                <GlassIcon name="brain" size={13} variant={internalTab === 'agents' ? 'purple' : 'gray'} />
                Agents
              </button>
              <button role="tab" aria-selected={internalTab === 'circuitscope'} className={`app-topnav-tab ${internalTab === 'circuitscope' ? 'active' : ''}`} onClick={() => setInternalTab('circuitscope')}>
                <GlassIcon name="bolt" size={13} variant={internalTab === 'circuitscope' ? 'purple' : 'gray'} />
                CircuitScope
              </button>
              <button role="tab" aria-selected={internalTab === 'knowledge'} className={`app-topnav-tab ${internalTab === 'knowledge' ? 'active' : ''}`} onClick={() => setInternalTab('knowledge')}>
                <GlassIcon name="camera" size={13} variant={internalTab === 'knowledge' ? 'purple' : 'gray'} />
                Knowledge
              </button>
            </nav>
          </div>

      {/* ── Dashboard ── */}
      {internalTab === 'dashboard' && <CadenceDashboard onTriggerProbeTest={handleTriggerProbeTest} />}

      {/* ── Agents ── */}
      {internalTab === 'agents' && <AgentsView />}

      {/* ── Knowledge ── */}
      {internalTab === 'knowledge' && (
        <div className="knowledge-fullscreen">
          <div className="knowledge-toolbar">
            <h3>Knowledge Graph</h3>
            <div className="knowledge-search">
              <input
                type="text"
                placeholder="Search nodes..."
                value={graphSearchQuery}
                onChange={e => setGraphSearchQuery(e.target.value)}
                className="knowledge-search-input"
              />
              <span className="knowledge-count">{getKnowledgeGraph().length} edges</span>
            </div>
          </div>
          <KnowledgeGraphViewer edges={getKnowledgeGraph()} searchQuery={graphSearchQuery} />
        </div>
      )}

      {/* ══ CircuitScope: Stage 1 — Intro / Input ══ */}
      {internalTab === 'circuitscope' && stage === 'intro' && (
        <div className="intro-screen">
          <div className="intro-content">
            <div className="intro-badge">
              <span className="badge-dot" />
              Cerebras × Gemma 4 Hackathon
            </div>

            <h1 className="intro-title">
              Hardware Debugging<br />
              <span className="accent">in Seconds, Not Days</span>
            </h1>

            <p className="intro-subtitle">
              Upload a KiCad netlist or schematic image. Three AI agents compute
              theoretical values, analyze your oscilloscope telemetry, and pinpoint
              which component is drifting — instantly.
            </p>

            <div className="intro-tech-row">
              <div className="tech-pill">Vision Agent — OCR &amp; Parse</div>
              <div className="tech-pill">Theory Agent — Formulaic Math</div>
              <div className="tech-pill">Verification Agent — Signal Sync</div>
            </div>

            {/* Real-World Case Studies — clickable, runs full pipeline */}
            <div className="case-studies-row">
              {(() => {
                const c = (id: string) => DEMO_CIRCUITS.find(d => d.id === id)!;
                return (
                  <>
                    <button className="circuit-card circuit-automotive" onClick={() => { autoShowDefect.current = true; handleSelectCircuit(c('bldc-motor')); }}>
                      <span className="circuit-industry-tag industry-automotive">AUTOMOTIVE</span>
                      <span style={{ fontSize: '18px' }}>🚗</span>
                      <span className="circuit-card-name">BLDC Motor Shoot-Through</span>
                      <span className="circuit-card-desc">Dead-time violation melts gate driver — $2,400 repair per ECU</span>
                      <span className="circuit-usecase">Agent detects: Vgs ringing &gt;20V, cross-conduction at commutation</span>
                    </button>
                    <button className="circuit-card circuit-medical" onClick={() => { autoShowDefect.current = true; handleSelectCircuit(c('ecg-frontend')); }}>
                      <span className="circuit-industry-tag industry-medical">MEDICAL</span>
                      <span style={{ fontSize: '18px' }}>🏥</span>
                      <span className="circuit-card-name">ECG CMRR Degradation</span>
                      <span className="circuit-card-desc">RFI filter drift makes ECG unreadable — misdiagnosis risk</span>
                      <span className="circuit-usecase">Agent detects: CMRR drop 100dB→72dB, 50Hz mains bleed-through</span>
                    </button>
                    <button className="circuit-card circuit-power" onClick={() => { autoShowDefect.current = true; handleSelectCircuit(c('buck-converter')); }}>
                      <span className="circuit-industry-tag industry-power">POWER</span>
                      <span style={{ fontSize: '18px' }}>⚡</span>
                      <span className="circuit-card-name">Buck Converter Saturation</span>
                      <span className="circuit-card-desc">Aged inductor doubles ripple — 5V rail droops to 4.2V, logic glitches</span>
                      <span className="circuit-usecase">Agent detects: 200mV p-p ripple, subharmonic oscillation at 8kHz</span>
                    </button>
                    <button className="circuit-card circuit-industrial" onClick={() => { autoShowDefect.current = true; handleSelectCircuit(c('plc-input')); }}>
                      <span className="circuit-industry-tag industry-industrial">INDUSTRIAL</span>
                      <span style={{ fontSize: '18px' }}>🏭</span>
                      <span className="circuit-card-name">PLC Optocoupler Failure</span>
                      <span className="circuit-card-desc">CTR drops 100%→30% after 50k hours — machine loses all sensors</span>
                      <span className="circuit-usecase">Agent detects: logic level never reaches 2.5V threshold, stuck low</span>
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Input card */}
            <div className="upload-section">
              <div className="upload-heading">Circuit Input</div>

              <div className="tab-row">
                <button
                  id="tab-kicad"
                  className={`tab ${schematicTab === 'kicad' ? 'active' : ''}`}
                  onClick={() => setSchematicTab('kicad')}
                >
                  KiCad .net
                </button>
                <button
                  id="tab-paste"
                  className={`tab ${schematicTab === 'paste' ? 'active' : ''}`}
                  onClick={() => setSchematicTab('paste')}
                >
                  Paste SPICE
                </button>
                <button
                  id="tab-image"
                  className={`tab ${schematicTab === 'image' ? 'active' : ''}`}
                  onClick={() => setSchematicTab('image')}
                >
                  Schematic Image
                </button>
                <button
                  id="tab-demo"
                  className={`tab ${schematicTab === 'demo' ? 'active' : ''}`}
                  onClick={() => setSchematicTab('demo')}
                >
                  Demo Circuits
                </button>
              </div>

              {pasteError && <div className="paste-error">{pasteError}</div>}

              {schematicTab === 'kicad' && (
                <div className="upload-box" onClick={() => kicadInputRef.current?.click()}>
                  <input ref={kicadInputRef} type="file" accept=".net,.sp,.cir,.spice" onChange={handleKiCadUpload} style={{ display: 'none' }} />
                  <GlassIcon name="clipboard" size={28} variant="blue" style={{ marginBottom: '6px' }} />
                  <span className="upload-label">Upload KiCad .net File</span>
                  <span className="upload-hint">Ground truth — 100% accurate netlist export</span>
                </div>
              )}

              {schematicTab === 'paste' && (
                <div className="paste-section">
                  <textarea
                    id="paste-netlist-input"
                    className="paste-textarea"
                    placeholder={`SPICE format:\nR1 VCC DIS 1k\nR2 DIS THR 10k\nC1 THR GND 100n\nC2 CTRL GND 10n\nU1 VCC GND DIS THR TRI OUT RST CTRL NE555`}
                    value={pasteText}
                    onChange={(e) => { setPasteText(e.target.value); setPasteError(''); }}
                    rows={7}
                  />
              <button
                id="btn-parse-analyze"
                className="btn-analyze"
                onClick={handlePasteNetlist}
                disabled={isProcessing || !pasteText.trim()}
              >
                Parse &amp; Analyze
              </button>
                </div>
              )}

              {schematicTab === 'image' && (
                <div className="upload-box" onClick={() => imageInputRef.current?.click()}>
                  <input ref={imageInputRef} type="file" accept="image/*,.ppm,.bmp,.tiff,.tif" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <GlassIcon name="camera" size={28} variant="green" style={{ marginBottom: '6px' }} />
                  <span className="upload-label">Upload Schematic Image</span>
                  <span className="upload-hint">PNG, JPG, BMP, TIFF — vision model extracts netlist</span>
                </div>
              )}

              {schematicTab === 'demo' && (
                <div className="circuit-grid">
                  {DEMO_CIRCUITS.map(circuit => (
                    <button
                      key={circuit.id}
                      id={`circuit-demo-${circuit.id}`}
                      className={`circuit-card ${circuit.industry ? `circuit-${circuit.industry}` : ''}`}
                      onClick={() => handleSelectCircuit(circuit)}
                    >
                      {circuit.industry && (
                        <span className={`circuit-industry-tag industry-${circuit.industry}`}>
                          {circuit.industry.toUpperCase()}
                        </span>
                      )}
                      <GlassIcon name={circuit.icon} size={24} variant="purple" style={{ marginBottom: '4px' }} />
                      <span className="circuit-card-name">{circuit.name}</span>
                      <span className="circuit-card-desc">{circuit.description}</span>
                      {circuit.useCase && (
                        <span className="circuit-usecase">{circuit.useCase}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="intro-grid-bg" />
        </div>
      )}

      {/* ══ CircuitScope: Stage 2 — Agent Orchestration Loading ══ */}
      {internalTab === 'circuitscope' && stage === 'analyzing' && (
        <div className="orchestration-screen">
          <div className="orchestration-card">
            <div className="orbit-ring" />
            <div className="orchestration-title">Running Agent Swarm</div>
            <div className="orchestration-subtitle">Three specialists working in sequence</div>

            <div className="agent-progress-list">
              {(['Vision Agent', 'Theory Agent', 'Verification Agent'] as const).map((name, i) => {
                const status = agentStatuses[i];
                return (
                  <div key={name} className={`agent-progress-row ${status}`}>
                    <div className="agent-name-tag">
                      <span className="agent-row-dot" />
                      {name}
                    </div>
                    <span className="agent-status-label">
                      {status === 'idle' ? 'Queued' : status === 'active' ? 'Running…' : 'Done'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="agent-chat-terminal" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
              {agentChatLines.length === 0 && (
                <span style={{ color: 'var(--text-dim)' }}>Initializing pipeline…</span>
              )}
              {agentChatLines.map((line, i) => (
                <div key={i} className={`agent-chat-line ${line.role}`}>
                  <span className="sender">{line.sender}:</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ CircuitScope: Stage 3 — Analysis Workspace ══ */}
      {internalTab === 'circuitscope' && stage !== 'intro' && stage !== 'analyzing' && currentNetlist && (
        <div className="demo-layout">
          <header className="demo-header">
            <div className="header-left">
              <GlassIcon name="bolt" size={13} variant="purple" />
              <span className="logo-text">CircuitScope</span>
              <span className="header-divider">/</span>
              <span className="header-circuit">
                {selectedCircuit ? (
                  <><GlassIcon name={selectedCircuit.icon} size={13} variant="purple" />{selectedCircuit.name}</>
                ) : (
                  <><GlassIcon name="camera" size={13} variant="green" />Uploaded</>
                )}
              </span>
            </div>
            <div className="header-right">
              <button id="btn-new-circuit" className="btn-back" onClick={() => { reset(); setStage('intro'); }}>
                ← New Circuit
              </button>
              <div className="speed-badge" data-active={analysisTime > 0}>
                {analysisTime > 0 ? (
                  <>
                    <GlassIcon name="bolt" size={10} variant="purple" style={{ padding: '1px' }} />
                    {analysisTime}ms
                    <span className="speed-label">{getLastCerebrasTiming()?.model || 'Cerebras'}</span>
                  </>
                ) : (
                  <><GlassIcon name="bolt" size={10} variant="purple" style={{ padding: '1px' }} />—</>
                )}
              </div>
            </div>
          </header>

          {statusMsg && (
            <div className="status-bar">
              <div className="spinner-small" />
              {statusMsg}
            </div>
          )}

          <PipelineSteps steps={steps} activeIndex={getStepIndex()} completedIndex={getStepIndex()} />

          <main className="demo-main">
            {/* Left: Schematic diagram (full height) */}
            <section className="panel schematic-panel">
              <div className="panel-header">
                <h2>Schematic</h2>
                {currentNetlist && (
                  <button
                    id="btn-toggle-netlist"
                    className="btn-small"
                    onClick={() => setShowNetlist(!showNetlist)}
                  >
                    {showNetlist ? 'Diagram' : 'Netlist'}
                  </button>
                )}
              </div>
              <div className="panel-body">
                {showNetlist
                  ? <NetlistViewer netlist={currentNetlist} />
                  : selectedCircuit
                    ? (
                      <CircuitDiagram
                        components={currentNetlist.components}
                        selectedRef={selectedComp}
                        onComponentClick={(ref) => {
                          const next = ref === selectedComp ? null : ref;
                          setSelectedComp(next);
                          setNetContext(next ? getNetContext(next, currentNetlist) : null);
                          if (next) setActiveTab('context');
                        }}
                        circuitId={selectedCircuit.id}
                      />
                    )
                    : (
                      <div className="empty-state">
                        <GlassIcon name="clipboard" size={28} variant="gray" />
                        <p>{currentNetlist.components.length} components extracted</p>
                      </div>
                    )
                }
              </div>
            </section>

            {/* Top right: Analysis + Agent output */}
            <section className="panel analysis-panel">
              <div className="panel-header">
                <div className="panel-tabs">
                  <button id="tab-analysis" className={`panel-tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>Analysis</button>
                  <button id="tab-bringup" className={`panel-tab ${activeTab === 'bringup' ? 'active' : ''}`} onClick={() => setActiveTab('bringup')}>Bring-Up</button>
                  <button id="tab-context" className={`panel-tab ${activeTab === 'context' ? 'active' : ''}`} onClick={() => setActiveTab('context')}>Net Context</button>
                </div>
              </div>
              <div className="panel-body">
                {activeTab === 'analysis' && (
                  <>
                    {agentResults.theoretical && (
                      <div className="analysis-content">
                        <div className="analysis-card">
                          <h3>Theory Agent</h3>
                          <div className="agent-result">
                            <div className="agent-label">{agentResults.theoretical.circuitType}</div>
                            <div className="formula">{agentResults.theoretical.formula}</div>
                            <div className="calc-value">f = {agentResults.theoretical.calculatedFrequency != null ? agentResults.theoretical.calculatedFrequency.toFixed(1) + ' Hz' : 'N/A (LLM will predict)'}</div>
                            <div className="calc-value">Vpp = {agentResults.theoretical.calculatedVpp != null ? agentResults.theoretical.calculatedVpp.toFixed(1) + ' V' : 'N/A'}</div>
                            {agentResults.theoretical.calculatedDutyCycle != null && (
                              <div className="calc-value">Duty = {(agentResults.theoretical.calculatedDutyCycle * 100).toFixed(1)}%</div>
                            )}
                            <ul className="notes-list">
                              {agentResults.theoretical.notes.map((n: string, i: number) => <li key={i}>{n}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {protocolResult && protocolResult.protocol !== 'single-channel' && (
                      <div className="protocol-badge" style={{ marginTop: '12px' }}>
                        <GlassIcon name="gear" size={11} variant="blue" />
                        <span>{protocolResult.protocol} detected ({(protocolResult.confidence * 100).toFixed(0)}% confidence)</span>
                        {protocolResult.findings.map((f: string, i: number) => (
                          <span key={i} className="protocol-finding">{f}</span>
                        ))}
                      </div>
                    )}

                    {analysis
                      ? <AnalysisPanel analysis={analysis} />
                      : isProcessing
                        ? <div className="analyzing-spinner"><div className="spinner" /><p>{statusMsg}</p></div>
                        : <div className="empty-state"><GlassIcon name="bolt" size={28} variant="gray" /><p>Netlist loaded — agents computing</p></div>
                    }
                  </>
                )}
                {activeTab === 'bringup' && <BringUpChecklist steps={bringUpSteps} />}
                {activeTab === 'context' && <NetContextPanel context={netContext} />}
              </div>
            </section>

            {/* Bottom right: Waveform + Verification (rendered when ready) */}
            {(stage === 'analysis' || stage === 'waveform' || stage === 'verified') && (
              <>
                <section className="panel waveform-panel">
                  <div className="panel-header">
                    <h2>Waveform</h2>
                    <div className="waveform-buttons">
                      {selectedCircuit && stage === 'analysis' && (
                        <>
                          <button id="btn-demo-correct" className="btn-verify" onClick={() => handleLoadDemoWaveform(true)}>
                            <GlassIcon name="check" size={10} variant="green" style={{ padding: '1px' }} /> Correct
                          </button>
                          <button id="btn-demo-mismatch" className="btn-mismatch" onClick={() => handleLoadDemoWaveform(false)}>
                            <GlassIcon name="cross" size={10} variant="red" style={{ padding: '1px' }} /> Mismatched
                          </button>
                        </>
                      )}
                      {selectedCircuit && (
                        <>
                          <button
                            id="btn-dl-csv-match"
                            className="btn-small"
                            style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}
                            onClick={() => handleDownloadSampleCSV(true)}
                          >
                            <GlassIcon name="download" size={10} variant="green" style={{ padding: '1px' }} /> CSV ✓
                          </button>
                          <button
                            id="btn-dl-csv-mismatch"
                            className="btn-small"
                            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
                            onClick={() => handleDownloadSampleCSV(false)}
                          >
                            <GlassIcon name="download" size={10} variant="red" style={{ padding: '1px' }} /> CSV ✗
                          </button>
                        </>
                      )}
                      <button id="btn-scope-image" className="btn-small" onClick={() => scopeImageRef.current?.click()}>
                        <GlassIcon name="camera" size={10} variant="purple" style={{ padding: '1px' }} /> Scope Image
                      </button>
                      <button id="btn-scope-csv" className="btn-small" onClick={() => scopeCsvRef.current?.click()}>
                        <GlassIcon name="timer" size={10} variant="purple" style={{ padding: '1px' }} /> Scope CSV
                      </button>
                      <input ref={scopeImageRef} type="file" accept="image/*" onChange={handleScopeImageUpload} style={{ display: 'none' }} />
                      <input ref={scopeCsvRef} type="file" accept=".csv,.tsv,.txt" onChange={handleScopeCsvUpload} style={{ display: 'none' }} />
                    </div>
                  </div>
                  <div className="panel-body">
                    {waveform && analysis?.predictedWaveform ? (
                      <WaveformViewer
                        waveform={{ type: analysis.predictedWaveform.type, description: analysis.predictedWaveform.description, measurements: waveform }}
                        predicted={analysis.predictedWaveform.measurements}
                      />
                    ) : (
                      <div className="empty-state">
                        <GlassIcon name="timer" size={28} variant="gray" />
                        <p>Load scope data to verify</p>
                      </div>
                    )}
                  </div>
                </section>

                {verification && waveform && (
                  <section className="panel verification-panel">
                    <div className="panel-header">
                      <h2>Verification</h2>
                      <button 
                        className="btn-small"
                        style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}
                        onClick={() => {
                          // Switch to Cadence dashboard with circuit context
                          setInternalTab('dashboard');
                        }}
                      >
                        <GlassIcon name="bolt" size={10} variant="purple" style={{ padding: '1px' }} /> Switch to Cadence
                      </button>
                    </div>
                    <div className="panel-body">
                      <VerificationPanel
                        predicted={analysis?.predictedWaveform?.measurements || waveform}
                        actual={waveform}
                        verification={verification}
                      />
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      )}
       </>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default App;
