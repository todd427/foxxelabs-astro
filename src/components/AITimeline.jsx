import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// Accent colours match foxxelabs.ie CSS variables:
//   --accent:  #7dd3fc  (sky blue)
//   --accent2: #a78bfa  (purple)
const C_OAI = "#7dd3fc";   // OpenAI line  — site --accent
const C_CLA = "#a78bfa";   // Claude line  — site --accent2
const C_BG  = "#0b0f14";   // site --bg
const C_CARD= "#121923";   // site --card
const C_MUT = "#9fb0c3";   // site --muted
const C_BORDER = "rgba(255,255,255,.10)";

const openaiReleases = [
  { date: "Nov '22", ts: 0,  model: "GPT-3.5",        mmlu: 70.0, note: "ChatGPT launch — 1M users in 5 days" },
  { date: "Mar '23", ts: 4,  model: "GPT-4",           mmlu: 86.4, note: "Major leap; launched in Bing and ChatGPT" },
  { date: "Nov '23", ts: 12, model: "GPT-4 Turbo",     mmlu: 87.4, note: "128K context; updated knowledge cutoff" },
  { date: "May '24", ts: 18, model: "GPT-4o",          mmlu: 88.7, note: "Omni-modal; free-tier access" },
  { date: "Sep '24", ts: 22, model: "o1-preview",      mmlu: 90.8, note: "Chain-of-thought reasoning model" },
  { date: "Dec '24", ts: 25, model: "o1",              mmlu: 92.3, note: "Full o1 + $200/mo Pro tier" },
  { date: "Jan '25", ts: 26, model: "o3-mini",         mmlu: 93.0, note: "Compact, fast reasoning" },
  { date: "Apr '25", ts: 29, model: "o3 / o4-mini",   mmlu: 96.7, note: "Top AIME 2024/25 benchmark scores" },
  { date: "May '25", ts: 30, model: "GPT-5",           mmlu: 96.0, note: "Unified reasoning + conversational AI" },
  { date: "Nov '25", ts: 36, model: "GPT-5.1",         mmlu: 96.4, note: "Adaptive reasoning; 8 personality presets" },
  { date: "Feb '26", ts: 39, model: "GPT-5.2",         mmlu: 96.8, note: "Improved polish, spreadsheet & finance tasks" },
];

const claudeReleases = [
  { date: "Mar '23", ts: 4,  model: "Claude 1",           mmlu: 73.0, note: "First public Claude via limited API" },
  { date: "Jul '23", ts: 8,  model: "Claude 2",           mmlu: 78.5, note: "General public access; 100K context" },
  { date: "Nov '23", ts: 12, model: "Claude 2.1",         mmlu: 80.0, note: "200K context; reduced hallucination rate" },
  { date: "Mar '24", ts: 16, model: "Claude 3 Opus",      mmlu: 86.8, note: "Multimodal; noted self-awareness in tests" },
  { date: "Jun '24", ts: 19, model: "Claude 3.5 Sonnet",  mmlu: 88.7, note: "Beats Opus at Sonnet price; Artifacts" },
  { date: "Oct '24", ts: 23, model: "Claude 3.5 Sonnet v2", mmlu: 89.5, note: "Computer use capability; upgraded Haiku" },
  { date: "Feb '25", ts: 27, model: "Claude 3.7 Sonnet",  mmlu: 91.0, note: "First hybrid reasoning model" },
  { date: "May '25", ts: 30, model: "Claude 4 Opus",      mmlu: 94.5, note: "ASL-3 safety classification; Claude Code" },
  { date: "Sep '25", ts: 34, model: "Claude 4.5 Sonnet",  mmlu: 95.0, note: "77.2% SWE-bench; 30+ hour task focus" },
  { date: "Nov '25", ts: 36, model: "Claude 4.5 Opus",    mmlu: 95.8, note: "First model to break 80% SWE-bench (80.9%)" },
];

const allTs = [...new Set([
  ...openaiReleases.map(d => d.ts),
  ...claudeReleases.map(d => d.ts),
])].sort((a, b) => a - b);

const merged = allTs.map(ts => {
  const oai = openaiReleases.find(d => d.ts === ts);
  const cl  = claudeReleases.find(d => d.ts === ts);
  return {
    ts,
    date: oai?.date || cl?.date,
    openai: oai?.mmlu ?? null,
    claude: cl?.mmlu ?? null,
    openaiModel: oai?.model,
    claudeModel: cl?.model,
    openaiNote: oai?.note,
    claudeNote: cl?.note,
  };
});

