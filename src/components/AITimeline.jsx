import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, LabelList, Legend,
} from "recharts";

// Colours match foxxelabs.ie CSS variables
const C_OAI    = "#7dd3fc";  // --accent
const C_CLA    = "#a78bfa";  // --accent2
const C_BG     = "#0b0f14";  // --bg
const C_CARD   = "#121923";  // --card
const C_MUT    = "#9fb0c3";  // --muted
const C_BORDER = "rgba(255,255,255,.10)";

// ─── MMLU historical data ────────────────────────────────────────────────────
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
  { date: "Feb '26", ts: 39, model: "GPT-5.2",         mmlu: 96.8, note: "Improved polish; spreadsheet & finance tasks" },
  { date: "Mar '26", ts: 40, model: "GPT-5.4",         mmlu: 97.2, note: "Native computer use (75% OSWorld); 1M context; merges GPT-5.3-Codex line*" },
];

const claudeReleases = [
  { date: "Mar '23", ts: 4,  model: "Claude 1",            mmlu: 73.0, note: "First public Claude via limited API" },
  { date: "Jul '23", ts: 8,  model: "Claude 2",            mmlu: 78.5, note: "General public access; 100K context" },
  { date: "Nov '23", ts: 12, model: "Claude 2.1",          mmlu: 80.0, note: "200K context; reduced hallucination rate" },
  { date: "Mar '24", ts: 16, model: "Claude 3 Opus",       mmlu: 86.8, note: "Multimodal; noted self-awareness in tests" },
  { date: "Jun '24", ts: 19, model: "Claude 3.5 Sonnet",   mmlu: 88.7, note: "Beats Opus at Sonnet price; Artifacts" },
  { date: "Oct '24", ts: 23, model: "Claude 3.5 Sonnet v2", mmlu: 89.5, note: "Computer use capability; upgraded Haiku" },
  { date: "Feb '25", ts: 27, model: "Claude 3.7 Sonnet",   mmlu: 91.0, note: "First hybrid reasoning model" },
  { date: "May '25", ts: 30, model: "Claude 4 Opus",       mmlu: 94.5, note: "ASL-3 safety classification; Claude Code" },
  { date: "Sep '25", ts: 34, model: "Claude 4.5 Sonnet",   mmlu: 95.0, note: "77.2% SWE-bench; 30+ hour task focus" },
  { date: "Nov '25", ts: 36, model: "Claude 4.5 Opus",     mmlu: 95.8, note: "First model >80% SWE-bench (80.9%)" },
  { date: "Feb '26", ts: 39, model: "Claude Opus 4.6",     mmlu: 96.5, note: "1M context beta; 65.4% Terminal-Bench; adaptive thinking; agent teams*" },
  { date: "Mar '26", ts: 40, model: "Claude Sonnet 4.6",   mmlu: 96.2, note: "Cost-efficient tier; released 12 days after Opus 4.6*" },
];

const allTs = [...new Set([
  ...openaiReleases.map(d => d.ts),
  ...claudeReleases.map(d => d.ts),
])].sort((a, b) => a - b);

