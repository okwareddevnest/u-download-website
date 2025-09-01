import { NavLink } from 'react-router-dom'
import React from 'react'
import { loadReleases } from '../lib/releases'
import MarqueeBackground from '../components/MarqueeBackground'
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <MarqueeBackground />
      <section className="relative overflow-hidden py-8 sm:py-12 lg:py-14 text-white bg-slate-900/70">
        <div className="container-app relative" style={{ zIndex: 10 }}>
          <div className="flex flex-col items-start gap-6 sm:gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 max-w-2xl">
              <LatestBadge />
              <h1 className="mb-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">U-Download</h1>
              <p className="mb-4 sm:mb-6 text-base sm:text-lg text-white/90">
                Fast & Beautiful YouTube Downloader for Windows, macOS, and Linux. Paste a link, trim the exact segment you need, pick the best quality, and save.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <NavLink to="/download" className="btn-primary w-full sm:w-auto text-center">
                  Download U-Download
                </NavLink>
                <a href="#features" className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white shadow-sm ring-1 ring-white/20 backdrop-blur hover:bg-white/20 w-full sm:w-auto text-center">
                  Learn more
                </a>
              </div>
            </div>
            <div className="flex-1 w-full mt-6 lg:mt-0">
              <CardContainer>
                <CardBody className="relative rounded-2xl border border-white/20 bg-white/10 p-2 sm:p-3 shadow-2xl backdrop-blur">
                  <CardItem translateZ={60} className="w-full">
                    <img
                      src="/images/product-image-1.png"
                      alt="U-Download screenshot"
                      className="rounded-lg w-full"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = '/logo.svg'
                      }}
                    />
                  </CardItem>
                </CardBody>
              </CardContainer>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative backdrop-blur-sm">
        <div className="container-app grid gap-4 sm:gap-6 py-8 sm:py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ zIndex: 10 }}>
        {[
          {
            title: 'One‑click downloads',
            body: 'Paste a URL, choose quality, and save to your folder.',
          },
          {
            title: 'Trim & clip',
            body: 'Select start and end times to download only the part you need.',
          },
          {
            title: 'Quality‑aware downloads',
            body: 'Automatically picks the best available resolution (4K/1080p/720p) with sensible file sizes.',
          },
          { title: 'Privacy friendly', body: 'No accounts or tracking on the download URLs.' },
          {
            title: 'Cross‑platform',
            body: 'Windows, macOS (Intel/Apple Silicon) and Linux AppImage/Deb/RPM.',
          }
        ].map((f) => (
          <CardContainer key={f.title}>
            <CardBody className="rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm bg-slate-900/50">
              <CardItem translateZ={50} className="mb-1 text-base sm:text-lg font-semibold text-white">
                {f.title}
              </CardItem>
              <CardItem translateZ={80} as="p" className="text-sm sm:text-base text-slate-300">
                {f.body}
              </CardItem>
            </CardBody>
          </CardContainer>
        ))}
        </div>
      </section>
    </div>
  )
}

function LatestBadge() {
  const [version, setVersion] = React.useState<string>('')
  React.useEffect(() => {
    ;(async () => {
      try {
        const d = await loadReleases()
        setVersion(d.latest)
      } catch {}
    })()
  }, [])
  return (
    <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px]">●</span>
      <span className="opacity-90">{version ? `Latest v${version}` : 'Latest'}</span>
    </div>
  )
}
