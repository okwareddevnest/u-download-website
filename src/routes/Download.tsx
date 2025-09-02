import React from 'react'
import { detectPlatform } from '../lib/os'
import { loadReleases, pickBestAsset, formatAssetType, type Asset, type OS } from '../lib/releases'
import { OSIcon } from '../components/OSIcon'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type State = {
  loading: boolean
  error?: string
  assets: Asset[]
  latestVersion?: string
  latestDate?: string
  latestNotes?: string
  platform: OS
  selected?: Asset
}

export default function Download() {
  const initialPlatform = React.useMemo(() => detectPlatform().platform, [])
    const [state, setState] = React.useState<State>({
      loading: true,
      assets: [],
      platform: initialPlatform,
    })

  React.useEffect(() => {
    ;(async () => {
      try {
        const rel = await loadReleases()
        const latest = rel.releases.find((r) => r.version === rel.latest) || rel.releases[0]
        const assets = latest?.assets || []
        const { arch } = detectPlatform()
        const recommended = pickBestAsset(assets, state.platform, arch)
        setState((s) => ({
          ...s,
          loading: false,
          latestVersion: latest?.version,
          latestDate: latest?.date,
          latestNotes: latest?.notes,
          assets,
          selected: recommended,
        }))
      } catch (e: any) {
        setState((s) => ({ ...s, loading: false, error: e?.message || 'Failed to load releases' }))
      }
    })()
  }, [])

  const selectOS = (os: OS) => {
    const { arch } = detectPlatform()
    const sel = pickBestAsset(state.assets, os, arch)
    setState((s) => ({ ...s, platform: os, selected: sel }))
  }

  const download = async () => {
    if (!state.selected) return
    
    // Navigate to asset URL which triggers the browser download
    window.location.href = state.selected.url
  }

  return (
    <div className="container-app py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-100">Download U-Download</h1>
      <p className="mb-8 text-slate-300">
        Choose your operating system below. Latest version{' '}
        <span className="font-semibold text-slate-100">{state.latestVersion || '—'}</span>
        {/* total downloads removed */}
      </p>

      <div className="mb-6 flex gap-3">
        {(['windows', 'mac', 'linux'] as OS[]).map((os) => (
          <button
            key={os}
            onClick={() => selectOS(os)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              state.platform === os
                ? 'border-indigo-600 bg-indigo-600/10 text-indigo-300'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <OSIcon os={os} /> {os}
          </button>
        ))}
      </div>

      {state.loading && <div className="text-slate-300">Loading…</div>}
      {state.error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && (
        <div>
          {state.selected ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <div className="mb-2 text-sm uppercase tracking-wide text-slate-400">
                Recommended for {state.platform}
              </div>
              <div className="mb-4 text-xl font-semibold text-slate-100">
                {state.selected.filename}
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {state.latestVersion && <span>Version {state.latestVersion}</span>}
                {state.latestDate && <span>Released {new Date(state.latestDate).toDateString()}</span>}
                <span>Type: {formatAssetType(state.selected)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={download} className="btn-primary" aria-label="Download installer">
                  Download
                </button>
                <a
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  href={state.selected.url}
                  download
                >
                  Direct link
                </a>
              </div>
              {state.latestNotes && (
                <details className="mt-6 rounded-lg border border-slate-800 p-4">
                  <summary className="cursor-pointer select-none text-sm font-bold text-slate-100">Release notes</summary>
                  <article className="prose prose-invert max-w-none text-slate-300 prose-a:text-indigo-400 prose-code:text-slate-200 mt-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.latestNotes}</ReactMarkdown>
                  </article>
                </details>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-amber-800 bg-amber-950/40 p-4 text-amber-200">
              No installer for {state.platform}. Add assets to <code>public/downloads/</code> and update <code>public/data/releases.json</code>.
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">All assets</h2>
            <div className="grid gap-3">
              {state.assets.map((a) => (
                <div key={a.url} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/30 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <OSIcon os={a.os} />
                    <div>
                      <div className="font-medium text-slate-100">{a.filename}</div>
                      <div className="text-slate-400">{formatAssetType(a)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="btn-primary"
                      href={a.url}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
