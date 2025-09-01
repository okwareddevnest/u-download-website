U-Download Website (Vite + React + TypeScript + Tailwind)

Overview
- Static marketing + download site for U-Download.
- Built with Vite (React + TS) and Tailwind CSS.
- OS-aware download chooser with per-asset links.
- Simple, privacy-friendly analytics for total downloads via CountAPI.

Getting Started
- Install: `npm i`
- Dev: `npm run dev` and open the URL printed in the terminal.
- Build: `npm run build` → static output in `dist/`.
- Preview: `npm run preview`.

Branding Assets
- Favicon and logo are SVG and live in `public/`.
- Screenshot placeholder path: `public/images/app-screenshot.png`.
  - Put your real screenshot there (PNG/JPG). If missing, the UI falls back to the logo.

Releases & Downloads
- Source of truth: `public/data/releases.json`.
- Put your installers under `public/downloads/<version>/...` and reference them in `releases.json` with either relative URLs (recommended) or absolute URLs hosted on your domain/CDN.
- Example (already present): version `2.1.0` with Windows, macOS (universal dmg), and Linux assets (AppImage/Deb/RPM).
- The Download page auto-detects OS and recommends the best installer, with a manual OS picker and a full asset list.

GitHub Releases (Dynamic)
- The site will fetch the latest release (assets + notes) from the repo in `public/data/config.json`.
- Current setting: `okwareddevnest/U-Download`.
- Optional: set an env var `VITE_GITHUB_REPO` or `VITE_GITHUB_TOKEN` to increase rate limits (token scoped to public repo read).

Analytics (Total Downloads)
- The site calls CountAPI to increment and read `total-downloads` scoped to your host name.
- No personal data is collected; it’s a plain counter increment on click.
- To reset or isolate counts per environment, use different hostnames.

Notes on Artifacts
- Files under `public/downloads/` in this repo are small stub binaries to keep the flow working. Replace them with your actual installers before deploying.
- After replacing, no code changes are required as long as filenames/paths in `releases.json` match.

Project Structure
- `public/` – static assets (favicon, logo, releases.json, downloads/...).
- `src/` – React app, routes and components.
- `src/lib/` – OS detection, releases manifest loader, analytics.

Customization Tips
- Colors: utility classes use the Indigo palette; adjust in `src/index.css` or replace with your brand hues.
- Content: Update hero text and features in `src/routes/Home.tsx`.
- Pages: Add more routes with React Router if needed.
