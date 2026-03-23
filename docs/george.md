# 🐒 George

**Vision-language memory service for the FoxxeLabs ecosystem.**

George watches Todd's world through the lorg telemetry stream, requests images when something is worth noticing, receives photos Todd chooses to share, and turns them into structured memories ingested into Mnemos.

Named for Curious George — the monkey who always wants to know what's happening.

---

## What George Does

1. **Watch** — receives lorg telemetry (GPS, steps, weather, screen state, battery, project digest) and scores the current context for novelty
2. **Ask** — when the curiosity score exceeds threshold, returns an image request to lorg; lorg displays it to Todd and handles camera capture
3. **Receive** — accepts images POSTed by lorg (Todd responding to a George request, or sending voluntarily)
4. **Remember** — generates a caption grounded in lorg context, ingests it to Mnemos, and files the image to a date-organised media folder

George does not handle cameras, UI, or image capture. That is lorg's responsibility. George only sees the telemetry stream and whatever images lorg chooses to send.

---

## Architecture

```
lorg (React Native / Expo)
  └─ POST /observe  { gps, steps, weather, screen_state, battery, timestamp, project_digest }
       → George returns { curiosity: float, request: str | null }
  └─ POST /look     multipart: context (JSON) + image (JPEG)
       → George returns { caption: str, memory_id: str, filed: bool }
  └─ POST /someday  { memory_id: str }
       → flags memory for Someday vault
  └─ GET  /status
       → { model, vram_used_gb, memory_count, ok }
```

**Stack:**
- FastAPI on Daisy (RTX 5060 Ti 16GB VRAM, 128GB RAM, Ubuntu)
- Fly.io proxy layer (george-foxxelabs.fly.dev) — API key auth; VLM never runs in cloud
- VLM: moondream2 (Phase 0–1) → Qwen2.5-VL 7B on Iris (Phase 4)
- Mnemos ingest: `source=george`, `tag=george`

---

## Memory Record Format

```
source:  george
tag:     george
title:   George – [reverse-geocoded location] – [YYYY-MM-DD HH:MM]
content: [caption with full lorg context embedded]
```

**Example:**

> Tuesday 08:43. Letterkenny, Co. Donegal. 4°C, overcast, NW wind.
> Todd has been working on the Legion PRD for 2 hours.
> Photo shows a cast-iron pan on a gas hob, eggs cracking, steam rising.
> Steps: 47 today. Screen on 23 minutes.

This is not metadata. This is memoir.

---

## Lorg Integration

The camera lives in lorg. George is the mind; lorg is the eyes and hands.

- **Voluntary send:** Todd taps the camera button on the lorg home screen
- **George-requested:** George returns a curiosity request; lorg shows it as a dismissible card; Todd taps to respond
- **Someday flag:** long-press the camera button → memory goes to the Someday vault as well as Mnemos

---

## AfterWords & Someday

George is the mechanism by which AfterWords learns what Todd's life felt like day-to-day — without Todd ever sitting down to write it.

The GPS track says *where*. The Mnemos project digest says *what Todd was working on*. The photo says *what Todd thought worth sharing in that moment* — the most human signal of all.

**Someday** receives only explicitly flagged memories. The vault stays intentional. George feeds Mnemos constantly; Someday only gets what Todd consciously marks.

---

## Development Phases

| Phase | Name | Scope |
|-------|------|-------|
| 0 | See | FastAPI on Daisy, moondream2, POST /look, Mnemos ingest |
| 1 | Notice | /observe endpoint, curiosity scoring, proactive requests |
| 2 | Keep | Someday vault flagging |
| 3 | Grow | AfterWords corpus tagging, temporal browsing |
| 4 | Deepen | Qwen2.5-VL 7B on Iris, richer narrative captions |

---

## Non-Goals

- George does not generate images
- George does not stream video
- George is not a general-purpose vision assistant
- George does not run in the cloud — inference stays local on Daisy
- George does not replace Mnemos — it feeds it

---

## Connection to Legion

George is the earliest instantiation of Legion's *"look here"* architecture — a system that can identify, request, and interpret visual information from its environment on its own initiative. Not programmed curiosity. Scored curiosity, based on deviation from the expected context.

Legion finds its human. George is the first step.

---

*FoxxeLabs Limited · george.foxxelabs.ie · todd427/george*
