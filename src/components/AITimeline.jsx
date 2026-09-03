import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
  BarChart, Bar, LabelList,
} from "recharts";

import {
  LAST_UPDATED, MMLU_ESTIMATED_FROM_TS,
  openaiReleases, claudeReleases, mergedMmlu,
  capBenchmarks, gdpval, saturated, STATS, SOURCES,
} from "../data/ai-timeline.js";

// ─── Theme plumbing ──────────────────────────────────────────────────────────
// Recharts needs concrete colour values (the code also derives alpha variants
// by suffixing hex), so `var(--token)` can't be passed through directly.
// Instead we resolve the site's design tokens off <html> and re-resolve
// whenever BaseLayout flips data-theme.
const TOKENS = {
  bg:      "--bg",
  card:    "--card",
  text:    "--text",
  muted:   "--muted",
  border:  "--border",
  s1:      "--chart-1",
  s2:      "--chart-2",
  grid:    "--chart-grid",
  axis:    "--chart-axis",
  warn:    "--warn",
};

// Server render and first paint before hydration use the dark defaults; the
// effect below replaces them with whatever the live theme resolves to.
const FALLBACK = {
  bg: "#0b0f14", card: "#121923", text: "#e9f0f7", muted: "#9fb0c3",
  border: "rgba(255,255,255,.10)", s1: "#0e9ad4", s2: "#8b5cf6",
  grid: "rgba(255,255,255,.06)", axis: "rgba(255,255,255,.10)", warn: "#fbbf24",
};

function readTokens() {
  if (typeof window === "undefined") return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  for (const [key, prop] of Object.entries(TOKENS)) {
    const v = cs.getPropertyValue(prop).trim();
    out[key] = v || FALLBACK[key];
  }
  return out;
}

function useThemeTokens() {
  const [t, setT] = useState(FALLBACK);
  useEffect(() => {
    const sync = () => setT(readTokens());
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return t;
}

// Alpha suffix helper — tokens are authored as 6-digit hex so this is safe;
// falls back to the opaque colour if a theme ever supplies a non-hex value.
const alpha = (hex, suffix) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + suffix : hex);

// ─── Chart-level pieces ──────────────────────────────────────────────────────
const SectionDivider = ({ t, title, subtitle }) => (
  <div style={{ padding: "28px 18px 16px", borderTop: `1px solid ${t.border}`, marginTop: 8 }}>
    <div style={{ fontSize: 11, color: t.s1, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
      {title}
    </div>
    <p style={{ margin: 0, fontSize: 13, color: t.muted, lineHeight: 1.6, maxWidth: "72ch" }}>
      {subtitle}
    </p>
  </div>
);

const tooltipShell = (t) => ({
  background: t.card,
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 13,
  maxWidth: 280,
  boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
});

const MmluTooltip = ({ active, payload, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipShell(t)}>
      {payload.map(p => {
        if (p.value == null) return null;
        const isOai = p.dataKey === "openai";
        return (
          <div key={p.dataKey} style={{ marginBottom: 6 }}>
            <div style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>
              {p.payload[isOai ? "openaiModel" : "claudeModel"]}
            </div>
            <div style={{ color: t.text, fontWeight: 600 }}>{p.value.toFixed(1)}% MMLU</div>
            <div style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>
              {p.payload[isOai ? "openaiNote" : "claudeNote"]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MmluDot = ({ cx, cy, payload, dataKey, color, ring }) => {
  if (payload[dataKey] == null) return null;
  const isNew = payload.ts >= 43;
  return <circle cx={cx} cy={cy} r={isNew ? 7 : 5} fill={color} stroke={ring} strokeWidth={2} />;
};

const CapTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  const bench = capBenchmarks.find(b => b.shortName === label);
  return (
    <div style={tooltipShell(t)}>
      <div style={{ color: t.text, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {bench && <div style={{ color: t.muted, fontSize: 11, marginBottom: 8 }}>{bench.description}</div>}
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span>{" "}
          <span style={{ color: t.text }}>{p.value}%</span>
        </div>
      ))}
      {bench?.note && (
        <div style={{ color: t.muted, fontSize: 11, marginTop: 6, borderTop: `1px solid ${t.border}`, paddingTop: 6 }}>
          {bench.note}
        </div>
      )}
    </div>
  );
};

// GDPval-AA is an Elo rating, so it gets its own panel rather than a bar on the
// percentage axis. Bars are drawn against a shared local scale, labelled.
const EloPanel = ({ t }) => {
  const lo = 1650;
  const hi = Math.max(gdpval.oai.value, gdpval.cla.value) + 60;
  const pct = v => ((v - lo) / (hi - lo)) * 100;
  const rows = [
    { ...gdpval.oai, color: t.s1 },
    { ...gdpval.cla, color: t.s2 },
  ];
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ color: t.text, fontWeight: 700, fontSize: 13 }}>{gdpval.name}</div>
      <div style={{ color: t.muted, fontSize: 11, margin: "4px 0 14px", lineHeight: 1.5 }}>{gdpval.description}</div>
      {rows.map(r => (
        <div key={r.model} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: t.text, fontWeight: 600 }}>{r.model}</span>
            <span style={{ color: t.text, fontWeight: 700, fontFamily: "var(--font-mono, ui-monospace, monospace)" }}>
              {r.value.toLocaleString()} Elo
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: t.grid, overflow: "hidden" }}>
            <div style={{ width: `${pct(r.value)}%`, height: "100%", borderRadius: 5, background: r.color }} />
          </div>
        </div>
      ))}
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, borderTop: `1px solid ${t.border}`, paddingTop: 10, marginTop: 4 }}>
        {gdpval.note} Bars start at {lo.toLocaleString()} Elo, not zero.
      </div>
    </div>
  );
};

