// The Android app: its own version line (android-vX.Y.Z tags) and one fixed
// download link that always serves the newest APK.

export const ANDROID_MIN_VERSION = '7.0'

export type AndroidRelease = {
  version: string
  date?: string
  notes?: string
  sizeBytes?: number
  url: string
  releaseUrl?: string
}

const REPO = 'DecodeDedan/U-Download'
export const ANDROID_APK_URL = `https://github.com/${REPO}/releases/download/android-latest/U-Download-Android.apk`

const TAG_PREFIX = 'android-v'
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

type GitHubRelease = {
  tag_name?: string
  draft?: boolean
  prerelease?: boolean
  html_url?: string
  published_at?: string
  created_at?: string
  body?: string
  assets?: { name?: string; size?: number }[]
}

function compare(a: string, b: string): number {
  const pa = SEMVER.exec(a)!
  const pb = SEMVER.exec(b)!
  for (let i = 1; i <= 3; i += 1) {
    const diff = Number(pa[i]) - Number(pb[i])
    if (diff !== 0) return diff
  }
  return 0
}

/** Mirrors api/_lib/android.js, for when the site runs without the API (vite dev). */
function pickFromGitHub(releases: unknown): AndroidRelease | null {
  if (!Array.isArray(releases)) return null
  let best: { release: GitHubRelease; version: string } | null = null
  for (const release of releases as GitHubRelease[]) {
    const tag = release?.tag_name
    if (!tag || release.draft || release.prerelease || !tag.startsWith(TAG_PREFIX)) continue
    const version = tag.slice(TAG_PREFIX.length)
    if (!SEMVER.test(version)) continue
    if (!best || compare(version, best.version) > 0) best = { release, version }
  }
  if (!best) return null
  const apk = best.release.assets?.find((a) => a?.name === `U-Download-Android-${best.version}.apk`)
  return {
    version: best.version,
    date: best.release.published_at || best.release.created_at,
    notes: best.release.body || undefined,
    sizeBytes: apk?.size,
    url: ANDROID_APK_URL,
    releaseUrl: best.release.html_url,
  }
}

/** `null` until the first Android release is published. */
export async function loadAndroidRelease(): Promise<AndroidRelease | null> {
  try {
    const r = await fetch('/api/android', { cache: 'no-cache' })
    const type = r.headers.get('content-type') || ''
    if (r.ok && type.includes('application/json')) {
      const data = (await r.json()) as Partial<AndroidRelease>
      return data.version ? (data as AndroidRelease) : null
    }
  } catch {
    // No serverless API (local dev): fall through to GitHub directly.
  }
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=50`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!r.ok) throw new Error(`GitHub answered ${r.status}`)
  return pickFromGitHub(await r.json())
}

export function isAndroidDevice(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')
}

export function formatSize(bytes?: number): string | null {
  if (!bytes) return null
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}
