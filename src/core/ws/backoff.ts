/** Tek sorumluluk: reconnect gecikmesi. */

export const MAX_RECONNECT = 12
export const MAX_BACKOFF_MS = 30_000

export function reconnectDelay(attempt: number, jitter = 0): number {
  return Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS) + jitter
}
