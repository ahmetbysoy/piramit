/** Tek sorumluluk: 7 katman payından şekil etiketi. */

import { SIGNAL } from './signalConfig'

export type ShapeId = 'klasik' | 'kum' | 'ters' | 'mantar' | 'yassi' | 'bos'

export function detectShape(
  layers: { share: number; buyNotional: number; sellNotional: number }[],
  scale = 1,
): {
  id: ShapeId
  yazi: string
} {
  const shares = layers.map((l) => l.share)
  const vol = layers.reduce((a, l) => a + l.buyNotional + l.sellNotional, 0)
  if (vol < SIGNAL.volBos * scale) return { id: 'bos', yazi: 'Sessizlik. Bekle.' }

  const bot = shares[0] + shares[1] + shares[2]
  const mid = shares[3]
  const top = shares[5] + shares[6]
  const kraken = shares[6]

  if (kraken > SIGNAL.krakenShare) return { id: 'mantar', yazi: 'Tepe patladı — iri vuruş.' }
  if (vol < SIGNAL.volYassi * scale && Math.max(...shares) < 0.35) {
    return { id: 'yassi', yazi: 'Piyasa ölü, hacim yok.' }
  }
  if (top > SIGNAL.kumTop && bot > SIGNAL.kumBot && mid < SIGNAL.kumMid) {
    return { id: 'kum', yazi: 'Alt ve üst şişik — kavga var.' }
  }
  if (top > bot * SIGNAL.tersRatio && top > SIGNAL.tersTop) {
    return { id: 'ters', yazi: 'Sadece büyükler oynuyor, ince buz.' }
  }
  if (bot > top * SIGNAL.klasikRatio) {
    return { id: 'klasik', yazi: 'Klasik piramit — taban geniş.' }
  }
  return { id: 'klasik', yazi: 'Normal akış.' }
}
