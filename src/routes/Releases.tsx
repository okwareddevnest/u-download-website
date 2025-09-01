import React from 'react'
import { loadReleases, type Release } from '../lib/releases'

export default function Releases() {
  const [releases, setReleases] = React.useState<Release[]>([])
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    ;(async () => {
      try {
        const d = await loadReleases()
        setReleases(d.releases)
      } catch (e: any) {
        setError(e?.message || 'Failed to load releases')
      }
    })()
  }, [])

  if (error) return <div className="container-app py-10 text-rose-400">{error}</div>

  return (
    <div className="container-app py-10">
      <h1 className="mb-6 text-3xl font-bold text-slate-100">Release Notes</h1>
      <div className="space-y-8">
        {releases.map((r) => (
          <div key={r.version} className="rounded-xl border border-slate-800 p-6">
            <div className="mb-1 text-sm text-slate-400">{new Date(r.date).toDateString()}</div>
            <div className="mb-3 text-xl font-semibold text-slate-100">v{r.version}</div>
            {r.notes ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-300">{r.notes}</pre>
            ) : (
              <div className="text-slate-300">No notes provided.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
