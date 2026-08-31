import { inferOSAndKindFromFilename, normalizeRepo } from './_lib/assets.js'

// The download total is the sum across BOTH accounts, and it has to be.
//
// GitHub counts `download_count` per release asset, per repository. The project
// moved accounts mid-life: okwareddevnest/U-Download holds essentially the whole
// real audience, DecodeDedan/U-Download is the current home and holds a handful.
// Reporting only the currently-configured repo would show single digits and
// misrepresent the project's actual reach, so this endpoint aggregates the set.
//
// Precedence matches /api/releases and /api/contributors: the in-repo value is
// authoritative, with one explicitly-named escape hatch. A stale GITHUB_REPO in
// the Vercel dashboard once silently repointed this site at the wrong account,
// so the ambient GITHUB_REPO is deliberately NOT consulted here — an env var
// meant for "which repo do we ship from" must not quietly shrink the historical
// download total.
const DEFAULT_REPOS = ['okwareddevnest/U-Download', 'DecodeDedan/U-Download']

/** Comma-separated "owner/repo" list. Only set this to deliberately re-scope the total. */
const REPOS_ENV = 'GITHUB_DOWNLOAD_REPOS'

// Cache window. Measured over this project's history the total moves roughly
// twice a day, so 30 minutes is already an order of magnitude fresher than the
// underlying data — there is nothing to gain from a tighter window and a real
// budget to lose. GitHub allows 60 requests/hour/IP unauthenticated and Vercel
// functions share egress IPs across every visitor, so the CDN is what keeps
// visitor traffic from multiplying into upstream calls: at 2 repos per
// revalidation and 2 revalidations/hour this costs ~4 of those 60 per region,
// no matter how many people are on the site. The long stale-while-revalidate
// then means a GitHub outage or a rate-limit blip serves the last good number
// for a day rather than blanking the counter.
const CACHE_OK = 's-maxage=1800, stale-while-revalidate=86400'
// A partial or empty result is cheap to retry and expensive to pin, so it is
// held for a minute instead of half an hour — a transient failure recovers on
// the next visitor rather than being frozen in the CDN.
const CACHE_DEGRADED = 's-maxage=60, stale-while-revalidate=86400'

export default async function handler(req, res) {
  try {
    const repos = parseRepoList(process.env[REPOS_ENV]) || DEFAULT_REPOS
    const token = process.env.GITHUB_TOKEN

    const headers = { Accept: 'application/vnd.github+json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const sources = await Promise.all(repos.map((repo) => fetchRepoDownloads(repo, headers)))

    const ok = sources.filter((s) => s.ok)
    const partial = ok.length !== sources.length

    if (ok.length === 0) {
      // Every source failed. Report an unknown total rather than a zero — a
      // confident "0 downloads" is a worse lie than showing nothing at all, and
      // the client renders nothing when total is null.
      res.setHeader('Cache-Control', CACHE_DEGRADED)
      send(res, 200, {
        total: null,
        byOS: null,
        partial: true,
        sources: sources.map(publicSource),
        updatedAt: new Date().toISOString(),
      })
      return
    }

    const total = ok.reduce((n, s) => n + s.total, 0)
    const byOS = { windows: 0, mac: 0, linux: 0, other: 0 }
    for (const s of ok) {
      for (const key of Object.keys(byOS)) byOS[key] += s.byOS[key]
    }

    res.setHeader('Cache-Control', partial ? CACHE_DEGRADED : CACHE_OK)
    send(res, 200, {
      total,
      byOS,
      // True when at least one repo could not be reached, so the number is a
      // floor rather than the real figure. The UI uses this to soften its claim
      // instead of hiding a count it does have.
      partial,
      sources: sources.map(publicSource),
      updatedAt: new Date().toISOString(),
    })
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    send(res, 200, { total: null, byOS: null, partial: true, sources: [], updatedAt: new Date().toISOString() })
  }
}

/**
 * One repo's contribution to the total. Never throws: a failure here must not
 * take down the other repo's count, so the outcome is reported in `ok`.
 */
async function fetchRepoDownloads(rawRepo, headers) {
  const repo = normalizeRepo(rawRepo)
  if (!repo) return { repo: String(rawRepo), ok: false, total: 0, byOS: emptyByOS(), error: 'invalid repo' }
  try {
    // 100 is the API maximum and comfortably above this project's release count,
    // so one request per repo covers the entire history. If a repo ever passes
    // 100 releases this silently starts undercounting the oldest ones, which is
    // why `releaseCount` is reported back — it is the tripwire.
    const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, { headers })
    if (!r.ok) {
      return {
        repo,
        ok: false,
        total: 0,
        byOS: emptyByOS(),
        error: r.status === 403 || r.status === 429 ? 'rate limited' : `http ${r.status}`,
      }
    }
    const arr = await r.json()
    if (!Array.isArray(arr)) return { repo, ok: false, total: 0, byOS: emptyByOS(), error: 'bad payload' }

    const byOS = emptyByOS()
    let total = 0
    for (const rel of arr) {
      // Drafts are invisible to the public and cannot have been downloaded by
      // anyone but a maintainer. Prereleases ARE counted: those are real
      // downloads by real users.
      if (!rel || rel.draft) continue
      for (const a of rel.assets || []) {
        const n = Number(a && a.download_count)
        if (!Number.isFinite(n) || n < 0) continue
        total += n
        const meta = inferOSAndKindFromFilename(a.name)
        // Unrecognised extensions (checksums, .sig files, update manifests) are
        // bucketed rather than dropped, so byOS always sums back to total.
        byOS[meta ? meta.os : 'other'] += n
      }
    }
    return { repo, ok: true, total, byOS, releaseCount: arr.length }
  } catch (e) {
    return { repo, ok: false, total: 0, byOS: emptyByOS(), error: 'fetch failed' }
  }
}

function emptyByOS() {
  return { windows: 0, mac: 0, linux: 0, other: 0 }
}

/** What we are willing to say publicly about each source. */
function publicSource(s) {
  return { repo: s.repo, ok: s.ok, total: s.ok ? s.total : null, error: s.ok ? undefined : s.error }
}

function parseRepoList(input) {
  if (!input) return null
  const list = String(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length ? list : null
}

function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}
