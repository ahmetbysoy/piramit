/** Tek sorumluluk: kısa pencere ↔ oturum çelişkisi. */

export type Clash = {
  kind: 'donus' | 'dip' | 'teyit' | 'yok'
  yazi: string
}

export function readClash(shortNet: number, sessNet: number, minAbs = 800): Clash {
  const s = Math.abs(shortNet)
  const l = Math.abs(sessNet)
  if (s < minAbs || l < minAbs) return { kind: 'yok', yazi: '' }
  const shortUp = shortNet > 0
  const sessUp = sessNet > 0
  if (shortUp && sessUp) return { kind: 'teyit', yazi: 'Kısa ve uzun aynı: ALIŞ teyitli.' }
  if (!shortUp && !sessUp) return { kind: 'teyit', yazi: 'Kısa ve uzun aynı: SATIŞ teyitli.' }
  if (!shortUp && sessUp) {
    return { kind: 'donus', yazi: '1dk SATIŞ, açılıştan ALIŞ — büyükler çıkışa geçmiş olabilir.' }
  }
  return { kind: 'dip', yazi: '1dk ALIŞ, açılıştan SATIŞ — düşüşte toplama başlamış olabilir.' }
}
