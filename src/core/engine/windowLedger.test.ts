import { describe, expect, it } from 'vitest'
import { totalNotional } from './layerWallet'
import { WindowLedger } from './windowLedger'

const t0 = 1_700_000_000_000

function vol(wallets: Parameters<typeof totalNotional>[0][]): number {
  return wallets.reduce((a, w) => a + totalNotional(w), 0)
}

describe('WindowLedger', () => {
  it('1dk ⊆ 5dk ⊆ 15dk ⊆ 1sa ⊆ oturum', () => {
    const L = new WindowLedger()
    const now = t0 + 19 * 60_000 + 2_000
    // 20 dk boyunca her dk 100$ alış (son tick now'a yakın)
    for (let m = 0; m < 20; m++) {
      L.ingest(100, 'ALIS', t0 + m * 60_000 + 500, 1, '1')
    }
    const v1 = vol(L.sumWindow(60, now))
    const v5 = vol(L.sumWindow(300, now))
    const v15 = vol(L.sumWindow(900, now))
    const v60 = vol(L.sumWindow(3600, now))
    const sess = vol(L.sessionBuckets())
    expect(v1).toBeLessThanOrEqual(v5 + 1e-6)
    expect(v5).toBeLessThanOrEqual(v15 + 1e-6)
    expect(v15).toBeLessThanOrEqual(v60 + 1e-6)
    expect(v60).toBeLessThanOrEqual(sess + 1e-6)
    expect(sess).toBeCloseTo(2000)
    expect(v1).toBeCloseTo(100)
    expect(v5).toBeCloseTo(500)
  })

  it('geri gelen tick aynı saniyeye yazar, sıra bozulmaz', () => {
    const L = new WindowLedger()
    L.ingest(10, 'ALIS', t0 + 3000, 1, '1')
    L.ingest(10, 'ALIS', t0 + 1000, 1, '1')
    L.ingest(10, 'SATIS', t0 + 1000, 1, '1')
    L.ingest(10, 'ALIS', t0 + 2000, 1, '1')
    expect(L.isChronological()).toBe(true)
    expect(L.sliceCount()).toBe(3)
    const w = L.sumWindow(5, t0 + 3000)
    expect(vol(w)).toBeCloseTo(40)
  })

  it('reset her şeyi siler', () => {
    const L = new WindowLedger()
    L.ingest(500, 'ALIS', t0, 2, '2')
    L.reset()
    expect(vol(L.sessionBuckets())).toBe(0)
    expect(vol(L.sumWindow(60, t0 + 1000))).toBe(0)
    expect(L.lastPriceInfo().priceStr).toBe('')
  })

  it('gelecek timestamp pencereyi kirletmez', () => {
    const L = new WindowLedger()
    L.ingest(100, 'ALIS', t0, 1, '1')
    L.ingest(9_999, 'SATIS', t0 + 86_400_000, 1, '1')
    const now = t0 + 1000
    expect(vol(L.sumWindow(60, now))).toBeCloseTo(100)
    expect(vol(L.sessionBuckets())).toBeCloseTo(10_099)
  })
})
