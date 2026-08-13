/** Tek sorumluluk: sinyal eşikleri. Sihirli sayı burada, tune buradan. */

/** BTC ölçeği referans medyan notional (USDT). */
export const BTC_MEDIAN_REF = 4_000

export const SIGNAL = {
  /** Divergence: fiyat %'si bu tau'da tanh ile yumuşar (0.4 değil). */
  pxTau: 0.85,
  divMinVol: 500,
  divScore: 0.12,
  /** Morfoloji hacim (USDT), sonra scale ile çarpılır. */
  volBos: 50,
  volYassi: 2_000,
  krakenShare: 0.45,
  kumTop: 0.28,
  kumBot: 0.28,
  kumMid: 0.12,
  tersTop: 0.35,
  tersRatio: 1.4,
  klasikRatio: 1.3,
  clashMin: 800,
  burstMs: 4_000,
  burstOverlay: 0.15,
  glowFromLayer: 5,
} as const

export function sizeScale(medianNotional: number): number {
  if (!Number.isFinite(medianNotional) || medianNotional <= 0) return 1
  const s = medianNotional / BTC_MEDIAN_REF
  return Math.min(2.5, Math.max(0.02, s))
}
