/** Tek sorumluluk: combined stream JSON'u bir kez aç. */

export type Unwrapped =
  | { kind: 'aggTrade'; data: Record<string, unknown> }
  | { kind: 'forceOrder'; data: Record<string, unknown> }
  | { kind: 'mini'; data: unknown[] }
  | { kind: 'diger' }

export function unwrapWs(raw: string): Unwrapped {
  let msg: unknown
  try {
    msg = JSON.parse(raw)
  } catch {
    return { kind: 'diger' }
  }
  if (Array.isArray(msg)) return { kind: 'mini', data: msg }
  if (!msg || typeof msg !== 'object') return { kind: 'diger' }
  const rec = msg as { data?: unknown; e?: string }
  const inner = rec.data !== undefined ? rec.data : msg
  if (Array.isArray(inner)) return { kind: 'mini', data: inner }
  if (!inner || typeof inner !== 'object') return { kind: 'diger' }
  const e = (inner as { e?: string }).e
  if (e === 'aggTrade') return { kind: 'aggTrade', data: inner as Record<string, unknown> }
  if (e === 'forceOrder') return { kind: 'forceOrder', data: inner as Record<string, unknown> }
  return { kind: 'diger' }
}