const STATS = [
  { label: "OpenAI MMLU gain", value: "+26.8pp", sub: "GPT-3.5 → o3 in 2.5 yrs" },
  { label: "Claude MMLU gain",  value: "+22.8pp", sub: "Claude 1 → 4.5 Opus" },
  { label: "Cost drop",         value: "~10× /yr", sub: "Per equivalent performance" },
  { label: "Frontier ceiling",  value: "~96–97%",  sub: "MMLU near saturation" },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C_CARD, border: `1px solid ${C_BORDER}`, borderRadius: 8,
      padding: "12px 16px", fontSize: 13, maxWidth: 260,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      {payload.map(p => {
        if (p.value == null) return null;
        const isOai = p.dataKey === "openai";
        return (
          <div key={p.dataKey} style={{ marginBottom: 6 }}>
            <div style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>
              {p.payload[isOai ? "openaiModel" : "claudeModel"]}
            </div>
            <div style={{ color: "#e9f0f7", fontWeight: 600 }}>
              {p.value.toFixed(1)}% MMLU
            </div>
            <div style={{ color: C_MUT, fontSize: 12, marginTop: 2 }}>
              {p.payload[isOai ? "openaiNote" : "claudeNote"]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CustomDot = ({ cx, cy, payload, dataKey, color }) => {
  if (payload[dataKey] == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke={C_BG} strokeWidth={2} />;
};

export default function AITimeline() {
  return (
    <div style={{ background: C_BG, color: "#e9f0f7", padding: "28px 0", fontFamily: "system-ui, sans-serif" }}>

      {/* Stat row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 12, marginBottom: 24, padding: "0 18px",
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: C_CARD, border: `1px solid ${C_BORDER}`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#e9f0f7" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C_OAI, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: C_MUT, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, padding: "0 18px", flexWrap: "wrap" }}>
        {[
          { label: "OpenAI / ChatGPT", color: C_OAI },
          { label: "Anthropic / Claude", color: C_CLA },
        ].map(({ label, color }) => (
          <span key={label} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 100,
            background: `${color}18`, border: `1px solid ${color}44`,
            color, fontSize: 12, fontWeight: 500,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div style={{ padding: "0 0 4px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C_MUT, textAlign: "right", paddingRight: 32, marginBottom: 8, letterSpacing: 1 }}>
          MMLU BENCHMARK (%) — HIGHER IS BETTER
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={merged} margin={{ top: 8, right: 32, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: C_MUT, fontSize: 11 }}
              axisLine={{ stroke: C_BORDER }} tickLine={false}
              interval={0} angle={-35} textAnchor="end" height={52}
            />
            <YAxis
              domain={[65, 100]}
              tick={{ fill: C_MUT, fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`} width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={90} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4"
              label={{ value: "90%", fill: "rgba(255,255,255,.2)", fontSize: 10, position: "insideRight" }} />
            <ReferenceLine y={95} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4"
              label={{ value: "95%", fill: "rgba(255,255,255,.2)", fontSize: 10, position: "insideRight" }} />
            <Line type="monotone" dataKey="openai" stroke={C_OAI} strokeWidth={2.5}
              dot={<CustomDot dataKey="openai" color={C_OAI} />}
              activeDot={{ r: 7, fill: C_OAI, stroke: C_BG, strokeWidth: 2 }}
              connectNulls={false} />
            <Line type="monotone" dataKey="claude" stroke={C_CLA} strokeWidth={2.5}
              dot={<CustomDot dataKey="claude" color={C_CLA} />}
              activeDot={{ r: 7, fill: C_CLA, stroke: C_BG, strokeWidth: 2 }}
              connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Release tables */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 14, marginBottom: 20, padding: "0 18px",
      }}>
        {[
          { title: "OpenAI / ChatGPT",   color: C_OAI, releases: openaiReleases },
          { title: "Anthropic / Claude", color: C_CLA, releases: claudeReleases },
        ].map(col => (
          <div key={col.title} style={{
            background: `${col.color}0a`, border: `1px solid ${col.color}30`,
            borderRadius: 12, padding: 16, fontSize: 12,
          }}>
            <div style={{ color: col.color, fontWeight: 700, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", fontSize: 11 }}>
              {col.title}
            </div>
            {col.releases.map(r => (
              <div key={r.model} style={{
                display: "grid", gridTemplateColumns: "60px 1fr auto",
                gap: 8, alignItems: "start", marginBottom: 9, paddingBottom: 9,
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}>
                <span style={{ color: C_MUT, fontSize: 11 }}>{r.date}</span>
                <div>
                  <div style={{ color: "#e9f0f7", fontWeight: 500 }}>{r.model}</div>
                  <div style={{ color: C_MUT, fontSize: 11, marginTop: 1 }}>{r.note}</div>
                </div>
                <span style={{ color: col.color, fontWeight: 600, whiteSpace: "nowrap", paddingTop: 1 }}>
                  {r.mmlu}%
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footnote */}
      <p style={{
        fontSize: 11, color: C_MUT, lineHeight: 1.7,
        borderTop: `1px solid ${C_BORDER}`, paddingTop: 16, margin: "0 18px",
      }}>
        <strong style={{ color: "#e9f0f7" }}>Benchmark note:</strong> MMLU (Massive Multitask Language Understanding) scores shown.
        Actual reported values used where available from official model cards and ArtificialAnalysis.ai; estimated for intermediate releases.
        MMLU is approaching saturation near 97–98%; newer benchmarks (SWE-bench, FrontierMath, HLE) better differentiate frontier models.
        &ensp;<strong style={{ color: "#e9f0f7" }}>Key takeaway:</strong> Both labs have roughly tripled meaningful capability in 2.5 years.
        Claude entered 2023 behind GPT-4 and had fully converged by mid-2024 — the real differentiation now lies in reasoning depth,
        agentic task completion, context length, and safety posture.
      </p>
    </div>
  );
}
