# Live download counter

Shows the total number of times U-Download has been downloaded, on the marketing
site, updating while the visitor is looking at it.

## Why this is not just "read the configured repo"

GitHub tracks `download_count` per release asset, per repository. The project
migrated GitHub accounts partway through its life, and the counts did not follow:

| repo | downloads (verified 2026-08-31) |
|---|---|
| `okwareddevnest/U-Download` | 577 |
| `DecodeDedan/U-Download` | 4 |
| **combined** | **581** |

The old account holds essentially the entire real audience. The new one — the
repo the rest of the site is configured against — holds a handful, all of them
the owner testing. A counter that read only the currently-configured repo would
display "4". That is not merely under-reporting; it actively misrepresents the
project as having no traction. **The endpoint therefore sums both repos, and
that is the whole reason it exists as a separate endpoint rather than a field on
`/api/releases`.**

## The endpoint

`GET /api/downloads` → `api/downloads.js`

```json
{
  "total": 581,
  "byOS": { "windows": 304, "mac": 63, "linux": 214, "other": 0 },
  "partial": false,
  "sources": [
    { "repo": "okwareddevnest/U-Download", "ok": true, "total": 577 },
    { "repo": "DecodeDedan/U-Download",    "ok": true, "total": 4 }
  ],
  "updatedAt": "2026-08-31T09:23:48.497Z"
}
```

- `total` — combined count, or `null` when no source could be reached. **`null`
  is never rendered as `0`.** A confident zero is a worse lie than an absent
  figure.
- `byOS` — every asset is bucketed, including filenames the classifier does not
  recognise (`other`), so **`byOS` always sums exactly to `total`**. This is
  asserted in the verification script rather than assumed.
- `partial` — true when at least one repo failed, i.e. `total` is a floor.
- `sources` — per-repo outcome, so a wrong total is diagnosable from the payload
  alone without redeploying.

### Repo list

```js
const DEFAULT_REPOS = ['okwareddevnest/U-Download', 'DecodeDedan/U-Download']
const REPOS_ENV = 'GITHUB_DOWNLOAD_REPOS'   // comma-separated, explicit opt-in
```

Same precedence principle as `api/releases.js` and `api/contributors.js`: the
in-repo value is authoritative, with one clearly-named env override.

**The ambient `GITHUB_REPO` is deliberately not consulted.** A stale `GITHUB_REPO`
in the Vercel dashboard previously repointed this site at the wrong account
silently, which is what motivated that precedence rule in the first place. The
failure mode here would be worse than for releases: an env var meaning "which
repo do we ship from" would quietly shrink a historical total from 581 to 4, and
nothing on the page would indicate anything was wrong.

`GITHUB_TOKEN` is honoured exactly as the existing functions do — attached as a
bearer token when present, absent otherwise.

### Shared asset classifier

`inferOSAndKindFromFilename` and `normalizeRepo` were lifted out of
`api/releases.js` into **`api/_lib/assets.js`**, now imported by both. One copy
means `/api/releases` and `/api/downloads` cannot drift on what a `.AppImage` or
an `aarch64.dmg` is. Files under `api/_lib` are not routed by Vercel (leading
underscore), so this is a module, not an endpoint.

`releases.js` was changed **only** by deleting those two function bodies and
adding the import. Its repo-source precedence block is byte-for-byte untouched —
see the diff.

## Cache window and how rate limiting is bounded

```
success:  s-maxage=1800, stale-while-revalidate=86400   (30 min / 24 h)
degraded: s-maxage=60,   stale-while-revalidate=86400   (1 min / 24 h)
```

**Why 30 minutes.** The total moves roughly twice a day. A 30-minute window is
already more than an order of magnitude fresher than the data it describes, so a
tighter window buys nothing observable and spends a budget that matters.

