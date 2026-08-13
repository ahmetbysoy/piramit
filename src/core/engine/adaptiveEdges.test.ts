import { describe, expect, it } from 'vitest'
import { emptyWallet, type LayerWallet } from './layerWallet'
import { bucketCount } from './microBuckets'
import { edgesFromHistogram, fixedEdges } from './adaptiveEdges'
import { notionalToBucket } from './microBuckets'

function hist(sizes: number[]): LayerWallet[] {
  const row = Array.from({ length: bucketCount() }, emptyWallet)
  for (const n of sizes) {
    const i = notionalToBucket(n)
    row[i].buyCount += 1
    row[i].buyNotional += n
  }
  return row
}

describe('adaptif eşik', () => {
  it('az tick varsa sabit eşiğe düşer', () => {
    const e = edgesFromHistogram(hist([20, 30, 40]), null)
    expect(e[1]).toBe(fixedEdges()[1])
  })

  it('küçük coin dağılımında Kraken eşiği BTC’den düşük', () => {
    const pepe = hist(Array.from({ length: 200 }, (_, i) => (i < 180 ? 80 : 4_000)))
    const btc = hist(Array.from({ length: 200 }, (_, i) => (i < 180 ? 8_000 : 900_000)))
    const pe = edgesFromHistogram(pepe, null)
    const be = edgesFromHistogram(btc, null)
    expect(pe[6]).toBeLessThan(be[6])
    expect(pe[6]).toBeLessThan(50_000)
    expect(be[6]).toBeGreaterThan(100_000)
  })

  it('histerezis küçük kaymayı yutar', () => {
    const a = hist(Array.from({ length: 80 }, () => 1_000))
    const e1 = edgesFromHistogram(a, null)
    const e2 = edgesFromHistogram(a, e1)
    expect(e2).toEqual(e1)
  })
})
