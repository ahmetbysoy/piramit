import { describe, expect, it } from 'vitest'
import { PyramidEngine } from './pyramidEngine'
import type { AggTrade } from '../market/aggTrade'

const t0 = 1_700_000_100_000

function trade(partial: Partial<AggTrade> & Pick<AggTrade, 'notional' | 'timeMs'>): AggTrade {
  return {
    symbol: 'BTCUSDT',
    tradeId: 1,
    priceStr: '100',
    qtyStr: '1',
    price: 100,
    qty: 1,
    side: 'ALIS',
    ...partial,
  }
}

describe('PyramidEngine pencereler + coin', () => {
  it('yanlış sembolü yemez', () => {
    const e = new PyramidEngine()
    e.setClock(() => t0)
    e.setSymbol('BTCUSDT')
    e.ingestTrade(trade({ symbol: 'ETHUSDT', notional: 500, timeMs: t0 }))
    e.flush()
    expect(e.snapshot().tickCount).toBe(0)
    expect(e.snapshot().windowBuy).toBe(0)
  })

  it('coin değişince sayaç ve hacim sıfır', () => {
    const e = new PyramidEngine()
    e.setClock(() => t0 + 10_000)
    e.setSymbol('BTCUSDT')
    e.ingestTrade(trade({ notional: 800, timeMs: t0 }))
    e.flush()
    expect(e.snapshot().tickCount).toBe(1)
    e.setSymbol('ETHUSDT')
    expect(e.snapshot().tickCount).toBe(0)
    expect(e.snapshot().windowBuy).toBe(0)
    expect(e.snapshot().sessionBuy).toBe(0)
    expect(e.snapshot().priceStr).toBe('')
    expect(e.snapshot().symbol).toBe('ETHUSDT')
    e.ingestTrade(trade({ symbol: 'BTCUSDT', notional: 800, timeMs: t0 + 1000 }))
    e.flush()
    expect(e.snapshot().tickCount).toBe(0)
  })

  it('1dk seçiliyken 5dk daha büyük veya eşit', () => {
    const e = new PyramidEngine()
    const now = t0 + 9 * 60_000 + 2_000
    e.setClock(() => now)
    e.setSymbol('BTCUSDT')
    for (let i = 0; i < 10; i++) {
      e.ingestTrade(
        trade({
          tradeId: i,
          notional: 50,
          timeMs: t0 + i * 60_000,
        }),
      )
    }
    e.setWindow(60)
    e.flush()
    const one = e.snapshot().windowBuy
    e.setWindow(300)
    e.flush()
    const five = e.snapshot().windowBuy
    e.setWindow(900)
    e.flush()
    const fifteen = e.snapshot().windowBuy
    e.setWindow('oturum')
    e.flush()
    const sess = e.snapshot().sessionBuy
    expect(one).toBeLessThanOrEqual(five)
    expect(five).toBeLessThanOrEqual(fifteen)
    expect(fifteen).toBeLessThanOrEqual(sess)
    expect(one).toBeCloseTo(50)
    expect(five).toBeCloseTo(250)
    expect(sess).toBeCloseTo(500)
  })

  it('pencere değişince oturum değişmez', () => {
    const e = new PyramidEngine()
    e.setClock(() => t0 + 5000)
    e.setSymbol('BTCUSDT')
    e.ingestTrade(trade({ notional: 120, timeMs: t0, side: 'SATIS' }))
    e.flush()
    const sess = e.snapshot().sessionSell
    e.setWindow(300)
    e.flush()
    expect(e.snapshot().sessionSell).toBe(sess)
    e.setWindow(60)
    e.flush()
    expect(e.snapshot().sessionSell).toBe(sess)
  })

  it('OI fail yalan söylemez', () => {
    const e = new PyramidEngine()
    e.setSymbol('BTCUSDT')
    expect(e.snapshot().oiState).toBe('bekliyor')
    e.markOiFail()
    e.flush()
    expect(e.snapshot().oiState).toBe('yok')
    e.setOi(12, 1)
    e.flush()
    expect(e.snapshot().oiState).toBe('ok')
    e.markOiFail()
    e.flush()
    expect(e.snapshot().oiState).toBe('eski')
    expect(e.snapshot().oi).toBe(12)
    expect(e.snapshot().edges.length).toBeGreaterThan(2)
  })

  it('kovalar zaman sıralı kalır', () => {
    const e = new PyramidEngine()
    e.setClock(() => t0 + 4000)
    e.setSymbol('BTCUSDT')
    e.ingestTrade(trade({ tradeId: 1, notional: 10, timeMs: t0 + 3000 }))
    e.ingestTrade(trade({ tradeId: 2, notional: 10, timeMs: t0 + 500 }))
    e.ingestTrade(trade({ tradeId: 3, notional: 10, timeMs: t0 + 2000 }))
    expect(e.ledgerChronological()).toBe(true)
  })
})
