/** Tek sorumluluk: notional → sabit logaritmik kova indeksi. */

export const BUCKET_MIN = 10
export const BUCKET_MAX = 10_000_000
export const BUCKETS_PER_DECADE = 10

export function bucketCount(): number {
  const decades = Math.log10(BUCKET_MAX / BUCKET_MIN)
  return Math.round(decades * BUCKETS_PER_DECADE) + 1
}

export function notionalToBucket(notional: number): number {
  const n = Math.max(BUCKET_MIN, Math.min(notional, BUCKET_MAX))
  const idx = Math.floor(Math.log10(n / BUCKET_MIN) * BUCKETS_PER_DECADE)
  return Math.max(0, Math.min(idx, bucketCount() - 1))
}

export function bucketFloor(index: number): number {
  return BUCKET_MIN * 10 ** (index / BUCKETS_PER_DECADE)
}
