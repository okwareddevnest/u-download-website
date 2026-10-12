// Picks the newest Android release out of a GitHub releases payload.
// Private to the API (leading underscore: Vercel does not route it).

const TAG_PREFIX = 'android-v'
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

/** <0, 0 or >0 for two MAJOR.MINOR.PATCH strings already known to be valid. */
function compare(a, b) {
  const pa = SEMVER.exec(a)
  const pb = SEMVER.exec(b)
  for (let i = 1; i <= 3; i += 1) {
    const diff = Number(pa[i]) - Number(pb[i])
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * @param {unknown} releases parsed GET /repos/{repo}/releases
 * @param {string} repo "owner/name", for the permanent download link
 * @returns {null | {version: string, date: string, notes?: string, sizeBytes?: number, url: string, releaseUrl: string}}
 */
export function latestAndroidRelease(releases, repo) {
  if (!Array.isArray(releases)) return null
  const best = releases
    .filter((r) => r && !r.draft && !r.prerelease && typeof r.tag_name === 'string' && r.tag_name.startsWith(TAG_PREFIX))
    .map((r) => ({ release: r, version: r.tag_name.slice(TAG_PREFIX.length) }))
    .filter((r) => SEMVER.test(r.version))
    .reduce((acc, r) => (acc === null || compare(r.version, acc.version) > 0 ? r : acc), null)
  if (!best) return null

  const apkName = `U-Download-Android-${best.version}.apk`
  const apk = (best.release.assets || []).find((a) => a && a.name === apkName)
  return {
    version: best.version,
    date: best.release.published_at || best.release.created_at,
    notes: best.release.body || undefined,
    sizeBytes: apk ? apk.size : undefined,
    url: `https://github.com/${repo}/releases/download/android-latest/U-Download-Android.apk`,
    releaseUrl: best.release.html_url,
  }
}
