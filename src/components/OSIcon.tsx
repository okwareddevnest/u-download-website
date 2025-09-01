export type OS = 'windows' | 'mac' | 'linux'

export function OSIcon({ os, className = 'h-6 w-6' }: { os: OS; className?: string }) {
  if (os === 'windows')
    return (
      <svg className={className} viewBox="0 0 48 48" fill="currentColor" aria-hidden>
        <path d="M3 7l18-3v19H3V7zm0 34l18 3V25H3v16zM27 4l18-3v22H27V4zm0 40l18 3V25H27v19z" />
      </svg>
    )
  if (os === 'mac')
    return (
      <svg className={className} viewBox="0 0 48 48" fill="currentColor" aria-hidden>
        <path d="M33.5 25.3c-.1-4 3.4-6.1 3.5-6.2-1.9-2.8-4.8-3.2-5.8-3.3-2.5-.3-4.8 1.5-6.1 1.5-1.3 0-3.2-1.5-5.2-1.5-2.7 0-5.2 1.6-6.6 4.1-2.8 4.8-.7 11.8 2 15.7 1.4 2 3 4.2 5.2 4.1 2.1-.1 2.9-1.3 5.3-1.3s3.1 1.3 5.2 1.3c2.2 0 3.6-2 5-4 1.6-2.4 2.2-4.8 2.2-4.9-.1-.1-4.1-1.6-4.3-5.5z" />
        <path d="M29.6 12.4c1.1-1.4 1.9-3.3 1.7-5.3-1.6.1-3.6 1.1-4.8 2.5-1.1 1.3-2 3.2-1.8 5.1 1.9.1 3.9-1 4.9-2.3z" />
      </svg>
    )
  return (
    <svg className={className} viewBox="0 0 48 48" fill="currentColor" aria-hidden>
      <path d="M24 3l19 11v20L24 45 5 34V14L24 3zm0 4.6L9 15v18l15 8.4L39 33V15L24 7.6z" />
    </svg>
  )
}
