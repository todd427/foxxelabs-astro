// src/data/ai-timeline.js
//
// Single source of truth for the /ai-timeline/ charts. Kept out of the
// component so the numbers can be reviewed and updated without touching
// rendering code.
//
// Conventions
//   ts        months since Nov 2022 (ChatGPT launch = 0)
//   mmlu      MMLU %, `est: true` where the lab no longer publishes one
//   flagship  false for tier releases that belong in the table but not on
//             the frontier line (e.g. Sonnet alongside an Opus in the same month)

export const LAST_UPDATED = '3 September 2026';

// ─── Part 1 · MMLU historical arc ────────────────────────────────────────────
// MMLU stopped being a frontier differentiator in late 2025 — both labs are
// saturated above 96% and neither reports it in launch materials any more.
// Everything from Feb 2026 on is an estimate positioned from the
// ArtificialAnalysis Intelligence Index, flagged `est` and shaded on the chart.
export const MMLU_ESTIMATED_FROM_TS = 39; // Feb 2026

export const openaiReleases = [
  { date: "Nov '22", ts: 0,  model: 'GPT-3.5',       mmlu: 70.0, note: 'ChatGPT launch — 1M users in 5 days' },
  { date: "Mar '23", ts: 4,  model: 'GPT-4',         mmlu: 86.4, note: 'Major leap; launched in Bing and ChatGPT' },
  { date: "Nov '23", ts: 12, model: 'GPT-4 Turbo',   mmlu: 87.4, note: '128K context; updated knowledge cutoff' },
  { date: "May '24", ts: 18, model: 'GPT-4o',        mmlu: 88.7, note: 'Omni-modal; free-tier access' },
  { date: "Sep '24", ts: 22, model: 'o1-preview',    mmlu: 90.8, note: 'Chain-of-thought reasoning model' },
  { date: "Dec '24", ts: 25, model: 'o1',            mmlu: 92.3, note: 'Full o1 + $200/mo Pro tier' },
  { date: "Jan '25", ts: 26, model: 'o3-mini',       mmlu: 93.0, note: 'Compact, fast reasoning' },
  { date: "Apr '25", ts: 29, model: 'o3 / o4-mini',  mmlu: 96.7, note: 'Top AIME 2024/25 benchmark scores' },
  { date: "May '25", ts: 30, model: 'GPT-5',         mmlu: 96.0, note: 'Unified reasoning + conversational AI' },
  { date: "Nov '25", ts: 36, model: 'GPT-5.1',       mmlu: 96.4, note: 'Adaptive reasoning; 8 personality presets' },
  { date: "Feb '26", ts: 39, model: 'GPT-5.2',       mmlu: 96.8, est: true, note: 'Improved polish; spreadsheet & finance tasks' },
  { date: "Mar '26", ts: 40, model: 'GPT-5.4',       mmlu: 97.2, est: true, note: 'Native computer use; 1M context; merges the Codex line' },
  { date: "Apr '26", ts: 41, model: 'GPT-5.5',       mmlu: 96.5, est: true, note: "Codename 'Spud'; first fully-retrained base since GPT-4.5" },
  { date: "Jul '26", ts: 44, model: 'GPT-5.6 Sol',   mmlu: 97.4, est: true, note: 'Sol / Terra / Luna tiers; 96.2% SWE-bench Verified; $5/$30 per MTok' },
];

