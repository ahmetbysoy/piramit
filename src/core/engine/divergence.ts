/** Tek sorumluluk: tepe/taban vs fiyat → ölçülebilir etiket. OI sadece dipnot. */

export type DivKind = 'toplama' | 'bosaltma' | 'yok'

export type DivSignal = {
  kind: DivKind
  score: number
  yazi: string
}

export function scoreDivergence(input: {
  priceChange: number
  topNet: number
  botNet: number
  topAbs: number
  botAbs: number
  oiDelta?: number | null
}): DivSignal {
  const { priceChange, topNet, botNet, topAbs, botAbs, oiDelta } = input
  if (topAbs + botAbs < 500) {
    return { kind: 'yok', score: 0, yazi: '' }
  }
  const top = topAbs > 0 ? topNet / topAbs : 0
  const bot = botAbs > 0 ? botNet / botAbs : 0
  const px = Math.max(-1, Math.min(1, priceChange / 0.4))

  const bosaltma = Math.max(0, px) * Math.max(0, -top) * Math.max(0, bot)
  const toplama = Math.max(0, -px) * Math.max(0, top) * Math.max(0, -bot)
  if (bosaltma >= 0.12 && bosaltma >= toplama) {
    return {
      kind: 'bosaltma',
      score: bosaltma,
      yazi: `Küçükler kovalıyor, büyükler SATIŞ — boşaltma.${oiNote(oiDelta, 'bosaltma')}`,
    }
  }
  if (toplama >= 0.12) {
    return {
      kind: 'toplama',
      score: toplama,
      yazi: `Büyükler ALIŞ yazıyor, küçükler SATIŞ — toplama.${oiNote(oiDelta, 'toplama')}`,
    }
  }
  return { kind: 'yok', score: Math.max(bosaltma, toplama), yazi: '' }
}

function oiNote(d: number | null | undefined, kind: DivKind): string {
  if (d == null || Math.abs(d) < 1e-8) return ''
  if (kind === 'toplama') {
    return d > 0 ? ' OI şişiyor — yeni long kokusu.' : ' OI iniyor — short kapanışı olabilir, yakıt değil.'
  }
  return d > 0 ? ' OI şişiyor — yeni short açılıyor olabilir.' : ' OI iniyor — long’lar kapanıyor.'
}
