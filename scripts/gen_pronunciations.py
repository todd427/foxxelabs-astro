#!/usr/bin/env python3
"""
gen_pronunciations.py — FoxxeLabs Irish pronunciation generator
Runs on Daisy as a cron job (weekly, Sunday 02:00).

What it does:
  1. Reads pronunciations.json (the source of truth for Irish names)
  2. Fetches AZURE_SPEECH_KEY + AZURE_SPEECH_REGION from Rialú key vault
  3. Generates an MP3 for each entry (Orla voice, 0.85 rate) via Azure TTS
  4. Skips entries whose MP3 already exists and hasn't changed
  5. Regenerates public/pronunciation/index.html from the manifest
  6. Git commits + pushes only if anything changed

Usage:
  cd /home/Projects/foxxelabs-astro
  python scripts/gen_pronunciations.py

  # Force regeneration of all MP3s even if they exist:
  python scripts/gen_pronunciations.py --force

  # Dry run (show what would change, write nothing):
  python scripts/gen_pronunciations.py --dry-run

Dependencies:
  pip install requests  (already in most venvs)

Secrets (pulled from Rialú at runtime):
  AZURE_SPEECH_KEY    — Azure Speech resource key
  AZURE_SPEECH_REGION — e.g. northeurope

Cron entry (add to Daisy crontab):
  0 2 * * 0 cd /home/Projects/foxxelabs-astro && python scripts/gen_pronunciations.py >> /home/Projects/logs/gen_pronunciations.log 2>&1
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
REPO_DIR     = SCRIPT_DIR.parent
MANIFEST     = REPO_DIR / "public" / "pronunciation" / "pronunciations.json"
AUDIO_DIR    = REPO_DIR / "public" / "pronunciation" / "audio"
WIDGET_HTML  = REPO_DIR / "public" / "pronunciation" / "index.html"
LOG_PREFIX   = "[gen_pronunciations]"

# ── Azure TTS ─────────────────────────────────────────────────────────────────
VOICE_ORLA   = "ga-IE-OrlaNeural"
VOICE_COLM   = "ga-IE-ColmNeural"
TTS_RATE     = "0.85"
OUTPUT_FMT   = "audio-24khz-48kbitrate-mono-mp3"

# ── Rialú ─────────────────────────────────────────────────────────────────────
RIALU_API    = "https://rialu.ie/api"
RIALU_KEY_AZURE_SPEECH = "AZURE_SPEECH_KEY"
RIALU_KEY_AZURE_REGION = "AZURE_SPEECH_REGION"


def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


def get_rialu_secret(key_name: str) -> str:
    """Pull a secret from Rialú. Reads RIALU_API_KEY from env."""
    api_key = os.environ.get("RIALU_API_KEY")
    if not api_key:
        raise RuntimeError("RIALU_API_KEY not set in environment")
    r = requests.get(
        f"{RIALU_API}/keys/{key_name}",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    return data["value"]


def get_azure_creds() -> tuple[str, str]:
    """Return (key, region) from Rialú, or fall back to env vars."""
    key    = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION")
    if key and region:
        log("Using AZURE_SPEECH_KEY/REGION from environment")
        return key, region
    log("Fetching Azure credentials from Rialú...")
    key    = get_rialu_secret(RIALU_KEY_AZURE_SPEECH)
    region = get_rialu_secret(RIALU_KEY_AZURE_REGION)
    return key, region


def azure_tts(text: str, key: str, region: str, voice: str = VOICE_ORLA) -> bytes:
    """Call Azure TTS REST API directly. Returns raw MP3 bytes."""
    ssml = (
        f"<speak version='1.0' xml:lang='ga-IE'>"
        f"<voice name='{voice}'>"
        f"<prosody rate='{TTS_RATE}'>{text}</prosody>"
        f"</voice></speak>"
    )
    endpoint = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    r = requests.post(
        endpoint,
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": OUTPUT_FMT,
            "User-Agent": "foxxelabs-gen-pronunciations",
        },
        data=ssml.encode("utf-8"),
        timeout=30,
    )
    r.raise_for_status()
    return r.content


def mp3_content_hash(path: Path) -> str:
    if not path.exists():
        return ""
    return hashlib.md5(path.read_bytes()).hexdigest()


def generate_audio(entries: list, key: str, region: str, force: bool, dry_run: bool) -> list[str]:
    """Generate MP3s for all entries. Returns list of changed slugs."""
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    changed = []

    for entry in entries:
        slug  = entry["slug"]
        irish = entry["irish"]

        for voice_key, voice_name in [("orla", VOICE_ORLA), ("colm", VOICE_COLM)]:
            out_path = AUDIO_DIR / f"{slug}-{voice_key}.mp3"

            if out_path.exists() and not force:
                log(f"  skip  {out_path.name} (exists, use --force to regenerate)")
                continue

            log(f"  gen   {out_path.name}  ← '{irish}' ({voice_name})")
            if dry_run:
                log(f"  [dry-run] would write {out_path}")
                continue

            mp3_bytes = azure_tts(irish, key, region, voice_name)
            out_path.write_bytes(mp3_bytes)
            changed.append(out_path.name)
            log(f"  wrote {out_path.name} ({len(mp3_bytes):,} bytes)")
            time.sleep(0.3)  # polite rate limiting

    return changed


def generate_html(entries: list, dry_run: bool) -> bool:
    """Regenerate the pronunciation widget HTML. Returns True if changed."""

    rows = ""
    for e in entries:
        slug    = e["slug"]
        name    = e["name"]
        phonetic= e["phonetic"]
        ipa     = e["ipa"]
        meaning = e["meaning"]
        rows += f"""    <tr>
      <td class="name">{name}</td>
      <td class="phonetic">{phonetic}</td>
      <td class="ipa">{ipa}</td>
      <td class="meaning">
        <button class="speak-btn" onclick="speak(this,'{slug}','orla')" title="Orla">▶</button>
        <button class="speak-btn colm-btn" onclick="speak(this,'{slug}','colm')" title="Colm">▶</button>
        {meaning}
      </td>
    </tr>\n"""

    html = f"""<!DOCTYPE html>
