---
title: "Lorg Phase 0: Building a Personal Worldline in Seven Hours"
description: "From empty repo to GPS-tracked life trail in one session. How we built a personal worldline data collection system with FastAPI, React Native, and a glowing map of Ireland."
publishDate: 2026-03-22
category: "Research"
tags: ["Lorg", "worldline", "GPS", "React Native", "Expo", "FastAPI", "Fly.io", "Mnemos", "Claude Code"]
readingTime: "6 min read"
furtherReading:
  - title: "Lorg Repository"
    url: "https://github.com/todd427/lorg"
    source: "GitHub"
  - title: "Experiment Léargas: Memory That Breathes"
    url: "/resources/experiment-leargas-memory-map"
    source: "FoxxeLabs"
draft: false
---

## <span style="color:#1F4E79">What if you could see your life?</span>

Not in photographs. Not in calendar entries. But as a continuous trail through space and time — every walk to the shop, every evening at home, every drive to Derry, rendered as a glowing worm threading through four dimensions.

That's Lorg.

The Irish word means *track, trail, footprint*. The system collects GPS position, step count, screen state, battery level, and weather from an Android phone, stores it in a time-series database, and will eventually render it as a 3D tube at [lorg.ie](https://lorg.ie) — latitude and longitude as X/Y, time as the Z axis, step cadence as thickness, weather as ambient colour.

Phase 0 is the pipe. No visualisation yet. Just get the data flowing. On the evening of 21 March 2026, we sat down with an empty repository, a Phase 0 brief, and Claude Code. Seven hours later, the pipe was built, data was flowing, and the first daily summary was searchable in [Mnemos](/resources/experiment-leargas-memory-map).

## <span style="color:#1F4E79">The build</span>

### 17:25 — Empty repo

Nothing but a `CLAUDE.md`, a `README`, and a brief in `docs/phase0-brief.md` describing what needed to exist. The brief specified database schema, API endpoints, mobile app structure, and a definition of done. Everything else was built from scratch.

### 20:38 — Backend and mobile app scaffolded

The FastAPI backend came together first: six endpoints for ingesting GPS samples, weather records, retrieving daily data, computing distance and streak, and generating daily summaries for Mnemos. PostgreSQL on Fly.io. API key authentication. Seventeen tests.

The mobile app followed in parallel: React Native via Expo, Android only. Background GPS via a foreground service firing every five minutes. Step counting, weather from OpenWeatherMap, battery and screen state tracking. A queue-and-sync pattern — samples stored locally in AsyncStorage, flushed to the backend every five minutes.

### 21:11 — First data

Backend deployed to Fly.io London. Postgres attached. Secrets set. The phone sent its first GPS sample at 21:11:19 UTC — Letterkenny, County Donegal, Ireland. 54.9698°N, 7.7688°W, altitude 227 metres.

### 21:30–22:00 — Making it feel alive

The raw status UI was functional but lifeless. What followed was a rapid iteration on what the home screen should actually *feel* like:

- **Distance and streak** replaced raw sample counts. "0.1 km today · Day 1 · *The trail begins.*" tells a story that "8 samples recorded" never could.
- **Tappable everything.** Tap the time to open your calendar. Tap the weather to see the forecast. Tap the location to open Google Maps. Tap steps to open Google Fit. Dead cards feel broken.
- **Silent sync.** The queue-and-flush mechanism was initially visible — "2 pending, tap to sync." Nobody needs to see the plumbing. It now syncs silently every five minutes.

### 22:00–23:24 — The Ireland glow

The app needed a soul. Todd dropped a PNG into the repo: a circuit-board map of Ireland, glowing lime-green on deep forest. It became the default background image, visible through semi-transparent cards.

A "Glow" theme was pulled from the image's palette — deep green background, lime-gold accent, WCAG AAA compliant. The cards got subtle primary-colour borders. The result looks like the map of Ireland is alive behind your data.

Nine themes were designed and audited for WCAG AAA (7:1 contrast ratio on all text pairings): Glow, Café, Candle, Meadow, Moss, Atlantic, Overcast, Limestone, Heather, and Terminal Gold. Each draws from Irish landscape references — Atlantic coast navy, Donegal bogland amber, Burren limestone cream, Errigal heather purple.

### 23:46 — Mnemos integration verified

A background asyncio task runs at midnight UTC, generating a plain-text daily summary and posting it to Mnemos. The first summary landed successfully:

```
2026-03-21 — Daily Summary (Lorg)
Location: Letterkenny Municipal District, County Donegal, Éire / Ireland
Steps: 22 | Active: 8 minutes
Weather: 6°C, clouds, humidity 93%
Screen on: 1h 03m
Battery start: 93% → end: 81%
```

The physical record of a human day, searchable alongside conversation history, research notes, and everything else in the personal knowledge base. When [Léargas](/resources/experiment-leargas-memory-map) eventually renders its cognitive memory map, these Lorg summaries will appear as anchors — physical locations pinned to the temporal manifold.

### 00:21 — Production APK

A standalone Android APK built via EAS, with all environment variables baked in. No development server needed. Background GPS runs indefinitely, surviving phone restarts via the foreground service notification: *"Lorg — Tracking your trail."*

## <span style="color:#1F4E79">What's actually in the database</span>

After one evening:

| Metric | Value |
|--------|-------|
| GPS samples | 14+ |
| Weather records | 28 |
| Steps recorded | 22 |
| Distance | 0.1 km (stayed home) |
| Battery drain tracked | 93% → 81% |
| Screen time | 1h 03m |
| Location | Letterkenny, Co. Donegal |
| Streak | Day 1 |

Not much. But it's not about one evening. It's about every evening, every morning, every walk, every drive, for the rest of a life. The worm grows.

## <span style="color:#1F4E79">What's next</span>

| Phase | What | Status |
|-------|------|--------|
| 0 | GPS + steps + weather → backend → Mnemos | **Done** |
| 1 | 3D glowworm visualisation at lorg.ie | Next |
| 2 | Health Connect — real daily steps, heart rate, HRV | Planned |
| 3 | Weather ambient glow on the worm | Planned |
| 4 | Expenditure — TrueLayer PSD2 for Irish banks | Planned |
| 5 | Léargas integration — cognitive anchors on the worm | Planned |

## <span style="color:#1F4E79">Foxxe Take</span>

Seven hours is not a lot of time. But it's enough to build a pipe that will run for years.

The interesting thing about Lorg isn't the technology — it's GPS, a database, and a phone app. The interesting thing is the *record*. A continuous, machine-readable trace of a human life at five-minute resolution. Where you were. How fast you walked. Whether it was raining. Whether your phone was in your pocket or in your hand. Whether you slept or paced.

No fitness app does this. Fitness apps care about workouts. Lorg cares about *everything* — the texture of ordinary time. The walk to the shop that wasn't exercise. The evening you didn't leave the house. The morning you drove to Derry and back.

When Phase 1 renders the worm, you'll be able to see a week of your life as a glowing thread through space-time. Thick where you walked, thin where you sat, coloured by weather, anchored by the cognitive markers that Léargas will eventually provide.

A four-dimensional self-portrait, drawn by living.

---

*Built by Todd McCaffrey and Claude Opus 4.6 on 21 March 2026, Letterkenny, Co. Donegal.*
*22 steps. The trail begins.*
