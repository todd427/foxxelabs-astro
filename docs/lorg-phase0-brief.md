# Lorg Phase 0 — Claude Code Brief
## Personal Worldline Data Collection

**Date:** 2026-03-21  
**Repo:** todd427/lorg (new repo, create it)  
**Goal:** Get data flowing. No visualisation yet. Just collect.

Read docs/lorg-prd.md in todd427/foxxelabs-astro for full context.

---

## What Phase 0 Builds

Three things:

1. **FastAPI backend** on Fly.io — receives and stores samples
2. **React Native mobile app** — collects GPS + steps + screen state, pushes to backend
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
  date        DATE PRIMARY KEY,
  steps_total INTEGER,
  active_minutes INTEGER,
  locations   JSONB,          -- [{lat, lng, name, duration_min}]
  weather_avg JSONB,          -- {temp_c, condition, humidity}
  mnemos_ingested BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### API endpoints

```
POST /api/samples         — receive batch of samples from mobile
POST /api/weather         — receive weather update from mobile
GET  /api/status          — health check, returns doc count + last sample time
GET  /api/day/{date}      — return all samples + weather for a given date (YYYY-MM-DD)
GET  /api/worm?start=&end= — return samples for a time range (for visualisation, Phase 1)
POST /api/summaries/generate?date= — trigger daily summary generation
```

### Authentication
Simple API key — mobile app sends `X-API-Key: {secret}` header.
Key stored as Fly.io secret: `LORG_API_KEY`.

### Daily summary generation (ingest_mnemos.py)

Run at midnight (or triggered manually). For a given date:

1. Query all samples for that date
2. Compute: total steps, active minutes (periods with steps_delta > 0), location clusters
3. Query weather for that date — average temp, dominant condition
4. Format as a plain-text document:

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

### Env vars / secrets needed on Fly.io
```
LORG_API_KEY          — auth key for mobile → backend
DATABASE_URL          — Fly Postgres connection string
MNEMOS_URL            — https://mnemos.foxxelabs.ie
MNEMOS_API_KEY        — Mnemos API key
OPENWEATHER_API_KEY   — OpenWeatherMap key (Todd to supply)
```

### Fly.io deployment
App name: `lorg-foxxelabs`  
Region: `lhr` (London, same as Mnemos)  
Machine: shared-cpu-1x, 256MB RAM (tiny — just storing JSON)  
Postgres: Fly managed Postgres (free tier)

---

## Component 2: React Native Mobile App

### Setup
```bash
npx create-expo-app lorg-mobile --template blank
cd lorg-mobile
npx expo install expo-location expo-sensors expo-task-manager expo-background-fetch
```

### LocationService.js

Background GPS sampling every 5 minutes.

```js
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK = 'lorg-location';
const SAMPLE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data;
  // Store locally, sync later
  await SyncService.queueSample({
    ts: new Date().toISOString(),
    lat: locations[0].coords.latitude,
    lng: locations[0].coords.longitude,
    altitude: locations[0].coords.altitude,
    accuracy: locations[0].coords.accuracy,
  });
});

export async function startTracking() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: SAMPLE_INTERVAL_MS,
    distanceInterval: 50,  // also trigger if moved 50m
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Lorg',
      notificationBody: 'Tracking your trail',
    },
  });
}
```

### BiometricService.js

Steps from pedometer. Screen state from AppState.

```js
import { Pedometer } from 'expo-sensors';
import { AppState } from 'react-native';

let lastStepCount = 0;
let screenOn = true;

AppState.addEventListener('change', state => {
  screenOn = state === 'active';
});

export async function getStepDelta() {
  const end = new Date();
  const start = new Date(end - 5 * 60 * 1000);
  const result = await Pedometer.getStepCountAsync(start, end);
  return result.steps;
}

export function isScreenOn() { return screenOn; }
```

### WeatherService.js

Call OpenWeatherMap every 30 minutes based on current location.

```js
const OWM_KEY = process.env.EXPO_PUBLIC_OWM_KEY;

export async function fetchWeather(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OWM_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return {
    ts: new Date().toISOString(),
    lat, lng,
    temp_c: data.main.temp,
    feels_like: data.main.feels_like,
    condition: data.weather[0].main.toLowerCase(),
    humidity: data.main.humidity,
    wind_kph: data.wind.speed * 3.6,
    wind_dir: degToCompass(data.wind.deg),
    uv_index: null,  // requires separate OWM call, add in Phase 2
  };
}

function degToCompass(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}
```

