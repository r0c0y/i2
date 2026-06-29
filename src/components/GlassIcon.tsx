import React from 'react'

interface GlassIconProps {
  name: string
  size?: number
  variant?: 'purple' | 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'gray'
  style?: React.CSSProperties
  className?: string
}

export function GlassIcon({ name, size = 18, variant = 'purple', style, className }: GlassIconProps) {
  const getGradient = () => {
    switch (variant) {
      case 'purple': return 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(124, 58, 237, 0.05))'
      case 'green': return 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.05))'
      case 'red': return 'linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(220, 38, 38, 0.05))'
      case 'blue': return 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(37, 99, 235, 0.05))'
      case 'yellow': return 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(217, 119, 6, 0.05))'
      case 'orange': return 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(234, 88, 12, 0.05))'
      default: return 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))'
    }
  }

  const getBorderColor = () => {
    switch (variant) {
      case 'purple': return 'rgba(167, 139, 250, 0.25)'
      case 'green': return 'rgba(52, 211, 153, 0.25)'
      case 'red': return 'rgba(248, 113, 113, 0.25)'
      case 'blue': return 'rgba(96, 165, 250, 0.25)'
      case 'yellow': return 'rgba(251, 191, 36, 0.25)'
      case 'orange': return 'rgba(251, 146, 60, 0.25)'
      default: return 'rgba(255, 255, 255, 0.12)'
    }
  }

  const getGlow = () => {
    switch (variant) {
      case 'purple': return '0 0 10px rgba(167, 139, 250, 0.25)'
      case 'green': return '0 0 10px rgba(52, 211, 153, 0.2)'
      case 'red': return '0 0 10px rgba(248, 113, 113, 0.2)'
      case 'blue': return '0 0 10px rgba(96, 165, 250, 0.2)'
      case 'yellow': return '0 0 10px rgba(251, 191, 36, 0.2)'
      case 'orange': return '0 0 10px rgba(251, 146, 60, 0.2)'
      default: return 'none'
    }
  }

  const getSvgColor = () => {
    switch (variant) {
      case 'purple': return '#c4b5fd'
      case 'green': return '#34d399'
      case 'red': return '#f87171'
      case 'blue': return '#60a5fa'
      case 'yellow': return '#fbbf24'
      case 'orange': return '#fb923c'
      default: return '#e4e4e7'
    }
  }

  const renderIcon = () => {
    const color = getSvgColor()
    switch (name) {
      case 'bolt':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )
      case 'factory':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h20M20 18v-8l-8 4v-4l-8 4v8" />
          </svg>
        )
      case 'camera':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )
      case 'clipboard':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        )
      case 'timer':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <line x1="12" y1="2" x2="12" y2="4" />
          </svg>
        )
      case 'inverter':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6 4 18 12 6 20 6 4" />
            <circle cx="20" cy="12" r="2" />
          </svg>
        )
      case 'led':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
            <circle cx="12" cy="12" r="4" fill={color + '33'} />
          </svg>
        )
      case 'filter':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12H12s-3-9-6-9-6 9-6 9h10" />
            <path d="M2 12s3 9 6 9 6-9 6-9h8" />
          </svg>
        )
      case 'check':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )
      case 'cross':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )
      case 'cpu':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
          </svg>
        )
      case 'brain':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
          </svg>
        )
      case 'manual':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        )
      case 'gear':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )
      case 'download':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        )
      case 'search':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )
      case 'reset':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <span
      className={`glass-icon-wrapper ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        background: getGradient(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '6px',
        boxShadow: getGlow(),
        verticalAlign: 'middle',
        ...style
      }}
    >
      {renderIcon()}
    </span>
  )
}
