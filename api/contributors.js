export default async function handler(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    const includeBots = url.searchParams.get('includeBots') === '1' || url.searchParams.get('includeBots') === 'true'
    const repoEnv = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO
    const token = process.env.GITHUB_TOKEN
    const repo = normalizeRepo(repoEnv)
    if (!repo) {
      return send(res, 400, { error: 'Missing GITHUB_REPO env' })
    }
    const [owner, repoName] = repo.split('/')
    const headers = { Accept: 'application/vnd.github+json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const r = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=100`, { headers })
    if (!r.ok) {
      return send(res, r.status, { error: 'GitHub fetch failed' })
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
    send(res, 200, list)
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    send(res, 200, [])
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

function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}
