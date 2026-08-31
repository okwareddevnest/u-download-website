// Fallback when neither GITHUB_REPO nor VITE_GITHUB_REPO is set in the
// deployment environment. Keep in sync with public/data/config.json —
// the client prefers this API, so an unset env var would otherwise 400
// and the site would show no releases at all.
const DEFAULT_REPO = 'DecodeDedan/U-Download'

export default async function handler(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    const includePre = url.searchParams.get('includePrereleases') === '1'
    const max = Math.max(1, Math.min(100, Number(url.searchParams.get('max') || 20)))

    const repoEnv = process.env.GITHUB_REPO_OVERRIDE || DEFAULT_REPO
    // Precedence deliberately favours the in-repo value. A stale GITHUB_REPO
    // left in the Vercel dashboard silently kept pointing this site at the
    // previous account after the app repo moved, and nothing in the codebase
    // could reveal it. GITHUB_REPO_OVERRIDE remains as an explicit escape
    // hatch; the ambient GITHUB_REPO no longer wins by accident.
    const token = process.env.GITHUB_TOKEN
    const repo = normalizeRepo(repoEnv)
    if (!repo) {
      send(res, 400, { error: 'Missing GITHUB_REPO env' })
      return
    }

    const headers = { Accept: 'application/vnd.github+json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=${max}`, { headers })
    if (!r.ok) {
      send(res, r.status, { error: 'GitHub fetch failed' })
      return
    }
    const arr = await r.json()
    const filtered = arr.filter((it) => !it.draft && (includePre ? true : !it.prerelease))
    const releases = filtered
      .map((json) => {
        const version = (json.tag_name || json.name || 'latest').replace(/^v/i, '')
        const date = json.published_at || json.created_at
        const notes = json.body || undefined
        const assets = (json.assets || [])
          .map((a) => {
            const meta = inferOSAndKindFromFilename(a.name)
            if (!meta) return null
            return {
              os: meta.os,
              kind: meta.kind,
              arch: meta.arch,
              filename: a.name,
              url: a.browser_download_url,
              sizeBytes: a.size,
            }
          })
          .filter(Boolean)
        return { version, date, notes, assets }
      })
      .filter((r) => r.assets && r.assets.length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (!releases.length) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=86400')
      send(res, 200, { latest: '', releases: [] })
      return
    }

    const latest = releases[0].version
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
    send(res, 200, { latest, releases })
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    send(res, 200, { latest: '', releases: [] })
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

function inferOSAndKindFromFilename(filename) {
  const f = filename.toLowerCase()
  const arch = /arm64|aarch64/.test(f) ? 'arm64' : /x64|x86_64|amd64/.test(f) ? 'x64' : undefined
  if (f.endsWith('.exe')) return { os: 'windows', kind: 'exe', arch }
  if (f.endsWith('.msi')) return { os: 'windows', kind: 'msi', arch }
  if (f.endsWith('.dmg')) return { os: 'mac', kind: 'dmg', arch }
  if (f.endsWith('.pkg')) return { os: 'mac', kind: 'pkg', arch }
  if (f.endsWith('.appimage')) return { os: 'linux', kind: 'appimage', arch }
  if (f.endsWith('.deb')) return { os: 'linux', kind: 'deb', arch }
  if (f.endsWith('.rpm')) return { os: 'linux', kind: 'rpm', arch }
  if (f.endsWith('.tar.gz') || f.endsWith('.tgz') || f.endsWith('.tar')) return { os: 'linux', kind: 'tar', arch }
  if (f.endsWith('.zip')) return { os: 'mac', kind: 'zip', arch }
  return null
}
