# Lorg — Product Requirements Document
## Personal Worldline Visualisation

**Irish:** *lorg* — track, trail, trace, footprint  
**Status:** Concept — pre-development  
**Owner:** Todd McCaffrey / FoxxeLabs  
**Date:** 2026-03-21  
**Version:** 0.1

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

### 2.5 Derived / Computed
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

### 3.3 Views

**Worm view (primary):** 3D tube in space-time. X/Y = geography, Z = time. Orbitable, zoomable, scrubbable with a time slider.

**Map view:** Project the worm onto a 2D map (Mapbox/Leaflet). Time is shown as colour gradient along the path — oldest = faded, newest = bright.

**Timeline view:** Flatten to a 2D chart. X = time, Y = metric selector (heart rate / steps / expenditure / temperature). The worm becomes a set of correlated time series.

**Day slice:** Select a single day. The worm for that day is shown in isolation, with all events annotated. Weather shown as background gradient. Expenditure events listed chronologically.

### 3.4 Interaction
- **Scrub:** Time slider moves a highlight along the worm
- **Tap/click an event marker:** Expand transaction or Léargas anchor details
- **Pinch/zoom:** Drill into a time period
- **Long-press a segment:** "What was happening here?" — queries Mnemos for context from that date/time
- **Privacy mode:** Blur location to city-level, hide expenditure amounts — shareable version

---

## 4. Architecture

### 4.1 Mobile App (data collection)
**React Native** — single codebase for iOS and Android.

Core modules:
- `LocationService` — background GPS sampling, geofence management
- `BiometricService` — steps (Pedometer API), heart rate (HealthKit/Health Connect), ambient light
- `WeatherService` — periodic OpenWeatherMap calls, cached by location cluster
- `SyncService` — batches samples and pushes to Lorg backend every 15 minutes, or immediately on WiFi

The app runs as a background service. UI is minimal — a status indicator, a quick day-view of the current day's worm, and settings.

### 4.2 Backend (data store + API)
**FastAPI on Fly.io** (same pattern as Mnemos).

Endpoints:
- `POST /samples` — receive batched samples from mobile
- `GET /worm?start=&end=` — return processed worm data for a time range
- `GET /day/{date}` — full day data including weather and transactions
- `POST /transactions/sync` — webhook receiver for TrueLayer
- `GET /export` — full data export (JSON / CSV)

Storage:
- **TimescaleDB** or plain **PostgreSQL with time-series partitioning** — samples are append-only time-series data
- Alternatively: **InfluxDB** (purpose-built for this pattern)
- Transactions in a separate table, linked to samples by timestamp interpolation

### 4.3 Visualisation (web)
Static HTML + Three.js + Mapbox GL JS. Lives at `lorg.foxxelabs.ie` (or `lorg.irish`).

Data is fetched from the backend API, rendered client-side. No server-side rendering needed.

### 4.4 Mnemos Integration
The Lorg backend periodically generates daily summary documents and ingests them into Mnemos:

```
2024-08-19 — Daily Summary
Steps: 3,240 (low)
Active periods: 08:15–08:45 (walk), 13:00–13:20 (lunch walk)
Resting heart rate: 68bpm (elevated vs 60bpm baseline)
Sleep: 5.4 hours (poor, estimated)
Weather: 22°C, clear, SW wind 12km/h
Expenditure: €2.80 Spar (coffee 08:47), €8.40 SuperValu (groceries 18:22)
Location: Letterkenny (home + town centre)
```

This makes the physical record searchable via Mnemos and visible as anchors in Léargas.

---

## 5. Integrations

### 5.1 OpenWeatherMap
- Free tier: 60 calls/minute, 1M/month
- One API key, stored as Fly.io secret
- Called by backend on behalf of user — not client-side

### 5.2 TrueLayer (PSD2 Banking)
- OAuth 2.0 flow: user connects bank account in-app
- Webhook receives new transaction notifications
- Supported Irish banks: AIB, Bank of Ireland, Permanent TSB, Ulster Bank, Revolut, N26, KBC
- TrueLayer free tier: up to 100 end-users (more than sufficient for personal use)
- Credentials stored as Fly.io secrets

### 5.3 HealthKit (iOS) / Health Connect (Android)
- Read-only permissions: steps, heart rate, HRV, sleep
- User grants permission on first launch
- Data pulled on a schedule, not real-time push

### 5.4 Wearables (optional)
- Apple Watch: via HealthKit, automatic
- Wear OS (Google): via Health Connect, automatic
- Garmin / Fitbit / Whoop: via their respective SDKs or Health Connect bridge

---

## 6. Privacy

- **All data is personal and private** — no sharing, no analytics, no third-party access
- Location data is stored server-side (user's own Fly.io instance or self-hosted)
- TrueLayer tokens stored encrypted, never logged
- Export is always available — full data portability
- **Privacy mode in visualisation:** blur to city level, hide amounts, shareable
- No data is sent to Mnemos without explicit daily summary generation

---

## 7. Platform Considerations for Ireland

- PSD2 mandates bank API access — TrueLayer covers all major Irish banks
- GPS accuracy is good in urban Letterkenny; rural Donegal may have gaps
- Weather: OpenWeatherMap has good Irish Met Éireann-calibrated data for Ireland
- Irish Data Protection Commission (DPC) jurisdiction — GDPR applies; personal use exemption covers single-user deployment

---

## 8. Phased Development

### Phase 0 — Data capture only (MVP)
- Mobile app collects GPS + steps + screen state
- Pushes to backend
- No visualisation
- Goal: get the data flowing, validate battery impact

### Phase 1 — Basic worm
- 3D tube visualisation of GPS track over time
- Colour by time-of-day (no biometrics yet)
- Timeline scrubber
- Map view

### Phase 2 — Biometrics
- Add heart rate (wearable)
- Colour by heart rate
- Thickness by step cadence
- Sleep window detection

### Phase 3 — Weather
- OpenWeatherMap integration
- Ambient weather glow on worm
- Day view shows weather background

### Phase 4 — Expenditure
- TrueLayer bank integration
- Transaction event markers on worm
- Day view transaction list
- Merchant categorisation

### Phase 5 — Mnemos integration
- Daily summary generation + ingest
- Léargas anchor markers (cognitive events on physical worm)
- "What was happening here?" queries

---

## 9. Open Questions

1. **Self-hosted vs managed backend?** Fly.io personal instance (most private) vs a managed Lorg service (more scalable for AuthorsOwn expansion)
2. **InfluxDB vs PostgreSQL?** InfluxDB is purpose-built for time-series but adds operational complexity
3. **React Native vs Flutter?** Either works; React Native preferred given existing JS/TS stack
4. **Domain:** `lorg.irish`? `lorg.foxxelabs.ie`? `lorg.agora.irish`?
5. **Battery impact:** 5-minute GPS sampling in background — needs real-device testing on both iOS and Android

---

## 10. Why This Matters

The worm is not a productivity tool. It is not a health dashboard. It is a memory — the physical complement to the cognitive memory that Léargas builds from conversations and documents.

When you look back at August 2024 in Léargas and see "Dutch Boy — intense writing sprint," the worm will show you what that felt like in your body: the reduced sleep, the elevated heart rate, the afternoons you barely moved, the coffees you bought to push through. The two systems together answer both "what were you thinking?" and "what were you experiencing?"

That is as close as software can come to genuine episodic memory.

---

*PRD status: first draft. Awaiting architectural review before development begins. Post-viva priority.*
