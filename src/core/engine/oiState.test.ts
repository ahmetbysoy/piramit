import { describe, expect, it } from 'vitest'
import { oiMeta } from './oiState'

const fmt = (n: number) => String(n)

describe('oiMeta', () => {
  it('CORS’ta yalan yok', () => {
    expect(oiMeta('yok', null, null, fmt)).toContain('CORS')
  })
  it('eski OI işaretli', () => {
    expect(oiMeta('eski', 10, 1, fmt)).toContain('eski')
  })
  it('ok OI yazar', () => {
    expect(oiMeta('ok', 8.5, -1, fmt)).toBe('OI 8.5 ↓')
  })
})
