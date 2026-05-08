# BYOS Next.js for TRMNL

[![License](https://img.shields.io/github/license/usetrmnl/byos_next)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

This repository is a TRMNL BYOS fork built around:
- reliable TRMNL DIY / ESP32 device handshakes
- bitmap-first recipe rendering for real e-ink hardware
- a larger local recipe gallery, including several TRMNL-inspired imports
- stricter debugging and observability for `/api/setup`, `/api/display`, and `/api/log`

## Overview
**BYOS (Build Your Own Server) Next.js** is a Next.js implementation that powers:
- device registration and identity management
- playlist and single-screen display assignment
- on-demand PNG/BMP rendering for TRMNL devices
- a local recipe browser with browser preview vs. renderer preview

## What This Fork Adds

### TRMNL DIY device fixes
- Robust device matching order: `api_key` -> `mac_address` -> `friendly_id`
- Header normalization for `Access-Token`, `ID`, `id`, and related variants
- Safer `/api/display` lookup flow that does not try to recreate devices on every refresh
- Improved `/api/setup` and `/api/log` consistency with the same device identity rules
- Better debug logs for device resolution, fallbacks, and final screen selection
- `not-found` fallback now shows the last refresh failure reason on-screen

### Database and RLS hardening
- Public device lookup is now isolated from stale pooled session scope
- Scoped DB helpers reset `ROLE` and `app.current_user_id` after use
- This prevents intermittent `Display device identity not found` regressions caused by connection reuse

### Renderer hardening
- Recipes were adjusted to behave better under Takumi/Taffy-style layout constraints
- `picture/source` trees are normalized for renderer compatibility
- Shared render preprocessing now enforces safer sizing defaults for bitmap output
- Many recipes were reworked to prefer explicit layout and bitmap-friendly typography

### Calendar improvements
- Apple, Google, and Outlook calendars use public ICS feeds
- Better timezone handling for:
  - IANA timezones
  - Outlook / Windows timezone labels
  - `X-WR-TIMEZONE` ICS fallbacks
- Better day-window alignment so "today" is computed in the selected calendar timezone
- More readable small text and stronger `Simple Text`-inspired typography

## Features
- Device management UI with MAC/API key registration, status tracking, screen assignment, and refresh scheduling
- Playlist-based screen rotation with time and weekday rules
- Single-screen fallback flow for debugging or simple TRMNL device setups
- On-demand screen rendering to 1-bit BMP via Takumi/Satori
- Postgres-backed persistence for devices, logs, playlists, mixups, and recipe configs
- Recipe gallery to compare direct browser preview vs. renderer PNG/BMP output
- Parameter-driven recipes, including booleans rendered as actual checkboxes in the recipe config UI

## Quickstart

### Deploy to Vercel
1. Create a Neon, Supabase, or PostgreSQL database.
2. Deploy the app to Vercel.
3. Configure the required environment variables.
4. Open the app, initialize the tables, and configure a device.
5. Point your TRMNL device to your deployed server URL.

### Run locally
```bash
git clone https://github.com/usetrmnl/byos_next
cd byos_next
pnpm install
pnpm dev
```

### Lint / typecheck
```bash
pnpm lint
pnpm exec tsc --noEmit
```

## Environment
Common variables:

```bash
DATABASE_URL=
POSTGRES_PASSWORD=
AUTH_ENABLED=false
REACT_RENDERER=takumi
```

Notes:
- `AUTH_ENABLED=false` is useful for local BYOS-style setups.
- `REACT_RENDERER` can be switched, but this fork has primarily been hardened around real Takumi bitmap output.

## Project structure
- `app/` - Next.js routes, API endpoints, and recipes
- `app/api/setup` - TRMNL setup handshake endpoint
- `app/api/display` - screen resolution and bitmap redirect endpoint
- `app/api/log` - device log ingestion endpoint
- `app/(app)/recipes/` - recipe gallery and recipe registry
- `components/` - app and recipe configuration UI
- `lib/database/` - DB access, RLS scoping, migrations, and SQL helpers
- `utils/` - renderer, bitmap, image, and cache helpers

## Device flow

### `/api/setup`
- Registers or updates a device
- Returns stable `api_key` and `friendly_id`
- Updates MAC/API-key associations without unnecessary duplicates

### `/api/display`
- Resolves the device identity
- Determines the correct screen or playlist item
- Falls back more defensively when playlist or mixup config is broken
- Emits structured logs showing:
  - whether token/MAC/friendly ID were present
  - which lookup path matched
  - which screen was chosen
  - whether a fallback was used

### `/api/log`
- Accepts TRMNL device logs
- Reuses the same identity resolution logic as setup/display

## Renderer notes
The recipe page shows multiple render stages:
- `Direct browser preview` is standard browser React/CSS output
- `Renderer PNG` is the real server-side recipe render path
- `BMP` is derived from that renderer output for the device

If a recipe looks good in the browser but bad on-device, the problem is usually in renderer constraints, not in the browser preview.

## Recipes
Visit `/recipes` to browse screens, configure params, and compare preview modes.

### Core recipes
- `simple-text` - base text recipe with crisp bitmap typography
- `album` - photo plus clock
- `apple-photos` - random iCloud shared album photo with clock and album metadata
- `bitmap-patterns`
- `wikipedia`
- `bitcoin-price`
- `weather`
- `responsive-example`

### Calendar recipes
- `calendar-apple`
- `calendar-google`
- `calendar-outlook`

Common calendar params:
- `icsUrl`
- `calendarName`
- `headers`
- `timezone`
- `eventLayout`
- `timeFormat`
- `includeDescription`
- `includeEventTime`
- `firstDay`
- `ignoredPhrases`
- `maxEventsPerDay`

### TRMNL-inspired and imported recipes
- `parcel` - package tracking via Parcel external API
- `nasa-deep-space-network` - live NASA DSN traffic
- `flightboard` - airport activity board near an airport code
- `whos-that-pokemon`
- `skywatch` - local air traffic radar style screen
- `lp-weather` - editorial weather screen inspired by lucaspimentel's plugin
- `f1-race-standings` - next race + driver standings
- `f1-weekend-teams` - weekend schedule + constructor standings
- `nasa-image-of-the-day`
- `github-monitor`
- `vercel-overview`
- `pollen-air-quality`

### Recipe-specific setup notes

#### `apple-photos`
- Uses a public iCloud Shared Album URL
- Supports:
  - `sharedAlbumUrl`
  - `albumName`
  - `timezone`
  - `showCaption`
  - `showTimestamp`
  - `fitMode`

#### `flightboard`
- Uses airport-centric live state vector data
- Supports:
  - `airportCode`
  - `radiusKm`

#### `skywatch`
- Uses map-centered live air-traffic data
- Supports:
  - `latitude`
  - `longitude`
  - `radiusKm`

#### `lp-weather`
- Uses Open-Meteo forecast data
- Supports:
  - `location`
  - `units`

#### `f1-race-standings`
- Uses OpenF1
- Focused on readable driver standings and next-race information

#### `f1-weekend-teams`
- Uses OpenF1
- Splits constructor standings and weekend schedule out into a separate screen for readability

#### `nasa-image-of-the-day`
- Uses NASA APOD
- Optional `apiKey`
- Includes a safe fallback when NASA returns unsupported media

#### `vercel-overview`
- Uses the Vercel REST API
- Supports:
  - `apiToken`
  - `teamId`

#### `github-monitor`
- Uses the GitHub REST API
- Supports:
  - `githubToken`
  - `owner`
  - `repositories`
  - `includePrivateRepos`
  - `staleDays`
  - `timezone`
  - `maxRepos`
  - `maxWorkflowRuns`

#### `pollen-air-quality`
- Uses Open-Meteo Air Quality
- Defaults to `State College, PA`
- Supports either:
  - `location`
  - or `latitude` + `longitude`
- Supports checkbox toggles for:
  - `showUsAqi`
  - `showPm25`
  - `showPm10`
  - `showNo2`
  - `showO3`
  - `showCo`
  - `showSo2`
  - `showUvIndex`
  - `showPollen`

## Recipe development
To add a recipe:
1. Create a folder under `app/(app)/recipes/screens/`
2. Add your component and optional `getData.ts`
3. Register it in `app/(app)/recipes/screens.json`
4. Test both:
   - browser preview
   - renderer PNG / bitmap output

For this fork, recipe work should be validated against the renderer path, not just the browser preview.

## Documentation
- API reference: `docs/api.md`
- Recipe registry: `app/(app)/recipes/screens.json`
- Device and renderer logic:
  - `app/api/display/`
  - `app/api/setup/`
  - `app/api/log/`
  - `utils/pre-satori.tsx`

## Notes on divergence from upstream
Compared with the upstream `usetrmnl/byos_next` project, this fork currently differs in these major areas:
- many additional local recipes
- more aggressive renderer hardening
- stronger TRMNL DIY device matching and debugging
- ICS-based calendar imports for Apple, Google, and Outlook
- expanded parameter UI including boolean checkbox support
- more opinionated bitmap-readability adjustments across recipes

## Support
- Upstream project: https://github.com/usetrmnl/byos_next
- This fork's customizations are centered on personal BYOS/TRMNL device usage and recipe development

## License
MIT - see `LICENSE`
