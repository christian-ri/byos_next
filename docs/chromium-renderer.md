# Vercel-only Chromium Renderer

## 1. Why this exists
This project stays a full Next.js BYOS server for TRMNL devices, but the future render path is now Chromium screenshot rendering instead of React-to-image rendering. New recipes should converge on one source of truth: fixed-size HTML/CSS at `800x480`, rendered by Chromium, then postprocessed for TRMNL output.

## 2. Architecture
- TRMNL device requests still enter through Next.js endpoints such as `/api/setup`, `/api/display`, and `/api/log`.
- Device images continue to be served through `/api/bitmap/<screen>`.
- The new future render path is:
  - recipe data
  - HTML/CSS shell at `800x480`
  - Chromium screenshot to PNG
  - Sharp postprocessing
  - BMP conversion for device output when needed
- `/api/display` should keep returning `image_url` and stay fast. It should not do synchronous rendering work.

## 3. How it differs from Satori/Takumi
- Satori and Takumi are now legacy renderer paths retained for existing screens during migration.
- Chromium is the canonical renderer for new recipes.
- Browser preview and device output should come from the same HTML/CSS structure instead of maintaining separate browser-vs-renderer layout behavior.
- Sharp and Jimp are postprocessors only. They are not renderers.

## 4. How to write new recipes
- Author recipes for a fixed `800x480` viewport.
- Keep HTML self-contained and deterministic.
- Export recipe data separately from the HTML builder.
- Escape all dynamic text before injecting it into template strings.
- Prefer one HTML shell and reuse it for browser preview, PNG render routes, and future device bitmap routes.

## 5. Pixel Perfect / TRMNL Framework rules
- New recipes should use Pixel Perfect / TRMNL Framework-compatible HTML conventions.
- Prefer strong black/white contrast and bitmap-safe typography.
- Avoid remote CSS, fonts, and assets in the render path.
- Version local CSS and fonts with the repository.
- Avoid shadows, thin strokes, tiny text, fine gradients, and low-contrast decoration.
- Keep body overflow hidden and the viewport fixed.
- Do not accept arbitrary raw user HTML.
- If remote images are ever needed, proxy/cache/validate them before rendering.

## 6. Local test commands
```bash
pnpm install
pnpm dev
curl http://localhost:3000/api/render/chromium-simple-text --output chromium-simple-text.png
curl http://localhost:3000/api/bitmap/chromium-simple-text --output chromium-simple-text.bmp
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## 7. Vercel constraints
- The renderer is designed for Vercel-compatible Node.js functions with `puppeteer-core` and `@sparticuz/chromium`.
- Keep Chromium launches short-lived and request-scoped unless a reuse strategy is proven safe.
- Cache aggressively with HTTP headers.
- Avoid runtime fetches to arbitrary external resources from Chromium.

## 8. Migration checklist
- Mark legacy Satori/Takumi files as deprecated.
- Keep existing routes functional while migration is in progress.
- Add new recipes in Chromium mode first.
- Integrate screens one by one instead of rewriting the whole gallery.
- Prefer explicit route-level integrations over forcing all existing recipes through Chromium in one PR.
- Confirm each migrated recipe still targets the TRMNL OG `800x480` e-ink display.

## 9. Future work
- Bundle local TRMNL Framework CSS for renderer use.
- Add Vercel Blob or KV artifact caching for rendered PNG and BMP outputs.
- Cache render artifacts by recipe id, params, and data hash.
- Add render locks to avoid duplicate Chromium launches.
- Improve grayscale, ordered dithering, and 2-bit BMP output.
- Gradually migrate legacy Takumi/Satori recipes to the Chromium HTML/CSS path.