### SyncService.js

Queue samples locally (AsyncStorage), push to backend when on WiFi or every 15 minutes.

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BACKEND = process.env.EXPO_PUBLIC_LORG_URL; // https://lorg-foxxelabs.fly.dev
const API_KEY = process.env.EXPO_PUBLIC_LORG_KEY;

export async function queueSample(sample) {
  const existing = JSON.parse(await AsyncStorage.getItem('lorg_queue') || '[]');
  existing.push(sample);
  await AsyncStorage.setItem('lorg_queue', JSON.stringify(existing));

  // Try to sync if queue is getting large
  if (existing.length >= 12) await sync();
}

export async function sync() {
  const queue = JSON.parse(await AsyncStorage.getItem('lorg_queue') || '[]');
  if (!queue.length) return;

  try {
    const resp = await fetch(`${BACKEND}/api/samples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ samples: queue }),
    });
    if (resp.ok) {
      await AsyncStorage.setItem('lorg_queue', '[]');
    }
  } catch (e) {
    // Network unavailable — keep in queue
  }
}
```

### HomeScreen.js — minimal status UI

Just enough to confirm it's working:

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

No maps, no charts — that's Phase 1. This screen just confirms the service is running and data is flowing.

### app.json permissions needed
```json
{
  "expo": {
    "plugins": [
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Lorg tracks your location to build your personal timeline.",
        "isIosBackgroundLocationEnabled": true
      }]
    ],
    "ios": {
      "infoPlist": {
        "NSMotionUsageDescription": "Lorg uses motion data to count your steps."
      }
    }
  }
}
```

---

## Environment Variables

Create `.env` in the mobile app root (gitignored):
```
EXPO_PUBLIC_LORG_URL=https://lorg-foxxelabs.fly.dev
EXPO_PUBLIC_LORG_KEY=    ← ask Todd for this (same as LORG_API_KEY on Fly)
EXPO_PUBLIC_OWM_KEY=     ← ask Todd for this (OpenWeatherMap API key)
```

---

## Definition of Done — Phase 0

### Backend
- [ ] FastAPI app created with `samples`, `weather`, `daily_summaries` tables
- [ ] `POST /api/samples` accepts batches, stores to DB
- [ ] `POST /api/weather` accepts weather updates, stores to DB
- [ ] `GET /api/status` returns health + last sample timestamp
- [ ] `GET /api/day/{date}` returns day's data as JSON
- [ ] `ingest_mnemos.py` generates daily summary + POSTs to Mnemos
- [ ] Deployed to Fly.io as `lorg-foxxelabs` in `lhr` region
- [ ] All secrets set via `fly secrets set`

### Mobile app
- [ ] Background GPS sampling runs every 5 minutes
- [ ] Steps counted per sample window
- [ ] Screen state captured
- [ ] Weather fetched every 30 minutes
- [ ] Samples queued locally, synced to backend every 15 min or on queue size
- [ ] HomeScreen shows today's steps, active time, last sync time, current weather
- [ ] App survives phone restart and resumes tracking

### Integration
- [ ] At least one full day of samples in the backend DB
- [ ] Daily summary generated for that day
- [ ] Summary ingested into Mnemos
- [ ] Query Mnemos for "lorg" — returns the summary

---

## Notes for Claude Code

- Todd is on Android (Rose/Daisy/Lava are all PCs, but his phone is Android — ask him to confirm before finalising iOS-specific code)
- Expo is preferred over bare React Native — easier deployment and OTA updates
- The backend pattern should follow Mnemos (FastAPI + Fly.io) — Todd knows that stack
- Battery efficiency is important — 5-minute GPS is the minimum that gives a useful trail; don't go shorter
- The queue-and-sync pattern in SyncService is deliberate — don't switch to real-time WebSockets, it kills battery
- OpenWeatherMap free tier is sufficient — don't suggest paid tiers
- For the Mnemos daily summary, use the same POST /api/ingest pattern as all other ingest scripts
