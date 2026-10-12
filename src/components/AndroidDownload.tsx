import React from 'react'
import { siAndroid } from 'simple-icons'
import {
  ANDROID_APK_URL,
  ANDROID_MIN_VERSION,
  formatSize,
  isAndroidDevice,
  loadAndroidRelease,
  type AndroidRelease,
} from '../lib/android'

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; release: AndroidRelease }
  | { phase: 'unreleased' }
  | { phase: 'error'; message: string }

export function AndroidIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill={`#${siAndroid.hex}`} d={siAndroid.path} />
    </svg>
  )
}

const STEPS = [
  'Download the APK on your phone.',
  'Open it. When Android asks, allow installs from your browser or Files app.',
  'In YouTube, tap Share → U-Download, then Download.',
]

/**
 * The Android download: one APK for every phone, behind a link that never
 * changes. On a computer it also shows a QR code to scan with the phone.
 */
export function AndroidDownload() {
  const [state, setState] = React.useState<State>({ phase: 'loading' })
  const onPhone = React.useMemo(isAndroidDevice, [])

  React.useEffect(() => {
    let cancelled = false
    loadAndroidRelease()
      .then((release) => {
        if (!cancelled) setState(release ? { phase: 'ready', release } : { phase: 'unreleased' })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ phase: 'error', message: e instanceof Error ? e.message : 'Could not load' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const release = state.phase === 'ready' ? state.release : null
  const size = formatSize(release?.sizeBytes)

  return (
    <section
      aria-labelledby="android-heading"
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400">
            <AndroidIcon className="h-5 w-5" /> Android {ANDROID_MIN_VERSION} and newer
          </div>
          <h2 id="android-heading" className="mb-2 text-xl font-semibold text-slate-100">
            U-Download for Android
          </h2>
          <p className="mb-4 text-slate-300">
            Share any YouTube video to U-Download and it saves straight to your phone, in the background, with the same
            fast engine as the desktop app.
          </p>

          {state.phase === 'loading' && <p className="text-slate-400">Checking the latest version…</p>}

          {state.phase === 'unreleased' && (
            <p className="rounded-lg border border-slate-700 p-3 text-slate-300">
              The Android app is on its way. Its first release will appear here.
            </p>
          )}

          {state.phase === 'error' && (
            <p className="mb-4 text-sm text-slate-400">
              Couldn’t check the version just now ({state.message}). The download link below still works.
            </p>
          )}

          {(release || state.phase === 'error') && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {release && <span>Version {release.version}</span>}
                {size && <span>{size}</span>}
                {release?.date && <span>Released {new Date(release.date).toDateString()}</span>}
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <a href={release?.url || ANDROID_APK_URL} className="btn-primary" aria-label="Download the Android APK">
                  Download APK
                </a>
                {release?.releaseUrl && (
                  <a
                    href={release.releaseUrl}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Release notes &amp; smaller builds
                  </a>
                )}
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
                {STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>

        {!onPhone && state.phase !== 'unreleased' && state.phase !== 'loading' && (
          <figure className="flex shrink-0 flex-col items-center gap-2">
            <img
              src="/images/android-qr.svg"
              alt="QR code linking to the U-Download Android APK"
              width={168}
              height={168}
              className="rounded-lg bg-white p-2"
            />
            <figcaption className="text-xs text-slate-400">Scan with your phone</figcaption>
          </figure>
        )}
      </div>
    </section>
  )
}
