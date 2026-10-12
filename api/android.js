import { normalizeRepo } from './_lib/assets.js'
import { latestAndroidRelease } from './_lib/android.js'

// The Android app ships on its own version line and tags (android-vX.Y.Z),
// apart from the desktop releases /api/releases serves. Its download link is
// fixed — the `android-latest` release always carries the newest APK — so this
// endpoint only reports what that link currently serves.
const DEFAULT_REPO = 'DecodeDedan/U-Download'

const CACHE_OK = 's-maxage=1800, stale-while-revalidate=86400'
// "Not released yet" or an upstream failure: cheap to retry, so not pinned.
const CACHE_EMPTY = 's-maxage=60, stale-while-revalidate=86400'

export default async function handler(req, res) {
  try {
    const repo = normalizeRepo(process.env.GITHUB_REPO_OVERRIDE || DEFAULT_REPO)
    if (!repo) {
      send(res, 400, { error: 'Missing repository' })
      return
    }
    const headers = { Accept: 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

    const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=50`, { headers })
    if (!r.ok) {
      res.setHeader('Cache-Control', CACHE_EMPTY)
      send(res, 200, { version: '' })
      return
    }
    const latest = latestAndroidRelease(await r.json(), repo)
    res.setHeader('Cache-Control', latest ? CACHE_OK : CACHE_EMPTY)
    send(res, 200, latest || { version: '' })
  } catch (e) {
    console.error('android release lookup failed', e)
    res.setHeader('Cache-Control', 'no-store')
    send(res, 200, { version: '' })
  }
}

function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}
