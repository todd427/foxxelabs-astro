// src/data/world.js
//
// The census behind /world. One row per project; the page renders nothing that
// is not in here. Source of truth is the Rialu registry — when a status or a
// phase changes there, change it here.
//
//   status: 'live'  — live / serving
//           'build' — in build
//           'plan'  — on paper (also: shelved, retired, parked)

export const STATUS = { live: 'live / serving', build: 'in build', plan: 'on paper' };
export const GLYPH  = { live: '\u25CF', build: '\u25C6', plan: '\u25CB' };

export const REGIONS = [
  {
    id: "horizon",
    title: "An léaslíne",
    sub: "the long horizon",
    wide: true,
    items: [
      { name: "Lorg", status: "live", blurb: "A worldline tracker — GPS and biometrics braided into one personal timeline. The 3D worm renders and the phone app is at v0.3.6; the work has been resting since June." },
      { name: "Someday", status: "plan", blurb: "A sovereign personal-AI shell at someday.irish — your own assistant, on your own hardware, under your own law." },
      { name: "Cruinne", status: "build", blurb: "A world-model experiment with a React face — first milestone working, all four planned layers in code." },
    ],
  },
  {
    id: "mind",
    title: "An intinn",
    sub: "the mind — the cognition stack",
    items: [
      { name: "Aigne", status: "live", blurb: "The cognition gateway: one OpenAI-compatible front door to the whole fleet. Routes every request to the cheapest sufficient brain and bills it in joules, not vibes. v0.1 serving across two nodes." },
      { name: "Timire", status: "live", blurb: "The steward: a job queue and dispatcher that loads a stack of project briefs and works the fleet overnight, reporting at morning standup." },
      { name: "Mnemos", status: "live", blurb: "The memory: 121,000 documents spanning 1996 to this morning, searchable by meaning and by keyword at once. Several other projects stand on it." },
      { name: "Taithí", status: "live", blurb: "Experience: a continual-learning layer that teaches the local models facts as they are asserted — and revokes them when they aren't." },
      { name: "Fiosrú", status: "live", blurb: "Inquiry: fork an investigation to a background researcher, collect the answer when it's done." },
      { name: "Gléas", status: "live", blurb: "The instrument rack: local model serving across the GPU fleet." },
      { name: "Mothú", status: "live", blurb: "Feeling: an affective salience source, so the stack knows what mattered, not just what was said." },
      { name: "Colainn", status: "live", blurb: "The body: a time-series store for biometrics — the stack's medulla." },
      { name: "Macalla", status: "build", blurb: "Echo: a fine-tuned model that writes in the author's own register, trained on thirty years of his prose." },
      { name: "Measure", status: "build", blurb: "The evaluation harness — how the stack knows whether a model change was an improvement or a story." },
      { name: "Garden", status: "build", blurb: "VRAM pooling across three GPUs and a dedicated network lane — growing larger models than any one card can hold." },
      { name: "Ceann", status: "build", blurb: "The head: a model-agnostic boundary gate — the stack's prefrontal check on any model it fronts. First two milestones built and measured." },
      { name: "Tuiscint", status: "build", blurb: "Understanding: a from-scratch pretrained decoder — corpus and eval locked, awaiting its training run." },
      { name: "Imeall", status: "build", blurb: "The edge: a concept-and-claim map drawn over the memory layer. The inward pass now reads each new paper against what you already hold, and /field draws the field and where you are not yet on it." },
      { name: "Sleep cluster", status: "build", blurb: "Léargas, Aislinge, Radharc: overnight consolidation — compiling each day's experience into the models while the human sleeps. Parts already running." },
      { name: "Cuimhin", status: "build", blurb: "Remembrance, open-sourced: the generic retrieval shell extracted from Mnemos under Apache-2.0. Design docs written, the M0 skeleton in build." },
      { name: "Codoir", status: "plan", blurb: "The coder: a from-scratch code model sharing Tuiscint's rig. Phase 0 sizing authorised and the serve brief written — the bootstrap not yet." },
    ],
  },
  {
    id: "harbour",
    title: "An margadh",
    sub: "the harbour — facing the world",
    items: [
      { name: "Beirt", status: "live", blurb: "Two of them: an open, bring-your-own-key tool that runs the same prompt through two models side by side." },
      { name: "Ainm", status: "live", blurb: "The name: clears a candidate company name against the register, the domains, and trademark risk in one pass." },
      { name: "Eric", status: "live", blurb: "The marketing man: an intelligence agent who watches markets, keeps the pipeline, and answers go-to-market questions." },
      { name: "Aibí", status: "live", blurb: "Ripe: a report and roadmap generator built for SME digitalisation work." },
      { name: "Saothar", status: "live", blurb: "Labour: an Irish labour-market signal service built on CSO data." },
      { name: "Úire", status: "live", blurb: "Freshness: a preprint frontier monitor running nightly, unattended — with an open browser lens on the way." },
      { name: "Féirín", status: "build", blurb: "A small gift: QR voucher keys that let a stranger try the tools with a capped budget." },
      { name: "Translator", status: "build", blurb: "EPUB in, publishable German out. The first title is in flight." },
      { name: "Sruth", status: "build", blurb: "The stream: an economic model of Ireland with a live dashboard." },
      { name: "Anseo", status: "build", blurb: "Here: a community platform with sign-in and a deep roadmap." },
      { name: "Solas", status: "build", blurb: "Light: a data-driven slide-deck compiler." },
    ],
  },
  {
    id: "academy",
    title: "An acadamh",
    sub: "the academy — the bridge to standing",
    wide: true,
    items: [
      { name: "ATU teaching", status: "build", blurb: "Two routes to the lectern: a module insertion into the Applied AI masters, and a lecturer application in flight." },
      { name: "HAX PhD", status: "plan", blurb: "A research PhD in human-AI interaction, in planning — the long route to being the person Ireland calls about this." },
      { name: "BWAI course", status: "build", blurb: "Building With AI: a six-week course teaching people to ship with these tools." },
      { name: "Aithint", status: "build", blurb: "Recognition: a course project on spotting AI failure modes; demo stage." },
      { name: "Fuzz session", status: "build", blurb: "Reading the Fuzz: a sixty-minute guest session teaching students to catch a model going off the rails, live, in the room." },
      { name: "Trust session", status: "build", blurb: "Trust, cybertrust, and AI: an interactive session for an applied-AI masters cohort." },
      { name: "Solopreneur book", status: "build", blurb: "The AI Solopreneur: a field report on running a one-person, AI-leveraged shop — written by someone actually doing it." },
      { name: "Cyberpsych research", status: "build", blurb: "The masters research thread, continuing toward journal publication." },
    ],
  },
  {
    id: "ground",
    title: "An bonn",
    sub: "the ground — what everything stands on",
    wide: true,
    items: [
      { name: "Féith mesh", status: "live", blurb: "The vein: a private WireGuard mesh joining every machine in the fleet." },
      { name: "Rialú", status: "live", blurb: "Control: the command centre, with browser terminals into every host." },
      { name: "Suim", status: "live", blurb: "Interest: a usage monitor — ps and top for AI assistant usage across the fleet." },
      { name: "Tomhas", status: "live", blurb: "Measure: a conversation-context risk gauge that tells the assistant when to stop trusting itself." },
      { name: "Testy", status: "live", blurb: "The wiring tester: verifies tool hookup across every AI client before anything real depends on it." },
      { name: "Sentinel", status: "live", blurb: "The watchman: logs, scores, and reports hostile traffic." },
      { name: "Taisce", status: "live", blurb: "The hoard: an encrypted vault for keys, logins, and notes." },
      { name: "Flyer", status: "live", blurb: "Cloud fleet operations: status, logs, secrets, and restarts." },
      { name: "Rian", status: "live", blurb: "The trace: reads every conversation and repository and rebuilds the whole project timeline, unattended, every Monday morning." },
      { name: "firstlight", status: "build", blurb: "The fleet environment kit: dotfiles, manifests, and per-host install scripts, version-controlled." },
      { name: "git-mcp", status: "live", blurb: "Git over MCP: clone, branch, diff, commit and push across the repos without leaving the conversation." },
      { name: "foxxe-mcp", status: "live", blurb: "The shared tool-plumbing every service stands on. v0.5.3 — and as of September all eleven MCP servers in the fleet run on it." },
    ],
  },
  {
    id: "backcountry",
    title: "An cúlra",
    sub: "the back country — the wider estate",
    wide: true,
    items: [
      { name: "Stór", status: "live", blurb: "The store: the storefront platform behind stor.irish — the publishing arm's till." },
      { name: "Foxxe Frey backlist", status: "live", blurb: "The fiction backlist, selling at foxxefrey.com." },
      { name: "Foxxe Covers", status: "build", blurb: "Cover production for the books, in development." },
      { name: "Reasons for Discord", status: "build", blurb: "A written work, in drafting." },
      { name: "sionnach", status: "live", blurb: "The fox: the umbrella site at sionnach.ie sheltering the smaller tools." },
      { name: "Foghlaim", status: "live", blurb: "Learning: a v1 app under the sionnach roof." },
      { name: "ga-say", status: "live", blurb: "A small Irish-language speech helper, v1." },
      { name: "Glór", status: "live", blurb: "Voice: a v1 speech service, deployed." },
      { name: "agora", status: "live", blurb: "The gathering place at agora.irish." },
      { name: "Litir", status: "build", blurb: "Letter: the mail layer of the Anseo platform, phase 1 complete." },
      { name: "Comhordú", status: "plan", blurb: "Coordination: specified and build-ready at comhordu.irish." },
      { name: "Tionól", status: "plan", blurb: "Assembly: a placeholder with a domain waiting at tionol.irish." },
      { name: "Four small apps", status: "plan", blurb: "Coinne, Dialann, Geall, Céim — appointment, diary, pledge, step: four small Irish-named apps, specified and queued." },
      { name: "Taca", status: "live", blurb: "Support: a personal service in phase-1 testing." },
      { name: "Cúltaca", status: "build", blurb: "The reserve: backup configuration and runbook, v0.1." },
      { name: "foxxelabs-config", status: "build", blurb: "The registry: fleet configuration and specs under version control." },
      { name: "mcp-watcher", status: "live", blurb: "Keeps an eye on the MCP servers." },
      { name: "george", status: "live", blurb: "George: a phase-0 service at george.foxxelabs.ie." },
      { name: "Duel", status: "live", blurb: "The two-pane model face-off that Beirt was forked from." },
      { name: "Versus", status: "live", blurb: "A head-to-head comparison site, deployed." },
      { name: "The Forge", status: "live", blurb: "A builder's bench at builder.foxxelabs.ie." },
      { name: "SLAM Bridge", status: "live", blurb: "An interactive bridge-auction site at slambridge.ie." },
      { name: "stats-course", status: "live", blurb: "A statistics course, deployed." },
      { name: "CyberSafer", status: "live", blurb: "Online-safety resources at cybersafer.uk." },
      { name: "UCAHub", status: "build", blurb: "The masters study platform — pre-live, ethics approval pending." },
      { name: "URBS", status: "build", blurb: "A city in a game: playable prototype." },
      { name: "Stele", status: "plan", blurb: "Shelved: the UE5 forerunner that URBS superseded." },
      { name: "Faire", status: "build", blurb: "The watch: a desktop app at phase 4." },
      { name: "Teas", status: "build", blurb: "Heat: fleet thermal telemetry, scaffolded — blocked on a telemetry brief." },
      { name: "Áit", status: "build", blurb: "Place: a prototype carrying a thesis test." },
      { name: "Scéal", status: "build", blurb: "Story: multi-voice audio rendering of prose — speaker attribution, a cast list, and a voice per character." },
      { name: "Sanas", status: "plan", blurb: "Glossary: v0.1 spec accepted, early scaffold." },
      { name: "Miteo", status: "plan", blurb: "Specced, never run — parked." },
      { name: "Finne", status: "plan", blurb: "Witness: bootstrapped, pre-implementation." },
      { name: "Suil", status: "plan", blurb: "The eye: a research probe at suil.irish." },
      { name: "Explore Ireland", status: "build", blurb: "Points of interest across the island, in progress." },
      { name: "Foxxeeye", status: "build", blurb: "In development." },
      { name: "Personality Quiz", status: "build", blurb: "A personality quiz, in development." },
      { name: "FoxxeLabs STEP", status: "build", blurb: "In development." },
      { name: "Cło", status: "plan", blurb: "Toll: the multi-book translation platform. A working English-to-German slice, then deprioritised — Translator carries the live work now." },
      { name: "Teorainn", status: "plan", blurb: "Boundary: the analysis is finished, the interactive explorer is build-ready." },
      { name: "Tairseach", status: "plan", blurb: "Threshold: specified, pre-implementation." },
      { name: "AfterWords", status: "plan", blurb: "The long-running writing-and-voice research thread." },
      { name: "dirs", status: "live", blurb: "A small directory utility, deployed and quietly in use." },
      { name: "Fáidh", status: "plan", blurb: "The seer: a v0 that returned a negative result and was shelved on the strength of it." },
      { name: "Legion", status: "plan", blurb: "Retired: closed out in September, never built." },
      { name: "park", status: "plan", blurb: "Paused — as the name insists." },
    ],
  },
];

export const CENSUS = REGIONS.reduce((acc, r) => {
  for (const it of r.items) { acc[it.status]++; acc.total++; }
  return acc;
}, { live: 0, build: 0, plan: 0, total: 0 });