const mergedMmlu = allTs.map(ts => {
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

// ─── Capabilities benchmark data (frontier models only, Mar 2026) ─────────────
// Sources: official model cards, ArtificialAnalysis, TechCrunch, DigitalApplied
// Human baselines shown where published.
const capBenchmarks = [
  {
    name: "SWE-bench\nVerified",
    shortName: "SWE-bench",
    description: "Real-world software engineering tasks resolved autonomously",
    unit: "%",
    humanBaseline: null,
    oai: { model: "GPT-5.4", value: 79.2 },
    cla: { model: "Claude 4.5 Opus", value: 80.9 },
    note: "Claude 4.5 Opus holds the published record (80.9%); GPT-5.4 estimated ~79% based on relative positioning*",
  },
  {
    name: "Terminal-Bench\n2.0",
    shortName: "Terminal-Bench",
    description: "Agentic coding in real terminal environments",
    unit: "%",
    humanBaseline: null,
    oai: { model: "GPT-5.2 + Codex", value: 64.7 },
    cla: { model: "Claude Opus 4.6", value: 65.4 },
    note: "Claude Opus 4.6 holds the record (65.4%); GPT-5.2 Codex CLI at 64.7%. GPT-5.4 score pending independent verification.",
  },
  {
    name: "OSWorld\nVerified",
    shortName: "OSWorld",
    description: "Autonomous desktop navigation via screenshots + keyboard/mouse",
    unit: "%",
    humanBaseline: 72.4,
    oai: { model: "GPT-5.4", value: 75.0 },
    cla: { model: "Claude Opus 4.6", value: 72.7 },
    note: "Human baseline: 72.4%. GPT-5.4 becomes first model to surpass human performance.",
  },
  {
    name: "GDPval-AA\n(Elo)",
    shortName: "GDPval-AA",
    description: "Economically valuable tasks across finance, legal & 44 professions",
    unit: " Elo",
    humanBaseline: null,
    oai: { model: "GPT-5.2", value: 1462 },
    cla: { model: "Claude Opus 4.6", value: 1606 },
    note: "Claude Opus 4.6 leads by ~144 Elo (~70% win rate). GPT-5.4 GDPval score pending; GPT-5.2 shown for comparison.",
  },
];

// ─── Stat row ────────────────────────────────────────────────────────────────
const STATS = [
  { label: "OpenAI MMLU gain", value: "+27.2pp", sub: "GPT-3.5 → GPT-5.4 (3.3 yrs)" },
  { label: "Claude MMLU gain",  value: "+23.2pp", sub: "Claude 1 → Sonnet 4.6" },
  { label: "Cost drop",         value: "~10× /yr", sub: "Per equivalent performance" },
  { label: "Frontier ceiling",  value: "~97%+",   sub: "MMLU near saturation" },
];

// ─── Shared components ────────────────────────────────────────────────────────
const SectionDivider = ({ title, subtitle }) => (
  <div style={{ padding: "28px 18px 16px", borderTop: `1px solid ${C_BORDER}`, marginTop: 8 }}>
    <div style={{ fontSize: 11, color: C_OAI, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
      {title}
    </div>
    <p style={{ margin: 0, fontSize: 13, color: C_MUT, lineHeight: 1.6, maxWidth: 72 + "ch" }}>
      {subtitle}
    </p>
  </div>
);

const MmluTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C_CARD, border: `1px solid ${C_BORDER}`, borderRadius: 8,
      padding: "12px 16px", fontSize: 13, maxWidth: 270,
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
            <div style={{ color: "#e9f0f7", fontWeight: 600 }}>{p.value.toFixed(1)}% MMLU</div>
            <div style={{ color: C_MUT, fontSize: 12, marginTop: 2 }}>
              {p.payload[isOai ? "openaiNote" : "claudeNote"]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MmluDot = ({ cx, cy, payload, dataKey, color }) => {
  if (payload[dataKey] == null) return null;
  const isNew = payload.ts === 40;
  return <circle cx={cx} cy={cy} r={isNew ? 7 : 5} fill={color} stroke={isNew ? "#ffffff" : C_BG} strokeWidth={2} />;
};

const CapTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const bench = capBenchmarks.find(b => b.shortName === label);
  return (
    <div style={{
      background: C_CARD, border: `1px solid ${C_BORDER}`, borderRadius: 8,
      padding: "12px 16px", fontSize: 13, maxWidth: 280,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <div style={{ color: "#e9f0f7", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {bench && <div style={{ color: C_MUT, fontSize: 11, marginBottom: 8 }}>{bench.description}</div>}
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span>{" "}
          <span style={{ color: "#e9f0f7" }}>{p.value}{bench?.unit || "%"}</span>
        </div>
      ))}
      {bench?.humanBaseline && (
        <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 6 }}>
          Human baseline: {bench.humanBaseline}{bench.unit}
        </div>
      )}
      {bench?.note && (
        <div style={{ color: C_MUT, fontSize: 11, marginTop: 6, borderTop: `1px solid ${C_BORDER}`, paddingTop: 6 }}>
          {bench.note}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AITimeline() {
  const capData = capBenchmarks.map(b => ({
    name: b.shortName,
    "OpenAI": b.oai.value,
    "Claude":  b.cla.value,
    humanBaseline: b.humanBaseline,
    oaiModel: b.oai.model,
    claModel: b.cla.model,
    unit: b.unit,
  }));

  return (
    <div style={{ background: C_BG, color: "#e9f0f7", padding: "28px 0", fontFamily: "system-ui, sans-serif" }}>

      {/* ── SECTION 1: MMLU ── */}
      <SectionDivider
        title="Part 1 — Knowledge Benchmark (MMLU)"
        subtitle="MMLU (Massive Multitask Language Understanding) was the dominant benchmark from 2022–2025, tracking broad knowledge across 57 academic disciplines. Both labs are now near-saturated at 97%+, making it a poor differentiator for current frontier models — but the historical arc is striking."
      />

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
      <div style={{ display: "flex", gap: 10, marginBottom: 14, padding: "0 18px", flexWrap: "wrap", alignItems: "center" }}>
        {[{ label: "OpenAI / ChatGPT", color: C_OAI }, { label: "Anthropic / Claude", color: C_CLA }].map(({ label, color }) => (
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
        <span style={{
          fontSize: 11, padding: "3px 8px", borderRadius: 100,
          background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)",
          color: "#fbbf24", fontWeight: 600,
        }}>● = Latest releases (Mar 2026)</span>
      </div>

      {/* MMLU Line Chart */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C_MUT, textAlign: "right", paddingRight: 32, marginBottom: 8, letterSpacing: 1 }}>
          MMLU BENCHMARK (%) — HIGHER IS BETTER
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={mergedMmlu} margin={{ top: 8, right: 32, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: C_MUT, fontSize: 11 }}
              axisLine={{ stroke: C_BORDER }} tickLine={false}
              interval={0} angle={-35} textAnchor="end" height={52} />
            <YAxis domain={[65, 100]} tick={{ fill: C_MUT, fontSize: 11 }}
              axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={44} />
            <Tooltip content={<MmluTooltip />} />
            <ReferenceLine y={90} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4"
              label={{ value: "90%", fill: "rgba(255,255,255,.2)", fontSize: 10, position: "insideRight" }} />
            <ReferenceLine y={95} stroke="rgba(255,255,255,.08)" strokeDasharray="4 4"
              label={{ value: "95%", fill: "rgba(255,255,255,.2)", fontSize: 10, position: "insideRight" }} />
            <Line type="monotone" dataKey="openai" stroke={C_OAI} strokeWidth={2.5}
              dot={<MmluDot dataKey="openai" color={C_OAI} />}
              activeDot={{ r: 7, fill: C_OAI, stroke: C_BG, strokeWidth: 2 }} connectNulls={false} />
            <Line type="monotone" dataKey="claude" stroke={C_CLA} strokeWidth={2.5}
              dot={<MmluDot dataKey="claude" color={C_CLA} />}
              activeDot={{ r: 7, fill: C_CLA, stroke: C_BG, strokeWidth: 2 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MMLU Release tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12, padding: "0 18px" }}>
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
            {col.releases.map((r, i) => {
              const isNewest = i === col.releases.length - 1;
              return (
                <div key={r.model} style={{
                  display: "grid", gridTemplateColumns: "60px 1fr auto",
                  gap: 8, alignItems: "start", marginBottom: 9, paddingBottom: 9,
                  borderBottom: "1px solid rgba(255,255,255,.05)",
                  background: isNewest ? `${col.color}0d` : "transparent",
                  borderRadius: isNewest ? 6 : 0,
                  padding: isNewest ? "6px 4px" : undefined,
                }}>
                  <span style={{ color: C_MUT, fontSize: 11 }}>{r.date}</span>
                  <div>
                    <div style={{ color: "#e9f0f7", fontWeight: isNewest ? 700 : 500, display: "flex", alignItems: "center", gap: 5 }}>
                      {r.model}
                      {isNewest && (
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 100, background: "rgba(251,191,36,0.2)", color: "#fbbf24", fontWeight: 700 }}>NEW</span>
                      )}
                    </div>
                    <div style={{ color: C_MUT, fontSize: 11, marginTop: 1 }}>{r.note.replace("*", "")}</div>
                  </div>
                  <span style={{ color: col.color, fontWeight: 600, whiteSpace: "nowrap", paddingTop: 1 }}>{r.mmlu}%</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── SECTION 2: Capabilities benchmarks ── */}
      <SectionDivider
        title="Part 2 — Capabilities Benchmarks (Mar 2026)"
        subtitle="MMLU measures what models know. These benchmarks measure what they can actually do — write and deploy working code, navigate a computer autonomously, and complete real professional tasks. This is where the frontier labs are differentiating in 2026. Hover each bar for model details and source notes."
      />

      {/* Capabilities bar chart */}
      <div style={{ padding: "0 18px", marginBottom: 20 }}>

        {/* Human baseline callout */}
        <div style={{
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#fbbf24",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span>
            <strong>OSWorld human baseline: 72.4%.</strong> GPT-5.4 (75.0%) is the first model to surpass human performance on autonomous desktop navigation.
          </span>
        </div>

        <div style={{ fontSize: 10, color: C_MUT, textAlign: "right", marginBottom: 8, letterSpacing: 1 }}>
          SCORE — HIGHER IS BETTER &nbsp;|&nbsp; GDPval-AA IN ELO POINTS (SCALE DIFFERS)
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={capData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" horizontal={true} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: C_MUT, fontSize: 12 }} axisLine={{ stroke: C_BORDER }} tickLine={false} />
            <YAxis tick={{ fill: C_MUT, fontSize: 11 }} axisLine={false} tickLine={false} width={44}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip content={<CapTooltip />} />
            <Legend
              formatter={(value) => <span style={{ color: value === "OpenAI" ? C_OAI : C_CLA, fontSize: 12 }}>{value}</span>}
            />
            <Bar dataKey="OpenAI" fill={C_OAI} radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList dataKey="OpenAI" position="top" style={{ fill: C_OAI, fontSize: 11, fontWeight: 600 }}
                formatter={(v) => v >= 1000 ? `${v} Elo` : `${v}%`} />
            </Bar>
            <Bar dataKey="Claude" fill={C_CLA} radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList dataKey="Claude" position="top" style={{ fill: C_CLA, fontSize: 11, fontWeight: 600 }}
                formatter={(v) => v >= 1000 ? `${v} Elo` : `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Capabilities detail cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 18px", marginBottom: 20 }}>
        {capBenchmarks.map(b => {
          const oaiWins = b.oai.value > b.cla.value;
          return (
            <div key={b.shortName} style={{
              background: C_CARD, border: `1px solid ${C_BORDER}`,
              borderRadius: 10, padding: "14px 16px", fontSize: 12,
            }}>
              <div style={{ fontWeight: 700, color: "#e9f0f7", marginBottom: 4 }}>{b.shortName}</div>
              <div style={{ color: C_MUT, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>{b.description}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C_OAI, fontWeight: 600 }}>{b.oai.model}</span>
                  <span style={{
                    color: oaiWins ? "#e9f0f7" : C_MUT, fontWeight: oaiWins ? 700 : 400,
                    background: oaiWins ? `${C_OAI}22` : "transparent",
                    padding: "2px 8px", borderRadius: 100, fontSize: 13,
                  }}>
                    {b.oai.value}{b.unit}{oaiWins ? " 🏆" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C_CLA, fontWeight: 600 }}>{b.cla.model}</span>
                  <span style={{
                    color: !oaiWins ? "#e9f0f7" : C_MUT, fontWeight: !oaiWins ? 700 : 400,
                    background: !oaiWins ? `${C_CLA}22` : "transparent",
                    padding: "2px 8px", borderRadius: 100, fontSize: 13,
                  }}>
                    {b.cla.value}{b.unit}{!oaiWins ? " 🏆" : ""}
                  </span>
                </div>
                {b.humanBaseline && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#fbbf24", fontSize: 11 }}>
                    <span>Human baseline</span>
                    <span style={{ fontWeight: 600 }}>{b.humanBaseline}{b.unit}</span>
                  </div>
                )}
              </div>
              {b.note && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C_BORDER}`, color: C_MUT, fontSize: 11, lineHeight: 1.5 }}>
                  {b.note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footnote + llm-stats link ── */}
      <div style={{ borderTop: `1px solid ${C_BORDER}`, paddingTop: 16, margin: "0 18px" }}>
        <p style={{ fontSize: 11, color: C_MUT, lineHeight: 1.7, margin: "0 0 10px" }}>
          <strong style={{ color: "#e9f0f7" }}>Benchmark notes:</strong> MMLU scores — official where available;
          recent entries (*) estimated from ArtificialAnalysis Intelligence Index and relative positioning.
          MMLU is near-saturated at 97%+ and no longer the primary frontier differentiator.
          Capabilities benchmark scores sourced from official model cards, TechCrunch, DigitalApplied, and ArtificialAnalysis (March 2026).
          GDPval-AA is measured in Elo points and is not directly comparable to percentage-based benchmarks.
          Independent verification of GPT-5.4 Terminal-Bench and GDPval scores is still emerging.
        </p>
        <p style={{ fontSize: 12, color: C_MUT, margin: 0 }}>
          <strong style={{ color: "#e9f0f7" }}>For the latest information: </strong>
          <a
            href="https://llm-stats.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C_OAI, textDecoration: "underline", textDecorationColor: `${C_OAI}66`, textUnderlineOffset: "2px" }}
          >
            llm-stats.com
          </a>
          {" "}— live benchmark tracking across 50+ evaluations and 20+ API providers.
        </p>
      </div>

    </div>
  );
}
