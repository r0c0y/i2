import { useState } from 'react'
import type { BringUpStep } from '../types'

interface Props {
  steps: BringUpStep[]
}

export function BringUpChecklist({ steps }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const progress = steps.length > 0 ? (completed.size / steps.length) * 100 : 0

  return (
    <div className="bringup-checklist">
      <div className="bringup-header">
        <h3>Guided Bring-Up</h3>
        <span className="bringup-progress">{completed.size}/{steps.length}</span>
      </div>
      <div className="bringup-bar">
        <div className="bringup-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="bringup-steps">
        {steps.map((step, i) => {
          const isDone = completed.has(step.id)
          const isOpen = expanded === step.id
          return (
            <div key={step.id} className={`bringup-step ${isDone ? 'done' : ''} ${isOpen ? 'open' : ''}`}>
              <button className="bringup-step-header" onClick={() => { toggle(step.id); setExpanded(isOpen ? null : step.id) }}>
                <span className="bringup-check">{isDone ? '✓' : `${i + 1}`}</span>
                <span className="bringup-title">{step.title}</span>
                <span className="bringup-expand">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="bringup-detail">
                  <p className="bringup-instruction">{step.instruction}</p>
                  {step.warning && <div className="bringup-warning">⚠ {step.warning}</div>}
                  {step.probePoints && step.probePoints.length > 0 && (
                    <div className="bringup-section">
                      <strong>Probe Points:</strong>
                      <ul>{step.probePoints.map((p, j) => <li key={j}>{p}</li>)}</ul>
                    </div>
                  )}
                  {step.expectedValues && step.expectedValues.length > 0 && (
                    <div className="bringup-section">
                      <strong>Expected:</strong>
                      <ul>{step.expectedValues.map((v, j) => <li key={j}>{v}</li>)}</ul>
                    </div>
                  )}
                  <div className="bringup-pass">
                    <strong>Pass:</strong> {step.passCondition}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
