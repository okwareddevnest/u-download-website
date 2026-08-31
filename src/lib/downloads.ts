import React from 'react'

/**
 * Total installer downloads, aggregated across both GitHub accounts by
 * /api/downloads.
 *
 * This is a module-level singleton rather than per-component state on purpose:
 * the figure appears in more than one place (the home hero and the download
 * page), and every mount must share one fetch and one timer. Two components
 * each running their own poll would double the load on an endpoint whose whole
 * design goal is to stay well inside GitHub's rate limit.
 */

export type DownloadsByOS = {
  windows: number
  mac: number
  linux: number
  other: number
}

export type DownloadStats = {
  /** `null` means "we could not determine this" — never conflate it with zero. */
  total: number | null
  byOS: DownloadsByOS | null
  /** True when at least one source repo failed, so `total` is a floor. */
  partial: boolean
  updatedAt?: string
}

export type DownloadsState =
  /** No answer yet. Render nothing — not a zero, not a NaN. */
  | { status: 'loading' }
  | { status: 'ready'; stats: DownloadStats & { total: number } }
  /** Endpoint failed, or reported an unknown total. The UI omits the figure. */
  | { status: 'unavailable' }

/**
 * How often we re-ask while the tab is visible.
 *
 * The counter is polled, not pushed — GitHub offers no subscription for asset
 * download counts and updates them with its own lag, so "live" here honestly
 * means "recent". Five minutes is chosen against the CDN, not against the data:
 * /api/downloads is cached for 30 minutes, so most of these polls are served
 * from the edge and cost GitHub nothing, while still catching a new number
 * within minutes of the cache turning over.
 */
const POLL_MS = 5 * 60 * 1000

/**
 * If a tab sat hidden for longer than this, refetch the moment it comes back
 * rather than waiting out the remaining interval — returning to a stale tab is
 * exactly when the number is most likely to have moved.
 */
const STALE_MS = POLL_MS

let state: DownloadsState = { status: 'loading' }
const subscribers = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null
let lastFetchAt = 0
let inFlight = false
let visibilityBound = false

function setState(next: DownloadsState) {
  state = next
  for (const fn of subscribers) fn()
}

function getSnapshot(): DownloadsState {
  return state
}

async function fetchStats() {
  if (inFlight) return
  inFlight = true
  try {
    const r = await fetch('/api/downloads', { cache: 'no-cache' })
    if (!r.ok) throw new Error(`http ${r.status}`)
    const j = (await r.json()) as Partial<DownloadStats>
    const total = typeof j.total === 'number' && Number.isFinite(j.total) ? j.total : null
    lastFetchAt = Date.now()
    if (total === null) {
      // Endpoint answered but has no number for us. Keep any figure we already
      // showed — a counter that blinks out on one bad response is worse than a
      // slightly stale one.
      if (state.status !== 'ready') setState({ status: 'unavailable' })
      return
    }
    setState({
      status: 'ready',
      stats: {
        total,
        byOS: j.byOS ?? null,
        partial: Boolean(j.partial),
        updatedAt: j.updatedAt,
      },
    })
  } catch {
    lastFetchAt = Date.now()
    // Same rule on a transport failure: only degrade if we never had a number.
    if (state.status !== 'ready') setState({ status: 'unavailable' })
  } finally {
    inFlight = false
  }
}

function isVisible() {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

function startTimer() {
  if (timer !== null) return
  timer = setInterval(() => {
    if (isVisible()) void fetchStats()
  }, POLL_MS)
}

function stopTimer() {
  if (timer === null) return
  clearInterval(timer)
  timer = null
}

function onVisibilityChange() {
  if (subscribers.size === 0) return
  if (isVisible()) {
    // Back in view: resume, and catch up immediately if we drifted.
    startTimer()
    if (Date.now() - lastFetchAt >= STALE_MS) void fetchStats()
  } else {
    // Hidden: stop entirely. A background tab polling for a number that moves
    // about twice a day is pure waste — of the visitor's battery and of the
    // shared GitHub rate limit.
    stopTimer()
  }
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn)
  if (subscribers.size === 1) {
    if (!visibilityBound && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
      visibilityBound = true
    }
    if (isVisible()) {
      void fetchStats()
      startTimer()
    }
  }
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) stopTimer()
  }
}

/**
 * Readable magnitude, consistent everywhere the figure appears:
 *   581 -> "581", 1240 -> "1,240", 12400 -> "12.4k", 10000 -> "10k", 2400000 -> "2.4M"
 * Grouped digits stay exact up to five figures, which is where an exact count
 * stops being something a reader can hold anyway.
 */
export function formatDownloadCount(n: number): string {
  if (!Number.isFinite(n)) return ''
  const v = Math.max(0, Math.round(n))
  if (v < 10000) return v.toLocaleString('en-US')
  // 999_950 rather than 1_000_000: above it the one-decimal 'k' form rounds to
  // "1000k", which should read "1M".
  if (v < 999950) return compact(v / 1000, 'k')
  return compact(v / 1000000, 'M')
}

function compact(value: number, suffix: string): string {
  const s = value.toFixed(1)
  return `${s.endsWith('.0') ? s.slice(0, -2) : s}${suffix}`
}

/**
 * Subscribe a component to the shared store.
 *
 * Lives here rather than beside the component so that DownloadCount.tsx exports
 * a component and nothing else, which is what react-refresh requires to hot
 * reload it correctly.
 */
export function useDownloadStats(): DownloadsState {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
