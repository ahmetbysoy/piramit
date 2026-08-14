/** Tek sorumluluk: UI etiketleri. Katman adları (Toz…) çevrilmez. */

export const t = {
  tr: {
    navPyramid: 'Piramit',
    navTape: 'Akış',
    navRadar: 'Radar',
    navSettings: 'Ayar',
    adaptWarm: 'Adaptif kuruluyor',
    saveShot: 'Kaydet',
    saved: 'İndirildi.',
    adaptFlip: 'Eşikler güncellendi — şekil değişebilir, bug değil.',
  },
} as const

export type Lang = keyof typeof t
