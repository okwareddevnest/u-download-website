import React from 'react'
import { formatDownloadCount, useDownloadStats } from '../lib/downloads'

/**
 * Eases the displayed figure toward `target` so an update reads as a change
 * rather than a flicker.
 *
 * `active` gates the *first* value: until the real number arrives we must not
 * treat the placeholder as a starting point, or the figure would visibly count
 * up from zero on reveal. The first real value lands instantly; only later
 * changes are tweened.
 */
function useTweenedNumber(target: number, active: boolean): number {
  const [display, setDisplay] = React.useState(target)
  const fromRef = React.useRef(target)
  const seenRef = React.useRef(false)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!active) return
    if (!seenRef.current) {
      seenRef.current = true
      fromRef.current = target
      setDisplay(target)
      return
    }
    if (fromRef.current === target) return

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      fromRef.current = target
      setDisplay(target)
      return
    }

    const from = fromRef.current
    const delta = target - from
    const duration = 900
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + delta * eased)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      fromRef.current = target
    }
  }, [target, active])

  return display
}

type Props = {
  /** Word(s) after the figure. Kept in the component so the whole phrase can be omitted together. */
  label?: string
  className?: string
  /** Class for the numeral itself, so each placement can set its own weight/colour. */
  numberClassName?: string
  /**
   * Rendered immediately before the figure — a separator such as " · ".
   * It belongs to this component rather than the parent so that it disappears
   * along with the count; a separator left dangling in the sentence when the
   * number is unavailable is exactly the artefact this design avoids.
   */
  prefix?: React.ReactNode
}

/**
 * The download total, as running text.
 *
 * Renders `null` in every state that is not a real number — before the first
 * fetch resolves, and when the endpoint cannot give us one. Showing nothing is
 * correct here: a "0 downloads" or "NaN downloads" on a marketing page is worse
 * than an absent line, and the surrounding sentence is written to read fine
 * without it.
 */
export function DownloadCount({ label = 'downloads', className = '', numberClassName = '', prefix }: Props) {
  const state = useDownloadStats()
  const ready = state.status === 'ready'
  const total = ready ? state.stats.total : 0
  const display = useTweenedNumber(total, ready)

  // Replay the highlight whenever the settled figure changes. The key forces a
  // remount, which is the reliable way to restart a CSS animation; without it a
  // +1 update is a single digit flipping and is easy to miss entirely.
  const [tick, setTick] = React.useState(0)
  const prevRef = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (!ready) return
    if (prevRef.current !== null && prevRef.current !== total) setTick((t) => t + 1)
    prevRef.current = total
  }, [ready, total])

  if (!ready) return null

  const { partial, byOS } = state.stats
  const breakdown = byOS
    ? `Windows ${byOS.windows.toLocaleString('en-US')} · macOS ${byOS.mac.toLocaleString('en-US')} · Linux ${byOS.linux.toLocaleString('en-US')}`
    : ''
  const title = [breakdown, partial ? 'Partial — one source was unavailable, so this is a floor.' : '']
    .filter(Boolean)
    .join('\n')

  return (
    <span className={className} title={title || undefined}>
      {prefix}
      <span
        key={tick}
        // The highlight is reserved for genuine updates. On the first reveal
        // the figure is new content arriving, not a value that moved, so it
        // appears plainly rather than flashing on every page load.
        className={`${tick > 0 ? 'count-tick ' : ''}rounded px-0.5 ${numberClassName}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatDownloadCount(display)}
      </span>{' '}
      {label}
    </span>
  )
}
