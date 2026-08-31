# Platform & architecture detection

Why the Download page used to hand an Apple Silicon Mac `U-Download_3.0.2_x64.dmg`,
what replaced that, and exactly which parts of the fix were observed versus reasoned about.

## The bug, reproduced

Observed in headless Chrome 151 on this machine (an Apple M4 Pro), running the
pre-change `detectPlatform()` unmodified:

```
OLD detectPlatform() => {"platform":"mac"}      // arch is absent, i.e. undefined
navigator.userAgent      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) … Safari/537.36"
navigator.platform       "MacIntel"
```

Both root causes confirmed rather than assumed:

1. The UA string on Apple Silicon says **`Intel Mac OS X`** and `navigator.platform`
   says **`MacIntel`**. There is no ARM marker anywhere for the regex to find, so
   `arch` came back `undefined`.
2. `pickBestAsset` treated `undefined` as the *else* branch of
   `arch === 'arm64' ? … : ['x64','universal','arm64']`, so every undetected machine
   was silently ranked x64-first. On this Mac that is the Intel dmg, which then runs
   under Rosetta with no warning.

## The layered strategy (`src/lib/os.ts`)

`detectPlatformDetailed()` tries each layer in order and stops at the first that
answers. It reports which layer answered (`archSource`) so the failure modes stay
debuggable, and returns `arch: undefined` when every layer is inconclusive.

### Layer 1 — User-Agent Client Hints (`archSource: 'client-hints'`)

`navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness'])`.

- **Covers:** all Chromium browsers on every desktop OS — Chrome, Edge, Brave, Opera,
  Arc. Authoritative: the browser reports the real CPU, not a compatibility-masked
  string. This is the only layer that can distinguish Windows-on-ARM from Windows x64
  in browsers whose UA has been trimmed.
- **Does not cover:** Safari and Firefox, neither of which implements `userAgentData`.
- **Why the old code couldn't use it:** it is a Promise, and `detectPlatform()` was
  synchronous. Hence the new async `detectPlatformDetailed()`; the sync
  `detectPlatform()` remains for the first-paint OS guess.
- `bitness === '32'` is rejected rather than mapped, since we ship no 32-bit builds.

### Layer 2 — WebGL unmasked renderer (`archSource: 'webgl'`)

A throwaway `<canvas>` WebGL context, read through the `WEBGL_debug_renderer_info`
extension's `UNMASKED_RENDERER_WEBGL`, falling back to plain `gl.RENDERER`.

- **Covers:** Safari on macOS — the browser that layer 1 misses on the platform where
  getting it wrong matters most. Also Firefox on macOS.
- **Only consulted on macOS.** On Windows and Linux the GPU vendor says nothing about
  the CPU architecture (an x64 desktop with an AMD card and an ARM board with an AMD
  card look identical), so running it there would only manufacture false positives.
- **Matching order matters:** Intel / AMD / Radeon / NVIDIA / GeForce are checked
  *first* and map to x64, *then* Apple maps to arm64. Chrome on an Intel Mac reports
  `ANGLE (Intel Inc., …)`; without that ordering a string containing both vendor
  words could resolve the wrong way.
- **Cleanup and safety:** the whole function is wrapped in try/catch and returns
  `undefined` on any failure, and a `finally` block calls
  `WEBGL_lose_context.loseContext()` so the throwaway context is released rather than
  counting against the browser's context limit. The extension can be absent, blocked
  by privacy settings (Safari's Advanced Tracking Protection, Firefox's
  `webgl.disable-renderer-info`), or missing entirely in a software-rendering context;
  every one of those paths yields `undefined` and falls through to the next layer,
  never an exception.

### Layer 3 — User-agent regex (`archSource: 'user-agent'`)

The original `/ARM64|AArch64|arm64/i` and `/x64|x86_64|Win64|WOW64|amd64/i` checks,
kept unchanged.

- **Covers:** Windows on ARM in non-Chromium browsers (Firefox reports `ARM64` in its
  UA), most Linux UAs (`x86_64`, `aarch64`), and Win64 desktops.
- **Does not cover:** macOS at all, which is precisely the original bug.

### Layer 4 — Per-OS default (`archSource: 'unknown'`, `arch: undefined`)

