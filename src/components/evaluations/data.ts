// Shared mock data for the Evaluation Studio page.

export type RunStatus = "complete" | "running" | "failed" | "queued";

export interface DashRun {
  id: string;
  name: string;
  target: string;
  bundles: string[];
  family: string[];
  rows: number;
  score: number; // 0..5
  status: RunStatus;
  progress?: number;
  duration: string;
  cost: string;
  tokens: string;
  created: string;
}

export const RUNS: DashRun[] = [
  { id: "ev_3312", name: "support-agent v2.3 eval", target: "support-agent · v2.3", bundles: ["RAG pack", "Safety pack"], family: ["rag", "safety"], rows: 500, score: 4.3, status: "complete", duration: "6m 12s", cost: "$4.12", tokens: "1.2M", created: "12m ago" },
  { id: "ev_3311", name: "nightly quality gate", target: "qa-bot · nightly", bundles: ["QA bundle"], family: ["quality"], rows: 2000, score: 4.1, status: "running", progress: 64, duration: "3m 40s", cost: "$2.87", tokens: "0.8M", created: "31m ago" },
  { id: "ev_3308", name: "agent health sweep", target: "support-agent · v2.3", bundles: ["Agent Health bundle"], family: ["agent"], rows: 350, score: 4.0, status: "complete", duration: "4m 02s", cost: "$3.44", tokens: "0.9M", created: "2h ago" },
  { id: "ev_3304", name: "safety regression · dec", target: "all endpoints", bundles: ["ContentSafety bundle"], family: ["safety"], rows: 1200, score: 4.8, status: "complete", duration: "9m 51s", cost: "$6.20", tokens: "2.1M", created: "5h ago" },
  { id: "ev_3296", name: "xpia probe eval", target: "billing-agent · v1.9", bundles: ["Safety pack"], family: ["safety"], rows: 800, score: 3.9, status: "failed", duration: "1m 18s", cost: "$0.92", tokens: "0.3M", created: "1d ago" },
  { id: "ev_3288", name: "rag pack · chunking exp", target: "kb-search · exp-4", bundles: ["RAG pack"], family: ["rag"], rows: 500, score: 4.2, status: "complete", duration: "5m 44s", cost: "$3.98", tokens: "1.1M", created: "2d ago" },
  { id: "ev_3280", name: "support-agent v2.2 eval", target: "support-agent · v2.2", bundles: ["RAG pack", "Safety pack"], family: ["rag", "safety"], rows: 500, score: 4.0, status: "complete", duration: "6m 01s", cost: "$4.05", tokens: "1.2M", created: "3d ago" },
  { id: "ev_3271", name: "fluency spot check", target: "copy-writer · v3", bundles: ["QA bundle"], family: ["quality"], rows: 150, score: 4.6, status: "complete", duration: "1m 52s", cost: "$1.10", tokens: "0.2M", created: "4d ago" },
];

export interface CatalogEntry {
  name: string;
  type: "builtin" | "composite" | "custom";
  desc: string;
  create?: string;
}

export const CATALOG: { family: string; entries: CatalogEntry[] }[] = [
  {
    family: "Quality",
    entries: [
      { name: "coherence", type: "builtin", desc: "Logical flow and structure of generated text (1–5)." },
      { name: "fluency", type: "builtin", desc: "Grammatical and stylistic quality of the response." },
      { name: "similarity", type: "builtin", desc: "Semantic similarity vs ground-truth answer." },
      { name: "f1", type: "builtin", desc: "Token-level F1 against reference spans." },
      { name: "bleu", type: "builtin", desc: "N-gram overlap precision vs reference." },
      { name: "rouge", type: "builtin", desc: "Recall-oriented overlap for summarization." },
      { name: "meteor", type: "builtin", desc: "Alignment with synonyms and stemming." },
    ],
  },
  {
    family: "RAG",
    entries: [
      { name: "retrieval score", type: "builtin", desc: "Quality of retrieved chunks for the query." },
      { name: "groundedness", type: "builtin", desc: "Factual alignment with retrieved context (1–5)." },
      { name: "relevance", type: "builtin", desc: "How well the response addresses the query." },
      { name: "completeness", type: "builtin", desc: "Coverage of all aspects of the question." },
    ],
  },
  {
    family: "Safety",
    entries: [
      { name: "hate", type: "builtin", desc: "Hate and fairness severity detection." },
      { name: "sexual", type: "builtin", desc: "Sexual content severity detection." },
      { name: "violence", type: "builtin", desc: "Violent content severity detection." },
      { name: "self-harm", type: "builtin", desc: "Self-harm content severity detection." },
      { name: "protected material", type: "builtin", desc: "Copyrighted text regurgitation check." },
      { name: "xpia", type: "builtin", desc: "Indirect prompt injection in retrieved content." },
      { name: "code vulnerability", type: "builtin", desc: "Insecure code pattern detection." },
    ],
  },
  {
    family: "Agent",
    entries: [
      { name: "intent resolution", type: "builtin", desc: "Agent resolves the user's underlying intent." },
      { name: "tool call accuracy", type: "builtin", desc: "Correct tool selected with correct arguments." },
      { name: "tool selection", type: "builtin", desc: "Right tool chosen for each subtask." },
      { name: "tool input correctness", type: "builtin", desc: "Tool arguments match schema and intent." },
      { name: "tool output correctness", type: "builtin", desc: "Tool results used faithfully in response." },
      { name: "task adherence", type: "builtin", desc: "Agent follows the assigned task to completion." },
      { name: "customer satisfaction", type: "builtin", desc: "Simulated CSAT from interaction quality." },
    ],
  },
  {
    family: "Composite bundles",
    entries: [
      { name: "QA bundle", type: "composite", desc: "coherence · fluency · relevance · similarity" },
      { name: "ContentSafety bundle", type: "composite", desc: "hate · sexual · violence · self-harm · xpia" },
      { name: "Agent Health bundle", type: "composite", desc: "intent · tool accuracy · task adherence · CSAT" },
    ],
  },
  {
    family: "Custom",
    entries: [
      { name: "code evaluator", type: "custom", desc: "Python function returning a score per row.", create: "Create code evaluator" },
      { name: "prompt evaluator", type: "custom", desc: "LLM-judge with your own rubric prompt.", create: "Create prompt evaluator" },
      { name: "endpoint evaluator", type: "custom", desc: "Remote HTTP scorer with batch API.", create: "Create endpoint evaluator" },
    ],
  },
];

