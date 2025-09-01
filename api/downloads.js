export default async function handler(req, res) {
  try {
    const url = new URL(req.url || '/', 'http://localhost')
    const host = url.searchParams.get('host') || req.headers['x-forwarded-host'] || req.headers.host || 'local'
    const deltaParam = url.searchParams.get('delta')
    const delta = deltaParam != null ? Number(deltaParam) || 0 : 0
    const key = ns(String(host))

    if ((req.method || 'GET').toUpperCase() === 'POST') {
      let value = null
      try {
        const r = await fetch(`https://api.countapi.xyz/update/${key}/total-downloads?amount=${delta}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const d = await r.json().catch(() => ({}))
        if (typeof d.value === 'number') value = d.value
      } catch {}
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ value }))
      return
    }

    // GET: fetch value; treat missing key as 0 with 200 to show the pill
    let value = 0
    try {
      const r = await fetch(`https://api.countapi.xyz/get/${key}/total-downloads`)
      const d = await r.json().catch(() => ({}))
      if (typeof d.value === 'number') value = d.value
    } catch {}
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify({ value }))
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify({ value: 0 }))
  }
}

const NAMESPACE = 'u-download'
function ns(host) {
  return `${NAMESPACE}-${String(host).replace(/[:/.]/g, '-')}`
}
