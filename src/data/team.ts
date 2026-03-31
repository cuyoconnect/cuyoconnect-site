/**
 * Equipo CuyoConnect: editá nombres, roles y `imageSrc` (ruta en /public/team).
 */
export type TeamMember = {
  name: string
  role: string
  /** Imagen del miembro (ruta pública, p. ej. `/team/foto.jpg`). */
  imageSrc?: string
  /** Enlaces sociales; lo que falta usa las URLs de la comunidad (LinkedIn, X, Instagram). */
  social?: {
    linkedin?: string
    x?: string
    instagram?: string
  }
  /** @deprecated Usá `social.linkedin`. */
  href?: string
}

/** Fotos en `public/team/` (archivo del zip de perfil). */
export const TEAM: TeamMember[] = [
  {
    name: 'Nicolás Bustelo',
    role: 'Co-fundación y estrategia',
    imageSrc: '/team/Nicolas_Bustelo.JPG',
  },
  {
    name: 'Matías Boldrini',
    role: 'Operaciones y eventos',
    imageSrc: '/team/Matias_Boldrini.jpg',
  },
  {
    name: 'Joaquín Cortez',
    role: 'Comunidad y contenido',
    imageSrc: '/team/Joaquin_Cortez.jpg',
  },
]
