# Lorg Phase 0 — Claude Code Brief
## Personal Worldline Data Collection

**Date:** 2026-03-21  
**Domain:** lorg.ie (registered)  
**Repo:** todd427/lorg (new repo, create it)  
**Platform:** Android (Expo/React Native)  
**Goal:** Get data flowing. No visualisation yet. Just collect.

Read docs/lorg-prd.md in todd427/foxxelabs-astro for full context.

---

## What Phase 0 Builds

Three things:

1. **FastAPI backend** on Fly.io — receives and stores samples
2. **React Native / Expo mobile app** — collects GPS + steps + screen state, pushes to backend
3. **Mnemos daily summary ingestion** — generates a daily summary document and pushes to Mnemos

No visualisation. No wearables. No bank integration yet. Just the pipe.

---

## Repo Structure

```
lorg/
  backend/
    main.py              ← FastAPI app
    models.py            ← SQLAlchemy models
    database.py          ← DB connection
    ingest_mnemos.py     ← Daily summary → Mnemos
    requirements.txt
    Dockerfile
    fly.toml
  mobile/
    App.js               ← React Native entry
    src/
      services/
        LocationService.js
        BiometricService.js
        SyncService.js
        WeatherService.js
      screens/
        HomeScreen.js    ← Minimal status UI
        SettingsScreen.js
    package.json
    app.json
  README.md
```

---

## Component 1: Backend (FastAPI + PostgreSQL on Fly.io)

### Database schema

```sql
-- Raw samples (every 2-5 min from phone)
CREATE TABLE samples (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  altitude    DOUBLE PRECISION,
  accuracy    REAL,
  steps_delta INTEGER,        -- steps since last sample
  steps_total INTEGER,        -- cumulative steps today
  screen_on   BOOLEAN,
  battery     REAL,           -- 0.0-1.0
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_samples_ts ON samples (ts DESC);

-- Weather (every 30 min, at current location)
CREATE TABLE weather (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  temp_c      REAL,
  feels_like  REAL,
  condition   TEXT,           -- "clear", "rain", "cloudy" etc.
  humidity    INTEGER,
  wind_kph    REAL,
  wind_dir    TEXT,
  uv_index    REAL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_ts ON weather (ts DESC);

-- Daily summaries (generated at midnight)
CREATE TABLE daily_summaries (
  date             DATE PRIMARY KEY,
  steps_total      INTEGER,
  active_minutes   INTEGER,
  locations        JSONB,    -- [{lat, lng, name, duration_min}]
  weather_avg      JSONB,    -- {temp_c, condition, humidity}
  mnemos_ingested  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### API endpoints

```
POST /api/samples              — receive batch of samples from mobile
POST /api/weather              — receive weather update from mobile
GET  /api/status               — health check, returns doc count + last sample time
GET  /api/day/{date}           — return all samples + weather for a given date (YYYY-MM-DD)
GET  /api/worm?start=&end=     — return samples for a time range (for visualisation, Phase 1)
POST /api/summaries/generate?date= — trigger daily summary generation
```

### Authentication
Simple API key — mobile app sends `X-API-Key: {secret}` header.
Key stored as Fly.io secret: `LORG_API_KEY`.

### Daily summary generation (ingest_mnemos.py)

Run at midnight (or triggered manually). For a given date:

1. Query all samples for that date
2. Compute: total steps, active minutes, location clusters
3. Query weather for that date — average temp, dominant condition
4. Format as plain-text document:

```
2026-03-21 — Daily Summary (Lorg)
Location: Letterkenny, Co. Donegal, Ireland
Steps: 4,280 | Active: 38 minutes
Weather: 9°C, overcast, humidity 78%
Active periods:
  08:15–08:47 (walk, 1.2km)
  13:05–13:22 (walk, 0.6km)
  17:30–17:55 (walk, 1.1km)
Screen on: 6h 22m
```

5. POST to Mnemos `/api/ingest` with:
   - `source: "lorg"`
   - `sft_tag: "lorg"`
   - `metadata.date: "2026-03-21"`
   - `metadata.type: "daily_summary"`

### Fly.io secrets required
```
LORG_API_KEY          — auth key for mobile → backend
DATABASE_URL          — Fly Postgres connection string
MNEMOS_URL            — https://mnemos.foxxelabs.ie
MNEMOS_API_KEY        — Mnemos API key
OPENWEATHER_API_KEY   — OpenWeatherMap key (Todd to supply when key activates)
```

### Fly.io deployment
App name: `lorg-foxxelabs`  
Region: `lhr` (London, same as Mnemos)  
Machine: shared-cpu-1x, 256MB RAM  
Postgres: Fly managed Postgres (free tier)

---

## Component 2: React Native / Expo Mobile App

### Platform: Android only for Phase 0. iOS later.

### Setup
```bash
npx create-expo-app lorg-mobile --template blank
cd lorg-mobile
npx expo install expo-location expo-sensors expo-task-manager expo-background-fetch @react-native-async-storage/async-storage
```

### LocationService.js — background GPS every 5 minutes

```js
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK = 'lorg-location';
const SAMPLE_INTERVAL_MS = 5 * 60 * 1000;

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data;
  const loc = locations[0];
  await SyncService.queueSample({
    ts:       new Date().toISOString(),
    lat:      loc.coords.latitude,
    lng:      loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy,
  });
});

