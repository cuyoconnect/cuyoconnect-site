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
    social: {
      linkedin: 'https://www.linkedin.com/in/nicolas-bustelo/',
    },
  },
  {
    name: 'Matías Boldrini',
    role: 'Diseño y operaciones',
    imageSrc: '/team/Matias_Boldrini.jpg',
    social: {
      linkedin: 'https://www.linkedin.com/in/mat%C3%ADas-boldrini-93b146192/',
    },
  },
  {
    name: 'Joaquín Cortez',
    role: 'Comunidad y contenido',
    imageSrc: '/team/Joaquin_Cortez.jpg',
    social: {
      linkedin: 'https://www.linkedin.com/in/joaqu%C3%ADn-cortez/',
    },
  },
  {
    name: 'Julio Márquez',
    role: 'Marketing y comunicación',
    imageSrc: '/team/Julio_Marquez.jpg',
    social: {
      linkedin: 'https://www.linkedin.com/in/juliocesarmarquez/',
    },
  },
  {
    name: 'Arturo Marín',
    role: 'Desarrollo y tecnología',
    imageSrc: '/team/Arturo_Marin.jpg',
    social: {
      linkedin: 'https://www.linkedin.com/in/arturo-marin-bosquet/',
    },
  },
  {
    name: 'Ticiana Angelucci',
    role: 'Eventos y experiencia',
    imageSrc: '/team/Ticiana_Angelucci.jpg',
    social: {
      linkedin: 'https://www.linkedin.com/in/ticiana-angelucci-12098b23a/',
    },
  },
  {
    name: 'Mauricio Medina',
    role: 'Alianzas y partnerships',
    imageSrc: '/team/Mauricio_Medina.jpg',
    social: {
      linkedin: 'https://www.linkedin.com/in/mauricio-medina-dev/',
    },
  },
]
