import type { Verdict } from "@/engines/ScanEngine";

export interface LiveEvent {
  id: string;
  ts: string;
  reqId: string;
  verdict: Verdict;
  category: string;
  severity: string;
  latency: number;
  policy: string;
  app: string;
}

export interface Span {
  name: string;
  kind: "root" | "scan" | "llm" | "tool";
  startMs: number;
  durationMs: number;
  attrs: Record<string, string | number>;
}

export interface Trace {
  id: string;
  operation: string;
  model: string;
  spans: Span[];
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  verdict: Verdict;
  ts: string;
}

export interface TimelineStep {
  label: string;
  ts: string;
  done: boolean;
}

export interface Incident {
  id: string;
  sev: "sev-1" | "sev-2";
  title: string;
  spark: number[];
  status: "investigating" | "mitigating" | "resolved";
  assignee: string;
  opened: string;
  timeline: TimelineStep[];
  relatedScans: { reqId: string; verdict: Verdict; latency: number; ts: string }[];
}

const CATS: Array<[string, string]> = [
  ["hate", "Safe · 0"],
  ["violence", "Low · 2"],
  ["xpia", "High · 6"],
  ["sexual", "Medium · 4"],
  ["self_harm", "Low · 2"],
  ["pii.email", "Mask"],
  ["groundedness", "Medium · 4"],
];
const SEVS = ["Safe · 0", "Low · 2", "Medium · 4", "High · 6"];
const POLICIES = ["prod-default", "support-agent", "chat-strict", "eu-ai-act"];
const APPS = ["support-agent", "copilot-web", "billing-bot", "internal-rag", "mobile-sdk"];

const VERDICT_W: Array<[Verdict, number]> = [["PASS", 91.2], ["FLAG", 3.1], ["MASK", 2.0], ["BLOCK", 3.7]];

function pickVerdict(): Verdict {
  let r = Math.random() * 100;
  for (const [v, w] of VERDICT_W) { r -= w; if (r <= 0) return v; }
  return "PASS";
}

export function makeEvent(i = 0): LiveEvent {
  const verdict = pickVerdict();
  const cat = CATS[Math.floor(Math.random() * CATS.length)];
  const sev = verdict === "PASS" ? "Safe · 0" : cat[1];
  const now = Date.now() - i * 2400;
  return {
    id: `ev_${now.toString(36)}_${Math.floor(Math.random() * 9999)}`,
    ts: new Date(now).toLocaleTimeString("en-GB", { hour12: false }),
    reqId: `req_${Math.random().toString(36).slice(2, 10)}`,
    verdict,
    category: cat[0],
    severity: SEVS.includes(sev) ? sev : "Safe · 0",
    latency: Math.round(35 + Math.random() * 200),
    policy: POLICIES[Math.floor(Math.random() * POLICIES.length)],
    app: APPS[Math.floor(Math.random() * APPS.length)],
  };
}

export function seedEvents(n: number): LiveEvent[] {
  return Array.from({ length: n }, (_, i) => makeEvent(i));
}

// ---- charts ----
export interface SevBucket { h: string; safe: number; low: number; medium: number; high: number }
export function severitySeries(): SevBucket[] {
  return Array.from({ length: 24 }, (_, h) => ({
    h: `${String(h).padStart(2, "0")}:00`,
    safe: Math.round(4200 + Math.random() * 1400),
    low: Math.round(90 + Math.random() * 80),
    medium: Math.round(40 + Math.random() * 45),
    high: Math.round(12 + Math.random() * 30),
  }));
}

export interface LatPoint { h: string; p50: number; p95: number; p99: number }
export function latencySeries(): LatPoint[] {
  return Array.from({ length: 24 }, (_, h) => {
    const wave = Math.sin(h / 3.8) * 14;
    const p50 = Math.round(41 + wave + Math.random() * 6);
    return { h: `${String(h).padStart(2, "0")}:00`, p50, p95: p50 + Math.round(60 + Math.random() * 30), p99: p50 + Math.round(120 + Math.random() * 60) };
  });
}

export const VERDICT_MIX: Array<{ name: Verdict; value: number; color: string }> = [
  { name: "PASS", value: 91.2, color: "#38E1C6" },
  { name: "FLAG", value: 3.1, color: "#F5B544" },
  { name: "MASK", value: 2.0, color: "#5B8CFF" },
  { name: "BLOCK", value: 3.7, color: "#F5586B" },
];

