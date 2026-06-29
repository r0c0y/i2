import type { Netlist } from '../types'

interface Props {
  netlist: Netlist
}

export function NetlistViewer({ netlist }: Props) {
  return (
    <div className="netlist-viewer">
      <div className="netlist-section">
        <h4>Components ({netlist.components.length})</h4>
        <table className="netlist-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Type</th>
              <th>Value</th>
              <th>Nodes</th>
            </tr>
          </thead>
          <tbody>
            {netlist.components.map((comp, i) => (
              <tr key={i}>
                <td className="ref">{comp.ref}</td>
                <td className="type">{comp.type}</td>
                <td className="value">{comp.value}</td>
                <td className="nodes">{comp.nodes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="netlist-section">
        <h4>Nets ({netlist.nets.length})</h4>
        <div className="nets-list">
          {netlist.nets.map((net, i) => (
            <div key={i} className="net-item">
              <span className="net-name">{net.name}</span>
              <span className="net-nodes">{net.nodes.join(' → ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="netlist-section">
        <h4>SPICE Netlist</h4>
        <pre className="spice-code">
          {generateSpiceNetlist(netlist)}
        </pre>
      </div>
    </div>
  )
}

function generateSpiceNetlist(netlist: Netlist): string {
  const lines: string[] = ['* Extracted Netlist', '']
  
  for (const comp of netlist.components) {
    const nodes = comp.nodes.join(' ')
    lines.push(`${comp.ref} ${nodes} ${comp.value}`)
  }
  
  lines.push('')
  lines.push('.end')
  
  return lines.join('\n')
}
