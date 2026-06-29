import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0a0a0f', color: '#e5e5e5', fontFamily: 'Inter, sans-serif',
          padding: '2rem', textAlign: 'center',
        }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '1rem', display: 'grid', placeItems: 'center',
            background: 'rgba(248, 113, 113, 0.12)', color: '#f87171', marginBottom: '1rem',
          }}>⚠</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.875rem', color: '#888', margin: '0 0 1rem', maxWidth: '28rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{
              padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(167, 139, 250, 0.3)',
              background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
