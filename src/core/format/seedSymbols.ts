/** Tek sorumluluk: CORS olursa bile arama çalışsın — popüler perp + tick. */

import type { SymbolMeta } from './precision'

export const SEED_SYMBOLS: SymbolMeta[] = [
  { symbol: 'BTCUSDT', base: 'BTC', tickSize: '0.10', stepSize: '0.001' },
  { symbol: 'ETHUSDT', base: 'ETH', tickSize: '0.01', stepSize: '0.001' },
  { symbol: 'SOLUSDT', base: 'SOL', tickSize: '0.0100', stepSize: '1' },
  { symbol: 'BNBUSDT', base: 'BNB', tickSize: '0.010', stepSize: '0.01' },
  { symbol: 'XRPUSDT', base: 'XRP', tickSize: '0.0001', stepSize: '0.1' },
  { symbol: 'DOGEUSDT', base: 'DOGE', tickSize: '0.000010', stepSize: '1' },
  { symbol: 'ADAUSDT', base: 'ADA', tickSize: '0.00010', stepSize: '1' },
  { symbol: 'AVAXUSDT', base: 'AVAX', tickSize: '0.0010', stepSize: '0.1' },
  { symbol: 'LINKUSDT', base: 'LINK', tickSize: '0.0010', stepSize: '0.01' },
  { symbol: 'DOTUSDT', base: 'DOT', tickSize: '0.0010', stepSize: '0.1' },
  { symbol: 'NEARUSDT', base: 'NEAR', tickSize: '0.0010', stepSize: '0.1' },
  { symbol: 'SUIUSDT', base: 'SUI', tickSize: '0.000100', stepSize: '0.1' },
  { symbol: 'PEPEUSDT', base: 'PEPE', tickSize: '0.0000001', stepSize: '1' },
  { symbol: 'WIFUSDT', base: 'WIF', tickSize: '0.00010', stepSize: '0.1' },
  { symbol: 'AAVEUSDT', base: 'AAVE', tickSize: '0.010', stepSize: '0.01' },
  { symbol: 'LTCUSDT', base: 'LTC', tickSize: '0.010', stepSize: '0.001' },
  { symbol: 'APTUSDT', base: 'APT', tickSize: '0.00010', stepSize: '0.01' },
  { symbol: 'ARBUSDT', base: 'ARB', tickSize: '0.00010', stepSize: '0.1' },
  { symbol: 'OPUSDT', base: 'OP', tickSize: '0.00010', stepSize: '0.1' },
  { symbol: 'TIAUSDT', base: 'TIA', tickSize: '0.00010', stepSize: '0.1' },
]
