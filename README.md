# Platinum War Room — GTA VI Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry-r3/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry-r3/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline mission-control dashboard for hunting all 55 trophies in Grand Theft Auto VI — built for the `gta6-trophy-guide-01` competition on make.fun.

## What it is

**Platinum War Room** treats the platinum hunt like an operation, not a checklist:

- **Next-Best-Trophy optimizer** — ranks the trophies you still need by effort (time + difficulty) into a smart queue, so you always know what to chase next.
- **Story-beat board** — chapters and missions laid out as an operations board, with the one missable trophy's alert pinned to the exact story beat where it can be lost.
- **Collectible radar** — per-region grids with counts, so no collectible hides.
- **165 cited guide steps** — every trophy ships with a step-by-step guide, each step carrying a source citation.
- **Live self-audit strip** — visible on every screen: cited steps, verified count, missables covered, and a completion forecast (ETA to platinum from your current pace).

All 55 trophies covered: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze — including all 28 hidden trophies, the missable, and the unconfirmed ones (marked as such).

## How to run it

Fully offline — no network calls, no build step:

- Open `app/index.html` in a browser, or
- Run `node serve.ts` and open the local address it prints.

Progress is saved locally (localStorage) with export/import.

## Layout

- `app/` — the guide itself: `index.html`, `js/`, `css/`, `data/trophies.json` (all 55 trophies + cited steps)
- `main.ts` — dossier generator (reads `app/`, writes the competition dossier)
- `screenshots/` — the four judge shots (dashboard, story-beat board, radar, trophy detail)
- `vendor/` — vendored frontend library

Built as an entry for [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.
