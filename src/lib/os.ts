export type Platform = 'windows' | 'mac' | 'linux'
export type Arch = 'x64' | 'arm64' | 'universal'

export function detectPlatform(): { platform: Platform; arch: Arch | undefined } {
  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const navUAData: any = (navigator as any).userAgentData

  const isWindows = /Win/i.test(ua) || /Win/i.test(platform)
  const isMac = /Mac/i.test(ua) || /Mac/i.test(platform)

  let arch: Arch | undefined
  if (navUAData?.getHighEntropyValues) {
    // Chromium-based
    try {
      // We cannot await here, so check brands quickly
      const brands = navUAData.brands?.map((b: any) => b.brand).join(',') || ''
      if (brands) {
        // no-op, but kept for completeness
      }
    } catch {}
  }
  if (/ARM64|AArch64|arm64/i.test(ua)) arch = 'arm64'
  else if (/x64|x86_64|Win64|WOW64|amd64/i.test(ua)) arch = 'x64'

  let platformName: Platform = isWindows ? 'windows' : isMac ? 'mac' : 'linux'
  return { platform: platformName, arch }
}
