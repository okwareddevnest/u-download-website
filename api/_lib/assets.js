// Shared asset-filename classifier.
//
// Both /api/releases (which turns assets into download links) and
// /api/downloads (which buckets download counts per platform) need to map a
// release-asset filename onto an OS. Keeping one copy means the two endpoints
// can never disagree about what a `.AppImage` or an `aarch64.dmg` is.
//
// Files under api/_lib are not routed by Vercel (the leading underscore marks
// them as private), so this stays a plain module rather than an endpoint.

/**
 * @param {string} filename
 * @returns {{os: 'windows'|'mac'|'linux', kind: string, arch: 'x64'|'arm64'|undefined} | null}
 *   `null` when the extension is not a recognised installer (checksums,
 *   signatures, update manifests), so callers can decide whether to skip it.
 */
export function inferOSAndKindFromFilename(filename) {
  const f = String(filename || '').toLowerCase()
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

/** Shared by every endpoint that talks to the GitHub REST API. */
export function normalizeRepo(input) {
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
