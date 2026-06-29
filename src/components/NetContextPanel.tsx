import type { NetContext } from '../types'

interface Props {
  context: NetContext | null
}

export function NetContextPanel({ context }: Props) {
  if (!context) return (
    <div className="net-context empty-state">
      <div className="empty-icon">🔍</div>
      <p>Click a component on the schematic to see details</p>
    </div>
  )

  const { component, connectedNets, expectedVoltages, failureModes, probeSuggestions } = context

  return (
    <div className="net-context">
      <div className="net-context-header">
        <span className="net-context-ref">{component.ref}</span>
        <span className="net-context-type">{component.type}</span>
        <span className="net-context-value">{component.value}</span>
      </div>

      {connectedNets.length > 0 && (
        <div className="net-context-section">
          <h4>Connected Nets</h4>
          <div className="net-tag-list">
            {connectedNets.map(n => (
              <span key={n.name} className="net-tag">{n.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="net-context-section">
        <h4>Expected Voltages</h4>
        <table className="net-voltage-table">
          <thead><tr><th>Net</th><th>Expected</th><th>Range</th></tr></thead>
          <tbody>
            {expectedVoltages.map((ev, i) => (
              <tr key={i}><td>{ev.net}</td><td>{ev.expected}</td><td>{ev.range}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="net-context-section">
        <h4>Failure Modes</h4>
        <ul className="net-failure-list">
          {failureModes.map((fm, i) => <li key={i}>{fm}</li>)}
        </ul>
      </div>

      <div className="net-context-section">
        <h4>Probe Suggestions</h4>
        <ul className="net-probe-list">
          {probeSuggestions.map((ps, i) => <li key={i}>{ps}</li>)}
        </ul>
      </div>
    </div>
  )
}
