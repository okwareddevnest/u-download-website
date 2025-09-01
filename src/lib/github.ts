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
  const parts = full.split('/')
  if (parts.length !== 2) return null
  const [owner, repo] = parts
  if (!owner || !repo) return null
  return { owner, repo }
}

export async function loadContributors(): Promise<GHContributor[]> {
  const cfg = await loadPublicConfig()
  const repoFull = cfg?.githubRepo || (import.meta as any).env?.VITE_GITHUB_REPO
  const auth = (import.meta as any).env?.VITE_GITHUB_TOKEN as string | undefined
  const p = parseRepo(repoFull)
  if (!p) throw new Error('GitHub repo not configured')
  const { owner, repo } = p
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (auth) headers.Authorization = `Bearer ${auth}`

  // Fetch contributors list (max 100)
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, {
    headers,
  })
  if (!r.ok) {
    throw new Error('Failed to load contributors from GitHub')
  }
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

  // Optionally enrich names for top N to reduce API calls
  const top = list.slice(0, 20)
  await Promise.all(
    top.map(async (c) => {
      if (c.name) return
      try {
        const u = await fetch(`https://api.github.com/users/${c.login}`, { headers })
        if (!u.ok) return
        const j = await u.json()
        c.name = j.name || undefined
      } catch {
        // ignore
      }
    }),
  )

  // Keep owner first; sort rest by contributions desc
  const [first, ...rest] = list
  rest.sort((a, b) => b.contributions - a.contributions)
  return first ? [first, ...rest] : rest
}

