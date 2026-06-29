import type { CircuitAnalysis } from '../types'

interface Props {
  analysis: CircuitAnalysis
}

export function AnalysisPanel({ analysis }: Props) {
  return (
    <div className="analysis-content">
      <div className="analysis-card">
        <h3>Predicted Behavior</h3>
        <p>{analysis.predictedBehavior}</p>
      </div>

      {analysis.predictedWaveform && (
        <div className="analysis-card">
          <h3>Expected Waveform</h3>
          <div className="waveform-params">
            <div className="param-item">
              <span className="param-label">Type</span>
              <span className="param-value">{analysis.predictedWaveform.type}</span>
            </div>
            <div className="param-item">
              <span className="param-label">Frequency</span>
              <span className="param-value">{analysis.predictedWaveform.measurements.frequency.toFixed(1)} Hz</span>
            </div>
            <div className="param-item">
              <span className="param-label">Period</span>
              <span className="param-value">{(analysis.predictedWaveform.measurements.period * 1000).toFixed(3)} ms</span>
            </div>
            <div className="param-item">
              <span className="param-label">V High</span>
              <span className="param-value">{analysis.predictedWaveform.measurements.vHigh.toFixed(2)} V</span>
            </div>
            <div className="param-item">
              <span className="param-label">V Low</span>
              <span className="param-value">{analysis.predictedWaveform.measurements.vLow.toFixed(2)} V</span>
            </div>
            <div className="param-item">
              <span className="param-label">Duty Cycle</span>
              <span className="param-value">{(analysis.predictedWaveform.measurements.dutyCycle * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {analysis.issues.length > 0 && (
        <div className="analysis-card">
          <h3>Potential Issues</h3>
          <ul className="issues-list">
            {analysis.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="analysis-card">
        <h3>Confidence</h3>
        <div className="confidence-bar">
          <div className="confidence-track">
            <div
              className={`confidence-fill ${analysis.confidence > 0.8 ? 'high' : analysis.confidence > 0.6 ? 'medium' : 'low'}`}
              style={{ width: `${analysis.confidence * 100}%` }}
            />
          </div>
          <span className="confidence-label">{(analysis.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}