const SaturatedPanel = ({ t }) => (
  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px 18px" }}>
    <div style={{ color: t.text, fontWeight: 700, fontSize: 13 }}>{saturated.name} — saturated</div>
    <div style={{ color: t.muted, fontSize: 11, margin: "4px 0 14px", lineHeight: 1.5 }}>
      Reported for reference, not plotted: the spread no longer separates the frontier.
    </div>
    {saturated.rows.map(r => (
      <div key={r.label} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${t.grid}`,
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: t.text }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: r.series === 1 ? t.s1 : t.s2 }} />
          {r.label}
        </span>
        <span style={{ color: t.text, fontWeight: 700, fontFamily: "var(--font-mono, ui-monospace, monospace)" }}>{r.value}</span>
      </div>
    ))}
    <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, paddingTop: 10 }}>{saturated.note}</div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function AITimeline() {
  const t = useThemeTokens();

  const capData = capBenchmarks.map(b => ({
    name: b.shortName,
    OpenAI: b.oai.value,
    Claude: b.cla.value,
  }));

  const estFrom = mergedMmlu.find(d => d.ts >= MMLU_ESTIMATED_FROM_TS)?.date;
  const estTo = mergedMmlu[mergedMmlu.length - 1]?.date;

  return (
    <div style={{ background: t.bg, color: t.text, padding: "28px 0", fontFamily: "var(--font-body, system-ui, sans-serif)" }}>

      {/* ── SECTION 1: MMLU ── */}
      <SectionDivider
        t={t}
        title="Part 1 — Knowledge benchmark (MMLU), 2022–2026"
        subtitle="MMLU was the dominant benchmark from 2022 to 2025, tracking broad knowledge across 57 academic disciplines. Neither lab reports it in launch materials any more: both sit above 96% and the spread between them is inside the noise. The historical arc is still the clearest picture of how fast the gap closed — Claude entered 2023 thirteen points behind GPT-4 and had caught up by mid-2024."
      />

      {/* Stat row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12, marginBottom: 24, padding: "0 18px",
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: t.card, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{s.value}</div>
            <div style={{ fontSize: 11, color: t.s1, marginTop: 2, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, padding: "0 18px", flexWrap: "wrap", alignItems: "center" }}>
        {[{ label: "OpenAI / ChatGPT", color: t.s1 }, { label: "Anthropic / Claude", color: t.s2 }].map(({ label, color }) => (
          <span key={label} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 100,
            background: alpha(color, "1f"), border: `1px solid ${alpha(color, "55")}`,
            color: t.text, fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
        <span style={{
          fontSize: 11, padding: "3px 8px", borderRadius: 100,
          background: alpha(t.warn, "1f"), border: `1px solid ${alpha(t.warn, "66")}`,
          color: t.text, fontWeight: 600,
        }}>Shaded region = estimated, no longer reported</span>
      </div>

      {/* MMLU line chart */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: t.muted, textAlign: "right", paddingRight: 32, marginBottom: 8, letterSpacing: 1 }}>
          MMLU BENCHMARK (%) — HIGHER IS BETTER
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={mergedMmlu} margin={{ top: 8, right: 32, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            {estFrom && estTo && (
              <ReferenceArea
                x1={estFrom} x2={estTo}
                fill={t.warn} fillOpacity={0.07}
                stroke={t.warn} strokeOpacity={0.25} strokeDasharray="3 3"
              />
            )}
            <XAxis dataKey="date" tick={{ fill: t.muted, fontSize: 11 }}
              axisLine={{ stroke: t.axis }} tickLine={false}
              interval={0} angle={-35} textAnchor="end" height={52} />
            <YAxis domain={[65, 100]} ticks={[65, 70, 75, 80, 85, 90, 95, 100]}
              tick={{ fill: t.muted, fontSize: 11 }}
              axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={44} />
            <Tooltip content={<MmluTooltip t={t} />} />
            <ReferenceLine y={90} stroke={t.axis} strokeDasharray="4 4"
              label={{ value: "90%", fill: t.muted, fontSize: 10, position: "insideRight" }} />
            <ReferenceLine y={95} stroke={t.axis} strokeDasharray="4 4"
              label={{ value: "95%", fill: t.muted, fontSize: 10, position: "insideRight" }} />
            <Line type="monotone" dataKey="openai" name="OpenAI" stroke={t.s1} strokeWidth={2}
              dot={<MmluDot dataKey="openai" color={t.s1} ring={t.bg} />}
              activeDot={{ r: 7, fill: t.s1, stroke: t.bg, strokeWidth: 2 }} connectNulls />
            <Line type="monotone" dataKey="claude" name="Anthropic" stroke={t.s2} strokeWidth={2}
              dot={<MmluDot dataKey="claude" color={t.s2} ring={t.bg} />}
              activeDot={{ r: 7, fill: t.s2, stroke: t.bg, strokeWidth: 2 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MMLU release tables */}
      <div className="ait-cols" style={{ display: "grid", gap: 14, marginBottom: 12, padding: "0 18px" }}>
        {[
          { title: "OpenAI / ChatGPT", color: t.s1, releases: openaiReleases },
          { title: "Anthropic / Claude", color: t.s2, releases: claudeReleases },
        ].map(col => (
          <div key={col.title} style={{
            background: t.card, border: `1px solid ${alpha(col.color, "3a")}`,
            borderRadius: 12, padding: 16, fontSize: 12,
          }}>
            <div style={{ color: col.color, fontWeight: 700, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", fontSize: 11 }}>
              {col.title}
            </div>
            {col.releases.map((r, i) => {
              const isNewest = i === col.releases.length - 1;
              return (
                <div key={r.model} style={{
                  display: "grid", gridTemplateColumns: "60px 1fr auto",
                  gap: 8, alignItems: "start", marginBottom: 9, paddingBottom: 9,
                  borderBottom: `1px solid ${t.grid}`,
                  background: isNewest ? alpha(col.color, "14") : "transparent",
                  borderRadius: isNewest ? 6 : 0,
                  padding: isNewest ? "6px 4px" : undefined,
                }}>
                  <span style={{ color: t.muted, fontSize: 11 }}>{r.date}</span>
                  <div>
                    <div style={{ color: t.text, fontWeight: isNewest ? 700 : 500, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      {r.model}
                      {isNewest && (
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 100, background: alpha(t.warn, "2e"), color: t.text, fontWeight: 700 }}>LATEST</span>
                      )}
                    </div>
                    <div style={{ color: t.muted, fontSize: 11, marginTop: 1 }}>{r.note}</div>
                  </div>
                  <span style={{ color: col.color, fontWeight: 700, whiteSpace: "nowrap", paddingTop: 1 }}>
                    {r.mmlu}%{r.est ? <span style={{ color: t.muted, fontWeight: 400 }}> est</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── SECTION 2: Capabilities benchmarks ── */}
      <SectionDivider
        t={t}
        title="Part 2 — Where the frontier is contested (September 2026)"
        subtitle="MMLU measures what a model knows. These measure what it can do: ship a repository-level change, drive a terminal, operate a desktop, and reason about problems it has never seen. Both current flagships — OpenAI's GPT-5.6 Sol (9 July) and Anthropic's Claude Opus 5 (24 July) — cleared 96% on SWE-bench Verified, so the live comparison has moved to SWE-bench Pro, OSWorld 2.0, Frontier-Bench and ARC-AGI-3. Hover any bar for the source note."
      />

      {/* Capabilities bar chart — percentages only */}
      <div style={{ padding: "0 18px", marginBottom: 20 }}>
        <div style={{
          background: alpha(t.warn, "14"), border: `1px solid ${alpha(t.warn, "44")}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: t.text,
          lineHeight: 1.55,
        }}>
          <strong>Benchmarks moved under the models this year.</strong> OSWorld went to the harder 2.0 set,
          Terminal-Bench to 2.1, SWE-bench to Pro, and GDPval-AA to v2. Scores below are not comparable to
          the 2025 numbers that carried the same benchmark names.
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          {[{ label: "GPT-5.6 Sol", color: t.s1 }, { label: "Claude Opus 5", color: t.s2 }].map(({ label, color }) => (
            <span key={label} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 100,
              background: alpha(color, "1f"), border: `1px solid ${alpha(color, "55")}`,
              color: t.text, fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
          <span style={{ fontSize: 10, color: t.muted, letterSpacing: 1, marginLeft: "auto" }}>
            SCORE (%) — HIGHER IS BETTER
          </span>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={capData} margin={{ top: 18, right: 24, left: 0, bottom: 8 }} barCategoryGap="24%" barGap={10}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} horizontal vertical={false} />
            <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 12 }} axisLine={{ stroke: t.axis }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: t.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={44}
              tickFormatter={v => `${v}%`} />
            <Tooltip content={<CapTooltip t={t} />} cursor={{ fill: t.grid }} />
            <Bar dataKey="OpenAI" name="GPT-5.6 Sol" fill={t.s1} radius={[4, 4, 0, 0]} maxBarSize={46}>
              <LabelList dataKey="OpenAI" position="top" style={{ fill: t.muted, fontSize: 10, fontWeight: 700 }}
                formatter={(v) => `${v}%`} />
            </Bar>
            <Bar dataKey="Claude" name="Claude Opus 5" fill={t.s2} radius={[4, 4, 0, 0]} maxBarSize={46}>
              <LabelList dataKey="Claude" position="top" style={{ fill: t.muted, fontSize: 10, fontWeight: 700 }}
                formatter={(v) => `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Off-axis panels: Elo and the saturated benchmark */}
      <div className="ait-cols" style={{ display: "grid", gap: 12, padding: "0 18px", marginBottom: 20 }}>
        <EloPanel t={t} />
        <SaturatedPanel t={t} />
      </div>

      {/* Capabilities detail cards */}
      <div className="ait-cols" style={{ display: "grid", gap: 12, padding: "0 18px", marginBottom: 20 }}>
        {capBenchmarks.map(b => {
          const oaiWins = b.oai.value > b.cla.value;
          return (
            <div key={b.shortName} style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 10, padding: "14px 16px", fontSize: 12,
            }}>
              <div style={{ fontWeight: 700, color: t.text, marginBottom: 4 }}>{b.shortName}</div>
              <div style={{ color: t.muted, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>{b.description}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { side: b.oai, color: t.s1, wins: oaiWins },
                  { side: b.cla, color: t.s2, wins: !oaiWins },
                ].map(({ side, color, wins }) => (
                  <div key={side.model} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: t.text, fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flex: "none" }} />
                      {side.model}
                    </span>
                    <span style={{
                      color: t.text, fontWeight: wins ? 700 : 500,
                      background: wins ? alpha(color, "2e") : "transparent",
                      padding: "2px 8px", borderRadius: 100, fontSize: 13,
                      fontFamily: "var(--font-mono, ui-monospace, monospace)",
                      whiteSpace: "nowrap",
                    }}>
                      {side.value}%{wins ? " ▲" : ""}
                    </span>
                  </div>
                ))}
              </div>
              {b.note && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${t.border}`, color: t.muted, fontSize: 11, lineHeight: 1.5 }}>
                  {b.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footnote ── */}
      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16, margin: "0 18px" }}>
        <p style={{ fontSize: 11, color: t.muted, lineHeight: 1.7, margin: "0 0 10px" }}>
          <strong style={{ color: t.text }}>Benchmark notes:</strong> MMLU is official where published.
          Entries marked <em>est</em> (February 2026 onward, shaded on the chart) are estimates positioned from the
          ArtificialAnalysis Intelligence Index — neither lab reports MMLU in launch materials any more.
          Capability scores are from the July 2026 launch posts and the comparison round-ups that followed, and reflect
          each lab's highest published effort setting (GPT-5.6 Sol at xhigh, Claude Opus 5 at max effort).
          GDPval-AA v2 is an Elo rating and is shown on its own scale rather than on the percentage axis.
          Benchmark versions changed during 2026 — OSWorld 2.0, Terminal-Bench 2.1, SWE-bench Pro, GDPval-AA v2 —
          so these are not comparable with earlier figures published under the same names.
          Last updated {LAST_UPDATED}.
        </p>
        <p style={{ fontSize: 12, color: t.muted, margin: 0 }}>
          <strong style={{ color: t.text }}>Live tracking: </strong>
          {SOURCES.map((s, i) => (
            <span key={s.href}>
              {i > 0 && " · "}
              <a href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ color: t.s1, textDecoration: "underline", textUnderlineOffset: "2px" }}>
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </div>

      <style>{`
        .ait-cols { grid-template-columns: 1fr 1fr; }
        @media (max-width: 720px) { .ait-cols { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
