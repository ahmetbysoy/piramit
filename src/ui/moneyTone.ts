export function sideColor(side: 'ALIS' | 'SATIS'): string {
  return side === 'ALIS' ? '#3dffa1' : '#ff4d6d'
}

export function netWord(net: number): 'ALIŞ' | 'SATIŞ' | 'DÜZ' {
  if (net > 0) return 'ALIŞ'
  if (net < 0) return 'SATIŞ'
  return 'DÜZ'
}
