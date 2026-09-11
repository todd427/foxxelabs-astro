// src/data/tools.js
//
// The Workshop's cabinet. One entry per tool; /tools/ renders the full set and
// the homepage Workshop card picks its headliners off the front of it, so the
// two cannot drift apart the way a hand-kept duplicate list does.
//
//   group: tools | quizzes | experimental
//   Add a tool = add a line.

export const PROJECTS = [
  // ── Tools ───────────────────────────────────────────────
  {
    group: 'tools',
    name: 'Gaeltacht', role: 'Irish pronunciation', headliner: true, gloss: 'fuaimniú na Gaeilge · Irish pronunciation',
    hook: `Hear any Irish word spoken aloud. 70+ phrases across seven categories, four voices of paper.`,
    tags: ['In-browser', 'Web Speech', 'No backend'],
    dom: 'gaeltacht.sionnach.ie', url: 'https://gaeltacht.sionnach.ie',
  },
  {
    group: 'tools',
    name: 'Foghlaim', role: 'Irish flashcards', headliner: true, gloss: 'cártaí · Irish flashcards',
    hook: `Irish vocabulary by spaced repetition — flip cards, quiz mode, and a daily streak, voiced through the same engine as Gaeltacht.`,
    tags: ['In-browser', 'Spaced repetition', 'No backend'],
    dom: 'foghlaim.sionnach.ie', url: 'https://foghlaim.sionnach.ie',
  },
  {
    group: 'tools',
    name: 'Beirt', role: 'Two models, compared', headliner: true, gloss: 'beirt · the two of them',
    hook: `Run one prompt through two models side by side and read them against each other. Bring your own key — it never leaves your browser.`,
    tags: ['In-browser', 'Bring your own key', 'No account'],
    dom: 'beirt.foxxelabs.ie', url: 'https://beirt.foxxelabs.ie',
  },
  {
    group: 'tools',
    name: 'Tuiscint', role: 'Cited answers', gloss: 'tuiscint · understanding',
    hook: `Ask a question, get the source for every claim — and "not stated" rather than a guess when the sources don't say it. Read the open web or a fixed canon.`,
    tags: ['Cited answers', 'Web or canon', 'No account'],
    dom: 'tuiscint.uk', url: 'https://tuiscint.uk',
  },
  {
    group: 'tools',
    name: 'The Forge', role: 'PC builder', headliner: true, gloss: 'where things are made',
    hook: `Don't spec a PC — say what you want it to do. Five archetypes, one shareable build card.`,
    tags: ['In-browser', 'No account'],
    dom: 'builder.foxxelabs.ie', url: 'https://builder.foxxelabs.ie',
  },
  {
    group: 'tools',
    name: 'SLAM Bridge', role: 'Bridge trainer', headliner: true, gloss: 'the bidding table',
    hook: `From opening bid to grand slam. A bridge bidding trainer with AI opponents and 30 hand-built deals.`,
    tags: ['AI opponents', 'Web'],
    dom: 'slambridge.ie', url: 'https://slambridge.ie',
  },
  {
    group: 'tools',
    name: 'CyberSafer', role: 'Online safety', gloss: 'stay safe online',
    hook: `Plain-language cyber safety — learn to spot the scam before it lands.`,
    tags: ['Web', 'Free'],
    dom: 'cybersafer.uk', url: 'https://cybersafer.uk',
  },
  {
    group: 'tools',
    name: 'aithint', role: 'AI literacy', headliner: true, gloss: 'aithint · recognition',
    hook: `Learn to partner with AI instead of fearing it — a plain-language course in reading the machine.`,
    tags: ['Course', 'AI literacy'],
    dom: 'aithint.us', url: 'https://aithint.us',
  },

  // ── Quizzes & snapshots ─────────────────────────────────
  {
    group: 'quizzes',
    name: 'Thinking Style Snapshot', role: 'Thinking style', gloss: 'focused ↔ broad',
    hook: `Ten yes/no statements that place you on the focused-to-broad/systems spectrum, with multipotentialite follow-ons.`,
    tags: ['Quiz', '~2 min', 'No data stored'],
    dom: 'foxxelabs.ie/tools/thinking-style-snapshot', url: '/tools/thinking-style-snapshot/',
  },
  {
    group: 'quizzes',
    name: 'Python Knowledge Quiz', role: 'Python quiz', gloss: 'data types to dark corners',
    hook: `Fifteen multiple-choice questions from comprehensions and OOP to the interpreter's internals — beginner to expert.`,
    tags: ['Quiz', '15 questions', 'No data stored'],
    dom: 'foxxelabs.ie/tools/python-quiz', url: '/tools/python-quiz/',
  },
  {
    group: 'quizzes',
    name: 'Python Week 3 Quiz', role: 'Python quiz', gloss: 'the Week 3 syllabus',
    hook: `Booleans, if/elif/else, nested conditions, loops and functions — ten questions on the Week 3 material.`,
    tags: ['Quiz', 'Course', '10 questions'],
    dom: 'foxxelabs.ie/tools/python-week3-quiz', url: '/tools/python-week3-quiz/',
  },
  {
    group: 'quizzes',
    name: 'E-commerce Psychology Quiz', role: 'Buying psychology', gloss: 'the psychology of the buy',
    hook: `Kahneman, Cialdini, Schwartz and Belk — a fast cheat sheet, then a quiz on what makes us click "buy".`,
    tags: ['Quiz', 'Cheat sheet'],
    dom: 'foxxelabs.ie/esc-quiz', url: '/esc-quiz/',
  },
  {
    group: 'quizzes',
    name: 'Cyberpsychology Quiz', role: 'Cyberpsychology quiz', gloss: 'cyber-aggression to research methods',
    hook: `Cyber-aggression, moral disengagement, online disinhibition, AI psychology and methods — difficulty levels and mastery tracking.`,
    tags: ['Quiz', 'Mastery tracking'],
    dom: 'ucahub.ie/quiz', url: 'https://ucahub.ie/quiz/',
  },

  // ── Experimental ────────────────────────────────────────
  {
    group: 'experimental', exp: true,
    name: 'Sionnach', role: 'On-device AI', headliner: true, gloss: 'an sionnach · the fox',
    hook: `Build a mind, then talk to it. A private AI personality engine running on your own GPU.`,
    tags: ['On-device', 'WebGPU', 'No account'],
    req: 'a browser with WebGPU — Chrome, Edge, Firefox 141+, or Safari 26+ — and a GPU with a few GB free. First run downloads a 1–5 GB model, then runs offline.',
    dom: 'sionnach.ie', url: 'https://sionnach.ie',
  },
  {
    group: 'experimental', exp: true,
    name: 'Agora', role: 'On-device debate', headliner: true, gloss: 'the gathering place',
    hook: `Convene a panel of 21 historical minds and let them argue it out — multi-persona debate, in the browser.`,
    tags: ['On-device', 'WebGPU', 'No account'],
    req: 'a browser with WebGPU — Chrome, Edge, Firefox 141+, or Safari 26+ — and a GPU with a few GB free. First run downloads a 1–5 GB model, then runs offline.',
    dom: 'agora.irish', url: 'https://agora.irish',
  },
];

export const SECTION_LABELS = [
  { key: 'tools',        label: 'Tools' },
  { key: 'quizzes',      label: 'Quizzes & snapshots' },
  { key: 'experimental', label: 'Experimental' },
];

export const SECTIONS = SECTION_LABELS
  .map((s) => ({ ...s, items: PROJECTS.filter((p) => p.group === s.key) }))
  .filter((s) => s.items.length);