export const claudeReleases = [
  { date: "Mar '23", ts: 4,  model: 'Claude 1',             mmlu: 73.0, note: 'First public Claude via limited API' },
  { date: "Jul '23", ts: 8,  model: 'Claude 2',             mmlu: 78.5, note: 'General public access; 100K context' },
  { date: "Nov '23", ts: 12, model: 'Claude 2.1',           mmlu: 80.0, note: '200K context; reduced hallucination rate' },
  { date: "Mar '24", ts: 16, model: 'Claude 3 Opus',        mmlu: 86.8, note: 'Multimodal; noted self-awareness in tests' },
  { date: "Jun '24", ts: 19, model: 'Claude 3.5 Sonnet',    mmlu: 88.7, note: 'Beats Opus at Sonnet price; Artifacts' },
  { date: "Oct '24", ts: 23, model: 'Claude 3.5 Sonnet v2', mmlu: 89.5, note: 'Computer use capability; upgraded Haiku' },
  { date: "Feb '25", ts: 27, model: 'Claude 3.7 Sonnet',    mmlu: 91.0, note: 'First hybrid reasoning model' },
  { date: "May '25", ts: 30, model: 'Claude 4 Opus',        mmlu: 94.5, note: 'ASL-3 safety classification; Claude Code' },
  { date: "Sep '25", ts: 34, model: 'Claude 4.5 Sonnet',    mmlu: 95.0, note: '77.2% SWE-bench; 30+ hour task focus' },
  { date: "Nov '25", ts: 36, model: 'Claude 4.5 Opus',      mmlu: 95.8, note: 'First model >80% SWE-bench (80.9%)' },
  { date: "Feb '26", ts: 39, model: 'Claude Opus 4.6',      mmlu: 96.5, est: true, note: '1M context beta; adaptive thinking; agent teams' },
  { date: "Mar '26", ts: 40, model: 'Claude Sonnet 4.6',    mmlu: 96.2, est: true, flagship: false, note: 'Cost-efficient tier; 12 days after Opus 4.6' },
  { date: "Apr '26", ts: 41, model: 'Claude Opus 4.7',      mmlu: 96.7, est: true, note: '87.6% SWE-bench Verified; xhigh effort tier' },
  { date: "May '26", ts: 42, model: 'Claude Opus 4.8',      mmlu: 96.9, est: true, note: '88.6% SWE-bench Verified; 41-day release cadence' },
  { date: "Jun '26", ts: 43, model: 'Claude Fable 5',       mmlu: 97.2, est: true, note: '95.0% SWE-bench Verified, 80.0% Pro; export-control pause 12 Jun – 1 Jul' },
  { date: "Jun '26", ts: 43, model: 'Claude Sonnet 5',      mmlu: 96.4, est: true, flagship: false, note: 'GA 30 Jun; 85.2% SWE-bench Verified at $2/$10 per MTok' },
  { date: "Jul '26", ts: 44, model: 'Claude Opus 5',        mmlu: 97.5, est: true, note: '96.0% SWE-bench Verified; 1M context; Opus pricing held at $5/$25' },
];

// One point per lab per month on the frontier line: where a lab shipped two
// models in a month (Fable 5 and Sonnet 5, June 2026) the flagship is plotted
// and both are listed in the release tables underneath.
const frontierAt = (releases, ts) =>
  releases.filter(d => d.ts === ts && d.flagship !== false).slice(-1)[0];

const allTs = [...new Set([
  ...openaiReleases.map(d => d.ts),
  ...claudeReleases.map(d => d.ts),
])].sort((a, b) => a - b);

