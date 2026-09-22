// EvalEngine — simulated evaluation engine: metric distributions, per-row
// scores with judge reasons, run comparison with significance tests.

export type EvaluatorKind =
  | "coherence" | "fluency" | "relevance" | "groundedness"
  | "retrieval" | "taskAdherence" | "toolCallAccuracy" | "safetyComposite";

export interface EvaluatorMeta {
  id: EvaluatorKind;
  name: string;
  family: "quality" | "rag" | "safety" | "agent";
  scale: string;
  description: string;
}

export const EVALUATOR_CATALOG: EvaluatorMeta[] = [
  { id: "coherence", name: "Coherence", family: "quality", scale: "1–5", description: "Logical flow and structure of generated text." },
  { id: "fluency", name: "Fluency", family: "quality", scale: "1–5", description: "Grammatical and stylistic quality." },
  { id: "relevance", name: "Relevance", family: "quality", scale: "1–5", description: "How well the response addresses the query." },
  { id: "groundedness", name: "Groundedness", family: "rag", scale: "1–5", description: "Factual alignment with retrieved context." },
  { id: "retrieval", name: "Retrieval", family: "rag", scale: "1–5", description: "Quality of retrieved chunks for the query." },
  { id: "taskAdherence", name: "Task Adherence", family: "agent", scale: "1–5", description: "Agent follows the assigned task to completion." },
  { id: "toolCallAccuracy", name: "Tool Call Accuracy", family: "agent", scale: "0–1", description: "Correct tool selected with correct arguments." },
  { id: "safetyComposite", name: "Safety Composite", family: "safety", scale: "0–1", description: "Aggregate of harm categories; higher is safer." },
];

export interface RowScore {
  rowId: string;
  input: string;
  output: string;
  score: number;
  reason: string;
}

export interface MetricResult {
  evaluator: EvaluatorKind;
  mean: number;
  p50: number;
  p95: number;
  distribution: number[]; // 10-bucket histogram 0..1 normalized
  rows: RowScore[];
}

export interface EvalRun {
  runId: string;
  name: string;
  dataset: string;
  model: string;
  metrics: MetricResult[];
  rowCount: number;
  passRate: number;
  createdAt: string;
  status: "complete" | "running" | "failed";
}

export interface MetricComparison {
  evaluator: EvaluatorKind;
  baseline: number;
  candidate: number;
  delta: number;
  pValue: number;
  significant: boolean;
}

const SAMPLE_INPUTS = [
  "Summarize the Q3 earnings call for the board.",
  "What's the refund policy for annual plans?",
  "Draft a follow-up email to the vendor about SLA breaches.",
  "Explain the migration path from v1 to v2 API.",
  "Classify this support ticket and suggest next actions.",
  "Compare our uptime against the contractual 99.9%.",
];

const REASON_TEMPLATES = {
  high: ["Fully addresses the query with grounded specifics.", "Clean structure, no unsupported claims.", "Correct tool selected; arguments match schema."],
  mid: ["Mostly relevant; misses one constraint from the prompt.", "Grounded in 2 of 3 retrieved passages.", "Minor redundancy but logically coherent."],
  low: ["Introduces an ungrounded figure not in context.", "Drifts off-task after the second paragraph.", "Wrong tool selected; recovered on retry."],
};

function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateMetric(evaluator: EvaluatorKind, rowCount = 24, bias = 0): MetricResult {
  const meta = EVALUATOR_CATALOG.find((e) => e.id === evaluator)!;
  const is01 = meta.scale === "0–1";
  const center = Math.min(0.99, rnd(0.62, 0.9) + bias);
  const scores = Array.from({ length: rowCount }, () => Math.max(0, Math.min(1, center + rnd(-0.18, 0.14))));
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((a, s) => a + s, 0) / scores.length;
  const distribution = Array.from({ length: 10 }, (_, i) => scores.filter((s) => s >= i / 10 && s < (i + 1) / 10).length);

  const rows: RowScore[] = scores.slice(0, 8).map((s, i) => {
    const band = s > 0.75 ? "high" : s > 0.5 ? "mid" : "low";
    const scaled = is01 ? s : +(s * 4 + 1).toFixed(1);
    return {
      rowId: `row-${String(i + 1).padStart(3, "0")}`,
      input: SAMPLE_INPUTS[i % SAMPLE_INPUTS.length],
      output: "(model response excerpt)",
      score: +scaled.toFixed(is01 ? 2 : 1),
      reason: pick(REASON_TEMPLATES[band]),
    };
  });

  const scale = (v: number) => (is01 ? +v.toFixed(3) : +(v * 4 + 1).toFixed(2));
  return {
    evaluator,
    mean: scale(mean),
    p50: scale(sorted[Math.floor(sorted.length / 2)]),
    p95: scale(sorted[Math.floor(sorted.length * 0.95)]),
    distribution,
    rows,
  };
}

export function runEvaluation(opts: { evaluators?: EvaluatorKind[]; name?: string; dataset?: string; model?: string }): EvalRun {
  const evaluators = opts.evaluators ?? ["coherence", "relevance", "groundedness", "safetyComposite"];
  const metrics = evaluators.map((e) => generateMetric(e));
  const pass = metrics.reduce((a, m) => a + (m.mean / (EVALUATOR_CATALOG.find((c) => c.id === m.evaluator)!.scale === "0–1" ? 1 : 5)), 0) / metrics.length;
  return {
    runId: `eval-${Math.random().toString(36).slice(2, 8)}`,
    name: opts.name ?? "nightly-quality-gate",
    dataset: opts.dataset ?? "prod-sample-2k.jsonl",
    model: opts.model ?? "gpt-4o @ 2025-08",
    metrics,
    rowCount: 2000,
    passRate: +pass.toFixed(3),
    createdAt: new Date().toISOString(),
    status: "complete",
  };
}

export function compareRuns(baseline: EvalRun, candidate: EvalRun): MetricComparison[] {
  return candidate.metrics.map((m) => {
    const b = baseline.metrics.find((x) => x.evaluator === m.evaluator);
    const base = b ? b.mean : m.mean - rnd(-0.06, 0.06);
    const delta = +(m.mean - base).toFixed(3);
    const pValue = Math.abs(delta) > 0.04 ? rnd(0.001, 0.04) : rnd(0.06, 0.4);
    return {
      evaluator: m.evaluator,
      baseline: base,
      candidate: m.mean,
      delta,
      pValue: +pValue.toFixed(4),
      significant: pValue < 0.05,
    };
  });
}
