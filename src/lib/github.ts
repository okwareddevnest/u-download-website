export type GHContributor = {
  login: string
  name?: string
  avatarUrl: string
  htmlUrl: string
  contributions: number
  isOwner: boolean
}

type PublicConfig = {
  githubRepo?: string
  includeBots?: boolean
}

async function loadPublicConfig(): Promise<PublicConfig | null> {
  try {
    const r = await fetch('/data/config.json', { cache: 'no-cache' })
    if (!r.ok) return null
    return (await r.json()) as PublicConfig
  } catch {
    return null
  }
}

function parseRepo(full?: string): { owner: string; repo: string } | null {
  if (!full) return null
  // Accept formats:
  // - owner/repo
  // - https://github.com/owner/repo
  // - github.com/owner/repo
  const cleaned = full.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
  const parts = cleaned.split('/')
  const ghIdx = parts.indexOf('github.com')
  if (ghIdx !== -1) {
    const owner = parts[ghIdx + 1]
    const repo = parts[ghIdx + 2]
    if (owner && repo) return { owner, repo }
    return null
  }
  const [owner, repo] = cleaned.split('/')
  if (!owner || !repo) return null
  return { owner, repo }
}

export async function loadContributors(): Promise<GHContributor[]> {
  // Prefer serverless proxy to avoid client-side rate limits
  try {
    const prox = await fetch('/api/contributors', { cache: 'no-cache' })
    if (prox.ok) {
      const data = (await prox.json()) as GHContributor[]
      if (Array.isArray(data)) {
        return applyNameOverrides(data)
      }
    }
  } catch {
    // Ignore serverless API errors and fall back to client-side implementation
  }
  try {
    const cfg = await loadPublicConfig()
    const repoFull = cfg?.githubRepo || (import.meta as any).env?.VITE_GITHUB_REPO
    const auth = (import.meta as any).env?.VITE_GITHUB_TOKEN as string | undefined
    const p = parseRepo(repoFull)
    if (!p) return []
    const { owner, repo } = p
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
    if (auth) headers.Authorization = `Bearer ${auth}`

    // Fetch contributors list (max 100)
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, {
      headers,
    })
    if (!r.ok) return []
    const arr = (await r.json()) as any[]
    const includeBots = cfg?.includeBots ?? false
    const base = arr
      .filter((c) => (includeBots ? true : c.type !== 'Bot'))
      .map((c) => ({
        login: c.login as string,
        name: undefined as string | undefined,
        avatarUrl: c.avatar_url as string,
        htmlUrl: c.html_url as string,
        contributions: Number(c.contributions) || 0,
        isOwner: c.login === owner,
      })) as GHContributor[]

    // Ensure owner appears and is first
    let list = base
    const ownerIdx = list.findIndex((c) => c.login === owner)
    if (ownerIdx === -1) {
      // If owner not in contributors, fetch owner profile
      try {
        const u = await fetch(`https://api.github.com/users/${owner}`, { headers })
        if (u.ok) {
          const j = await u.json()
          list = [
            {
              login: j.login,
              name: j.name || undefined,
              avatarUrl: j.avatar_url,
              htmlUrl: j.html_url,
              contributions: 0,
              isOwner: true,
            },
            ...list,
          ]
        }
      } catch {
        // ignore
      }
    } else {
      // Move to front and mark as owner
      const [own] = list.splice(ownerIdx, 1)
      own.isOwner = true
      list.unshift(own)
    }

    // Enrich ALL contributors with complete user data for name and username display
    await Promise.all(
      list.map(async (c) => {
        if (c.name) return // Skip if we already have the name
        try {
          const u = await fetch(`https://api.github.com/users/${c.login}`, { headers })
          if (!u.ok) {
            console.warn(`Failed to fetch user data for ${c.login}: ${u.status}`)
            return
          }
          const j = await u.json()
          // Always set name field - use the GitHub display name if available, otherwise keep undefined
          c.name = j.name && j.name.trim() !== '' ? j.name.trim() : undefined
        } catch (error) {
          console.warn(`Error fetching user data for ${c.login}:`, error)
        }
      }),
    )

    // Keep owner first; sort rest by contributions desc
    const [first, ...rest] = list
    rest.sort((a, b) => b.contributions - a.contributions)
    return applyNameOverrides(first ? [first, ...rest] : rest)
  } catch {
    return []
  }
}

async function loadNameOverrides(): Promise<Record<string, string>> {
  try {
    const r = await fetch('/data/contributors.json', { cache: 'no-cache' })
    if (!r.ok) return {}
    const j = (await r.json()) as any
    if (j && typeof j === 'object') {
      if (j.displayNames && typeof j.displayNames === 'object') return j.displayNames as Record<string, string>
      return j as Record<string, string>
    }
    return {}
  } catch {
    return {}
  }
}

async function applyNameOverrides(list: GHContributor[]): Promise<GHContributor[]> {
  try {
    const map = await loadNameOverrides()
    if (!map || Object.keys(map).length === 0) return list
    return list.map((c) => ({ ...c, name: map[c.login] || c.name }))
  } catch {
    return list
  }
}

export async function getRepoInfo(): Promise<{ owner: string; repo: string; url: string } | null> {
  const cfg = await loadPublicConfig()
  const repoFull = cfg?.githubRepo || (import.meta as any).env?.VITE_GITHUB_REPO
  const p = parseRepo(repoFull)
  if (!p) return null
  return { owner: p.owner, repo: p.repo, url: `https://github.com/${p.owner}/${p.repo}` }
}
