import type { WaveformMeasurement } from '../types'

interface Props {
  predicted: WaveformMeasurement
  actual: WaveformMeasurement
}

export function VerificationPanel({ predicted, actual }: Props) {
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

  const overallScore = (
    (freqResult.match ? 1 : 0) +
    (vppResult.match ? 1 : 0) +
    (dutyResult.match ? 1 : 0)
  ) / 3

  const scoreClass = overallScore >= 0.9 ? 'pass' : overallScore >= 0.6 ? 'warn' : 'fail'
  const scoreColor = overallScore >= 0.9 ? 'var(--green)' : overallScore >= 0.6 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className="verification-content">
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

      {!freqResult.match || !vppResult.match || !dutyResult.match ? (
        <div className="causes-section">
          <h3>Possible Causes</h3>
          <ul className="causes-list">
            {!freqResult.match && <li>Frequency mismatch — check R1, R2, C1 values for drift</li>}
            {!vppResult.match && <li>Amplitude mismatch — check supply voltage, rail-to-rail limits</li>}
            {!dutyResult.match && <li>Duty cycle mismatch — check R1/R2 ratio</li>}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
