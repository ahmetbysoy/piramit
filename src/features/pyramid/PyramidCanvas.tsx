import { useEffect, useRef, useState } from 'react'
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
  const buf = useRef({ dpr: 0, w: 0, h: 0 })
  const hits = useRef<{ y0: number; y1: number; l: LayerView }[]>([])
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const bw = Math.floor(w * dpr)
      const bh = Math.floor(h * dpr)
      if (buf.current.dpr !== dpr || canvas.width !== bw || canvas.height !== bh) {
        buf.current = { dpr, w, h }
        canvas.width = bw
        canvas.height = bh
      }
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
      hits.current = []

      rev.forEach((l, i) => {
        const t = i / Math.max(rev.length - 1, 1)
        const taper = TAPER_MIN + t * TAPER_SPAN
        const volW = empty
          ? EMPTY_BASE + t * EMPTY_GROW
          : Math.max(MIN_BAR, (l.share / maxShare) * (w - 8) * taper)
        const y = 6 + i * (rowH + GAP)
        hits.current.push({ y0: y, y1: y + rowH, l })
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
        if (!empty && l.id >= SIGNAL.glowFromLayer && !liteFx()) {
          ctx.shadowColor = net === 'ALIŞ' ? alis : satis
          ctx.shadowBlur = 18 + (pulse % 3)
        }
        roundRect(ctx, x, y, volW, rowH, 10)
        ctx.fillStyle = g
        ctx.globalAlpha = empty ? 0.55 : 0.92
        ctx.fill()
        ctx.restore()

        const midY = y + rowH / 2 + 4
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '600 12px "DM Sans", system-ui'
        ctx.textAlign = 'left'
        const mark = empty || net === 'DÜZ' ? '·' : net === 'ALIŞ' ? '▲' : '▼'
        ctx.fillText(`${mark} ${l.name}`, x + 10, midY)
        ctx.textAlign = 'right'
        const label = `${net === 'DÜZ' ? 'düz' : net}  ${formatCompactUsd(Math.abs(l.net))}`
        ctx.fillText(label, x + volW - 10, midY)
      })
    }

    draw()
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [layers, pulse])

  const vols = layers.map((l) => l.buyNotional + l.sellNotional).filter((n) => n > 0)
  const minN = vols.length ? Math.min(...vols) : 0
  const maxN = vols.length ? Math.max(...vols) : 0

  return (
    <div className="py-wrap">
      <canvas
        ref={ref}
        className="py-canvas"
        aria-hidden="true"
        onMouseMove={(e) => {
          const box = ref.current?.getBoundingClientRect()
          if (!box) return
          const y = e.clientY - box.top
          const hit = hits.current.find((h) => y >= h.y0 && y <= h.y1)
          if (!hit) {
            setTip(null)
            return
          }
          const l = hit.l
          setTip({
            x: e.clientX - box.left,
            y: e.clientY - box.top,
            text: `${l.name} · ▲ ${formatCompactUsd(l.buyNotional)} · ▼ ${formatCompactUsd(l.sellNotional)}`,
          })
        }}
        onMouseLeave={() => setTip(null)}
      />
      {tip && (
        <div className="py-tip" style={{ left: tip.x + 10, top: tip.y + 10 }}>
          {tip.text}
        </div>
      )}
      <div className="axis-labels">
        <span>küçük {formatCompactUsd(minN || 0)}</span>
        <span>büyük {formatCompactUsd(maxN)}</span>
      </div>
      <p className="sr-only">
        {layers.map((l) => `${l.name}: ${netWord(l.net)} ${formatCompactUsd(Math.abs(l.net))}`).join(', ')}
      </p>
    </div>
  )
}

function liteFx(): boolean {
  if (typeof document === 'undefined') return false
  if (document.documentElement.classList.contains('lite')) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
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