`detectPlatformDetailed()` deliberately does **not** guess here. It returns
`undefined`, and the default is applied one level up, in
`defaultArchFor(os)` in `src/lib/releases.ts`, so that "we defaulted" stays
distinguishable from "we detected" all the way to the UI.

| OS | Default when unknown | Why |
|---|---|---|
| **macOS** | **arm64 (Apple Silicon)** | Apple stopped selling Intel Macs in 2023; the transition began in 2020. An unidentifiable Mac in 2026 is overwhelmingly likely to be Apple Silicon. More decisively, **the two errors are not symmetric**: an Apple Silicon Mac given the Intel build installs and launches happily under Rosetta 2 — degraded, silently, forever, with the user never learning why. An Intel Mac given the arm64 build refuses to launch immediately and unmistakably, and the user goes back and picks the other one. When a heuristic must fail, it should fail loudly. |
| **Windows** | x64 | Windows on ARM is still a small minority of desktop installs, and layer 1 or layer 3 catches it in practice — an unknown Windows machine is almost certainly x64. |
| **Linux** | x64 | Same reasoning; desktop Linux is overwhelmingly x86_64, and `aarch64` normally appears in the UA anyway. |

This inverts the previous implicit macOS default, which was x64.

## The `pickBestAsset` change (`src/lib/releases.ts`)

Three changes:

1. **`undefined` is no longer the x64 branch.** `arch` is passed through
   `resolveArch(os, arch)`, which returns `{ arch, assumed }` — a concrete
   architecture plus a flag saying whether it was detected or defaulted. Unknown now
   resolves through `defaultArchFor(os)` (arm64 on macOS) rather than falling into the
   x64 ternary branch by accident.
2. **Architecture is now the primary sort key, package format the tie-break.** The old
   code chained two `.sort()` calls, which — relying on sort stability — made *format*
   primary and architecture only a tie-break within a format. With the 9-asset Linux
   matrix that is usually harmless, but if the preferred format existed for only the
   wrong architecture it would hand an arm64 machine an amd64 `.deb` in preference to
   an `aarch64.rpm`. A wrong-architecture build of the preferred format is worse than
   the right-architecture build of a second-choice format, so the single comparator
   now ranks arch first, then kind.
3. **Unranked values sort last instead of first.** `Array.indexOf` returns `-1` for
   anything not in the preference list, which previously sorted such assets *ahead* of
   ranked ones. A `rank()` helper maps a miss to `list.length`.

Two small helpers were added alongside: `availableArchs(assets, os)` (which
architectures we actually ship for an OS) and `formatArchLabel(os, arch)`.

## How the UI exposes and allows overriding the choice (`src/routes/Download.tsx`)

Detection is a heuristic, so the page shows what it decided and lets the visitor
correct it. No new visual language — every control reuses classes already on the page.

- **A "Processor" row of tabs** sits directly under the existing OS tabs and uses the
  identical button styling (`border-indigo-600 bg-indigo-600/10 text-indigo-300` when
  active). It renders only when we actually ship more than one architecture for the
  selected OS — so it appears for macOS and Linux and stays hidden for Windows, which
  currently has one build. Buttons carry `aria-pressed`.
- **The recommendation card names the architecture** in its existing eyebrow line:
  "Recommended for mac · Apple Silicon".
- **The alternative build is one click away** from the action row, as a third control
  beside "Download" and "Direct link", styled exactly like "Direct link":
  "Intel build" / "Apple Silicon build".
- **Human words, never filename tokens.** `formatArchLabel` renders Apple Silicon /
  Intel on macOS and 64-bit / ARM64 on Windows and Linux. `aarch64`, `amd64` and
  `x86_64` appear only inside the filenames themselves.
- **Uncertainty is stated, quietly.** When the architecture was defaulted rather than
  detected, a `text-sm text-slate-500` line under the buttons reads: "We couldn't
  confirm your processor, so we're showing the Apple Silicon build. If that's wrong,
  pick Intel instead." — with the alternative as an inline link. It is absent whenever
  detection actually succeeded, so a confident result is never dressed up as a caveat
  and a guess is never presented as certainty.
- **A manual choice sticks.** Once the visitor picks an architecture, later OS-tab
  switches respect it instead of re-running detection over their choice.
- **The "All assets" list** now labels each row with its architecture in the same human
  terms.

