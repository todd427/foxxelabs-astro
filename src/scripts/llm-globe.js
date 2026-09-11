// src/scripts/llm-globe.js
//
// The LLM Observatory globe, as plain JavaScript on a 2D canvas.
//
// This replaces a Claude Design canvas export that ran a React component through
// a 54KB dc-runtime inside a nested iframe at a fixed 1920x1080, scaled to fit.
// Nothing here needs React, a runtime, or an iframe: it sizes to whatever box you
// give it and reads the site's own theme attribute.
//
// Deliberately dropped in the port (see the page copy, which no longer claims
// them): the WebAudio layer that blipped on each release, and the usage-flow
// arcs, which were illustrative rather than measured. The capability spikes are
// NOT the arcs and are still drawn — "raised by capability" is a real axis here.

import { MODELS, ORGS, MAKER_HUES, COAST } from '../data/llm-observatory.js';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const START = new Date('2017-05-01').getTime();
const END = new Date('2026-10-01').getTime();
const SPEEDS = [1, 2, 4];
const TAU = Math.PI * 2;

const fmtParams = (b) => {
  if (b >= 1000) return (b / 1000).toFixed(b >= 10000 ? 0 : 2).replace(/\.?0+$/, '') + 'T';
  if (b >= 1) return Math.round(b) + 'B';
  return Math.round(b * 1000) + 'M';
};
const fmtDate = (ms) => {
  const d = new Date(ms);
  return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
};
const hexA = (h, a) => {
  let s = String(h || '#888').replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export class LlmGlobe {
  /**
   * @param {HTMLElement} root  container carrying the canvas and chrome
   * @param {object} opts
   *   bare            — hero mode: no chrome wiring, autoplay, loop
   *   timelineSeconds — seconds for a full 2017→2026 sweep
   *   markerScale     — multiplier on marker radius
   */
  constructor(root, opts = {}) {
    this.root = root;
    this.opts = { timelineSeconds: 45, markerScale: 1, bare: false, autoplay: false, ...opts };

    this.canvas = root.querySelector('[data-globe-canvas]');
    this.ctx = this.canvas.getContext('2d');

    // Work on a copy so a second instance on the same page (hero + standalone)
    // can hold its own colours without fighting over one shared array.
    this.models = MODELS.map((m) => ({ ...m }));

    this.t = 0;               // 0..1 position along the timeline
    this.spin = 0;            // degrees
    this.tilt = 0.32;         // radians
    this.speed = 1;
    this.playing = false;
    this.finished = false;
    this.spinOn = true;
    this.sound = false;        // opt-in only; see toggleSound
    this.dragging = false;
    this.scrubbing = false;
    this.selected = null;
    this._targetSpin = null;
    this._count = -1;
    this._last = null;
    this._ts = 0;
    this._moved = 0;

    this._running = true;
    this.frame = this.frame.bind(this);
    this.applyPalette();
    this.layout();
    this.bind();
    this._raf = requestAnimationFrame(this.frame);
  }

  setRunning(on) {
    if (on === this._running) return;
    this._running = on;
    if (on) {
      this._last = null;                 // don't charge the gap to one frame
      this._raf = requestAnimationFrame(this.frame);
    } else {
      cancelAnimationFrame(this._raf);
    }
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    if (this._mo) this._mo.disconnect();
    if (this._vo) this._vo.disconnect();
    if (this._actx) { try { this._actx.close(); } catch { /* already closed */ } }
    for (const [target, type, fn] of this._listeners || []) target.removeEventListener(type, fn);
  }

  // ── Geometry ───────────────────────────────────────────────────────────────
  // Derive the globe from the canvas's actual box so the same code serves a
  // full-bleed phone, a hero strip and the standalone page.
  layout() {
    const rect = this.canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width || 960));
    const H = Math.max(1, Math.round(rect.height || 540));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W;
    this.H = H;

    if (W <= 700) {
      // Phone, or the hero at narrow widths: centre it and let it fill.
      this.cx = W * 0.5;
      this.cy = H * 0.46;
      this.R = Math.min(W * 0.46, H * 0.4);
    } else if (this.opts.bare) {
      this.cx = W * 0.5;
      this.cy = H * 0.5;
      this.R = Math.min(W * 0.26, H * 0.42);
    } else {
      // Original framing: cx 648, cy 540, R 360 at 1920x1080.
      this.cx = W * 0.42;
      this.cy = H * 0.5;
      this.R = Math.min(W * 0.3, H * 0.4);
    }

    const n = Math.max(70, Math.round((W * H) / 9876));
    this.stars = [];
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.25, a: Math.random() * 0.45 + 0.12,
        tw: Math.random() * 0.004 + 0.001, ph: Math.random() * 6.28,
      });
    }
  }

  // Resolve the observatory palette off the document. The vars are defined per
  // site theme in the component's stylesheet, so a theme flip needs only a
  // re-read — no second source of truth for colour.
  applyPalette() {
    // Resolve against the component's own element, not <html>. Normally that
    // inherits the site theme; the homepage hero pins data-theme="dark" on the
    // container instead, because the hero lays a dark scrim under white copy and
    // a pale globe beneath it reads as a washed-out mistake rather than a light
    // theme. Reading from `root` serves both without a special case.
    const host = this.root.closest('[data-theme]') || document.documentElement;
    const theme = host.getAttribute('data-theme') || 'dark';
    const cs = getComputedStyle(this.root);
    const v = (n) => cs.getPropertyValue(n).trim();
    const hues = MAKER_HUES[theme] || MAKER_HUES.dark;

    this.pal = {
      theme,
      dark: theme === 'dark',
      globe1: v('--ob-globe-1'), globe2: v('--ob-globe-2'), globe3: v('--ob-globe-3'),
      atmo0: v('--ob-atmo-0'), atmo1: v('--ob-atmo-1'), atmo2: v('--ob-atmo-2'),
      grat: v('--ob-grat'), coast: v('--ob-coast'), label: v('--ob-canvas-label'),
    };
    for (const m of this.models) m.color = hues[m.org];
    this.hues = hues;
    if (this.selected) this.renderCard(this.selected);
    this.renderLegend();
  }

  // Orthographic projection. `s` scales the radius, which is how the capability
  // spike lifts a marker off the surface.
  proj(lat, lon, s) {
    const la = (lat * Math.PI) / 180;
    const lo = ((lon + this.spin) * Math.PI) / 180;
    const x = Math.cos(la) * Math.sin(lo);
    const y = Math.sin(la);
    const z = Math.cos(la) * Math.cos(lo);
    const ca = Math.cos(this.tilt);
    const sa = Math.sin(this.tilt);
    return {
      x: this.cx + this.R * x * s,
      y: this.cy - this.R * (y * ca - z * sa) * s,
      z: y * sa + z * ca,
    };
  }

  // ── Frame ──────────────────────────────────────────────────────────────────
  frame(ts) {
    this._ts = ts;
    if (this._last == null) this._last = ts;
    const dt = Math.min(80, ts - this._last);
    this._last = ts;

    if (this.playing && !this.scrubbing) {
      this.t += (dt / 1000 / this.opts.timelineSeconds) * this.speed;
      if (this.t >= 1) {
        this.t = 1;
        if (this.opts.bare) { this.t = 0; this._count = -1; }   // hero: keep blooming
        else { this.playing = false; this.finished = true; this.syncButtons(); }
      }
    }

    // Easing toward a selected marker beats snapping: the reader keeps their
    // bearings on the globe while it turns to face the thing they clicked.
    if (this._targetSpin != null) {
      const d = ((this._targetSpin - this.spin + 540) % 360) - 180;
      if (Math.abs(d) < 0.4) { this.spin = this._targetSpin; this._targetSpin = null; }
      else this.spin += d * 0.12;
    } else if (this.spinOn && !this.dragging && !this.selected) {
      this.spin += dt * 0.006;
    }

    this.draw();
    this.updateChrome();
    this._raf = requestAnimationFrame(this.frame);
  }

  draw() {
    const ctx = this.ctx;
    const { cx, cy, R } = this;
    const pal = this.pal;
    const ts = this._ts;
    ctx.clearRect(0, 0, this.W, this.H);

    if (pal.dark) {
      for (const s of this.stars) {
        ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(ts * s.tw + s.ph));
        ctx.fillStyle = pal.label;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const g = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.08, cx, cy, R);
    g.addColorStop(0, pal.globe1); g.addColorStop(0.6, pal.globe2); g.addColorStop(1, pal.globe3);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

    ctx.save();
    if (pal.dark) ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(cx, cy, R * 0.93, cx, cy, R * 1.13);
    rg.addColorStop(0, pal.atmo0); rg.addColorStop(0.55, pal.atmo1); rg.addColorStop(1, pal.atmo2);
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.13, 0, TAU); ctx.fill();
    ctx.restore();

    // Graticule, then coastlines. Both walk the path and break it wherever the
    // point falls behind the limb, so the far side never shows through.
    ctx.strokeStyle = pal.grat; ctx.lineWidth = 1;
    for (let lon = -150; lon <= 180; lon += 30) this.strokePath(ctx, -80, 80, 3, (lat) => this.proj(lat, lon, 1));
    for (let lat = -60; lat <= 60; lat += 30) this.strokePath(ctx, -180, 180, 3, (lon) => this.proj(lat, lon, 1));

    ctx.strokeStyle = pal.coast; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
    for (const line of COAST) {
      ctx.beginPath();
      let started = false;
      for (const c of line) {
        const p = this.proj(c[1], c[0], 1);
        if (p.z > 0.01) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
        } else started = false;
      }
      ctx.stroke();
    }

    const ms = START + this.t * (END - START);
    const released = this.models.filter((m) => m.t <= ms);
    if (released.length !== this._count) {
      const prev = this._count;
      this._count = released.length;
      // One blip for one arrival, and only while the timeline is running. A
      // scrub jumps the count by dozens; firing per model there would be a
      // machine-gun, so the step has to be exactly one.
      if (this.sound && this.playing && released.length === prev + 1 && released.length > 0) {
        this.blip(released[released.length - 1]);
      }
      this.updateStats(released);
    }
    this.drawMarkers(ctx, released, ms);
  }

  // Shared walker for graticule lines: `from`..`to` stepped by `step`, hidden
  // wherever the projected point is on the far hemisphere.
  strokePath(ctx, from, to, step, project) {
    ctx.beginPath();
    let started = false;
    for (let i = from; i <= to; i += step) {
      const p = project(i);
      if (p.z > 0) {
        if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);
      } else started = false;
    }
    ctx.stroke();
  }

  // Markers, back-to-front so nearer ones overlap farther ones.
  drawMarkers(ctx, released, ms) {
    const newest = released[released.length - 1];
    const scale = this.opts.markerScale;

    const vis = released
      .map((m) => ({ m, p: this.proj(m.lat + m.jlat, m.lon + m.jlon, 1) }))
      .filter((o) => o.p.z > 0.02)
      .sort((a, b) => a.p.z - b.p.z);

    for (const { m, p } of vis) {
      const color = m.color;
      const ageDays = (ms - m.t) / 86400000;
      const grow = Math.max(0, Math.min(1, ageDays / 40));
      if (grow <= 0) continue;

      const a = Math.min(1, p.z / 0.14) * Math.min(1, grow);
      const r = (2 + 6 * Math.sqrt(m.params / 1760)) * scale * (0.4 + 0.6 * grow);

      // Capability spike — the model lifted off the surface by its score.
      const h = (0.06 + ((m.score - 35) / 100) * 0.5) * grow;
      const ap = this.proj(m.lat + m.jlat, m.lon + m.jlon, 1 + h);
      ctx.save();
      if (this.pal.dark) ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexA(color, 0.5 * a);
      ctx.lineWidth = 1.4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 7 * grow;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ap.x, ap.y); ctx.stroke();
      ctx.fillStyle = hexA(color, 0.9 * a);
      ctx.beginPath(); ctx.arc(ap.x, ap.y, 1.7, 0, TAU); ctx.fill();
      ctx.restore();

      if (m === newest && ageDays < 70) {
        ctx.save();
        ctx.font = "600 13px 'IBM Plex Mono', ui-monospace, monospace";
        ctx.fillStyle = hexA(color, a);
        ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.textAlign = 'left';
        ctx.fillText(m.name, ap.x + 9, ap.y - 1);
        ctx.restore();
      }

      ctx.save();
      if (this.pal.dark) ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = color;
      ctx.shadowBlur = 9 * grow;
      if (m.open) {
        // Open weights read as a ring; closed weights as a filled disc.
        ctx.strokeStyle = hexA(color, 0.95 * a); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        ctx.fillStyle = hexA(color, 0.28 * a);
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.42, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = hexA(color, 0.92 * a);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      }

      if (m === newest && ageDays < 70) {
        const pu = ageDays / 70;
        ctx.strokeStyle = hexA(color, (1 - pu) * a * 0.9);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 6 + 22 * pu, 0, TAU); ctx.stroke();
      }
      if (m === this.selected) {
        const pr = 6 + 5 * Math.sin(this._ts * 0.006);
        ctx.strokeStyle = hexA(color, 0.9 * a); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 8 + pr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = hexA(color, 0.4 * a); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 15 + pr * 1.5, 0, TAU); ctx.stroke();
      }
      ctx.restore();

      if (m === this.selected) {
        ctx.save();
        ctx.font = "600 14px 'IBM Plex Mono', ui-monospace, monospace";
        ctx.fillStyle = hexA(color, Math.min(1, a + 0.2));
        ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.textAlign = 'left';
        ctx.fillText(m.name, p.x + r + 14, p.y - 2);
        ctx.restore();
      }
    }
    this._vis = vis;
  }

  // ── Chrome ─────────────────────────────────────────────────────────────────
  // Written straight to the DOM each frame rather than through a render pass.
  // The date and the scrubber change every frame; nothing else does.
  el(name) { return this.root.querySelector(`[data-globe-${name}]`); }

  updateChrome() {
    if (this.opts.bare) return;
    const ms = START + this.t * (END - START);
    const date = this.el('date');
    if (date) date.textContent = fmtDate(ms);
    const pct = this.t * 100 + '%';
    const fill = this.el('fill');
    if (fill) fill.style.width = pct;
    const handle = this.el('handle');
    if (handle) handle.style.left = pct;
    const track = this.el('track');
    if (track) track.setAttribute('aria-valuenow', String(Math.round(this.t * 100)));
  }

  updateStats(released) {
    if (this.opts.bare) return;
    const set = (name, value) => { const e = this.el(name); if (e) e.textContent = value; };
    set('count', released.length);
    set('labs', new Set(released.map((m) => m.lab)).size);
    set('countries', new Set(released.map((m) => m.country)).size);
    set('maxp', released.length ? fmtParams(Math.max(...released.map((m) => m.params))) : '—');

    const list = this.el('latest');
    if (!list) return;
    list.innerHTML = '';
    for (const m of released.slice(-4).reverse()) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ob-latest-row';
      btn.innerHTML =
        `<span class="ob-swatch" style="background:${m.color}"></span>` +
        `<span class="ob-latest-name"></span>` +
        `<span class="ob-latest-meta"></span>`;
      btn.querySelector('.ob-latest-name').textContent = m.name;
      btn.querySelector('.ob-latest-meta').textContent =
        `${m.open ? 'open' : 'closed'} · ${fmtParams(m.params)} · ${m.score}`;
      btn.addEventListener('click', () => this.select(m));
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  renderLegend() {
    const wrap = this.el('legend');
    if (!wrap || !this.hues) return;
    wrap.innerHTML = '';
    for (const key of Object.keys(ORGS)) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ob-swatch" style="background:${this.hues[key]}"></span><span></span>`;
      li.lastElementChild.textContent = ORGS[key].label;
      wrap.appendChild(li);
    }
  }

  renderCard(m) {
    const card = this.el('card');
    if (!card) return;
    if (!m) { card.hidden = true; card.innerHTML = ''; return; }
    card.hidden = false;
    card.innerHTML =
      `<button class="ob-card-close" type="button" aria-label="Close">×</button>` +
      `<h3></h3><p class="ob-card-lab"></p>` +
      `<dl class="ob-card-facts">` +
      `<div><dt>Released</dt><dd data-f="date"></dd></div>` +
      `<div><dt>Parameters</dt><dd data-f="params"></dd></div>` +
      `<div><dt>Capability</dt><dd data-f="score"></dd></div>` +
      `<div><dt>Weights</dt><dd data-f="open"></dd></div>` +
      `<div><dt>Where</dt><dd data-f="where"></dd></div>` +
      `</dl>`;
    card.querySelector('h3').textContent = m.name;
    card.querySelector('h3').style.color = m.color;
    card.querySelector('.ob-card-lab').textContent = m.lab;
    const f = (k) => card.querySelector(`[data-f="${k}"]`);
    f('date').textContent = fmtDate(m.t);
    f('params').textContent = fmtParams(m.params);
    f('score').textContent = `${m.score} / 100`;
    f('open').textContent = m.open ? 'Open' : 'Closed';
    f('where').textContent = `${m.cityName}, ${m.country}`;
    card.querySelector('.ob-card-close').addEventListener('click', () => this.clear());
  }

  // ── Sound ──────────────────────────────────────────────────────────────────
  // An ambient drone plus one blip per model as it appears, pitched by
  // capability and panned to where it sits on the globe. Carried over from the
  // page this replaces, with one deliberate change: it starts OFF and only ever
  // starts from a click on the Sound button. The original defaulted it on and
  // unlocked on the first pointerdown anywhere on the page, which meant a
  // reader who clicked a marker got a drone they never asked for.
  initAudio() {
    if (this._actx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;                       // no WebAudio: the button stays inert
    const ac = new AC();
    this._actx = ac;

    this._master = ac.createGain();
    this._master.gain.value = 0;
    this._master.connect(ac.destination);

    this._ambGain = ac.createGain();
    this._ambGain.gain.value = 0;
    this._ambGain.connect(this._master);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    lp.Q.value = 4;
    lp.connect(this._ambGain);

    const base = 55;
    [1, 1.5, 2.005].forEach((mu, i) => {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * mu;
      const g = ac.createGain();
      g.gain.value = i === 0 ? 0.55 : 0.22;
      o.connect(g); g.connect(lp); o.start();
    });
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.06;
    const lg = ac.createGain();
    lg.gain.value = 220;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();

    // C major pentatonic over ~2.5 octaves, so any two blips are consonant.
    this._scale = [];
    [0, 12, 24].forEach((oct) => [0, 2, 4, 7, 9].forEach((n) => this._scale.push(220 * Math.pow(2, (n + oct) / 12))));
    this._scale.sort((a, b) => a - b);
  }

  blip(m) {
    const ac = this._actx;
    if (!ac || !this._scale || !this.sound) return;
    const t = ac.currentTime;
    const sc = this._scale;
    const idx = Math.max(0, Math.min(sc.length - 1, Math.round(((m.score - 34) / (93 - 34)) * (sc.length - 1))));
    const f = sc[idx];

    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.value = 0;
    if (ac.createStereoPanner) {
      const pan = ac.createStereoPanner();
      const p = this.proj(m.lat, m.lon, 1);
      pan.pan.value = Math.max(-1, Math.min(1, (p.x - this.cx) / this.R));
      g.connect(pan); pan.connect(this._master);
    } else {
      g.connect(this._master);
    }
    o.connect(g);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0007, t + 0.95);
    o.start(t); o.stop(t + 1.0);

    const o2 = ac.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = f * 2;
    const g2 = ac.createGain();
    g2.gain.value = 0;
    o2.connect(g2); g2.connect(this._master);
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.06, t + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.0006, t + 0.6);
    o2.start(t); o2.stop(t + 0.7);
  }

  toggleSound() {
    this.sound = !this.sound;
    if (this.sound) {
      this.initAudio();
      if (!this._actx) { this.sound = false; return; }   // unsupported; stay off
      // The click that turned it on is the gesture that unlocks playback.
      if (this._actx.resume) this._actx.resume();
      const t = this._actx.currentTime;
      this._master.gain.cancelScheduledValues(t);
      this._master.gain.setValueAtTime(this._master.gain.value, t);
      this._master.gain.linearRampToValueAtTime(0.85, t + 0.8);
      this._ambGain.gain.linearRampToValueAtTime(0.05, t + 1.2);
    } else if (this._actx) {
      const t = this._actx.currentTime;
      this._master.gain.cancelScheduledValues(t);
      this._master.gain.setValueAtTime(this._master.gain.value, t);
      this._master.gain.linearRampToValueAtTime(0, t + 0.5);
    }
    this.syncButtons();
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  select(m) {
    this.selected = m;
    // Bring the model round to face the reader, and stop the idle spin so it
    // stays there while they read the card.
    this._targetSpin = ((-(m.lon + m.jlon) + 540) % 360) - 180;
    this.renderCard(m);
  }

  clear() {
    this.selected = null;
    this._targetSpin = null;
    this.renderCard(null);
  }

  // Hit-test the drawn markers. `_vis` is last frame's visible set, already in
  // draw order, so walking it backwards picks the topmost marker first.
  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.W / rect.width;
    const x = (clientX - rect.left) * sx;
    const y = (clientY - rect.top) * (this.H / rect.height);
    const vis = this._vis || [];
    for (let i = vis.length - 1; i >= 0; i--) {
      const { m, p } = vis[i];
      const r = (2 + 6 * Math.sqrt(m.params / 1760)) * this.opts.markerScale;
      const hit = Math.max(9, r + 6);          // generous: markers are small
      if ((p.x - x) ** 2 + (p.y - y) ** 2 <= hit * hit) return m;
    }
    return null;
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    (this._listeners = this._listeners || []).push([target, type, fn]);
  }

  bind() {
    const cv = this.canvas;

    this.on(window, 'resize', () => this.layout());

    // Stop drawing while off screen. Purely a cost saver — the globe is fully
    // constructed either way, so a browser that never delivers these callbacks
    // (a background tab, say) simply keeps animating rather than showing
    // nothing at all.
    if ('IntersectionObserver' in window) {
      this._vo = new IntersectionObserver((entries) => {
        for (const e of entries) this.setRunning(e.isIntersecting);
      }, { rootMargin: '150px' });
      this._vo.observe(this.root);
    }
    // BaseLayout flips data-theme on <html>; re-read rather than keep a copy.
    const mo = new MutationObserver(() => this.applyPalette());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this._mo = mo;

    if (this.opts.bare) { this.playing = true; this.speed = 2; return; }
    if (this.opts.autoplay) this.playing = true;

    // Drag to rotate. `_moved` separates a drag from a click so releasing after
    // a spin does not also select whatever happens to be under the cursor.
    this.on(cv, 'pointerdown', (e) => {
      this.dragging = true;
      this._moved = 0;
      this.lx = e.clientX;
      this.ly = e.clientY;
      cv.style.cursor = 'grabbing';
      try { cv.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
    });
    this.on(cv, 'pointermove', (e) => {
      if (!this.dragging) return;
      const sc = cv.getBoundingClientRect().width / this.W || 1;
      const dx = e.clientX - this.lx;
      const dy = e.clientY - this.ly;
      this._moved += Math.abs(dx) + Math.abs(dy);
      this.spin += (dx / sc) * 0.32;
      this.tilt = Math.max(-0.25, Math.min(1.05, this.tilt + (dy / sc) * 0.004));
      this.lx = e.clientX;
      this.ly = e.clientY;
    });
    const endDrag = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      cv.style.cursor = 'grab';
      if (this._moved < 5) {
        const m = this.pick(e.clientX, e.clientY);
        if (m) this.select(m); else this.clear();
      }
    };
    this.on(cv, 'pointerup', endDrag);
    this.on(cv, 'pointercancel', () => { this.dragging = false; cv.style.cursor = 'grab'; });

    this.bindControls();
  }

  bindControls() {
    const click = (name, fn) => { const e = this.el(name); if (e) this.on(e, 'click', fn); };

    click('play', () => {
      if (this.finished) { this.t = 0; this._count = -1; this.finished = false; this.playing = true; }
      else this.playing = !this.playing;
      this.syncButtons();
    });
    click('reset', () => {
      this.t = 0; this._count = -1; this.playing = false; this.finished = false;
      this.syncButtons();
    });
    click('speed', () => {
      this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length];
      this.syncButtons();
    });
    click('sound', () => this.toggleSound());
    click('spin', () => {
      this.spinOn = !this.spinOn;
      if (this.spinOn) this.clear();
      this.syncButtons();
    });

    const track = this.el('track');
    if (track) {
      const setFromX = (clientX) => {
        const r = track.getBoundingClientRect();
        this.t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        this._count = -1;
        this.finished = false;
      };
      this.on(track, 'pointerdown', (e) => {
        this.scrubbing = true;
        this.playing = false;
        this.syncButtons();
        setFromX(e.clientX);
        try { track.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
      });
      this.on(track, 'pointermove', (e) => { if (this.scrubbing) setFromX(e.clientX); });
      this.on(track, 'pointerup', () => { this.scrubbing = false; });
      this.on(track, 'pointercancel', () => { this.scrubbing = false; });
      // Keyboard scrubbing: the track is a real slider, so arrows must work.
      this.on(track, 'keydown', (e) => {
        const step = e.shiftKey ? 0.1 : 0.02;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') this.t = Math.min(1, this.t + step);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') this.t = Math.max(0, this.t - step);
        else if (e.key === 'Home') this.t = 0;
        else if (e.key === 'End') this.t = 1;
        else return;
        e.preventDefault();
        this._count = -1;
        this.playing = false;
        this.finished = false;
        this.syncButtons();
      });
    }

    this.syncButtons();
  }

  syncButtons() {
    const play = this.el('play');
    if (play) {
      play.textContent = this.playing ? '❚❚' : '▶';
      play.setAttribute('aria-label', this.playing ? 'Pause the timeline' : 'Play the timeline');
    }
    const speed = this.el('speed');
    if (speed) speed.textContent = this.speed + '×';
    const spin = this.el('spin');
    if (spin) spin.setAttribute('aria-pressed', String(this.spinOn));
    const sound = this.el('sound');
    if (sound) {
      sound.setAttribute('aria-pressed', String(this.sound));
      sound.setAttribute('aria-label', this.sound ? 'Mute the globe' : 'Unmute the globe');
    }
  }
}
