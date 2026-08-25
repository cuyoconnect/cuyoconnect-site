export type GithubMapScope = 'all' | 'owned'

export type GithubMapRepo = {
  fullName: string
  commits: number
  isOwner: boolean
  isFork: boolean
  stars: number
  language: string | null
  /** URL pública del deploy / sitio (campo homepage del repo). */
  homepageUrl: string
  description: string | null
}

export type GithubMapProject = {
  fullName: string
  commits: number
  stars: number
  language: string | null
  homepageUrl: string
  description: string | null
  /** og:image del sitio, resuelta en el refresh diario. */
  imageUrl?: string | null
  faviconUrl?: string | null
  /** Foto de quien publicó; null si GitHub solo tiene el identicon por defecto. */
  ownerAvatarUrl?: string | null
}

/** Enlaces públicos del perfil de GitHub (sitio, LinkedIn, Instagram, X). */
export type GithubMapLinks = {
  website?: string | null
  linkedin?: string | null
  instagram?: string | null
  x?: string | null
}

export type GithubMapMember = {
  id: string
  slug: string
  githubLogin: string
  displayName: string
  avatarUrl: string
  commits: number
  repos: GithubMapRepo[]
  links?: GithubMapLinks
}

export const GITHUB_MAP_CACHE_VERSION = 9

/** Menos de esto no entra al mapa (evita islas muertas). */
export const GITHUB_MAP_MIN_COMMITS = 20

export type GithubMapPayload = {
  scope: GithubMapScope
  members: GithubMapMember[]
  /** Proyectos con homepage; tamaño del mapa = commits (suma comunidad). */
  projects: GithubMapProject[]
  fetchedAt: string | null
  cacheVersion?: number
}

export type WeightedMapItem = {
  id: string
  weight: number
}
