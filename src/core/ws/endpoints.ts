/** Tek sorumluluk: Binance USD-M WS / REST adresleri. */

export const MARKET_WS = 'wss://fstream.binance.com/market'
export const PUBLIC_WS = 'wss://fstream.binance.com/public'

export const EXCHANGE_INFO_URLS = [
  'https://fapi.binance.com/fapi/v1/exchangeInfo',
  'https://fapi.binance.com/fapi/v1/exchangeInfo?pauseMS=0',
] as const

export const EXCHANGE_INFO_URL = EXCHANGE_INFO_URLS[0]
export const OI_URLS = [
  'https://fapi.binance.com/fapi/v1/openInterest',
  'https://www.binance.com/fapi/v1/openInterest',
] as const

export function marketCombinedUrl(streams: readonly string[]): string {
  return `${MARKET_WS}/stream?streams=${streams.join('/')}`
}

export function aggTradeStream(symbol: string): string {
  return `${symbol.toLowerCase()}@aggTrade`
}

export const FORCE_ORDER = '!forceOrder@arr'
export const MINI_TICKER = '!miniTicker@arr'
