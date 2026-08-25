export type GithubSocialLinks = {
  website: string | null
  linkedin: string | null
  instagram: string | null
  x: string | null
}

export type GithubSocialAccount = {
  provider?: string
  url?: string
}

const EMPTY_LINKS: GithubSocialLinks = {
  website: null,
  linkedin: null,
  instagram: null,
  x: null,
}

export function normalizeHttpUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

function classifyGenericUrl(url: string): keyof GithubSocialLinks {
  const host = hostOf(url)
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin'
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram'
  if (host === 'x.com' || host === 'twitter.com' || host.endsWith('.x.com')) return 'x'
  return 'website'
}

export function parseGithubSocialAccounts(input: {
  websiteUrl?: string | null
  twitterUsername?: string | null
  socialAccounts?: Array<GithubSocialAccount | null> | null
}): GithubSocialLinks {
  const links: GithubSocialLinks = { ...EMPTY_LINKS }
  const accounts = (input.socialAccounts ?? []).filter(Boolean) as GithubSocialAccount[]

  for (const account of accounts) {
    const href = normalizeHttpUrl(account.url)
    if (!href) continue

    const provider = (account.provider ?? '').toUpperCase()
    if (provider === 'LINKEDIN') {
      links.linkedin = href
      continue
    }
    if (provider === 'INSTAGRAM') {
      links.instagram = href
      continue
    }
    if (provider === 'TWITTER') {
      links.x = href
      continue
    }
    if (provider === 'GENERIC') {
      const field = classifyGenericUrl(href)
      if (!links[field]) links[field] = href
    }
  }

  const website = normalizeHttpUrl(input.websiteUrl)
  if (website) {
    const field = classifyGenericUrl(website)
    if (field === 'website' || !links[field]) links[field] = website
  }

  const twitter = input.twitterUsername?.trim()
  if (!links.x && twitter) {
    links.x = `https://x.com/${twitter.replace(/^@/, '')}`
  }

  return links
}
