import React from 'react'
import { loadContributors, type GHContributor, getRepoInfo } from '../lib/github'
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card'

export default function Contributors() {
  const [list, setList] = React.useState<GHContributor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>()
  const [repo, setRepo] = React.useState<{ owner: string; repo: string; url: string } | null>(null)

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const info = await getRepoInfo()
        if (alive) setRepo(info)
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
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {list.map((c) => (
                <CardContainer key={c.login}>
                  <a href={c.htmlUrl} target="_blank" rel="noreferrer">
                    <CardBody
                      className={`flex items-center gap-3 rounded-xl border border-slate-800 p-4 hover:border-indigo-600/60 hover:bg-slate-900/40 ${
                        c.isOwner ? 'ring-1 ring-indigo-600/40' : ''
                      }`}
                      title={c.isOwner ? 'Repository Owner' : undefined}
                    >
                      <CardItem translateZ={60}>
                        <img
                          src={c.avatarUrl}
                          alt={`@${c.login}`}
                          className="h-12 w-12 rounded-full border border-slate-700"
                          loading="lazy"
                        />
                      </CardItem>
                      <div className="min-w-0">
                        <CardItem translateZ={80} className="truncate font-semibold text-slate-100">
                          {c.name || c.login}
                          {c.isOwner && (
                            <span className="ml-2 rounded bg-indigo-600/20 px-2 py-0.5 text-xs text-indigo-300">Owner</span>
                          )}
                        </CardItem>
                        <CardItem translateZ={40} className="truncate text-sm text-slate-400">
                          @{c.login}
                        </CardItem>
                        <CardItem translateZ={40} className="text-xs text-slate-500">
                          {c.contributions} contributions
                        </CardItem>
                      </div>
                    </CardBody>
                  </a>
                </CardContainer>
              ))}
            </div>
          </div>
          <aside>
            <CardContainer>
              <CardBody className="contrib-card rounded-xl border border-slate-800 p-6">
              <h2 className="mb-2 text-xl font-semibold text-slate-100">How to Contribute</h2>
              <p className="mb-4 text-sm text-slate-400">Help improve U-Download — follow these quick steps.</p>
              <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                <li>
                  Fork the repository
                  {repo && (
                    <>
                      {' '}
                      <a className="text-indigo-400 hover:text-indigo-300" href={repo.url} target="_blank" rel="noreferrer">
                        {repo.owner}/{repo.repo}
                      </a>
                    </>
                  )}
                  .
                </li>
                <li>
                  Create a feature branch: <code>git checkout -b feature/your-change</code>
                </li>
                <li>
                  Install deps and run locally: <code>npm i</code> then <code>npm run dev</code>
                </li>
                <li>
                  Run checks: <code>npm run lint</code> and ensure the build passes
                </li>
                <li>
                  Commit using Conventional Commits (e.g., <code>feat:</code>, <code>fix:</code>) —
                  <a
                    className="ml-1 text-indigo-400 hover:text-indigo-300"
                    href="https://www.conventionalcommits.org/en/v1.0.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    read guide
                  </a>
                </li>
                <li>Open a Pull Request with a clear description and screenshots when helpful</li>
              </ol>
              <div className="flex flex-wrap gap-2">
                {repo && (
                  <>
                    <CardItem translateZ={60} as="a" className="btn-primary" href={`${repo.url}/fork`} target="_blank" rel="noreferrer">
                      Fork on GitHub
                    </CardItem>
                    <a
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                      href={`${repo.url}/issues/new/choose`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open an Issue
                    </a>
                    <a
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                      href={`${repo.url}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Good first issues
                    </a>
                  </>
                )}
              </div>
              </CardBody>
            </CardContainer>
          </aside>
        </div>
      )}
    </div>
  )
}
