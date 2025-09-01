import React from 'react'
import { loadContributors, type GHContributor } from '../lib/github'

export default function Contributors() {
  const [list, setList] = React.useState<GHContributor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const c = await loadContributors()
        if (!alive) return
        setList(c)
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Failed to load contributors')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="container-app py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-100">Project Contributors</h1>
      <p className="mb-8 text-slate-300">This project is made possible by the generous contributions of our community.</p>

      {loading && <div className="text-slate-300">Loading…</div>}
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <a
              key={c.login}
              href={c.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 rounded-xl border border-slate-800 p-4 hover:border-indigo-600/60 hover:bg-slate-900/40 ${
                c.isOwner ? 'ring-1 ring-indigo-600/40' : ''
              }`}
              title={c.isOwner ? 'Repository Owner' : undefined}
            >
              <img
                src={c.avatarUrl}
                alt={`@${c.login}`}
                className="h-12 w-12 rounded-full border border-slate-700"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-100">
                  {c.name || c.login}
                  {c.isOwner && <span className="ml-2 rounded bg-indigo-600/20 px-2 py-0.5 text-xs text-indigo-300">Owner</span>}
                </div>
                <div className="truncate text-sm text-slate-400">@{c.login}</div>
                <div className="text-xs text-slate-500">{c.contributions} contributions</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

