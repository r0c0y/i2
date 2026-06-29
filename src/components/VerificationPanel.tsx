import type { WaveformMeasurement, VerificationResult } from '../types'
import { GlassIcon } from './GlassIcon'

interface Props {
  predicted: WaveformMeasurement
  actual: WaveformMeasurement
  verification?: VerificationResult
}

export function VerificationPanel({ predicted, actual, verification }: Props) {
  const compare = (pred: number, act: number, tolerance: number = 0.1) => {
    const diff = Math.abs(pred - act) / Math.max(pred, 0.001)
    return {
      match: diff <= tolerance,
      diff: (diff * 100).toFixed(1),
    }
  }

  const freqResult = compare(predicted.frequency, actual.frequency)
  const vppResult = compare(predicted.vPp, actual.vPp)
  const dutyResult = compare(predicted.dutyCycle, actual.dutyCycle, 0.05)

  const overallScore = verification ? verification.score : (
    (freqResult.match ? 1 : 0) +
    (vppResult.match ? 1 : 0) +
    (dutyResult.match ? 1 : 0)
  ) / 3

  const scoreClass = overallScore >= 0.9 ? 'pass' : overallScore >= 0.6 ? 'warn' : 'fail'
  const scoreColor = overallScore >= 0.9 ? 'var(--green)' : overallScore >= 0.6 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className="verification-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="verification-grid">
        <div className={`verify-item ${freqResult.match ? 'match' : 'mismatch'}`}>
          <div className="verify-item-label">Frequency</div>
          <div className="verify-item-predicted">{predicted.frequency.toFixed(1)} Hz</div>
          <div className="verify-item-actual">{actual.frequency.toFixed(1)} Hz</div>
          <div className="verify-item-diff">{freqResult.diff}% diff</div>
        </div>
        <div className={`verify-item ${vppResult.match ? 'match' : 'mismatch'}`}>
          <div className="verify-item-label">Vpp</div>
          <div className="verify-item-predicted">{predicted.vPp.toFixed(2)} V</div>
          <div className="verify-item-actual">{actual.vPp.toFixed(2)} V</div>
          <div className="verify-item-diff">{vppResult.diff}% diff</div>
        </div>
        <div className={`verify-item ${dutyResult.match ? 'match' : 'mismatch'}`}>
          <div className="verify-item-label">Duty Cycle</div>
          <div className="verify-item-predicted">{(predicted.dutyCycle * 100).toFixed(1)}%</div>
          <div className="verify-item-actual">{(actual.dutyCycle * 100).toFixed(1)}%</div>
          <div className="verify-item-diff">{dutyResult.diff}% diff</div>
        </div>
      </div>

      <div className="verification-score">
        <div className="score-label">Overall Match</div>
        <div className={`score-value ${scoreClass}`}>{(overallScore * 100).toFixed(0)}%</div>
        <div className="score-bar">
          <div
            className="score-bar-fill"
            style={{ width: `${overallScore * 100}%`, background: scoreColor }}
          />
        </div>
      </div>

      {/* Cross-Run Memory Tip */}
      {verification?.crossRunTip && (
        <div className="cross-run-tip-box" style={{ background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.15)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--accent-bright)' }}>
            <GlassIcon name="brain" size={12} variant="purple" />
            INSTITUTIONAL MEMORY TRACKER
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            {verification.crossRunTip}
          </p>
        </div>
      )}

      {/* Ranked Diagnosed Component Faults */}
      {verification?.diagnosedFaults && verification.diagnosedFaults.length > 0 && (
        <div className="fault-diagnostics-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GlassIcon name="bolt" size={12} variant="purple" />
            Verification Agent: Self-Correcting Diagnostic Faults
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {verification.diagnosedFaults.map(f => (
              <div key={f.component} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(248, 113, 113, 0.1)', color: 'var(--red)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {f.component}
                    </span>
                    <strong style={{ fontSize: '11px', color: 'var(--text)' }}>Drift Suspect</strong>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Match Probability: <strong>{(f.probability * 100).toFixed(0)}%</strong>
                  </span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--red)', width: `${f.probability * 100}%` }} />
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!freqResult.match || !vppResult.match || !dutyResult.match ? (
        <div className="causes-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: '8px' }}>Recommended Checks</h3>
          <ul className="causes-list">
            {!freqResult.match && <li>Frequency mismatch — check component values for tolerance drift</li>}
            {!vppResult.match && <li>Amplitude mismatch — check supply voltage limits and grounding</li>}
            {!dutyResult.match && <li>Duty cycle mismatch — check passive network ratio</li>}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
