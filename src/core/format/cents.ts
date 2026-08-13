/** Tek sorumluluk: USDT kuruş birikimi — float kaymasını kes. */

export function toCents(n: number): number {
  return Math.round(n * 100)
}

export function fromCents(c: number): number {
  return c / 100
}

export function addCents(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b))
}