## Verified vs. reasoned about

**Verified by execution.**

- *Layer 1, client hints, on Apple Silicon.* Ran the real `src/lib/os.ts`, bundled
  unmodified, in headless Chrome 151 on this M4 Pro Mac.
  `getHighEntropyValues` returned `{architecture: "arm", bitness: "64"}` and
  `detectPlatformDetailed()` returned
  `{platform: "mac", arch: "arm64", archSource: "client-hints"}`.
- *Layer 2, WebGL, on Apple Silicon.* In the same run,
  `UNMASKED_RENDERER_WEBGL` was
  `"ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)"`, and the
  synchronous `detectPlatform()` — which on macOS consults only the WebGL layer —
  returned `{platform: "mac", arch: "arm64"}`. So the WebGL layer was exercised in
  isolation and produced the right answer on real hardware. Worth noting from the same
  capture: plain `gl.RENDERER` was the masked `"WebKit WebGL"`, which confirms the
  extension is genuinely required and that the masked fallback string matches none of
  our vendor patterns (so it correctly yields `undefined` rather than a wrong guess).
- *The bug itself.* The pre-change `detectPlatform()` returned `arch: undefined` on
  this Apple Silicon Mac, as quoted at the top.
- *`pickBestAsset` and the helpers.* 20 assertions over the real 9 release filenames,
  all passing: arm64 Mac → `aarch64.dmg`; Intel Mac → `x64.dmg`; unknown-arch Mac →
  `aarch64.dmg` (the new default); Linux arm64 → `arm64.deb` not `amd64.deb`; Linux
  x64 → `amd64.deb`; unknown Linux → `amd64.deb`; Windows → `x64-setup.exe`; a
  mixed-format fixture confirming arch now outranks package format; empty input →
  `undefined`; plus the label, `availableArchs` and `resolveArch` cases.
- *Build.* `npm run build` (`tsc -b && vite build`) clean; `npx tsc --noEmit` clean.
  `npm run lint` shows only errors that predate this work; the three touched files went
  from 10 lint errors + 1 warning to 5 errors and no warnings.

**Reasoned about, not executed.**

- *Safari on Apple Silicon* — the single most important case for layer 2. It could not
  be observed here: driving Safari from a shell needs "Allow JavaScript from Apple
  Events", which is off on this machine, and enabling it would mean changing the user's
  settings. The reasoning is that Safari has no `userAgentData`, so it falls to the
  WebGL layer, where Apple Silicon reports a renderer containing "Apple" — the same
  vendor token this run observed through Chrome's ANGLE wrapper. **The residual risk:**
  some Safari versions are reported to return a generic `"Apple GPU"` on *Intel* Macs
  too, as a fingerprinting mitigation. If that happens, an Intel Mac on Safari is
  offered the arm64 dmg — which is the loud, self-correcting failure the macOS default
  was chosen for, and the Processor tabs fix it in one click. This is the one behaviour
  worth confirming by hand on a real Intel Mac running Safari.
- *Intel Macs generally.* No Intel Mac was available. Chrome on Intel would answer at
  layer 1 (`architecture: "x86"`); Safari on Intel depends on the renderer string above.
- *Windows on ARM, and Linux on ARM.* No such hardware here. Both are layer 1 or
  layer 3 cases and neither involves the macOS-only WebGL path.
- *Firefox anywhere.* No `userAgentData`; on macOS it reaches the WebGL layer, elsewhere
  the UA regex.
- *Privacy-hardened browsers* where `WEBGL_debug_renderer_info` is blocked: by
  construction they land on the per-OS default and see the "couldn't confirm" note.

## Test runner

**The project has no test runner** — no `test` script, no vitest or jest dependency, and
no existing test files. None was added, since introducing one uninvited is a bigger
decision than this fix. The 20 assertions above were run as a throwaway script outside
the repo: `esbuild` (already present as a Vite dependency) transpiled `src/lib/releases.ts`
to ESM in a scratch directory and Node executed the assertions against the real exported
functions. Nothing was added to the repository to make that work. If a runner is ever
adopted, those cases are the ones worth keeping — `pickBestAsset`, `resolveArch`,
`defaultArchFor`, `formatArchLabel` and `availableArchs` are all pure and directly
testable.
