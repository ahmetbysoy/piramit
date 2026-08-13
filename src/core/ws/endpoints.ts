/** Tek sorumluluk: Binance USD-M WS / REST adresleri. */

export const MARKET_WS = 'wss://fstream.binance.com/market'
export const PUBLIC_WS = 'wss://fstream.binance.com/public'
export const EXCHANGE_INFO_URL =
  'https://fapi.binance.com/fapi/v1/exchangeInfo'

export function marketCombinedUrl(streams: readonly string[]): string {
  return `${MARKET_WS}/stream?streams=${streams.join('/')}`
}

export function aggTradeStream(symbol: string): string {
  return `${symbol.toLowerCase()}@aggTrade`
}
