export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost')
    const host = url.searchParams.get('host') || req.headers['x-forwarded-host'] || req.headers.host || 'local'
    const deltaParam = url.searchParams.get('delta')
    const delta = deltaParam != null ? Number(deltaParam) || 0 : 0
    const key = ns(String(host))

    if (req.method === 'POST') {
      const r = await fetch(`https://api.countapi.xyz/update/${key}/total-downloads?amount=${delta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const d = await r.json().catch(() => ({}))
      res.setHeader('Cache-Control', 'no-store')
      res.status(r.status).json({ value: d.value ?? null })
      return
    }

    // GET: fetch value; treat missing key as 0 with 200 to show the pill
    const r = await fetch(`https://api.countapi.xyz/get/${key}/total-downloads`)
    let value = 0
    try {
      const d = await r.json()
      if (typeof d.value === 'number') value = d.value
    } catch {}
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ value })
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    res.status(500).json({ value: null })
  }
}

const NAMESPACE = 'u-download'
function ns(host) {
  return `${NAMESPACE}-${String(host).replace(/[:/.]/g, '-')}`
}
