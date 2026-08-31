export type Platform = 'windows' | 'mac' | 'linux'
export type Arch = 'x64' | 'arm64' | 'universal'

/** Which detection layer produced the architecture, or 'unknown' if none could. */
export type ArchSource = 'client-hints' | 'webgl' | 'user-agent' | 'unknown'

export type PlatformInfo = {
  platform: Platform
  /** `undefined` means "inconclusive" — never silently treat it as x64. */
  arch: Arch | undefined
  archSource: ArchSource
}

function detectOS(): Platform {
  const ua = navigator.userAgent || ''
  // navigator.platform is deprecated but still the most reliable macOS signal in Safari.
  const platform = (navigator as Navigator & { platform?: string }).platform || ''
  const isWindows = /Win/i.test(ua) || /Win/i.test(platform)
  const isMac = /Mac/i.test(ua) || /Mac/i.test(platform)
  return isWindows ? 'windows' : isMac ? 'mac' : 'linux'
}

/**
 * Layer 3 — user-agent string.
 * Works for Windows on ARM and most Linux UAs. Never fires on Apple Silicon:
 * Safari and Chrome both report `MacIntel` with no ARM marker anywhere in the UA.
 */
function archFromUserAgent(ua: string): Arch | undefined {
  if (/ARM64|AArch64|arm64/i.test(ua)) return 'arm64'
  if (/x64|x86_64|Win64|WOW64|amd64/i.test(ua)) return 'x64'
  return undefined
}

/**
 * Layer 2 — WebGL renderer string. This is the only fallback that works in
 * Safari, which has no `navigator.userAgentData`. Apple Silicon reports a
 * renderer containing "Apple" (e.g. "Apple GPU", "Apple M1 Pro", or
 * "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, …)"); Intel Macs report
 * Intel / AMD / Radeon / NVIDIA.
 *
 * Only consulted on macOS: on Windows and Linux the GPU vendor says nothing
 * useful about the CPU architecture.
 *
 * Must never throw — the debug-renderer extension can be absent, disabled by
 * privacy settings, or the context creation itself can fail.
 */
function archFromWebGL(): Arch | undefined {
  if (typeof document === 'undefined') return undefined
  let gl: WebGLRenderingContext | null = null
  try {
    const canvas = document.createElement('canvas')
    gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return undefined

    let renderer = ''
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as { UNMASKED_RENDERER_WEBGL: number } | null
    if (debugInfo) {
      renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
    }
    // Newer Safari exposes a useful RENDERER without the extension.
    if (!renderer) renderer = String(gl.getParameter(gl.RENDERER) || '')
    if (!renderer) return undefined

    const r = renderer.toLowerCase()
    // Check x86 vendors first: Chrome on an Intel Mac reports
    // "ANGLE (Intel Inc., …)", which must not be mistaken for Apple Silicon.
    if (/intel|amd|radeon|nvidia|geforce/.test(r)) return 'x64'
    if (/apple/.test(r)) return 'arm64'
    return undefined
  } catch {
    return undefined
  } finally {
    try {
      const lose = gl?.getExtension('WEBGL_lose_context') as { loseContext: () => void } | null
      lose?.loseContext()
    } catch {
      /* nothing to clean up */
    }
  }
}

type UADataValues = { architecture?: string; bitness?: string }
type NavigatorUAData = {
  getHighEntropyValues?: (hints: string[]) => Promise<UADataValues>
}

/**
 * Layer 1 — User-Agent Client Hints. Chromium only, but authoritative there:
 * returns architecture "arm" on Apple Silicon and on Windows on ARM.
 * Asynchronous, which is why the synchronous `detectPlatform()` can never see it.
 */
async function archFromClientHints(): Promise<Arch | undefined> {
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData
  if (!uaData?.getHighEntropyValues) return undefined
  try {
    const values = await uaData.getHighEntropyValues(['architecture', 'bitness'])
    const architecture = (values?.architecture || '').toLowerCase()
    const bitness = String(values?.bitness || '')
    if (!architecture) return undefined
    if (architecture === 'arm' || architecture === 'arm64') {
      return bitness === '32' ? undefined : 'arm64'
    }
    if (architecture === 'x86' || architecture === 'x86_64') {
      return bitness === '32' ? undefined : 'x64'
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Synchronous detection. Uses the two layers that are available synchronously
 * (WebGL on macOS, then the UA string). Kept for callers that need an
 * immediate answer for first paint; prefer `detectPlatformDetailed()`.
 */
export function detectPlatform(): { platform: Platform; arch: Arch | undefined } {
  const platform = detectOS()
  const arch = (platform === 'mac' ? archFromWebGL() : undefined) ?? archFromUserAgent(navigator.userAgent || '')
  return { platform, arch }
}

/**
 * Full layered detection: client hints → WebGL (macOS) → UA string.
 * `arch` is left `undefined` when every layer is inconclusive; the caller is
 * responsible for applying a per-OS default and telling the user it did so.
 */
export async function detectPlatformDetailed(): Promise<PlatformInfo> {
  const platform = detectOS()

  const hinted = await archFromClientHints()
  if (hinted) return { platform, arch: hinted, archSource: 'client-hints' }

  if (platform === 'mac') {
    const gpu = archFromWebGL()
    if (gpu) return { platform, arch: gpu, archSource: 'webgl' }
  }

  const fromUA = archFromUserAgent(navigator.userAgent || '')
  if (fromUA) return { platform, arch: fromUA, archSource: 'user-agent' }

  return { platform, arch: undefined, archSource: 'unknown' }
}
