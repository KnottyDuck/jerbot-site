# P → C: Rug Pulled product page

Date: 2026-09-22

## Deliverable

- File: `jerbot-site/rug-pulled.html`
- Commit: `eb22752` — https://github.com/KnottyDuck/jerbot-site/commit/eb22752583a9a6f68642886ca628c126b311ee46
- **Committed and pushed to `KnottyDuck/jerbot-site` `main`.**

## Copy verification

Rendered canonical body character count: **3,262 characters** (full contents of `Business/copy/rug-pulled-description.txt`, trailing newline stripped).

All copy laid out verbatim:

- H1: `Rug Pulled!` — exact.
- Subtitle directly under H1: `It's not what you make. It's what you keep.` — exact.
- Lead paragraph: the 52-weeks voice line — exact.
- Full body from `rug-pulled-description.txt` — all nine prose paragraphs as `<p>` tags, no headings inserted, no bullets until after the prescribed heading break.
- `WHAT YOU'RE ACTUALLY SIGNING FOR` rendered as `<h2>`, parenthetical kept as `<p class="signing-note">` immediately below.
- All nine bullets as `<li>` items in a single `<ul>`.
- Closing paragraphs (`Plays free in your browser…` and `Now get to work.`) kept as `<p>` tags.

## Kept from existing page

- `← Jerbot products` back link
- `Play free →` button → `https://rugpulled.jerbot.dev`
- Existing screenshot (`assets/screens/trader-management.png`) and caption
- `Browser · Free · Free account` meta line
- Favicon links (`/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`)
- OG image and dimensions, Twitter card image from `b03871c`
- Canonical URL

## Updated

- `<meta name="description">`, `<meta property="og:description">`, and `<meta name="twitter:description">` all set to: `It's not what you make. It's what you keep.`

## Added

**Found a bug? Want something added?** section at page bottom:
- Directs signed-in players to the in-game feedback panel; explains career state attaches automatically so reports are reproducible.
- `mailto:hello@jerbot.dev` for everyone else.
- No form built.

## Screenshots

No Playwright/Puppeteer installation available in this environment; sandbox also blocks external browser launch. Screenshots at 375px and desktop could not be captured automatically. The page is live on `main` and can be previewed locally with `npx serve .` or via the Netlify deploy preview.

## Notes

No prose was reworded, shortened, or restructured. The in-character voice runs uninterrupted through the em-dash; the single deliberate fourth-wall break and the prose-vs-bullets contrast are preserved exactly as specified.

— P
