# CLAUDE.md

Daily-practice journal web app ("תרגול יומי לחיווט מחדש של המח הרגיש"). Static site served by GitHub Pages at https://ruthielax-pixel.github.io/HSP-Rewire-daily/ and installable as a PWA. No build step, no dependencies, no server.

Owner: ruthielax-pixel. Maya is a collaborator. The users communicate in Hebrew — reply in Hebrew unless asked otherwise.

## Files

- `index.html` – the whole app (HTML + CSS + JS in one file, ~2000 lines). Keep it a single self-contained file.
- `sw.js` – service worker: precaches app files, network-first (`cache: 'no-cache'`) for the page, cache-first for icons, runtime cache for Google Fonts.
- `manifest.webmanifest`, `icons/` – PWA install metadata and icons.

## Rules

- **Bump `VERSION` in `sw.js` on every change to any app file**, otherwise installed copies keep serving the old cache. Add any new app file to `APP_FILES` in `sw.js`.
- **`index.html` uses CRLF line endings.** Preserve them; a whole-file line-ending change makes the diff unreadable.
- UI text is Hebrew, `dir="rtl"`. Charts are drawn as inline SVG / CSS by hand — no chart libraries or CDNs (the app must work offline).
- Work on a branch and open a Pull Request; don't push to `main` directly. Owners also upload files through the GitHub web UI, so fetch the latest `main` before starting.
- Test changes in headless Chrome (Playwright with `executablePath: '/usr/bin/google-chrome'`): no page errors, and the flows you touched actually work.

## Data model (localStorage — real user data lives here, don't break it)

All keys start with `dailyRewire-`. Never rename or restructure existing keys/fields without a migration that still reads the old format.

- `dailyRewire-YYYY-MM-DD` – one daily entry (object with `date` + form fields). Only keys matching `/^dailyRewire-\d{4}-\d{2}-\d{2}$/` are daily entries; use `isDailyEntryKey()` / `getAllDailyEntries()` — never `startsWith('dailyRewire-')` for entries.
- An entry may be partial (e.g. only `anchor`, saved instantly when the anchor sentence is chosen). Averages and trend charts must skip missing values, not treat them as 0.
- `dailyRewire-draft-YYYY-MM-DD` – unsaved form draft; not counted anywhere. Removed on "שמור יומי".
- `dailyRewire-weekly-reflection-<Sunday date>`, `dailyRewire-monthly-reflection-YYYY-MM`, `dailyRewire-yearly-reflection-YYYY` – reflections. Legacy single keys `dailyRewire-monthly-reflection` / `dailyRewire-yearly-reflection` are still read as fallback.
- Settings: `dailyRewire-weekly-reminder-*`, `dailyRewire-last-backup`, `dailyRewire-install-dismissed`.
- Backup file format: `{ app: 'hsp-rewire-daily', version: 1, exportedAt, data: { key: rawString } }`. Restore merges (overwrites same keys, keeps the rest). Keep restore compatible with existing backup files.

## Conventions

- Periods are calendar-based: week Sunday–Saturday, real month length, calendar year (`getCalendarPeriod`). The "daily trends" view uses rolling 14/30/90 days.
- Dates are local `YYYY-MM-DD` via `formatDate()`; don't use `toISOString()` for dates (UTC shifts the day in Israel).
- There is leftover unused code for 21/42/63-day summaries (no matching HTML). Harmless; remove only if asked.
