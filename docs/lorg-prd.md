# Lorg — Product Requirements Document
## Personal Worldline Visualisation

**Irish:** *lorg* — track, trail, trace, footprint  
**Domain:** lorg.ie (registered 2026-03-21)  
**Status:** Phase 0 in development  
**Owner:** Todd McCaffrey / FoxxeLabs  
**Date:** 2026-03-21  
**Version:** 0.3

---

## 1. The Concept

Every person traces a path through four-dimensional space — three spatial dimensions plus time. Visualised, this path looks like a worm moving through the world: thin and slow when resting, fat and fast when active, coiling through familiar spaces, occasionally striking out to new territory.

Lorg makes this worm visible.

It is a personal data layer — a continuous, low-friction record of where you are, how your body is performing, what the environment is doing around you, and what you're spending money on. These streams are correlated and rendered as a living trail through time and space.

The worm is not a fitness tracker. It is not a map. It is a temporal record of a human life, at the resolution of lived experience.

### 1.1 The Baby Analogy

An infant brain continuously ingests: position in space, body temperature, heart rate, ambient light and sound, hunger and satiation signals, the faces and voices of caregivers. This stream of raw correlated sensory + physiological data is the substrate from which memory, identity, and understanding of the world is built.

Adults have the same data available — GPS, heart rate, step cadence, ambient light, weather, expenditure — but have never had a tool that captures and correlates it as a continuous stream. Lorg does this.

### 1.2 Relationship to Léargas

Léargas maps what you were *thinking* — conversations, writing sessions, research, projects. It is a cognitive map.

Lorg maps what you were *doing and experiencing* — where you were, how you felt physically, what the weather was, what you spent. It is an episodic map.

Together they form a complete personal intelligence layer. The writing sprint that produced Dutch Boy in August 2024 shows up in Léargas as a dominant topic. Lorg shows that during that same period, sleep quality degraded, resting heart rate elevated, steps dropped, and the weather was warm. The cognitive and physical records correlate into a coherent memory of that time.

### 1.3 Relationship to George

George is a separate service that reads the lorg telemetry feed and acts as a curiosity engine — deciding when something in the stream is worth noticing, and requesting a photo. Lorg is George's eyes and hands: it sends the telemetry, delivers image requests to Todd as cards, and provides the camera for capture and sending.

The camera is a lorg feature. George is the mind that interprets what the camera sends.

---

## 2. Data Streams

### 2.1 Position (every 2–5 minutes)
- Latitude, longitude, altitude
- Accuracy radius
- Source: device GPS / network
- **Battery strategy:** 5-minute interval in background, 30-second in foreground. Geofence triggers on enter/exit known places.

### 2.2 Biometrics (every 2–5 minutes, device-dependent)
- Steps delta (since last sample) — universal, accelerometer-based
- Heart rate — wearable if present (Wear OS, Apple Watch, Garmin), otherwise omitted
- Heart rate variability — wearable only, valuable stress indicator
- Ambient light level — device sensor, approximates indoor/outdoor
- Screen state — on/off, proxy for cognitive activity

**No workout history required.** The step cadence tells the movement story. HRV tells the stress story. Screen state tells the attention story.

### 2.3 Weather (every 30 minutes at current location)
- Temperature (°C), feels-like
- Condition: clear, cloudy, rain, snow, fog
- Humidity, wind speed and direction
- UV index (daytime only)
- **Source:** OpenWeatherMap free tier (1M calls/month, 60/minute — more than sufficient)
- Weather is correlated by time and location, not pulled continuously — one call per location cluster per 30 minutes

### 2.4 Expenditure (event-driven, retroactive)
- Timestamp, amount, currency
- Merchant name (raw from bank, then normalised)
- Category (auto-classified: food, transport, groceries, coffee, etc.)
- Location (from transaction metadata where available, otherwise interpolated from GPS log at that time)
- **Source:** TrueLayer PSD2 API (Ireland: AIB, Bank of Ireland, KBC, Revolut, N26, etc.)
- Transactions arrive hours to days after the event — the worm is annotated retroactively
- Revolut additionally exports real-time push notifications — higher fidelity for Revolut users

### 2.5 Images (user-initiated + George-requested)
- Single JPEG captures from device camera
- Two paths:
  - **Voluntary:** Todd taps the camera button on the lorg home screen — "look here"
  - **George-requested:** George sends a curiosity request; lorg displays it as a card; Todd taps to respond
- Both paths package the current telemetry context (GPS, weather, steps, screen state, timestamp) with the image and POST to the George service
- Optional long-press on the camera button flags the resulting memory for the Someday vault
- Images are not stored in lorg — they are sent to George, which files them and ingests a caption to Mnemos

