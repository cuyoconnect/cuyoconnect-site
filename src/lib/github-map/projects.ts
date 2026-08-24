import {
  GITHUB_MAP_MIN_COMMITS,
  type GithubMapMember,
  type GithubMapProject,
} from '@/lib/github-map/types'

/** Une repos de todos los miembros; el tamaño del mapa usa la suma de commits. */
export function aggregateMapProjects(
  members: readonly GithubMapMember[],
): GithubMapProject[] {
  const byName = new Map<string, GithubMapProject>()

  for (const member of members) {
    for (const repo of member.repos) {
      if (!repo.homepageUrl || repo.commits < 1) continue
      const existing = byName.get(repo.fullName)
      if (!existing) {
        byName.set(repo.fullName, {
          fullName: repo.fullName,
          commits: repo.commits,
          stars: repo.stars,
          language: repo.language,
          homepageUrl: repo.homepageUrl,
          description: repo.description,
        })
        continue
      }
      existing.commits += repo.commits
      existing.stars = Math.max(existing.stars, repo.stars)
      if (
        (repo.description?.length ?? 0) > (existing.description?.length ?? 0)
      ) {
        existing.description = repo.description
      }
    }
  }

  return [...byName.values()]
    .filter((project) => project.commits >= GITHUB_MAP_MIN_COMMITS)
    .sort((a, b) => b.commits - a.commits)
}
