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
  /** Tamaño mayor dentro de la celda (sigue en escala de grises hasta hover) */
  logoColorLarge?: boolean
}

/**
 * Aliados: Nerdconf, BAF, Club Blockchain, AIWKND, Vendimia Tech, Crecimiento.
 */
export const COMMUNITY_STRIP_PARTNERS: CommunityStripPartner[] = [
  {
    name: 'Nerdconf',
    logoAlt: 'Nerdconf',
    logoSrc: '/partners/nerdconf.svg',
    href: 'https://www.nerdconf.com/',
    logoForLightBg: true,
  },
  {
    name: 'BAF',
    logoAlt: 'Blockchain Acceleration Foundation',
    logoSrc: '/partners/baf.svg',
    href: 'https://www.blockchainacceleration.org/',
    logoInvert: true,
  },
  {
    name: 'Club Blockchain',
    logoAlt: 'Club Blockchain — Universidad Champagnat',
    logoSrc: '/partners/club-blockchain-uchampagnat.svg',
    href: 'https://www.instagram.com/andes.tech_/',
    logoColorLarge: true,
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
    logoInvert: true,
  },
  {
    name: 'Crecimiento',
    logoAlt: 'Crecimiento',
    logoSrc: '/partners/crecimiento-sun-black.svg',
    href: 'https://www.crecimiento.build/',
    logoColorLarge: true,
  },
]
