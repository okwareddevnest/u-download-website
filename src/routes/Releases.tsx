import React from 'react'
import { loadReleases, type Release } from '../lib/releases'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card'

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
          <CardContainer key={r.version}>
            <CardBody className="rounded-xl border border-slate-800 p-6">
              <CardItem translateZ={40} className="mb-1 text-sm text-slate-400">
                {new Date(r.date).toDateString()}
              </CardItem>
              <CardItem translateZ={80} className="mb-3 text-xl font-semibold text-slate-100">
                v{r.version}
              </CardItem>
              {r.notes ? (
                <article className="prose prose-invert max-w-none text-slate-300 prose-a:text-indigo-400 prose-code:text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.notes}</ReactMarkdown>
                </article>
              ) : (
                <div className="text-slate-300">No notes provided.</div>
              )}
            </CardBody>
          </CardContainer>
        ))}
      </div>
    </div>
  )
}
