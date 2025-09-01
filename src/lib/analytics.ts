// Serverless endpoint composes and scopes the namespace per host.

export async function getTotalDownloads(): Promise<number | null> {
  try {
    // Avoid hitting external service in local dev where API routes aren't available
    if (import.meta.env.DEV && location.hostname === 'localhost') return null
    const host = location.host || 'local'
    const r = await fetch(`/api/downloads?host=${encodeURIComponent(host)}`, { cache: 'no-store' })
    if (!r.ok) return null
    const d = await r.json()
    return typeof d.value === 'number' ? d.value : 0
  } catch {
    return null
  }
}

export async function incrementDownloads(delta = 1): Promise<number | null> {
  try {
    if (import.meta.env.DEV && location.hostname === 'localhost') return null
    const host = location.host || 'local'
    const r = await fetch(`/api/downloads?host=${encodeURIComponent(host)}&delta=${encodeURIComponent(delta)}`, { method: 'POST' })
    if (!r.ok) return null
    const d = await r.json()
    return typeof d.value === 'number' ? d.value : null
  } catch {
    return null
  }
}
