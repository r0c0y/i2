// Generates realistic PCB inspection images for demo
import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

const W = 640, H = 480
const outDir = path.join(process.cwd(), 'public', 'demo-pcb')

// Seeded random for reproducibility
let seed = 42
function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646 }

function drawPCB(ctx, opts = {}) {
  const { showDefects = false, variant = 0 } = opts

  // PCB substrate — dark green with texture
  ctx.fillStyle = '#1a472a'
  ctx.fillRect(0, 0, W, H)

  // Subtle texture noise
  for (let i = 0; i < 8000; i++) {
    const x = rand() * W, y = rand() * H
    const brightness = 20 + rand() * 20
    ctx.fillStyle = `rgb(${brightness}, ${40 + brightness}, ${brightness - 5})`
    ctx.fillRect(x, y, 1, 1)
  }

  // Copper ground plane (faint)
  ctx.strokeStyle = 'rgba(180, 130, 60, 0.08)'
  ctx.lineWidth = 0.5
  for (let y = 10; y < H; y += 12) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Grid of traces
  ctx.strokeStyle = '#c8a050'
  ctx.lineWidth = 1.5
  for (let x = 30; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 30; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Thicker power traces
  ctx.strokeStyle = '#d4a84a'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(20, 60); ctx.lineTo(200, 60); ctx.lineTo(200, 200); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W-20, H-60); ctx.lineTo(W-200, H-60); ctx.lineTo(W-200, H-200); ctx.stroke()

  // Signal traces (random routing)
  ctx.strokeStyle = '#b8923a'
  ctx.lineWidth = 1
  for (let i = 0; i < 15; i++) {
    const sx = 40 + rand() * (W-80)
    const sy = 40 + rand() * (H-80)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    let cx = sx, cy = sy
    for (let s = 0; s < 5; s++) {
      if (rand() > 0.5) cx += (rand() > 0.5 ? 1 : -1) * (20 + rand() * 40)
      else cy += (rand() > 0.5 ? 1 : -1) * (20 + rand() * 40)
      ctx.lineTo(cx, cy)
    }
    ctx.stroke()
  }

  // Via holes
  for (let i = 0; i < 30; i++) {
    const x = 30 + rand() * (W-60)
    const y = 30 + rand() * (H-60)
    ctx.fillStyle = '#8B7355'
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#2a2a2a'
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill()
  }

  // Components — IC chips (black rectangles with pins)
  const components = []
  const icPositions = [
    { x: 180, y: 140, w: 80, h: 40, label: 'U1', type: 'ic' },
    { x: 380, y: 180, w: 60, h: 30, label: 'U2', type: 'ic' },
    { x: 120, y: 300, w: 50, h: 50, label: 'U3', type: 'qfp' },
  ]

  for (const ic of icPositions) {
    // IC body
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(ic.x, ic.y, ic.w, ic.h)
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 0.5
    ctx.strokeRect(ic.x, ic.y, ic.w, ic.h)

    // Pin 1 marker (notch)
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(ic.x + 8, ic.y + ic.h/2, 3, 0, Math.PI*2); ctx.fill()

    // Pins along edges
    ctx.fillStyle = '#C0C0C0'
    const pinSpacing = 5
    for (let px = ic.x + 10; px < ic.x + ic.w - 5; px += pinSpacing) {
      ctx.fillRect(px, ic.y - 3, 2, 3) // top pins
      ctx.fillRect(px, ic.y + ic.h, 2, 3) // bottom pins
    }
    for (let py = ic.y + 5; py < ic.y + ic.h - 2; py += pinSpacing) {
      ctx.fillRect(ic.x - 3, py, 3, 2) // left pins
      ctx.fillRect(ic.x + ic.w, py, 3, 2) // right pins
    }

    // Label
    ctx.fillStyle = '#888'
    ctx.font = 'bold 9px monospace'
    ctx.fillText(ic.label, ic.x + ic.w/2 - 6, ic.y + ic.h/2 + 3)
    components.push(ic)
  }

  // Resistors (small rectangles with color bands)
  const resistors = [
    { x: 60, y: 80, w: 30, h: 10, label: 'R1', bands: ['#8B4513','#000','#8B4513','#C0C0C0'] },
    { x: 280, y: 80, w: 30, h: 10, label: 'R2', bands: ['#FFD700','#0000FF','#FF0000','#C0C0C0'] },
    { x: 60, y: 200, w: 30, h: 10, label: 'R3', bands: ['#000','#FFD700','#FF0000','#C0C0C0'] },
    { x: 350, y: 300, w: 30, h: 10, label: 'R4', bands: ['#8B4513','#FFD700','#FF0000','#C0C0C0'] },
    { x: 500, y: 120, w: 30, h: 10, label: 'R5', bands: ['#000','#000','#8B4513','#C0C0C0'] },
  ]

  for (const r of resistors) {
    // Body
    ctx.fillStyle = '#d4c4a0'
    ctx.beginPath()
    ctx.roundRect(r.x, r.y, r.w, r.h, 3)
    ctx.fill()

    // Color bands
    const bandW = r.w / (r.bands.length + 1)
    r.bands.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.fillRect(r.x + bandW * (i + 0.5), r.y + 1, bandW * 0.6, r.h - 2)
    })

    // Solder pads
    ctx.fillStyle = '#C0C0C0'
    ctx.beginPath(); ctx.arc(r.x - 4, r.y + r.h/2, 4, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(r.x + r.w + 4, r.y + r.h/2, 4, 0, Math.PI*2); ctx.fill()

    // Label
    ctx.fillStyle = '#666'
    ctx.font = '8px monospace'
    ctx.fillText(r.label, r.x + r.w/2 - 4, r.y - 4)
    components.push(r)
  }

  // Capacitors (ceramic — small orange/brown)
  const caps = [
    { x: 300, y: 140, r: 6, label: 'C1', color: '#c87533' },
    { x: 450, y: 250, r: 8, label: 'C2', color: '#8B6914' },
    { x: 150, y: 400, r: 6, label: 'C3', color: '#c87533' },
  ]

  for (const c of caps) {
    ctx.fillStyle = c.color
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = '#5a3a1a'
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Solder pads
    ctx.fillStyle = '#C0C0C0'
    ctx.beginPath(); ctx.arc(c.x - c.r - 3, c.y, 3, 0, Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(c.x + c.r + 3, c.y, 3, 0, Math.PI*2); ctx.fill()

    ctx.fillStyle = '#666'
    ctx.font = '8px monospace'
    ctx.fillText(c.label, c.x - 4, c.y - c.r - 4)
    components.push(c)
  }

  // Electrolytic caps (cylindrical, larger)
  const ecaps = [
    { x: 500, y: 350, r: 15, label: 'C4', color: '#1a1a3a' },
    { x: 80, y: 380, r: 12, label: 'C5', color: '#1a1a3a' },
  ]

  for (const ec of ecaps) {
    // Body
    ctx.fillStyle = ec.color
    ctx.beginPath(); ctx.arc(ec.x, ec.y, ec.r, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = '#C0C0C0'
    ctx.lineWidth = 1
    ctx.stroke()

    // Polarity stripe
    ctx.fillStyle = '#888'
    ctx.fillRect(ec.x - ec.r, ec.y - 3, ec.r * 2, 3)

    // Top marking
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.arc(ec.x, ec.y, ec.r * 0.6, 0, Math.PI*2); ctx.stroke()

    ctx.fillStyle = '#888'
    ctx.font = '8px monospace'
    ctx.fillText(ec.label, ec.x - 4, ec.y + ec.r + 12)
    components.push(ec)
  }

  // LEDs
  const leds = [
    { x: 550, y: 80, r: 5, color: '#ff2222', label: 'LED1' },
    { x: 420, y: 400, r: 5, color: '#22ff22', label: 'LED2' },
  ]

  for (const led of leds) {
    ctx.fillStyle = led.color
    ctx.beginPath(); ctx.arc(led.x, led.y, led.r, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath(); ctx.arc(led.x - 1, led.y - 1, led.r * 0.4, 0, Math.PI*2); ctx.fill()

    ctx.fillStyle = '#666'
    ctx.font = '8px monospace'
    ctx.fillText(led.label, led.x - 8, led.y + led.r + 12)
    components.push(led)
  }

  // Connectors (headers)
  const connectors = [
    { x: 30, y: 140, w: 8, h: 60, pins: 10, label: 'J1' },
    { x: W-40, y: 200, w: 8, h: 40, pins: 6, label: 'J2' },
  ]

  for (const j of connectors) {
    ctx.fillStyle = '#333'
    ctx.fillRect(j.x, j.y, j.w, j.h)
    ctx.strokeStyle = '#555'
    ctx.strokeRect(j.x, j.y, j.w, j.h)

    // Pin holes
    ctx.fillStyle = '#C0C0C0'
    const pinH = j.h / (j.pins + 1)
    for (let p = 1; p <= j.pins; p++) {
      ctx.beginPath()
      ctx.arc(j.x + j.w/2, j.y + pinH * p, 1.5, 0, Math.PI*2)
      ctx.fill()
    }

    ctx.fillStyle = '#666'
    ctx.font = '8px monospace'
    ctx.fillText(j.label, j.x - 2, j.y - 6)
    components.push(j)
  }

  // Silkscreen reference designators (white text on board)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '7px monospace'
  ctx.fillText('REV 2.1', 10, H - 10)
  ctx.fillText('© 2024 CADENCE MFG', 10, H - 22)

  // Board outline with corner radius
  ctx.strokeStyle = '#0d2d18'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(2, 2, W-4, H-4, 6)
  ctx.stroke()

  // Mounting holes
  const holes = [[15, 15], [W-15, 15], [15, H-15], [W-15, H-15]]
  for (const [hx, hy] of holes) {
    ctx.fillStyle = '#C0C0C0'
    ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#0d2d18'
    ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI*2); ctx.fill()
  }

  return components
}

function addDefect(ctx, type, components) {
  switch (type) {
    case 'solder_bridge': {
      // Solder bridge between two IC pins
      const ic = components.find(c => c.type === 'ic')
      if (ic) {
        const bx = ic.x + 20 + rand() * (ic.w - 40)
        const by = ic.y - 4
        ctx.fillStyle = '#C0C0C0'
        ctx.beginPath()
        ctx.ellipse(bx, by, 6, 3, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#a0a0a0'
        ctx.beginPath()
        ctx.ellipse(bx, by, 4, 2, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      return { category: 'solder_bridge', desc: 'Solder bridge between adjacent IC pins', severity: 'critical', x: 35, y: 25 }
    }
    case 'missing_component': {
      // Remove a resistor (draw over it with PCB color)
      const r = components.find(c => c.label === 'R3')
      if (r) {
        ctx.fillStyle = '#1a472a'
        ctx.fillRect(r.x - 6, r.y - 4, r.w + 12, r.h + 8)
        // Show bare pads
        ctx.fillStyle = '#C0C0C0'
        ctx.beginPath(); ctx.arc(r.x - 4, r.y + r.h/2, 4, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc(r.x + r.w + 4, r.y + r.h/2, 4, 0, Math.PI*2); ctx.fill()
      }
      return { category: 'missing_component', desc: 'Resistor R3 missing from board', severity: 'critical', x: 15, y: 38 }
    }
    case 'cold_joint': {
      // Dull solder joint on a capacitor
      const c = components.find(c => c.label === 'C2')
      if (c) {
        ctx.fillStyle = '#6a6a5a'
        ctx.beginPath(); ctx.arc(c.x - c.r - 3, c.y, 4, 0, Math.PI*2); ctx.fill()
        ctx.fillStyle = '#555'
        ctx.beginPath(); ctx.arc(c.x - c.r - 3, c.y, 2, 0, Math.PI*2); ctx.fill()
      }
      return { category: 'cold_joint', desc: 'Cold solder joint on capacitor C2 — grainy, dull appearance', severity: 'major', x: 70, y: 50 }
    }
    case 'scratch': {
      // Scratches across the board
      ctx.strokeStyle = 'rgba(200,180,140,0.6)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 3; i++) {
        const sx = 200 + rand() * 200
        const sy = 100 + rand() * 200
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(sx + 40 + rand() * 60, sy + (rand() - 0.5) * 30)
        ctx.stroke()
      }
      return { category: 'scratch', desc: 'Surface scratches on PCB near U2 area', severity: 'minor', x: 55, y: 45 }
    }
    case 'misalignment': {
      // Shift an IC slightly
      const ic = components.find(c => c.label === 'U2')
      if (ic) {
        // Draw shifted IC over original
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(ic.x + 4, ic.y + 3, ic.w, ic.h)
        ctx.strokeStyle = '#444'
        ctx.lineWidth = 0.5
        ctx.strokeRect(ic.x + 4, ic.y + 3, ic.w, ic.h)
        // Show original position outline
        ctx.strokeStyle = 'rgba(255,100,100,0.4)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(ic.x, ic.y, ic.w, ic.h)
        ctx.setLineDash([])
      }
      return { category: 'misalignment', desc: 'IC U2 misaligned by ~4px on pads', severity: 'major', x: 65, y: 35 }
    }
    case 'contamination': {
      // Flux residue / debris
      ctx.fillStyle = 'rgba(180,160,100,0.3)'
      ctx.beginPath()
      ctx.ellipse(320, 250, 30, 15, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(200,180,120,0.2)'
      ctx.beginPath()
      ctx.ellipse(330, 255, 20, 10, -0.2, 0, Math.PI * 2)
      ctx.fill()
      return { category: 'contamination', desc: 'Flux residue contamination near center of board', severity: 'minor', x: 50, y: 52 }
    }
  }
}

// ── Generate good boards ──
for (let i = 0; i < 4; i++) {
  seed = 42 + i * 100
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  drawPCB(ctx, { variant: i })

  const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 })
  fs.writeFileSync(path.join(outDir, `good_${i + 1}.jpg`), buf)
  console.log(`✓ good_${i + 1}.jpg (${buf.length} bytes)`)
}

// ── Generate defective boards ──
const defects = ['solder_bridge', 'missing_component', 'cold_joint', 'scratch', 'misalignment', 'contamination']
for (let i = 0; i < defects.length; i++) {
  seed = 200 + i * 77
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const components = drawPCB(ctx, { variant: i })
  const defect = addDefect(ctx, defects[i], components)

  // Add defect label overlay
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(W - 220, 8, 212, 28)
  ctx.fillStyle = defect.severity === 'critical' ? '#ff4444' : defect.severity === 'major' ? '#ff8844' : '#ffcc00'
  ctx.font = 'bold 11px monospace'
  ctx.fillText(`DEFECT: ${defect.category.toUpperCase()}`, W - 215, 26)

  const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 })
  fs.writeFileSync(path.join(outDir, `defective_${i + 1}.jpg`), buf)
  console.log(`✓ defective_${i + 1}.jpg — ${defect.category} (${buf.length} bytes)`)
}

console.log('\nDone! 4 good + 6 defective PCB images generated.')