export const mergedMmlu = allTs.map(ts => {
  const oai = frontierAt(openaiReleases, ts);
  const cl = frontierAt(claudeReleases, ts);
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

// ─── Part 2 · Where the frontier is actually contested (Sept 2026) ───────────
// Head-to-head between the two current flagships: OpenAI GPT-5.6 Sol (9 Jul
// 2026) and Anthropic Claude Opus 5 (24 Jul 2026). Sourced from the launch
// posts and the comparison round-ups listed in SOURCES below.
//
// SWE-bench Verified is deliberately NOT plotted: at 96.2% (Sol) vs 96.0%
// (Opus 5) it is saturated and carries no signal. It appears as a callout.
export const capBenchmarks = [
  {
    shortName: 'SWE-bench Pro',
    description: 'Repository-level software engineering — harder and less contaminated than Verified',
    oai: { model: 'GPT-5.6 Sol', value: 64.6 },
    cla: { model: 'Claude Opus 5', value: 79.2 },
    note: 'Opus 5 leads by 14.6 points. This is the benchmark that replaced Verified once both labs passed 95% there.',
  },
  {
    shortName: 'Terminal-Bench',
    description: 'Agentic coding in real terminal environments — planning, iteration, tool coordination',
    oai: { model: 'GPT-5.6 Sol', value: 89.5 },
    cla: { model: 'Claude Opus 5', value: 89.1 },
    note: 'Effectively a tie (0.4 points, Sol at xhigh vs Opus 5 at max effort). GPT-5.6 Sol Ultra reaches 91.9%.',
  },
  {
    shortName: 'OSWorld 2.0',
    description: 'Autonomous desktop navigation via screenshots and keyboard/mouse',
    oai: { model: 'GPT-5.6 Sol', value: 62.6 },
    cla: { model: 'Claude Opus 5', value: 70.6 },
    note: 'OSWorld moved to the harder 2.0 set in 2026 and scores reset downward — these are not comparable to the ~80% figures on OSWorld-Verified.',
  },
  {
    shortName: 'Frontier-Bench',
    description: 'Long-horizon agentic coding on unsolved problems',
    oai: { model: 'GPT-5.6 Sol', value: 34.4 },
    cla: { model: 'Claude Opus 5', value: 43.3 },
    note: 'Both labs are under 50%. The newest benchmark on this page and the least saturated.',
  },
  {
    shortName: 'ARC-AGI-3',
    description: 'Novel reasoning on problems absent from any training set',
    oai: { model: 'GPT-5.6 Sol', value: 7.8 },
    cla: { model: 'Claude Opus 5', value: 30.2 },
    note: 'The widest gap on the page — Opus 5 scores ~3.9× Sol. Absolute scores stay low across every lab: this is the benchmark nobody is close to.',
  },
];

// Elo, not a percentage — kept off the bar chart's axis on purpose.
export const gdpval = {
  name: 'GDPval-AA v2',
  description: 'Economically valuable knowledge work across 44 professions, scored as an Elo rating',
  oai: { model: 'GPT-5.6 Sol', value: 1736 },
  cla: { model: 'Claude Opus 5', value: 1861 },
  note: 'Opus 5 leads by 125 Elo — roughly a 67% expected win rate head-to-head. Elo is an interval scale and is not plotted alongside the percentage benchmarks.',
};

// Saturated — reported, not plotted.
export const saturated = {
  name: 'SWE-bench Verified',
  rows: [
    { label: 'GPT-5.6 Sol', value: '96.2%', series: 1 },
    { label: 'Claude Opus 5', value: '96.0%', series: 2 },
    { label: 'Claude Fable 5', value: '95.0%', series: 2 },
    { label: 'Claude Sonnet 5', value: '85.2%', series: 2 },
  ],
  note: 'Four points separate the two flagships. Verified is finished as a differentiator; the contested version is Pro.',
};

export const STATS = [
  { label: 'OpenAI MMLU gain', value: '+27.4pp', sub: 'GPT-3.5 → GPT-5.6 Sol (3.7 yrs)' },
  { label: 'Claude MMLU gain', value: '+24.5pp', sub: 'Claude 1 → Claude Opus 5' },
  { label: 'Anthropic 2026 cadence', value: '7 releases', sub: 'Opus 4.6 → Opus 5, Feb–Jul 2026' },
  { label: 'Widest live gap', value: 'ARC-AGI-3', sub: '30.2% vs 7.8% — nobody is close' },
];

export const SOURCES = [
  { label: 'llm-stats.com', href: 'https://llm-stats.com' },
  { label: 'Artificial Analysis', href: 'https://artificialanalysis.ai' },
  { label: 'ARC Prize leaderboard', href: 'https://arcprize.org/leaderboard' },
];