<html lang="ga">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FoxxeLabs — Pronunciation Guide</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{
    --bg:      #0d0e10;
    --bg2:     #141618;
    --border:  #2a2e35;
    --border2: #3a3f48;
    --text:    #d4d7dc;
    --text2:   #8a8f99;
    --text3:   #555c66;
    --teal:    #3eada0;
    --teal-bg: #091614;
    --teal-bd: #1e5a55;
    --amber:   #d4950f;
  }}
  body {{
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Mono', 'Fira Mono', monospace;
    font-size: 13px;
    padding: 16px 20px 20px;
  }}
  .header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }}
  .header-label {{
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text3);
  }}
  .voice-legend {{
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }}
  .legend-dot {{
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }}
  .dot-orla {{ background: var(--teal); }}
  .dot-colm {{ background: var(--amber); }}
  table {{ width: 100%; border-collapse: collapse; }}
  tr {{ border-bottom: 1px solid var(--border); }}
  tr:last-child {{ border-bottom: none; }}
  td {{ padding: 9px 6px; vertical-align: middle; }}
  td.name {{ font-weight: 500; color: var(--text); width: 110px; }}
  td.phonetic {{ color: var(--teal); width: 120px; font-size: 12px; }}
  td.ipa {{ color: var(--text3); font-size: 11px; width: 150px; }}
  td.meaning {{ color: var(--text2); font-size: 11px; }}
  .speak-btn {{
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    width: 24px; height: 22px;
    cursor: pointer;
    font-size: 9px;
    color: var(--teal);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, opacity 0.15s;
    margin-right: 3px;
  }}
  .speak-btn.colm-btn {{ color: var(--amber); border-color: var(--border); }}
  .speak-btn:hover {{ border-color: var(--border2); opacity: 0.8; }}
  .speak-btn.playing {{ opacity: 0.4; pointer-events: none; }}
  .note {{
    margin-top: 14px;
    font-size: 10px;
    color: var(--text3);
    line-height: 1.6;
    border-top: 1px solid var(--border);
    padding-top: 10px;
  }}
  .note a {{ color: var(--teal); text-decoration: none; }}
