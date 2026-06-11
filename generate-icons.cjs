const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, size, size)

  // Red circle
  ctx.fillStyle = '#e53e3e'
  const cx = size / 2, cy = size / 2, r = size * 0.38
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // B&T text
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.22}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('B&T', cx, cy - size * 0.04)

  ctx.font = `${size * 0.10}px Arial`
  ctx.fillText('FIT', cx, cy + size * 0.18)

  return canvas.toBuffer('image/png')
}

const dir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

fs.writeFileSync(path.join(dir, 'icon-192.png'), generateIcon(192))
fs.writeFileSync(path.join(dir, 'icon-512.png'), generateIcon(512))
console.log('Icons generated!')
