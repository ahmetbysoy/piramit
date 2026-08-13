import { useEffect, useRef } from 'react'
import type { LayerView } from '../../core/engine/pyramidEngine'
import { SIGNAL } from '../../core/engine/signalConfig'
import { formatCompactUsd } from '../../core/format/money'
import { netWord } from '../../ui/moneyTone'

type Props = {
  layers: LayerView[]
  pulse: number
}

const GAP = 6
const TAPER_MIN = 0.42
const TAPER_SPAN = 0.58
const EMPTY_BASE = 88
const EMPTY_GROW = 36
const MIN_BAR = 72

export function PyramidCanvas({ layers, pulse }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const cs = getComputedStyle(document.documentElement)
      const alis = cs.getPropertyValue('--alis').trim() || '#3dffa1'
      const satis = cs.getPropertyValue('--satis').trim() || '#ff5d7a'
      const mute = cs.getPropertyValue('--card').trim() || '#1c2230'

      const rev = [...layers].reverse()
      const empty = rev.every((l) => l.share === 0)
      const maxShare = Math.max(...rev.map((l) => l.share), 0.0001)
      const rowH = (h - 12 - GAP * (rev.length - 1)) / rev.length
      const cx = w / 2

      rev.forEach((l, i) => {
        const t = i / Math.max(rev.length - 1, 1)
        const taper = TAPER_MIN + t * TAPER_SPAN
        const volW = empty
          ? EMPTY_BASE + t * EMPTY_GROW
          : Math.max(MIN_BAR, (l.share / maxShare) * (w - 8) * taper)
        const y = 6 + i * (rowH + GAP)
        const x = cx - volW / 2
        const net = netWord(l.net)
        const buyR =
          l.buyNotional + l.sellNotional > 0
            ? l.buyNotional / (l.buyNotional + l.sellNotional)
            : 0.5

        const g = ctx.createLinearGradient(x, y, x + volW, y)
        if (empty) {
          g.addColorStop(0, mute)
          g.addColorStop(1, mute)
        } else if (net === 'ALIŞ') {
          g.addColorStop(0, alis)
          g.addColorStop(buyR, alis)
          g.addColorStop(1, satis)
        } else if (net === 'SATIŞ') {
          g.addColorStop(0, alis)
          g.addColorStop(1 - buyR, satis)
          g.addColorStop(1, satis)
        } else {
          g.addColorStop(0, mute)
          g.addColorStop(1, mute)
        }

        ctx.save()
        if (!empty && l.id >= SIGNAL.glowFromLayer) {
          ctx.shadowColor = net === 'ALIŞ' ? alis : satis
          ctx.shadowBlur = 18 + (pulse % 3)
        }
        roundRect(ctx, x, y, volW, rowH, 10)
        ctx.fillStyle = g
        ctx.globalAlpha = empty ? 0.55 : 0.92
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
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvas)
    return () => ro.disconnect()
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
