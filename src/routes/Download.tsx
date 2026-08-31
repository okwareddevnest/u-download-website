import React from 'react'
import { detectPlatform, detectPlatformDetailed } from '../lib/os'
import {
  loadReleases,
  pickBestAsset,
  formatAssetType,
  formatArchLabel,
  availableArchs,
  resolveArch,
  type Arch,
  type Asset,
  type OS,
} from '../lib/releases'
import { OSIcon } from '../components/OSIcon'
import { DownloadCount } from '../components/DownloadCount'
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
  /** Detected architecture. `undefined` means detection was inconclusive. */
  arch?: Arch
  /** True once the visitor has picked an architecture themselves. */
  archChosen: boolean
}

export default function Download() {
  const initialPlatform = React.useMemo(() => detectPlatform().platform, [])
  const [state, setState] = React.useState<State>({
    loading: true,
    assets: [],
    platform: initialPlatform,
    archChosen: false,
  })

  React.useEffect(() => {
    ;(async () => {
      try {
        // Architecture detection is layered and partly async (client hints),
        // so it is resolved here rather than during the first render.
        const [rel, detected] = await Promise.all([loadReleases(), detectPlatformDetailed()])
        const latest = rel.releases.find((r) => r.version === rel.latest) || rel.releases[0]
        setState((s) => ({
          ...s,
          loading: false,
          latestVersion: latest?.version,
          latestDate: latest?.date,
          latestNotes: latest?.notes,
          assets: latest?.assets || [],
          platform: s.archChosen ? s.platform : detected.platform,
          arch: s.archChosen ? s.arch : detected.arch,
        }))
      } catch (e: any) {
        setState((s) => ({ ...s, loading: false, error: e?.message || 'Failed to load releases' }))
      }
    })()
  }, [])

  const { arch: effectiveArch, assumed } = resolveArch(state.platform, state.arch)
  const archOptions = availableArchs(state.assets, state.platform)
  const selected = React.useMemo(
    () => pickBestAsset(state.assets, state.platform, state.arch),
    [state.assets, state.platform, state.arch],
  )
  const otherArch = archOptions.find((a) => a !== effectiveArch)

  const selectOS = (os: OS) => setState((s) => ({ ...s, platform: os }))
  const selectArch = (arch: Arch) => setState((s) => ({ ...s, arch, archChosen: true }))

  const download = async () => {
    if (!selected) return

    // Navigate to asset URL which triggers the browser download
    window.location.href = selected.url
  }

  return (
    <div className="container-app py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-100">Download U-Download</h1>
      <p className="mb-8 text-slate-300">
        Choose your operating system below. Latest version{' '}
        <span className="font-semibold text-slate-100">{state.latestVersion || '—'}</span>
        {/* Sits in the running sentence directly above the OS picker and the
            Download button — the moment the figure is actually persuasive. */}
        <DownloadCount
          label="downloads to date"
          numberClassName="font-semibold text-slate-100"
          prefix={<span className="text-slate-500"> · </span>}
        />
      </p>

      <div className="mb-4 flex gap-3">
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

      {archOptions.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">Processor</span>
          {archOptions.map((a) => (
            <button
              key={a}
              onClick={() => selectArch(a)}
              aria-pressed={effectiveArch === a}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                effectiveArch === a
                  ? 'border-indigo-600 bg-indigo-600/10 text-indigo-300'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {formatArchLabel(state.platform, a)}
            </button>
          ))}
        </div>
      )}

      {state.loading && <div className="text-slate-300">Loading…</div>}
      {state.error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && (
        <div>
          {selected ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm">
              <div className="mb-2 text-sm uppercase tracking-wide text-slate-400">
                Recommended for {state.platform}
                {selected.arch && <> · {formatArchLabel(state.platform, selected.arch)}</>}
              </div>
              <div className="mb-4 text-xl font-semibold text-slate-100">{selected.filename}</div>
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {state.latestVersion && <span>Version {state.latestVersion}</span>}
                {state.latestDate && <span>Released {new Date(state.latestDate).toDateString()}</span>}
                <span>Type: {formatAssetType(selected)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={download} className="btn-primary" aria-label="Download installer">
                  Download
                </button>
                <a
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  href={selected.url}
                  download
                >
                  Direct link
                </a>
                {otherArch && (
                  <button
                    onClick={() => selectArch(otherArch)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    {formatArchLabel(state.platform, otherArch)} build
                  </button>
                )}
              </div>
              {assumed && otherArch && (
                <p className="mt-4 text-sm text-slate-500">
                  We couldn’t confirm your processor, so we’re showing the{' '}
                  {formatArchLabel(state.platform, effectiveArch)} build. If that’s wrong, pick{' '}
                  <button
                    onClick={() => selectArch(otherArch)}
                    className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                  >
                    {formatArchLabel(state.platform, otherArch)}
                  </button>{' '}
                  instead.
                </p>
              )}
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
                      <div className="text-slate-400">
                        {formatAssetType(a)}
                        {a.arch && <> · {formatArchLabel(a.os, a.arch)}</>}
                      </div>
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