// ---- incidents ----
export const INCIDENTS: Incident[] = [
  {
    id: "inc_88", sev: "sev-1", title: "Spike in XPIA blocks on support-agent",
    spark: [2, 3, 2, 5, 9, 14, 11, 8], status: "investigating", assignee: "MK", opened: "14 min ago",
    timeline: [
      { label: "Alert fired: block rate > 5% / 5m", ts: "21:04:11", done: true },
      { label: "Incident created · paged on-call", ts: "21:04:40", done: true },
      { label: "Attack cluster fingerprinted (base64 + xpia)", ts: "21:09:02", done: true },
      { label: "Mitigation: shield threshold 0.85 → 0.72", ts: "—", done: false },
    ],
    relatedScans: [
      { reqId: "req_9f31ax2k", verdict: "BLOCK", latency: 87, ts: "21:03:58" },
      { reqId: "req_77q0mze1", verdict: "BLOCK", latency: 112, ts: "21:02:41" },
      { reqId: "req_55kdp92v", verdict: "FLAG", latency: 64, ts: "21:01:17" },
      { reqId: "req_31vxw8an", verdict: "BLOCK", latency: 95, ts: "20:58:33" },
    ],
  },
  {
    id: "inc_87", sev: "sev-2", title: "Custom category drift: 'financial-advice'",
    spark: [4, 4, 5, 6, 6, 8, 7, 7], status: "mitigating", assignee: "JW", opened: "1 h ago",
    timeline: [
      { label: "Eval drift detected: adherence -6.2 pts", ts: "20:02:10", done: true },
      { label: "Incident created", ts: "20:02:55", done: true },
      { label: "Rollback policy v14 → v13 staged", ts: "20:31:40", done: true },
      { label: "Verification eval suite running", ts: "—", done: false },
    ],
    relatedScans: [
      { reqId: "req_ad8k1p0q", verdict: "FLAG", latency: 71, ts: "20:01:22" },
      { reqId: "req_b72mn4xz", verdict: "PASS", latency: 44, ts: "19:58:10" },
    ],
  },
  {
    id: "inc_85", sev: "sev-2", title: "p99 latency regression on eu-west gateway",
    spark: [180, 190, 210, 260, 310, 280, 240, 220], status: "resolved", assignee: "AG", opened: "3 h ago",
    timeline: [
      { label: "Alert fired: p99 > 500ms / 5m", ts: "18:12:03", done: true },
      { label: "Incident created", ts: "18:12:30", done: true },
      { label: "Mitigation: scanner pool scaled 8 → 16", ts: "18:26:51", done: true },
      { label: "Resolved · p99 back to 212ms", ts: "18:41:09", done: true },
    ],
    relatedScans: [{ reqId: "req_eu99w1lk", verdict: "PASS", latency: 620, ts: "18:11:44" }],
  },
  {
    id: "inc_82", sev: "sev-1", title: "Credential-stuffing pattern on /v1/scan",
    spark: [1, 1, 2, 4, 7, 6, 3, 2], status: "resolved", assignee: "RS", opened: "9 h ago",
    timeline: [
      { label: "WAF anomaly → incident", ts: "12:40:02", done: true },
      { label: "Rate-limit profile tightened", ts: "12:55:18", done: true },
      { label: "Resolved", ts: "13:20:44", done: true },
    ],
    relatedScans: [{ reqId: "req_waf00x3z", verdict: "BLOCK", latency: 12, ts: "12:40:00" }],
  },
  {
    id: "inc_79", sev: "sev-2", title: "PII masker false positives on phone regex",
    spark: [3, 4, 6, 8, 9, 7, 5, 4], status: "resolved", assignee: "MK", opened: "1 d ago",
    timeline: [
      { label: "User reports: order IDs masked", ts: "08:11:00", done: true },
      { label: "Regex tuned · redeployed", ts: "09:32:41", done: true },
      { label: "Resolved", ts: "09:58:02", done: true },
    ],
    relatedScans: [{ reqId: "req_pii88q2m", verdict: "MASK", latency: 58, ts: "08:10:31" }],
  },
];

// ---- traces ----
function spanSet(verdict: Verdict, shieldConf: number): Span[] {
  const scan = Math.round(28 + Math.random() * 40);
  const llm = Math.round(420 + Math.random() * 900);
  const tool = Math.round(60 + Math.random() * 120);
  const total = scan + llm + tool + 40;
  return [
    { name: "chat.completion", kind: "root", startMs: 0, durationMs: total, attrs: { "gen_ai.operation.name": "chat.completion", "gen_ai.request.model": "gpt-4o", "gen_ai.usage.input_tokens": 812, "gen_ai.usage.output_tokens": 214 } },
    { name: "aegis.scan", kind: "scan", startMs: 6, durationMs: scan, attrs: { "aegis.policy": "prod-default", "aegis.verdict": verdict, "aegis.shield.confidence": shieldConf, "aegis.categories.flagged": verdict === "PASS" ? 0 : 1, "aegis.latency_ms": scan } },
    { name: "llm.call", kind: "llm", startMs: scan + 14, durationMs: llm, attrs: { "gen_ai.system": "openai", "gen_ai.request.temperature": 0.2, "gen_ai.response.finish_reasons": "stop" } },
    { name: "tool.search_kb", kind: "tool", startMs: scan + llm + 22, durationMs: tool, attrs: { "tool.name": "search_kb", "tool.args.top_k": 4 } },
    { name: "aegis.scan.output", kind: "scan", startMs: total - 18, durationMs: 14, attrs: { "aegis.policy": "prod-default", "aegis.verdict": verdict, "aegis.pii.masked": verdict === "MASK" ? 1 : 0 } },
  ];
}

const MODELS = ["gpt-4o", "claude-sonnet-4", "llama-3.1-70b", "gpt-4o-mini", "mistral-large"];
const OPS = ["chat.completion", "chat.completion", "chat.completion", "tool.call", "aegis.scan"];

export function makeTraces(n = 14): Trace[] {
  return Array.from({ length: n }, (_, i) => {
    const verdict = pickVerdict();
    const spans = spanSet(verdict, Math.round((0.62 + Math.random() * 0.37) * 100) / 100);
    const dur = spans[0].durationMs;
    return {
      id: `tr_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
      operation: OPS[Math.floor(Math.random() * OPS.length)],
      model: MODELS[Math.floor(Math.random() * MODELS.length)],
      spans,
      durationMs: dur,
      tokensIn: 400 + Math.round(Math.random() * 1800),
      tokensOut: 80 + Math.round(Math.random() * 600),
      verdict,
      ts: new Date(Date.now() - i * 137000).toLocaleTimeString("en-GB", { hour12: false }),
    };
  });
}

export const SPAN_COLORS: Record<Span["kind"], string> = {
  root: "#5B8CFF",
  scan: "#38E1C6",
  llm: "#9B7BFF",
  tool: "#5C6B7F",
};
