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
    const maxShare = Math.max(...rev.map((l) => l.share), 0.12)
    const rowH = (h - 8) / rev.length
    const cx = w / 2

    rev.forEach((l, i) => {
      const width = Math.max(48, (l.share / maxShare) * (w - 16))
      const y = 4 + i * rowH
      const x = cx - width / 2
      const glow = l.id === 6 && pulse % 2 === 1 ? 0.35 : 0
      const net = netWord(l.net)
      const fill = net === 'ALIŞ' ? '#1f7a4d' : net === 'SATIŞ' ? '#8a243c' : '#2a3140'
      ctx.fillStyle = fill
      ctx.globalAlpha = 0.92 + glow
      roundRect(ctx, x, y + 4, width, rowH - 10, 8)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#e8edf5'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(l.name, x + 8, y + rowH / 2 + 4)
      ctx.textAlign = 'right'
      const label = `${net === 'DÜZ' ? '—' : net} ${formatCompactUsd(Math.abs(l.net))}`
      ctx.fillText(label, x + width - 8, y + rowH / 2 + 4)
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
