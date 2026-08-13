import { describe, expect, it } from 'vitest'
import { readClash } from './windowClash'

describe('windowClash', () => {
  it('aynı yön teyit', () => {
    expect(readClash(5_000, 20_000).kind).toBe('teyit')
    expect(readClash(-5_000, -9_000).kind).toBe('teyit')
  })

  it('kısa satış uzun alış = dönüş', () => {
    const c = readClash(-4_000, 12_000)
    expect(c.kind).toBe('donus')
    expect(c.yazi).toContain('çıkış')
  })

  it('kısa alış uzun satış = dip', () => {
    expect(readClash(3_000, -10_000).kind).toBe('dip')
  })

  it('küçük hacim yok sayılır', () => {
    expect(readClash(10, -10).kind).toBe('yok')
  })
})