export function scoreColor(v: number, max = 5): string {
  const t = max === 5 ? v : v * 5;
  if (t >= 4) return "text-aegis";
  if (t >= 3) return "text-warn";
  return "text-danger";
}

export const QUERIES = [
  "What's the refund policy for annual plans?",
  "Summarize the Q3 earnings call for the board.",
  "Explain the migration path from v1 to v2 API.",
  "Draft a follow-up email to the vendor about SLA breaches.",
  "Classify this support ticket and suggest next actions.",
  "Compare our uptime against the contractual 99.9%.",
  "How do I rotate API keys without downtime?",
  "Why was my export job stuck in queued state?",
  "List all webhooks that fired yesterday after 6pm.",
  "Can I backfill usage data for the previous quarter?",
];

export const RESPONSES = [
  "Annual plans can be refunded within 30 days of purchase; after that, refunds are prorated per the terms in §4.2 of the agreement.",
  "Revenue grew 14% QoQ to $48.2M; gross margin held at 71%; guidance raised for FY.",
  "Migrate by pinning v2 in your client, updating auth headers, then replaying the parity suite.",
  "Hi — following up on the three SLA breaches logged last week; requesting credits per clause 7.",
  "Ticket classified as billing/urgent; suggested next action: escalate to T2 with context attached.",
  "Observed uptime 99.94% vs contractual 99.9% — within SLA, no credits owed.",
];

export const CONTEXT_CHUNKS = [
  "refund-policy.md §4.2 — Annual subscriptions: full refund within 30 days; prorated thereafter.",
  "sla-terms.pdf p.7 — Service credits apply when monthly uptime < 99.9%.",
  "migration-guide.md — v2 requires Authorization: Bearer scheme; v1 keys deprecated Mar 2026.",
];

export interface ResultRow {
  n: number;
  query: string;
  response: string;
  groundedness: number;
  relevance: number;
  coherence: number;
  retrieval: number;
  safetyPass: boolean;
  reason: string;
  latencyMs: number;
  tokens: number;
}

const REASONS: [number, string][] = [
  [4.8, "Fully grounded; every claim traces to retrieved context chunks 1–2."],
  [4.5, "Clean structure, no unsupported claims; tone matches policy voice."],
  [4.2, "Grounded in 2 of 3 passages; minor redundancy in final paragraph."],
  [3.6, "Mostly relevant; misses the proration constraint from the prompt."],
  [2.8, "Introduces an ungrounded figure not present in retrieved context."],
  [2.1, "Drifts off-task after the second paragraph; no citation of sources."],
];

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRows(count = 60, seed = 7): ResultRow[] {
  const r = mulberry(seed);
  return Array.from({ length: count }, (_, i) => {
    const [base, reason] = REASONS[Math.floor(r() * REASONS.length)];
    const j = () => Math.max(1, Math.min(5, +(base + (r() - 0.5) * 0.6).toFixed(1)));
    return {
      n: i + 1,
      query: QUERIES[i % QUERIES.length],
      response: RESPONSES[i % RESPONSES.length],
      groundedness: j(),
      relevance: j(),
      coherence: j(),
      retrieval: +(0.55 + r() * 0.42).toFixed(2),
      safetyPass: r() > 0.02,
      reason,
      latencyMs: Math.round(380 + r() * 1400),
      tokens: Math.round(420 + r() * 1800),
    };
  });
}