</style>
</head>
<body>
<div class="header">
  <span class="header-label">Click ▶ to hear — Orla &amp; Colm voices</span>
  <div class="voice-legend">
    <span><span class="legend-dot dot-orla"></span>Orla (f)</span>
    <span><span class="legend-dot dot-colm"></span>Colm (m)</span>
  </div>
</div>
<table>
  <tbody>
{rows}  </tbody>
</table>
<p class="note">Native Irish voices by <a href="https://ga-say.sionnach.ie">ga-say</a> · Azure Neural ga-IE · Audio generated offline, served as static MP3.</p>
<script>
const BASE = '/pronunciation/audio/';
let _cur = null;

function speak(btn, slug, voice) {{
  if (_cur) {{ _cur.pause(); _cur = null; }}
  document.querySelectorAll('.speak-btn.playing').forEach(b => b.classList.remove('playing'));
  btn.classList.add('playing');
  const audio = new Audio(BASE + slug + '-' + voice + '.mp3');
  _cur = audio;
  audio.onended = () => {{ btn.classList.remove('playing'); _cur = null; }};
  audio.onerror = () => {{ btn.classList.remove('playing'); _cur = null; fallback(slug); }};
  audio.play();
}}

function fallback(slug) {{
  const u = new SpeechSynthesisUtterance(slug);
  u.lang = 'ga'; u.rate = 0.75;
  window.speechSynthesis.speak(u);
}}
</script>
</body>
</html>
"""

    existing = WIDGET_HTML.read_text(encoding="utf-8") if WIDGET_HTML.exists() else ""
    if html == existing:
        log("  index.html unchanged")
        return False

    if not dry_run:
        WIDGET_HTML.write_text(html, encoding="utf-8")
        log(f"  wrote {WIDGET_HTML}")
    else:
        log(f"  [dry-run] would rewrite {WIDGET_HTML}")
    return True


def git_commit_push(changed_files: list[str], dry_run: bool):
    """Stage changed files and push if anything changed."""
    if not changed_files:
        log("Nothing to commit.")
        return

    if dry_run:
        log(f"[dry-run] would commit: {changed_files}")
        return

    log(f"Committing {len(changed_files)} changed file(s)...")
    subprocess.run(["git", "-C", str(REPO_DIR), "add",
                    "public/pronunciation/"], check=True)
    msg = f"chore: regenerate pronunciation audio ({len(changed_files)} file(s))"
    subprocess.run(["git", "-C", str(REPO_DIR), "commit", "-m", msg], check=True)
    subprocess.run(["git", "-C", str(REPO_DIR), "push"], check=True)
    log("Pushed to origin.")


def main():
    parser = argparse.ArgumentParser(description="Generate FoxxeLabs Irish pronunciation MP3s")
    parser.add_argument("--force",   action="store_true", help="Regenerate all MP3s even if they exist")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change, write nothing")
    parser.add_argument("--no-push", action="store_true", help="Generate files but skip git commit/push")
    args = parser.parse_args()

    log("═══════════════════════════════════════════")
    log("FoxxeLabs pronunciation generator")
    log(f"force={args.force}  dry-run={args.dry_run}  no-push={args.no_push}")
    log("═══════════════════════════════════════════")

    # Load manifest
    if not MANIFEST.exists():
        log(f"ERROR: manifest not found at {MANIFEST}")
        sys.exit(1)
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))["entries"]
    log(f"Loaded {len(entries)} entries from pronunciations.json")

    # Get Azure credentials
    try:
        key, region = get_azure_creds()
    except Exception as e:
        log(f"ERROR: could not get Azure credentials: {e}")
        sys.exit(1)
    log(f"Azure region: {region}")

    # Generate audio
    changed = generate_audio(entries, key, region, args.force, args.dry_run)

    # Regenerate HTML
    html_changed = generate_html(entries, args.dry_run)
    if html_changed:
        changed.append("index.html")

    # Commit + push
    if not args.no_push:
        git_commit_push(changed, args.dry_run)
    else:
        log(f"--no-push: skipping git. Changed: {changed}")

    log("Done.")


if __name__ == "__main__":
    main()
