/** Tek sorumluluk: 7 katman payından şekil etiketi. */

export type ShapeId = 'klasik' | 'kum' | 'ters' | 'mantar' | 'yassi' | 'bos'

export function detectShape(layers: { share: number; buyNotional: number; sellNotional: number }[]): {
  id: ShapeId
  yazi: string
} {
  const shares = layers.map((l) => l.share)
  const vol = layers.reduce((a, l) => a + l.buyNotional + l.sellNotional, 0)
  if (vol < 50) return { id: 'bos', yazi: 'Sessizlik. Bekle.' }

  const bot = shares[0] + shares[1] + shares[2]
  const mid = shares[3]
  const top = shares[5] + shares[6]
  const kraken = shares[6]

  if (kraken > 0.45) return { id: 'mantar', yazi: 'Tepe patladı — iri vuruş.' }
  if (vol < 2_000 && Math.max(...shares) < 0.35) {
    return { id: 'yassi', yazi: 'Piyasa ölü, hacim yok.' }
  }
  if (top > 0.28 && bot > 0.28 && mid < 0.12) {
    return { id: 'kum', yazi: 'Alt ve üst şişik — kavga var.' }
  }
  if (top > bot * 1.4 && top > 0.35) {
    return { id: 'ters', yazi: 'Sadece büyükler oynuyor, ince buz.' }
  }
  if (bot > top * 1.3) {
    return { id: 'klasik', yazi: 'Klasik piramit — taban geniş.' }
  }
  return { id: 'klasik', yazi: 'Normal akış.' }
}