**The budget.** GitHub allows 60 requests/hour/IP unauthenticated, and Vercel
functions share egress IPs across every visitor — so unbounded visitor traffic
would exhaust it quickly. The CDN is what decouples the two: the number of
upstream calls depends on the cache window, not on traffic. At 2 repos per
revalidation and 2 revalidations per hour, this costs **~4 of the 60 per edge
region regardless of how many people are on the site**. With a `GITHUB_TOKEN`
set the ceiling rises to 5,000/hour and the margin becomes irrelevant.

**Why the long `stale-while-revalidate`.** A GitHub outage or a rate-limit blip
serves the last good number for up to a day instead of blanking the counter.

**Why degraded responses are cached for only a minute.** A partial or empty
result is cheap to retry and expensive to pin — without the shorter window a
single transient failure would be frozen into the CDN for half an hour.

## Fail-soft behaviour

Each repo is fetched independently and `fetchRepoDownloads` never throws; the
outcome is reported in `ok`. Verified behaviour:

| case | result |
|---|---|
| both repos OK | `total: 581`, `partial: false`, 30-min cache |
| one repo 404s / rate-limits | `total: 577` (the other's count), `partial: true`, 1-min cache |
| all repos fail | `total: null`, `partial: true` — client renders **nothing** |
| malformed entry in env list | that entry reported `invalid repo`, others still counted |
| empty env var | falls back to `DEFAULT_REPOS` |

On the client the same principle applies one level up: if a poll fails *after* a
number was already on screen, the existing number is kept rather than replaced
with an error. The counter degrades to slightly stale, never to absent.

## Where the figure is on the page, and why

Two placements, both immediately adjacent to a download action, sharing one
fetch (see polling below).

1. **Home hero — inside the existing status pill.** The pill above the primary
   "Download U-Download" CTA already read `● Latest v3.0.2`; the total joins it
   behind a hairline divider: `● Latest v3.0.2 │ 581 downloads`.
2. **Download route — in the running subtitle**, directly above the OS picker
   and the Download button: `Latest version 3.0.2 · 581 downloads to date`.
   This slot is where a `{/* total downloads removed */}` marker already sat.

**Why not a stat tile.** The dataviz form heuristic is clear that a single figure
is a stat tile and never a chart — so no chart was built. But the Impeccable
craft floor explicitly refuses "the hero-metric template: big number, small
label, supporting stats, accent," which is precisely what a stat tile would be
here. Both constraints are satisfied by making the figure *running text inside
composition that already exists* rather than a new bordered card: no giant
numeral, no accent block, no bolt-on tile. Placement 1 extends an element that
was already on the page; placement 2 completes a sentence that was already
there.

The per-OS breakdown is available on hover (`title`) rather than laid out as
supporting stats — it is genuinely secondary, and surfacing it inline would
rebuild the hero-metric template by the back door.

## Polling, and what "as downloads happen" honestly means

This is **polling, not real-time**. GitHub publishes no subscription for asset
download counts and updates them with its own lag, so "live" here means "recent"
and the notes should not pretend otherwise.

- **5-minute interval while the tab is visible.** Chosen against the CDN rather
  than the data: `/api/downloads` is edge-cached for 30 minutes, so most polls
  are served from the edge and cost GitHub nothing, while still surfacing a new
  number within minutes of the cache turning over.
- **Polling stops entirely when the tab is hidden**, via `visibilitychange` /
  `document.visibilityState`. A background tab re-requesting a number that moves
  twice a day wastes the visitor's battery and the shared rate limit.
- **On return to visibility** the timer restarts and, if more than one interval
  has elapsed, refetches immediately — coming back to a long-idle tab is exactly
  when the figure is most likely to be stale.
- **One poll for the whole page.** The store in `src/lib/downloads.ts` is a
  module-level singleton with ref-counted subscribers, so the hero and the
  download page share a single fetch and a single timer. Two components each
  running their own poll would double load on an endpoint whose entire design
  goal is staying inside a rate limit.

### Presentation states

| state | renders |
|---|---|
| before first fetch resolves | nothing (no `0`, no `NaN`, no skeleton) |
| endpoint unreachable / `total: null` | nothing |
| ready | the figure, in tabular numerals |
| ready but `partial` | the figure, with a hover note that it is a floor |

Rendering nothing is deliberate: the surrounding sentences are written to read
correctly without the clause, and the `prefix` separator (`·`) is owned by the
component so it disappears with the number rather than dangling.

**Numerals.** `font-variant-numeric: tabular-nums` (inline style, so it cannot
be lost to a missing utility) — a proportional-figure counter jitters as digits
change width.

**Motion.** The first real value appears instantly; only *subsequent* changes
animate. A 900 ms eased tween carries the value, and a 1.2 s indigo wash behind
the digits marks the change — the wash does the real work, because updates are
usually `+1` and a single digit flipping is otherwise easy to miss. Both are
disabled under `prefers-reduced-motion: reduce`. Background-colour is animated
rather than text colour so it composes with either placement's ink.

**Format.** `581` · `1,240` · `12.4k` · `2.4M`. Grouped digits stay exact below
10,000, which is roughly where an exact count stops being a number a reader can
hold. Boundary: the `k`→`M` switch is at 999,950, not 1,000,000, so the
one-decimal form never renders `1000k`.

## Verified vs. reasoned about

**Verified by execution:**
- `npx tsc --noEmit` — clean. `npm run build` — clean (exit 0).
- `node --check` on all four API files — clean.
- **Aggregation against real data.** Both handlers were executed locally against
  the live GitHub API with a fake `res`. `/api/downloads` returned `total: 581`,
  cross-checked in the same shell invocation against
  `gh api repos/okwareddevnest/U-Download/releases --jq '[.[].assets[].download_count]|add'`
  (577) and the same for `DecodeDedan` (4). **577 + 4 = 581 = endpoint output.**
- `byOS` sums to `total`; `sources` sum to `total` (asserted, both true).
- All five fail-soft cases in the table above, by pointing
  `GITHUB_DOWNLOAD_REPOS` at deliberately broken repo lists.
- Pagination is not a factor: 8 + 2 = 10 releases total, and `per_page=100`,
  no-pagination, and `--paginate` all return identical sums. `releaseCount` is
  returned in the source record as a tripwire should a repo ever pass 100.
- `/api/releases` still returns `latest: 3.0.2` with 9 correctly-classified
  assets after the shared-module refactor.
- Number formatter across 17 inputs including `NaN`, negatives, and the k/M
  boundary.
- ESLint: my files are clean; the repo's 15 pre-existing errors are unchanged
  and none are in new code.

**Reasoned about, not verified:**
- **The deployed function was never exercised.** There is no way to invoke it on
  Vercel from here, so the CDN headers, the real cache behaviour, and the
  bundling of `api/_lib/assets.js` by Vercel's Node builder are all reasoned
  from convention, not observed. The `_`-prefix-is-private and
  relative-import-bundling behaviours are standard and the module graph resolves
  under local Node ESM, but this is the one claim in these notes with no direct
  evidence behind it — **check `/api/releases` still returns assets immediately
  after the first deploy**, since that is the path a bundling failure would
  break.
- The rate-limit arithmetic assumes Vercel revalidates per edge region and that
  regions do not share an egress IP with unrelated heavy GitHub consumers.
- The claim that the total moves ~twice a day comes from the counts given at
  task time, not from a measured time series.
- Browser rendering was not inspected; there was no dev server or screenshot in
  this pass. Layout of both placements is reasoned from the surrounding markup.

## Files

| file | change |
|---|---|
| `api/downloads.js` | new — aggregating endpoint |
| `api/_lib/assets.js` | new — shared filename classifier + repo normaliser |
| `api/releases.js` | two helpers removed, now imported; precedence untouched |
| `src/lib/downloads.ts` | new — singleton store, polling, visibility, formatter |
| `src/components/DownloadCount.tsx` | new — tweened, tabular-numeral figure |
| `src/routes/Home.tsx` | count added to the existing hero pill |
| `src/routes/Download.tsx` | count fills the existing subtitle slot |
| `src/index.css` | `count-tick` keyframe + reduced-motion guard (additive) |
