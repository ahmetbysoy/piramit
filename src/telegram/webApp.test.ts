import { describe, expect, it } from 'vitest'
import { applyTheme } from './webApp'

describe('applyTheme', () => {
  it('Telegram renklerini CSS değişkenine basar', () => {
    const el = { style: new Map<string, string>() }
    const prev = globalThis.document
    ;(globalThis as unknown as { document: { documentElement: { style: { setProperty: (k: string, v: string) => void } } } }).document = {
      documentElement: {
        style: {
          setProperty: (k, v) => {
            el.style.set(k, v)
          },
        },
      },
    }
    applyTheme({ bg_color: '#fff', text_color: '#111', hint_color: '#666' })
    expect(el.style.get('--bg')).toBe('#fff')
    expect(el.style.get('--txt')).toBe('#111')
    expect(el.style.get('--dim')).toBe('#666')
    if (prev) (globalThis as unknown as { document: typeof prev }).document = prev
  })
})
