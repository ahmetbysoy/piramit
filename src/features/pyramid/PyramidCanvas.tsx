import { useEffect, useRef } from 'react'
import type { LayerView } from '../../core/engine/pyramidEngine'
import { formatCompactUsd } from '../../core/format/money'
import { netWord } from '../../ui/moneyTone'

type Props = {
  layers: LayerView[]
  pulse: number
}

export function PyramidCanvas({ layers, pulse }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const rev = [...layers].reverse()
    const empty = rev.every((l) => l.share === 0)
    const maxShare = Math.max(...rev.map((l) => l.share), 0.0001)
    const gap = 6
    const rowH = (h - 12 - gap * (rev.length - 1)) / rev.length
    const cx = w / 2

    rev.forEach((l, i) => {
      const t = i / Math.max(rev.length - 1, 1)
      const taper = 0.42 + t * 0.58
      const volW = empty
        ? 88 + t * 36
        : Math.max(72, (l.share / maxShare) * (w - 8) * taper)
      const y = 6 + i * (rowH + gap)
      const x = cx - volW / 2
      const net = netWord(l.net)
      const buyR = l.buyNotional + l.sellNotional > 0 ? l.buyNotional / (l.buyNotional + l.sellNotional) : 0.5

      const g = ctx.createLinearGradient(x, y, x + volW, y)
      if (empty) {
        g.addColorStop(0, '#161b26')
        g.addColorStop(1, '#1c2230')
      } else if (net === 'ALIŞ') {
        g.addColorStop(0, '#0c3d2c')
        g.addColorStop(buyR, '#1dbf73')
        g.addColorStop(1, '#5a2230')
      } else if (net === 'SATIŞ') {
        g.addColorStop(0, '#14352a')
        g.addColorStop(1 - buyR, '#c43b55')
        g.addColorStop(1, '#ff5d7a')
      } else {
        g.addColorStop(0, '#1c2230')
        g.addColorStop(1, '#2a3142')
      }

      ctx.save()
      if (!empty && l.id >= 5) {
        ctx.shadowColor = net === 'ALIŞ' ? '#1dbf7388' : '#ff5d7a66'
        ctx.shadowBlur = 18 + (pulse % 3)
      }
      roundRect(ctx, x, y, volW, rowH, 10)
      ctx.fillStyle = g
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = '600 12px "DM Sans", system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(l.name, x + 10, y + rowH / 2 + 4)
      ctx.textAlign = 'right'
      const label = `${net === 'DÜZ' ? 'düz' : net}  ${formatCompactUsd(Math.abs(l.net))}`
      ctx.fillText(label, x + volW - 10, y + rowH / 2 + 4)
    })
  }, [layers, pulse])

  return <canvas ref={ref} className="py-canvas" />
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