### 2.6 Derived / Computed
- **Place detection:** cluster GPS points into named places (home, work, specific shops) using DBSCAN on historical data
- **Journey detection:** identify transitions between places, mode of transport (walking/driving inferred from speed)
- **Sleep windows:** infer from screen-off + low movement + time of day + heart rate drop
- **Stress score:** derived from HRV + heart rate + movement patterns

---

## 3. The Visualisation — The Worm

### 3.1 Core Geometry
A Three.js `TubeGeometry` following a series of GPS-timestamped points, with Z axis representing time (newer = higher). The camera can orbit, zoom, and scrub through time.

### 3.2 Visual Encoding

| Channel | Data | Encoding |
|---------|------|----------|
| Tube colour | Heart rate | Cool blue (rest) → warm yellow → red (elevated) |
| Tube thickness | Activity level (step cadence) | Thin = stationary, fat = active |
| Tube opacity | Sleep quality (estimated) | Transparent = poor sleep, solid = well-rested |
| Tube texture | HRV (if available) | Smooth = low stress, rough/noisy = high stress |
| Ambient glow | Weather | Blue haze = rain, warm glow = sunny, white = fog |
| Event markers | Expenditure | Small glowing spheres floating off the tube at transaction location/time |
| Mnemos anchors | Cognitive events | Larger, labelled markers: "Writing: Dutch Boy", "Meeting: ATU viva" |
| Photo markers | George memories | Small camera icon on the worm at capture location/time; tap to view caption |

### 3.3 Views

**Worm view (primary):** 3D tube in space-time. X/Y = geography, Z = time. Orbitable, zoomable, scrubbable with a time slider.

**Map view:** Project the worm onto a 2D map (Mapbox/Leaflet). Time is shown as colour gradient along the path — oldest = faded, newest = bright.

**Timeline view:** Flatten to a 2D chart. X = time, Y = metric selector (heart rate / steps / expenditure / temperature). The worm becomes a set of correlated time series.

**Day slice:** Select a single day. The worm for that day is shown in isolation, with all events annotated. Weather shown as background gradient. Expenditure events listed chronologically.

### 3.4 Interaction
- **Scrub:** Time slider moves a highlight along the worm
- **Tap/click an event marker:** Expand transaction or Léargas anchor details
- **Tap a photo marker:** Show the George caption for that image
- **Pinch/zoom:** Drill into a time period
- **Long-press a segment:** "What was happening here?" — queries Mnemos for context from that date/time
- **Privacy mode:** Blur location to city-level, hide expenditure amounts — shareable version

---

## 4. Architecture

### 4.1 Mobile App (data collection)
**React Native / Expo** — Android first (Todd is on Android), iOS later.

Core modules:
- `LocationService` — background GPS sampling, geofence management
- `BiometricService` — steps (Pedometer API), heart rate (Health Connect), ambient light
- `WeatherService` — periodic OpenWeatherMap calls, cached by location cluster
- `SyncService` — batches samples and pushes to Lorg backend every 15 minutes, or immediately on WiFi
- `GeorgeService` — polls George /observe endpoint on each telemetry sync; displays curiosity request cards; handles camera capture and POST to George /look

The app runs as a background service. UI is minimal — a status indicator, a quick day-view of the current day's worm, and settings.

### 4.2 George Integration (mobile)

The home screen has a camera icon in the card row alongside weather, steps, and distance.

**Voluntary send (tap camera button):**
1. Device camera opens
2. On capture: lorg packages current telemetry context + JPEG → POST to George `/look`
3. Lorg shows a brief "sent to George" confirmation

**Voluntary send with Someday flag (long-press camera button):**
1. Same as above, but lorg includes `someday: true` in the context payload
2. George routes the resulting memory to the Someday vault in addition to Mnemos

**George-requested image (curiosity card):**
1. GeorgeService receives a non-null `request` string from George `/observe`
2. Lorg displays a dismissible card above the home screen data: e.g. *"George wants to see what you're looking at"*
3. Tap card → camera opens; capture sends to George `/look`
4. Swipe away → dismissed; no image sent; George is not informed

The lorg backend proxies image POSTs to George — the mobile app never calls George directly. This keeps George's API key server-side.

### 4.3 Backend (data store + API)
**FastAPI on Fly.io** — same pattern as Mnemos, region lhr (London).