export async function startTracking() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy:        Location.Accuracy.Balanced,
    timeInterval:    SAMPLE_INTERVAL_MS,
    distanceInterval: 50,
    foregroundService: {
      notificationTitle: 'Lorg',
      notificationBody:  'Tracking your trail',
    },
  });
}
```

### BiometricService.js — steps + screen state

```js
import { Pedometer } from 'expo-sensors';
import { AppState } from 'react-native';

let screenOn = true;
AppState.addEventListener('change', s => { screenOn = s === 'active'; });

export async function getStepDelta() {
  const end   = new Date();
  const start = new Date(end - 5 * 60 * 1000);
  const result = await Pedometer.getStepCountAsync(start, end);
  return result.steps;
}

export function isScreenOn() { return screenOn; }
```

### WeatherService.js — OpenWeatherMap every 30 min

```js
const OWM_KEY = process.env.EXPO_PUBLIC_OWM_KEY;

export async function fetchWeather(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OWM_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return {
    ts:         new Date().toISOString(),
    lat, lng,
    temp_c:     data.main.temp,
    feels_like: data.main.feels_like,
    condition:  data.weather[0].main.toLowerCase(),
    humidity:   data.main.humidity,
    wind_kph:   data.wind.speed * 3.6,
    wind_dir:   degToCompass(data.wind.deg),
    uv_index:   null,
  };
}

function degToCompass(deg) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
}
```

### SyncService.js — queue locally, flush to backend

```js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND = process.env.EXPO_PUBLIC_LORG_URL;
const API_KEY = process.env.EXPO_PUBLIC_LORG_KEY;

export async function queueSample(sample) {
  const existing = JSON.parse(await AsyncStorage.getItem('lorg_queue') || '[]');
  existing.push(sample);
  await AsyncStorage.setItem('lorg_queue', JSON.stringify(existing));
  if (existing.length >= 12) await sync();
}

export async function sync() {
  const queue = JSON.parse(await AsyncStorage.getItem('lorg_queue') || '[]');
  if (!queue.length) return;
  try {
    const resp = await fetch(`${BACKEND}/api/samples`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body:    JSON.stringify({ samples: queue }),
    });
    if (resp.ok) await AsyncStorage.setItem('lorg_queue', '[]');
  } catch (e) {
    // Network unavailable — keep in queue, retry next cycle
  }
}
```

### HomeScreen.js — minimal status display

```
LORG                                    [● tracking]

Today
Steps: 3,240
Active: 28 min
Last sync: 14:23
Location: Letterkenny

Weather: 9°C  ⛅ Overcast

                              [Settings]
```

No maps, no charts — that's Phase 1.

### app.json
```json
{
  "expo": {
    "name": "Lorg",
    "slug": "lorg",
    "platforms": ["android"],
    "plugins": [
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Lorg tracks your location to build your personal timeline."
      }]
    ],
    "android": {
      "permissions": [
        "ACCESS_BACKGROUND_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACTIVITY_RECOGNITION"
      ]
    }
  }
}
```

### .env (gitignored)
```
EXPO_PUBLIC_LORG_URL=https://lorg-foxxelabs.fly.dev
EXPO_PUBLIC_LORG_KEY=        ← set when Fly secret is created
EXPO_PUBLIC_OWM_KEY=         ← set when OpenWeatherMap key activates (~2hr after signup)
```

---

## Definition of Done — Phase 0

### Backend
- [ ] FastAPI app with `samples`, `weather`, `daily_summaries` tables
- [ ] `POST /api/samples` accepts batches, stores to DB
- [ ] `POST /api/weather` accepts weather updates
- [ ] `GET /api/status` returns health + last sample timestamp
- [ ] `GET /api/day/{date}` returns JSON
- [ ] `ingest_mnemos.py` generates daily summary + POSTs to Mnemos
- [ ] Deployed to Fly.io `lorg-foxxelabs` in `lhr`
- [ ] All secrets set via `fly secrets set`

### Mobile
- [ ] Background GPS every 5 minutes (survives phone restart)
- [ ] Steps per sample window
- [ ] Screen state captured
- [ ] Weather every 30 minutes
- [ ] Queue-and-sync to backend
- [ ] HomeScreen shows steps, active time, last sync, weather

### Integration
- [ ] One full day of samples in DB
- [ ] Daily summary generated
- [ ] Summary visible in Mnemos (`query: "lorg daily summary"`)

---

## Notes for Claude Code

- **Android only for Phase 0.** Do not write iOS-specific code yet.
- **Expo preferred** over bare React Native — OTA updates, simpler builds.
- **Backend pattern = Mnemos.** FastAPI + Fly.io. Todd knows this stack.
- **Battery:** 5-minute GPS is the floor. Do not go shorter.
- **Queue-and-sync is deliberate.** No WebSockets, no real-time push — they drain battery.
- **OpenWeatherMap free tier only.** No paid tier suggestions.
- **Mnemos ingest:** use the same `POST /api/ingest` pattern as all other Mnemos ingest scripts.
- **Fly.io secrets** are secure — AES-256 at rest, injected as env vars at runtime, values never exposed via API or dashboard.
- **Domain:** lorg.ie is registered. The visualisation frontend (Phase 1) will live there. Backend can use `lorg-foxxelabs.fly.dev` for now.
