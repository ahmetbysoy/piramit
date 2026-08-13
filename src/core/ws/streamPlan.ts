/** Tek sorumluluk: hangi stream açılacak. */

import { FORCE_ORDER, MINI_TICKER, aggTradeStream } from './endpoints'

export function streamsFor(symbol: string, radar: boolean, saver: boolean): string[] {
  const out = [aggTradeStream(symbol)]
  if (!saver) out.push(FORCE_ORDER)
  if (radar && !saver) out.push(MINI_TICKER)
  return out
}
