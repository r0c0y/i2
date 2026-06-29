import { useState, useCallback, useRef } from 'react';
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

type DemoStage = 'intro' | 'schematic' | 'analyzing' | 'analysis' | 'waveform' | 'verified';
type SchematicTab = 'kicad' | 'image' | 'pdf' | 'paste' | 'demo';
type ViewMode = 'circuitscope' | 'cadence';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('cadence');
  const [selectedCircuit, setSelectedCircuit] = useState<DemoCircuit | null>(null);
  const [netlist, setNetlist] = useState<Netlist | null>(null);
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [waveform, setWaveform] = useState<WaveformMeasurement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<DemoStage>('intro');
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
  
  // Collaborative Agent Swarm states
  const [agentChatLines, setAgentChatLines] = useState<{ sender: string; text: string; role: 'vision' | 'theory' | 'verification' }[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<('idle' | 'active' | 'done')[]>(['idle', 'idle', 'idle']);

  const addAgentLog = useCallback((sender: string, text: string, role: 'vision' | 'theory' | 'verification') => {
    setAgentChatLines(prev => [...prev, { sender, text, role }]);
  }, []);
  const analysisStartTime = useRef(0);
  const kicadInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const scopeImageRef = useRef<HTMLInputElement>(null);
  const scopeCsvRef = useRef<HTMLInputElement>(null);

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

    addAgentLog('Theory Agent', `Formula analysis complete: f = ${theoretical.calculatedFrequency ? theoretical.calculatedFrequency.toFixed(1) + 'Hz' : 'N/A'}, Vpp = ${theoretical.calculatedVpp?.toFixed(1)}V.`, 'theory');
    addAgentLog('Theory Agent', 'Triggering Gemma 4 vision/behavior prediction on Cerebras API...', 'theory');
    
    const llmAnalysis = await analyzeCircuit(inputNetlist);

    // Merge
    if (theoretical.calculatedFrequency && llmAnalysis.predictedWaveform) {
      llmAnalysis.predictedWaveform.measurements.frequency = theoretical.calculatedFrequency;
      llmAnalysis.predictedWaveform.measurements.dutyCycle = theoretical.calculatedDutyCycle ?? llmAnalysis.predictedWaveform.measurements.dutyCycle;
    }
    setAnalysis(llmAnalysis);

    addAgentLog('Theory Agent', 'Behavior model loaded. Nominals established.', 'theory');
    setAgentStatuses(['done', 'done', 'active']);

    // Agent 3: Signal Verification Agent
    addAgentLog('Verification Agent', 'Awaiting physical oscilloscope telemetry input (CSV/image)...', 'verification');

    // Use actual Cerebras API timing if available
    const cerebrasTiming = getLastCerebrasTiming();
    setAnalysisTime(cerebrasTiming ? Math.round(cerebrasTiming.total) : Date.now() - analysisStartTime.current);
    setStage('analysis');
    setIsProcessing(false);
  }, [addAgentLog]);

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
      setViewMode('circuitscope');
    }
  }, [runAgentPipeline]);

  return (
    <div className="app">
      {/* View Mode Toggle Rail */}
      <div className="view-mode-toggle">
        <button
          id="mode-cadence"
          className={`mode-btn ${viewMode === 'cadence' ? 'active' : ''}`}
          onClick={() => setViewMode('cadence')}
        >
          <GlassIcon name="factory" size={13} variant={viewMode === 'cadence' ? 'purple' : 'gray'} />
          Cadence — Assembly Line
        </button>
        <button
          id="mode-circuitscope"
          className={`mode-btn ${viewMode === 'circuitscope' ? 'active' : ''}`}
          onClick={() => setViewMode('circuitscope')}
        >
          <GlassIcon name="bolt" size={13} variant={viewMode === 'circuitscope' ? 'purple' : 'gray'} />
          CircuitScope — Hardware Debug
        </button>
      </div>

      {/* ── Cadence view ── */}
      {viewMode === 'cadence' && <CadenceDashboard onTriggerProbeTest={handleTriggerProbeTest} />}

      {/* ══ CircuitScope: Stage 1 — Intro / Input ══ */}
      {viewMode === 'circuitscope' && stage === 'intro' && (
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
                  {pasteError && <div className="paste-error">{pasteError}</div>}
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
                      className="circuit-card"
                      onClick={() => handleSelectCircuit(circuit)}
                    >
                      <GlassIcon name={circuit.icon} size={24} variant="purple" style={{ marginBottom: '4px' }} />
                      <span className="circuit-card-name">{circuit.name}</span>
                      <span className="circuit-card-desc">{circuit.description}</span>
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
      {viewMode === 'circuitscope' && stage === 'analyzing' && (
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
      {viewMode === 'circuitscope' && stage !== 'intro' && stage !== 'analyzing' && currentNetlist && (
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
                            {agentResults.theoretical.calculatedFrequency && (
                              <div className="calc-value">f = {agentResults.theoretical.calculatedFrequency.toFixed(1)} Hz</div>
                            )}
                            {agentResults.theoretical.calculatedDutyCycle !== null && (
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

                {verification && (
                  <section className="panel verification-panel">
                    <div className="panel-header"><h2>Verification</h2></div>
                    <div className="panel-body">
                      <VerificationPanel
                        predicted={analysis?.predictedWaveform?.measurements || waveform!}
                        actual={waveform!}
                      />
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
