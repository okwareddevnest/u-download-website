const NAMESPACE = 'u-download'

function ns(host: string) {
  // Scope counts per host to avoid collisions across environments
  return `${NAMESPACE}-${host.replace(/[:/.]/g, '-')}`
}

export async function getTotalDownloads(): Promise<number | null> {
  try {
    if (import.meta.env.DEV || location.hostname === 'localhost') return null
    const host = location.host || 'local'
    const r = await fetch(`https://api.countapi.xyz/get/${ns(host)}/total-downloads`)
    const d = await r.json()
    return typeof d.value === 'number' ? d.value : 0
  } catch {
    return null
  }
}

export async function incrementDownloads(delta = 1): Promise<number | null> {
  try {
    if (import.meta.env.DEV || location.hostname === 'localhost') return null
    const host = location.host || 'local'
    const r = await fetch(
      `https://api.countapi.xyz/update/${ns(host)}/total-downloads/?amount=${delta}`,
      { method: 'POST', mode: 'cors', keepalive: true },
    )
    const d = await r.json()
    return typeof d.value === 'number' ? d.value : null
  } catch {
    return null
  }
}
