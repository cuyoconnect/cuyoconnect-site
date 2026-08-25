import { config } from 'dotenv'
import pg from 'pg'

config()

function envValue(...keys) {
  for (const key of keys) {
    if (process.env[key]?.trim()) return process.env[key].trim()
  }
  return ''
}

function normalizeHttpUrl(raw) {
  const value = raw?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

function classifyGenericUrl(url) {
  const host = hostOf(url)
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin'
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram'
  if (host === 'x.com' || host === 'twitter.com' || host.endsWith('.x.com')) return 'x'
  return 'website'
}

function parseGithubSocialAccounts(input) {
  const links = { website: null, linkedin: null, instagram: null, x: null }
  for (const account of input.socialAccounts ?? []) {
    const href = normalizeHttpUrl(account?.url)
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

async function fetchGithubProfile(login, token) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cuyoconnect-member-sync',
    },
    body: JSON.stringify({
      query: `
        query MemberSocialProfile($login: String!) {
          user(login: $login) {
            login
            name
            avatarUrl
            url
            websiteUrl
            twitterUsername
            location
            socialAccounts(first: 10) {
              nodes { provider url }
            }
          }
        }
      `,
      variables: { login },
    }),
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.errors?.[0]?.message || `GitHub HTTP ${response.status}`)
  }
  return body.data?.user ?? null
}

const token = envValue('GITHUB_TOKEN')
const dbUrl = envValue('DATABASE_URL', 'SUPABASE_DB_URL')
if (!token) {
  console.error('Falta GITHUB_TOKEN')
  process.exit(1)
}
if (!dbUrl || dbUrl.startsWith('http')) {
  console.error(
    'Falta una URI de Postgres (DATABASE_URL). SUPABASE_DB_URL no puede ser la URL https de la API.',
  )
  process.exit(1)
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

await client.connect()

try {
  await client.query(
    'alter table public.member_profiles disable trigger trg_member_profiles_cuyo_redeploy',
  )

  const { rows } = await client.query(
    `select id, github_login, website_url, linkedin_url, instagram_url, x_url
     from public.member_profiles
     where github_login is not null and btrim(github_login) <> ''
     order by joined_at desc`,
  )

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    try {
      const user = await fetchGithubProfile(row.github_login, token)
      if (!user) {
        skipped += 1
        console.log(`skip ${row.github_login}: usuario inexistente`)
        continue
      }
      const links = parseGithubSocialAccounts({
        websiteUrl: user.websiteUrl,
        twitterUsername: user.twitterUsername,
        socialAccounts: user.socialAccounts?.nodes,
      })
      const changed =
        (row.website_url ?? null) !== links.website ||
        (row.linkedin_url ?? null) !== links.linkedin ||
        (row.instagram_url ?? null) !== links.instagram ||
        (row.x_url ?? null) !== links.x

      if (!changed) {
        skipped += 1
        continue
      }

      await client.query(
        `update public.member_profiles
         set website_url = $2,
             linkedin_url = $3,
             instagram_url = $4,
             x_url = $5
         where id = $1`,
        [row.id, links.website, links.linkedin, links.instagram, links.x],
      )
      updated += 1
      const present = Object.entries(links)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(', ')
      console.log(`ok ${row.github_login}: ${present || 'sin redes'}`)
    } catch (error) {
      failed += 1
      console.error(
        `fail ${row.github_login}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }

  await client.query(
    'alter table public.member_profiles enable trigger trg_member_profiles_cuyo_redeploy',
  )

  console.log(`listo total=${rows.length} updated=${updated} skipped=${skipped} failed=${failed}`)
} finally {
  await client.end()
}