Endpoints:
- `POST /api/samples` — receive batched samples from mobile
- `POST /api/weather` — receive weather updates from mobile
- `GET /api/status` — health check, last sample time
- `GET /api/day/{date}` — full day data including weather and transactions
- `GET /api/worm?start=&end=` — return samples for a time range (Phase 1)
- `POST /api/look` — receive image + telemetry from mobile, forward to George (Phase 1)
- `GET /api/george/request` — return current George curiosity request if any (Phase 1)
- `POST /api/transactions/sync` — webhook receiver for TrueLayer (Phase 4)
- `GET /api/export` — full data export (JSON / CSV)

Storage: PostgreSQL (Fly managed Postgres, free tier). Time-series partitioned by month.

Secrets (Fly.io):
- `LORG_API_KEY` — mobile → backend auth
- `DATABASE_URL` — Fly Postgres
- `MNEMOS_URL` + `MNEMOS_API_KEY` — daily summary ingest
- `OPENWEATHER_API_KEY` — weather calls
- `GEORGE_URL` + `GEORGE_API_KEY` — George service integration (Phase 1)

### 4.4 Visualisation (web)
Static HTML + Three.js + Mapbox GL JS at `lorg.ie`.
Data fetched from backend API, rendered client-side.

### 4.5 Mnemos Integration
Daily summary documents ingested at midnight. Format:

```
2026-03-21 — Daily Summary (Lorg)
Location: Letterkenny, Co. Donegal, Ireland
Steps: 4,280 | Active: 38 minutes
Weather: 9°C, overcast, humidity 78%
Active periods:
  08:15–08:47 (walk, 1.2km)
  13:05–13:22 (walk, 0.6km)
Screen on: 6h 22m
George memories: 2
```

---

## 5. Integrations

### 5.1 OpenWeatherMap
Free tier: 60 calls/minute, 1M/month. Key stored as Fly.io secret.

### 5.2 George
George (george-foxxelabs.fly.dev) reads the lorg telemetry feed and returns curiosity scores and image requests. Lorg proxies image sends to George on behalf of the mobile app. See the George PRD for George's architecture and API.

### 5.3 TrueLayer (PSD2 Banking) — Phase 4
OAuth 2.0. Supported Irish banks: AIB, Bank of Ireland, PTSB, Revolut, N26.
Free tier: up to 100 end-users.

### 5.4 Health Connect (Android) — Phase 2
Read-only: steps, heart rate, HRV, sleep. Permission granted on first launch.

### 5.5 Wearables — Phase 2+
Wear OS via Health Connect automatic. Garmin/Fitbit via Health Connect bridge.

---

## 6. Privacy

- All data personal and private — no sharing, no analytics, no third-party access
- Location stored on user's own Fly.io instance
- TrueLayer tokens encrypted, never logged
- Images are sent to George and not retained by lorg; George files them locally on Daisy
- Full data export always available
- Privacy mode in visualisation: blur to city level, hide amounts
- No Mnemos ingest without explicit daily summary generation
- GDPR: Irish DPC jurisdiction, personal use exemption applies

---

## 7. Phased Development

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | GPS + steps + screen state → backend → Mnemos daily summary | **In development** |
| 1 | 3D worm visualisation at lorg.ie; camera button + George integration (curiosity cards, image send, Someday flag) | Planned |
| 2 | Heart rate + HRV (Health Connect), colour/thickness encoding | Planned |
| 3 | Weather — OpenWeatherMap, ambient glow on worm | Planned |
| 4 | Expenditure — TrueLayer PSD2, transaction markers | Planned |
| 5 | Léargas integration — cognitive anchors on physical worm | Planned |

---

## 8. Open Questions

1. **InfluxDB vs PostgreSQL?** PostgreSQL chosen for Phase 0 (simpler ops). Revisit if query performance degrades at scale.
2. **Battery impact** — 5-minute GPS needs real-device testing. May need to relax to 10 minutes.
3. **Wearable?** No wearable yet. Heart rate deferred to Phase 2.
4. **George poll frequency** — GeorgeService polls /observe on each telemetry sync (every 5 min). May need a push mechanism if George requests become time-sensitive.

---

## 9. Why This Matters

The worm is not a productivity tool. It is not a health dashboard. It is a memory — the physical complement to the cognitive memory that Léargas builds from conversations and documents.

When you look back at August 2024 in Léargas and see "Dutch Boy — intense writing sprint," the worm will show you what that felt like in your body: the reduced sleep, the elevated heart rate, the afternoons you barely moved, the coffees you bought to push through. The two systems together answer both "what were you thinking?" and "what were you experiencing?"

A photo of the breakfast you made on a Tuesday in March, grounded in GPS, weather, and what project you were thinking about — that is memoir. That is what the camera adds to the worm.

---

*PRD v0.3 — George integration added (camera button, curiosity cards, image proxy, Someday flag).*
