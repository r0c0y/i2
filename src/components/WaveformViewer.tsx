import { useRef, useEffect } from 'react'
import type { WaveformAnalysis, WaveformMeasurement, WaveformChannel } from '../types'

interface Props {
  waveform: WaveformAnalysis
  predicted?: WaveformMeasurement
}

function formatTime(seconds: number): string {
  if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(0)}ns`
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(1)}μs`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(2)}ms`
  return `${seconds.toFixed(3)}s`
}

function formatVoltage(v: number): string {
  if (Math.abs(v) < 0.01) return `${(v * 1000).toFixed(0)}mV`
  return `${v.toFixed(2)}V`
}

const CHANNEL_COLORS = ['#00ff88', '#ff6b6b', '#ffd93d', '#6bcbff', '#c084fc', '#fb923c']

function drawChannel(
  ctx: CanvasRenderingContext2D,
  channel: WaveformChannel,
  color: string,
  tStart: number, tEnd: number,
  vLo: number, vHi: number,
  padL: number, padT: number, plotW: number, plotH: number,
  index: number,
) {
  const pts = channel.rawPoints
  if (!pts || pts.length === 0) return

  const vToY = (v: number) => padT + plotH * (1 - (v - vLo) / (vHi - vLo))
  const tToX = (t: number) => padL + plotW * ((t - tStart) / (tEnd - tStart))

  // Offset each channel vertically if multi-channel
  const channelOffset = index * (plotH / 8) // Offset each channel vertically

  // Glow
  ctx.strokeStyle = color + '33'
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let i = 0; i < pts.length; i++) {
    const x = tToX(pts[i].time)
    const y = vToY(pts[i].voltage) + channelOffset
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Main trace
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.shadowColor = color
  ctx.shadowBlur = 3
  ctx.beginPath()
  for (let i = 0; i < pts.length; i++) {
    const x = tToX(pts[i].time)
    const y = vToY(pts[i].voltage) + channelOffset
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

export function WaveformViewer({ waveform, predicted }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const m = waveform?.measurements
    if (!m) return

    const channels = m.channels
    const hasMultiChannel = channels && channels.length > 1
    const hasRaw = m.rawPoints && m.rawPoints.length > 0

    // ── Background ──
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, w, h)

    // ── Padding ──
    const padL = 55, padR = 15, padT = 15, padB = 30
    const plotW = w - padL - padR
    const plotH = h - padT - padB
    if (plotW < 50 || plotH < 50) return

    // ── Grid ──
    const gridCols = 10, gridRows = 8
    ctx.strokeStyle = '#15152a'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridCols; i++) {
      const x = (i / gridCols) * plotW + padL
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke()
    }
    for (let i = 0; i <= gridRows; i++) {
      const y = (i / gridRows) * plotH + padT
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke()
    }
    // Center crosshair
    ctx.strokeStyle = '#252540'
    ctx.beginPath(); ctx.moveTo(padL + plotW / 2, padT); ctx.lineTo(padL + plotW / 2, padT + plotH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(padL, padT + plotH / 2); ctx.lineTo(padL + plotW, padT + plotH / 2); ctx.stroke()

    // ── Compute global voltage range ──
    let globalVMin = Infinity, globalVMax = -Infinity
    if (hasMultiChannel) {
      for (const ch of channels!) {
        if (ch.vLow < globalVMin) globalVMin = ch.vLow
        if (ch.vHigh > globalVMax) globalVMax = ch.vHigh
      }
    } else {
      globalVMin = m.vLow
      globalVMax = m.vHigh
    }
    const vPad = (globalVMax - globalVMin) * 0.15 || 1
    const vLo = globalVMin - vPad
    const vHi = globalVMax + vPad
    const vToY = (v: number) => padT + plotH * (1 - (v - vLo) / (vHi - vLo))

    // ── Time range ──
    let tStart = 0, tEnd: number
    if (hasMultiChannel && channels![0].rawPoints.length > 0) {
      tEnd = channels![0].rawPoints[channels![0].rawPoints.length - 1].time
    } else if (hasRaw) {
      tEnd = m.rawPoints![m.rawPoints!.length - 1].time
    } else {
      tEnd = m.period > 0 ? m.period * 3 : 0.003
    }
    if (tEnd === 0) tEnd = 1
    const tToX = (t: number) => padL + plotW * ((t - tStart) / (tEnd - tStart))

    // ── Voltage labels ──
    ctx.fillStyle = '#666'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const v = vLo + (vHi - vLo) * (i / 4)
      const y = vToY(v)
      ctx.fillText(formatVoltage(v), padL - 5, y + 3)
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(padL - 2, y); ctx.lineTo(padL, y); ctx.stroke()
    }

    // ── Time labels ──
    ctx.textAlign = 'center'
    for (let i = 0; i <= 5; i++) {
      const t = tStart + (tEnd - tStart) * (i / 5)
      const x = tToX(t)
      ctx.fillText(formatTime(t), x, h - padB + 15)
    }

    // ── Axis titles ──
    ctx.fillStyle = '#555'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Time', padL + plotW / 2, h - 3)
    ctx.save()
    ctx.translate(12, padT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Voltage', 0, 0)
    ctx.restore()

    // ── Draw channels ──
    if (hasMultiChannel) {
      for (let ci = 0; ci < channels!.length; ci++) {
        drawChannel(ctx, channels![ci], CHANNEL_COLORS[ci % CHANNEL_COLORS.length], tStart, tEnd, vLo, vHi, padL, padT, plotW, plotH, ci)
      }
    } else if (hasRaw) {
      // Single channel raw data
      const pts = m.rawPoints!
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 4
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const x = tToX(pts[i].time)
        const y = vToY(pts[i].voltage)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Predicted overlay
      if (predicted) {
        const predHighY = vToY(predicted.vHigh)
        const predLowY = vToY(predicted.vLow)
        const predPeriod = predicted.period || m.period
        const predDuty = predicted.dutyCycle
        ctx.strokeStyle = 'rgba(255,165,0,0.5)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        for (let px = 0; px < plotW; px++) {
          const t = tStart + (px / plotW) * (tEnd - tStart)
          const y = (t / predPeriod) % 1 < predDuty ? predHighY : predLowY
          const x = padL + px
          px === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
    } else {
      // Synthetic square wave (demo)
      const highY = vToY(m.vHigh)
      const lowY = vToY(m.vLow)
      const period = m.period || 0.001
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 6
      ctx.beginPath()
      for (let px = 0; px < plotW; px++) {
        const t = tStart + (px / plotW) * (tEnd - tStart)
        const y = (t / period) % 1 < m.dutyCycle ? highY : lowY
        const x = padL + px
        px === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // ── Voltage cursors ──
    const vppY1 = vToY(m.vHigh)
    const vppY2 = vToY(m.vLow)
    ctx.strokeStyle = '#f39c12'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 2])
    ctx.beginPath(); ctx.moveTo(padL, vppY1); ctx.lineTo(padL + plotW, vppY1); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(padL, vppY2); ctx.lineTo(padL + plotW, vppY2); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#f39c12'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Vpp=${formatVoltage(m.vPp)}`, padL + plotW - 90, vppY1 - 5)

    // ── Period marker ──
    if (m.frequency > 0 && m.period > 0) {
      const pStart = tToX(tStart)
      const pEnd = tToX(tStart + m.period)
      if (pEnd - pStart > 20) {
        const markerY = h - padB - 10
        ctx.strokeStyle = '#9b59b6'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pStart, markerY - 5); ctx.lineTo(pStart, markerY + 5)
        ctx.moveTo(pStart, markerY); ctx.lineTo(pEnd, markerY)
        ctx.lineTo(pEnd, markerY - 5); ctx.lineTo(pEnd, markerY + 5)
        ctx.stroke()
        ctx.fillStyle = '#9b59b6'
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`T=${formatTime(m.period)}`, (pStart + pEnd) / 2, markerY - 8)
      }
    }

    // ── Legend ──
    const legX = padL + 8, legY = padT + 12
    if (hasMultiChannel) {
      for (let ci = 0; ci < channels!.length; ci++) {
        const y = legY + ci * 14
        ctx.fillStyle = CHANNEL_COLORS[ci % CHANNEL_COLORS.length]
        ctx.fillRect(legX, y - 4, 14, 3)
        ctx.fillStyle = '#888'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(channels![ci].name, legX + 20, y)
      }
    } else {
      ctx.fillStyle = '#00ff88'
      ctx.fillRect(legX, legY - 4, 14, 3)
      ctx.fillStyle = '#888'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(hasRaw ? 'Scope Data' : 'Synthesized', legX + 20, legY)
      if (predicted) {
        ctx.fillStyle = 'rgba(255,165,0,0.5)'
        ctx.fillRect(legX, legY + 10, 14, 3)
        ctx.fillStyle = '#888'
        ctx.fillText('Predicted', legX + 20, legY + 14)
      }
    }

    // ── Stats overlay ──
    const statsX = w - padR - 130
    const statsY = padT + 12
    const statsH = hasMultiChannel ? 20 + channels!.length * 14 : 56
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(statsX - 5, statsY - 10, 140, statsH)
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#00ff88'
    ctx.fillText(`f = ${m.frequency.toFixed(1)} Hz`, statsX, statsY)
    ctx.fillStyle = '#888'
    ctx.fillText(`T = ${formatTime(m.period)}`, statsX, statsY + 14)
    ctx.fillText(`Vpp = ${formatVoltage(m.vPp)}`, statsX, statsY + 28)
    ctx.fillText(`Duty = ${(m.dutyCycle * 100).toFixed(1)}%`, statsX, statsY + 42)
    if (hasMultiChannel) {
      ctx.fillText(`${channels!.length} channels`, statsX, statsY + 56)
    }

  }, [waveform, predicted])

  return (
    <div className="waveform-viewer">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  )
}
