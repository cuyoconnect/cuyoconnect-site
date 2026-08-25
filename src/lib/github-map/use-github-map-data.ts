import { useEffect, useState } from 'react'

import {
  DEMO_GITHUB_MAP,
  fetchGithubMap,
  readCachedGithubMap,
} from '@/lib/github-map/client'
import type { GithubMapPayload } from '@/lib/github-map/types'

export function useGithubMapData() {
  const [payload, setPayload] = useState<GithubMapPayload | null>(() =>
    readCachedGithubMap('all'),
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(() => !readCachedGithubMap('all'))

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const hadCache = Boolean(readCachedGithubMap('all'))
      if (!hadCache) setIsLoading(true)
      setErrorMessage('')
      try {
        const next = await fetchGithubMap('all')
        if (cancelled) return
        if (
          next.projects.length === 0 &&
          next.members.length === 0 &&
          import.meta.env.DEV &&
          !next.fetchedAt
        ) {
          setPayload(DEMO_GITHUB_MAP)
        } else {
          setPayload(next)
        }
      } catch (error) {
        if (cancelled) return
        console.error('No se pudo cargar el mapa de GitHub.', error)
        if (readCachedGithubMap('all')) return
        if (import.meta.env.DEV) {
          setPayload(DEMO_GITHUB_MAP)
          setErrorMessage('')
        } else {
          setErrorMessage(
            'Todavía no pudimos cargar los proyectos de la comunidad.',
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { payload, errorMessage, isLoading }
}
