export default async function handler(req, res) {
  try {
    const repoEnv = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO
    const token = process.env.GITHUB_TOKEN
    const includeBots = req.query && (req.query.includeBots === '1' || req.query.includeBots === 'true')
    const repo = normalizeRepo(repoEnv)
    if (!repo) {
      res.statusCode = 400
      res.json({ error: 'Missing GITHUB_REPO env' })
      return
    }
    const [owner, repoName] = repo.split('/')
    const headers = { Accept: 'application/vnd.github+json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const r = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=100`, { headers })
    if (!r.ok) {
      res.statusCode = r.status
      res.setHeader('Cache-Control', 'no-store')
      res.json({ error: 'GitHub fetch failed' })
      return
    }
    const arr = await r.json()
    const base = arr
      .filter((c) => (includeBots ? true : c.type !== 'Bot'))
      .map((c) => ({
        login: c.login,
        name: undefined,
        avatarUrl: c.avatar_url,
        htmlUrl: c.html_url,
        contributions: Number(c.contributions) || 0,
        isOwner: c.login === owner,
      }))

    // ensure owner first
    let list = base
    const ownerIdx = list.findIndex((c) => c.login === owner)
    if (ownerIdx > -1) {
      const [own] = list.splice(ownerIdx, 1)
      own.isOwner = true
      list.unshift(own)
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
    res.json(list)
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Cache-Control', 'no-store')
    res.json({ error: 'Internal error' })
  }
}

function normalizeRepo(input) {
  if (!input) return null
  const cleaned = String(input).trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
  const parts = cleaned.split('/')
  const ghIdx = parts.indexOf('github.com')
  if (ghIdx !== -1) {
    const owner = parts[ghIdx + 1]
    const repo = parts[ghIdx + 2]
    if (owner && repo) return `${owner}/${repo}`
    return null
  }
  const [owner, repo] = cleaned.split('/')
  if (!owner || !repo) return null
  return `${owner}/${repo}`
}

