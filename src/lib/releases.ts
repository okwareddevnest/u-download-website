export type OS = 'windows' | 'mac' | 'linux'
export type Arch = 'x64' | 'arm64' | 'universal'

export type Asset = {
  os: OS
  arch?: Arch
  kind?: 'exe' | 'msi' | 'dmg' | 'zip' | 'appimage' | 'deb' | 'rpm' | 'pkg' | 'tar' | 'other'
  url: string // absolute or relative url
  filename: string
  sizeBytes?: number
  sha256?: string
  signatureUrl?: string
}

export type Release = {
  version: string
  date: string
  notes?: string
  assets: Asset[]
}

export type ReleasesFile = {
  latest: string
  releases: Release[]
}

type PublicConfig = { githubRepo?: string }

async function loadConfig(): Promise<PublicConfig | null> {
  try {
    const r = await fetch('/data/config.json', { cache: 'no-cache' })
    if (!r.ok) return null
    return (await r.json()) as PublicConfig
  } catch {
    return null
  }
}

function inferOSAndKindFromFilename(filename: string): Pick<Asset, 'os' | 'kind' | 'arch'> | null {
  const f = filename.toLowerCase()
  const arch: Arch | undefined = /arm64|aarch64/.test(f) ? 'arm64' : /x64|x86_64|amd64/.test(f) ? 'x64' : undefined
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

async function fetchLatestFromGitHub(repoFull: string, token?: string): Promise<ReleasesFile | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    }
    if (token) headers.Authorization = `Bearer ${token}`
    const latest = await fetch(`https://api.github.com/repos/${repoFull}/releases/latest`, { headers })
    if (!latest.ok) return null
    const json = await latest.json()
    const version: string = json.tag_name?.replace(/^v/i, '') || json.name || 'latest'
    const date: string = json.published_at || new Date().toISOString()
    const notes: string | undefined = json.body || undefined
    const assets: Asset[] = (json.assets as any[])
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
        } as Asset
      })
      .filter(Boolean) as Asset[]

    if (assets.length === 0) return null
    const rel: Release = { version, date, notes, assets }
    return { latest: version, releases: [rel] }
  } catch {
    return null
  }
}

export async function loadReleases(): Promise<ReleasesFile> {
  // Try GitHub first if configured
  const cfg = await loadConfig()
  const repo = cfg?.githubRepo || import.meta.env.VITE_GITHUB_REPO
  const ghToken = import.meta.env.VITE_GITHUB_TOKEN as string | undefined
  if (repo) {
    const gh = await fetchLatestFromGitHub(repo, ghToken)
    if (gh) return gh
  }
  // Fallback to static manifest
  const res = await fetch('/data/releases.json', { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error('Failed to load releases manifest (missing /data/releases.json)')
  }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    // SPA hosts may return index.html with 200; explain clearly
    const text = await res.text()
    if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
      throw new Error('Expected JSON at /data/releases.json but received HTML. Ensure the file exists in public/data/')
    }
    throw new Error('Invalid releases manifest content-type; expected JSON')
  }
  const data: ReleasesFile = await res.json()
  return data
}

export function pickBestAsset(assets: Asset[], os: OS, arch: Arch | undefined): Asset | undefined {
  const candidates = assets.filter((a) => a.os === os)
  if (!candidates.length) return undefined
  // Prefer universal over exact arch
  const archPref = arch === 'arm64' ? ['arm64', 'universal', 'x64'] : ['x64', 'universal', 'arm64']
  const kindPref: Asset['kind'][] =
    os === 'windows'
      ? ['exe', 'msi']
      : os === 'mac'
        ? ['dmg', 'pkg']
        : ['deb', 'rpm', 'appimage', 'tar', 'other']
  return candidates
    .sort((a, b) => archPref.indexOf(a.arch || 'universal') - archPref.indexOf(b.arch || 'universal'))
    .sort((a, b) => kindPref.indexOf(a.kind || 'other') - kindPref.indexOf(b.kind || 'other'))[0]
}

export async function computeSha256(url: string): Promise<string> {
  const r = await fetch(url)
  const buf = await r.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buf)
  const bytes = Array.from(new Uint8Array(hash))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function formatAssetType(a: Asset): string {
  const kind = a.kind
  switch (a.os) {
    case 'windows':
      if (kind === 'exe') return 'Windows Installer (.exe)'
      if (kind === 'msi') return 'Windows Installer (.msi)'
      return 'Windows Installer'
    case 'mac':
      if (kind === 'dmg') return 'macOS Disk Image (.dmg)'
      if (kind === 'pkg') return 'macOS Installer (.pkg)'
      if (kind === 'zip') return 'macOS ZIP Archive (.zip)'
      return 'macOS Package'
    case 'linux':
      if (kind === 'appimage') return 'Linux AppImage (.AppImage)'
      if (kind === 'deb') return 'Debian Package (.deb)'
      if (kind === 'rpm') return 'RPM Package (.rpm)'
      if (kind === 'tar') return 'Linux Tarball (.tar.gz)'
      return 'Linux Package'
    default:
      return 'Installer'
  }
}
