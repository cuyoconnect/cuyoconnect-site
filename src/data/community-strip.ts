export type CommunityStripPartner = {
  name: string
  logoSrc: string
  href: string
  /** Texto accesible del logo (si difiere del nombre corto) */
  logoAlt: string
  /** Logo pensado para fondo oscuro (p. ej. blanco): fuerza contraste en la tira clara */
  logoForLightBg?: boolean
  /** Invierte colores (filtro CSS) para mejor contraste en fondo claro */
  logoInvert?: boolean
  /**
   * Fondo de toda la celda de la grilla (el cuadrado completo), p. ej. marca institucional.
   * El logo se centra encima sin un “pastilla” aparte.
   */
  logoCellBgClass?: string
  /** Sin grayscale y tamaño mayor dentro de la celda */
  logoColorLarge?: boolean
  /** Ocultar por debajo de `sm`: grilla 2×2 con cuatro logos en móvil */
  hideOnMobile?: boolean
}

/**
 * Aliados: BAF, Nerdconf, Club Blockchain (tercera celda oculta en móvil), AIWKND, Vendimia Tech.
 */
export const COMMUNITY_STRIP_PARTNERS: CommunityStripPartner[] = [
  {
    name: 'BAF',
    logoAlt: 'Blockchain Acceleration Foundation',
    logoSrc: '/partners/baf.svg',
    href: 'https://www.blockchainacceleration.org/',
    logoCellBgClass: 'bg-[#6A1CF2]',
  },
  {
    name: 'Nerdconf',
    logoAlt: 'Nerdconf',
    logoSrc: '/partners/nerdconf.svg',
    href: 'https://www.nerdconf.com/',
    logoForLightBg: true,
  },
  {
    name: 'Club Blockchain',
    logoAlt: 'Club Blockchain — Universidad Champagnat',
    logoSrc: '/partners/club-blockchain-uchampagnat.svg',
    href: 'https://www.instagram.com/andes.tech_/',
    logoColorLarge: true,
    hideOnMobile: true,
  },
  {
    name: 'AI Weekend',
    logoAlt: 'AIWKND — AI Weekend',
    logoSrc: '/partners/aiwknd.png',
    href: 'https://www.aiweekend.tech/',
    logoInvert: true,
  },
  {
    name: 'Vendimia Tech',
    logoAlt: 'Vendimia Tech',
    logoSrc: '/partners/vendimia-tech.png',
    href: 'https://vendimiatech.com/',
    logoCellBgClass: 'bg-neutral-950',
  },
]
