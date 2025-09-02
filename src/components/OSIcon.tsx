export type OS = 'windows' | 'mac' | 'linux'

export function OSIcon({ os, className = 'h-6 w-6' }: { os: OS; className?: string }) {
  if (os === 'windows')
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden>
        {/* Windows blue */}
        <path fill="#0078D6" d="M3 7l18-3v18H3V7zm0 34l18 3V25H3v16zM27 4l18-3v21H27V4zm0 40l18 3V25H27v19z" />
      </svg>
    )
  if (os === 'mac')
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden>
        {/* Apple gray */}
        <path
          fill="#A2AAAD"
          d="M33.5 25.3c-.1-4 3.4-6.1 3.5-6.2-1.9-2.8-4.8-3.2-5.8-3.3-2.5-.3-4.8 1.5-6.1 1.5-1.3 0-3.2-1.5-5.2-1.5-2.7 0-5.2 1.6-6.6 4.1-2.8 4.8-.7 11.8 2 15.7 1.4 2 3 4.2 5.2 4.1 2.1-.1 2.9-1.3 5.3-1.3s3.1 1.3 5.2 1.3c2.2 0 3.6-2 5-4 1.6-2.4 2.2-4.8 2.2-4.9-.1-.1-4.1-1.6-4.3-5.5z"
        />
        <path fill="#A2AAAD" d="M29.6 12.4c1.1-1.4 1.9-3.3 1.7-5.3-1.6.1-3.6 1.1-4.8 2.5-1.1 1.3-2 3.2-1.8 5.1 1.9.1 3.9-1 4.9-2.3z" />
      </svg>
    )
  // Linux: penguin with Linux yellow accents (#FCC624)
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      {/* Head */}
      <circle cx="24" cy="13" r="7" fill="#000" />
      {/* Belly */}
      <ellipse cx="24" cy="28" rx="6.5" ry="8.5" fill="#fff" />
      {/* Body */}
      <path
        fill="#000"
        d="M24 18c-7.5 0-13 6.2-13 13.2 0 4 2.9 7.3 6.8 7.3 1.7 0 3.3-.6 4.6-1.8 1.1-.9 2.4-1.4 3.6-1.4s2.5.5 3.6 1.4c1.3 1.2 2.9 1.8 4.6 1.8 3.9 0 6.8-3.3 6.8-7.3C41 24.2 31.5 18 24 18z"
      />
      {/* Flippers */}
      <ellipse cx="12" cy="30" rx="4" ry="6" fill="#000" />
      <ellipse cx="36" cy="30" rx="4" ry="6" fill="#000" />
      {/* Beak */}
      <path d="M24 16l3 2-3 2-3-2 3-2z" fill="#FCC624" />
      {/* Feet */}
      <path
        fill="#FCC624"
        d="M18 40c-2.5 0-4.5 1.6-4.5 3.5S15.5 47 18 47h3c1.1 0 2-.9 2-2v-1c0-2-1.6-4-3.5-4H18zm12 0c-1.9 0-3.5 2-3.5 4v1c0 1.1.9 2 2 2h3c2.5 0 4.5-1.6 4.5-3.5S34.5 40 32 40h-2z"
      />
    </svg>
  )
}
