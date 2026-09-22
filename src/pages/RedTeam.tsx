import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Library, Plus, MoreHorizontal, ArrowLeft, Play, Square, Download,
  Flame, HeartCrack, Skull, Heart, FileLock2, Code2, MessageSquareWarning,
  Ban, KeyRound, ListChecks, MailWarning, Globe, Cpu, TerminalSquare, Check,
  Loader2, X, RefreshCw, FileJson, FileText, Database, CircleCheck, CircleX,
} from "lucide-react";
import ConsoleShell, { PageHeader } from "@/components/ConsoleShell";
import { StatCard, DataTable, Drawer } from "@/components/primitives";
import type { Column } from "@/components/primitives";
import { cn } from "@/lib/utils";
import {
  startLiveRun, simulateRun, CATEGORY_LABEL,
} from "@/engines/RedTeamEngine";
import type {
  RedTeamResult, RedTeamEvent, Conversation, RiskCategory,
} from "@/engines/RedTeamEngine";

/* ---------------------------------- types --------------------------------- */

type RunStatus = "complete" | "running" | "queued" | "failed";

interface RunRow {
  id: string;
  target: string;
  categories: string[];
  strategies: number;
  asr: number | null;
  status: RunStatus;
  duration: string;
  started: string;
}

interface WizardState {
  targetType: "http" | "aegis" | "python";
  url: string;
  authHeader: string;
  policy: string;
  categories: string[];
  strategies: string[];
  judgeModel: string;
  schedule: "one-time" | "weekly";
}

/* --------------------------------- constants ------------------------------- */

const VIOLET = "#9B7BFF";
const TEAL = "#38E1C6";
const RED = "#F5586B";
const AMBER = "#F5B544";

const HARM_CATS = [
  { id: "hate", label: "Hate & Fairness", icon: Flame },
  { id: "sexual", label: "Sexual", icon: Heart },
  { id: "violence", label: "Violence", icon: Skull },
  { id: "selfHarm", label: "Self-Harm", icon: HeartCrack },
  { id: "protectedMaterial", label: "Protected Material", icon: FileLock2 },
  { id: "codeVuln", label: "Code Vulnerability", icon: Code2 },
  { id: "ungrounded", label: "Ungrounded Attributes", icon: MessageSquareWarning },
];

const AGENTIC_CATS = [
  { id: "prohibitedActions", label: "Prohibited Actions", icon: Ban },
  { id: "sensitiveLeak", label: "Sensitive Data Leakage", icon: KeyRound },
  { id: "taskAdherence", label: "Task Adherence", icon: ListChecks },
  { id: "xpia", label: "Indirect Prompt Injection (XPIA)", icon: MailWarning },
];

const EASY_STRATS = ["Base64", "Flip", "Morse", "ROT13", "Leetspeak", "UnicodeConfusable", "Atbash", "Caesar", "AsciiArt", "Diacritic"];
const MODERATE_STRATS = [{ id: "Tense", badge: "requires LLM" }];
const DIFFICULT_STRATS = [
  { id: "Tense+Base64", badge: "composition" },
  { id: "Crescendo", badge: "multi-turn" },
  { id: "TAP", badge: "multi-turn" },
];

const INITIAL_RUNS: RunRow[] = [
  { id: "rt_2041", target: "support-agent-prod", categories: ["XPIA", "Jailbreak", "PII", "+4"], strategies: 9, asr: 12.4, status: "complete", duration: "14m 32s", started: "2h ago" },
  { id: "rt_2040", target: "chat-rtc-eu", categories: ["Hate", "Violence", "SelfHarm"], strategies: 12, asr: null, status: "running", duration: "—", started: "6m ago" },
  { id: "rt_2039", target: "claims-bot-staging", categories: ["Ungrounded", "TaskAdherence"], strategies: 6, asr: 8.1, status: "complete", duration: "9m 04s", started: "5h ago" },
  { id: "rt_2038", target: "support-agent-prod", categories: ["XPIA", "PII", "CodeVuln", "+2"], strategies: 10, asr: 11.9, status: "complete", duration: "16m 11s", started: "1d ago" },
  { id: "rt_2037", target: "internal-copilot", categories: ["Jailbreak"], strategies: 14, asr: null, status: "queued", duration: "—", started: "—" },
  { id: "rt_2036", target: "legacy-faq-v2", categories: ["Hate", "Sexual"], strategies: 8, asr: null, status: "failed", duration: "2m 40s", started: "2d ago" },
  { id: "rt_2035", target: "support-agent-prod", categories: ["XPIA", "Violence", "PII"], strategies: 11, asr: 14.2, status: "complete", duration: "12m 58s", started: "2d ago" },
];

const STAGES = ["Queued", "Probing baseline", "Converting", "Attacking", "Judging", "Complete"];

const LOG_POOL = [
  { cat: "XPIA", strat: "base64" }, { cat: "Jailbreak", strat: "crescendo" },
  { cat: "PIILeak", strat: "rot13" }, { cat: "Violence", strat: "flip" },
  { cat: "Hate", strat: "leetspeak" }, { cat: "Ungrounded", strat: "tense" },
  { cat: "SelfHarm", strat: "unicode-confusable" }, { cat: "XPIA", strat: "tap" },
  { cat: "TaskAdherence", strat: "morse" }, { cat: "CodeVuln", strat: "ascii-art" },
];

/* --------------------------------- helpers -------------------------------- */

function heatColor(v: number): string {
  // 0 -> teal, mid -> amber, high -> red (rgba with intensity)
  if (v < 6) return `rgba(56,225,198,${0.08 + (v / 6) * 0.25})`;
  if (v < 12) {
    const t = (v - 6) / 6;
    return `rgba(${Math.round(56 + (245 - 56) * t)},${Math.round(225 - (225 - 181) * t)},${Math.round(198 - (198 - 68) * t)},0.45)`;
  }
  const t = Math.min(1, (v - 12) / 12);
  return `rgba(${Math.round(245 - (245 - 245) * t)},${Math.round(181 - (181 - 88) * t)},${Math.round(68 - (68 - 107) * t)},${0.45 + t * 0.35})`;
}

function now(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

/* ------------------------- looping progress (memo) ------------------------ */

const LoopProgress = () => {
  const [p, setP] = useState(34);
  useEffect(() => {
    const id = setInterval(() => {
      setP((v) => (v >= 100 ? 4 : v + Math.random() * 2.2));
    }, 140);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-bg-3">
      <div
        className="h-full rounded-full transition-[width] duration-150"
        style={{ width: `${p}%`, background: `linear-gradient(90deg, ${VIOLET}66, ${VIOLET})`, boxShadow: `0 0 8px ${VIOLET}88` }}
      />
    </div>
  );
};

/* ------------------------------ status badge ------------------------------- */

function StatusBadge({ status }: { status: RunStatus }) {
  const map: Record<RunStatus, { color: string; pulse?: boolean }> = {
    complete: { color: TEAL },
    running: { color: VIOLET, pulse: true },
    queued: { color: "#5C6B7F" },
    failed: { color: RED },
  };
  const { color, pulse } = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", pulse && "animate-pulse")} style={{ background: color }} />
      {status}
    </span>
  );
}

/* --------------------------------- wizard --------------------------------- */

function Stepper({ step }: { step: number }) {
  const labels = ["01 target", "02 risk categories", "03 strategies", "04 review"];
  return (
    <div className="flex items-center gap-1 border-b border-line px-5 py-3">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1">
          <span
            className={cn(
              "font-mono text-[11px]",
              i === step ? "text-violet" : i < step ? "text-aegis" : "text-ink-low",
            )}
          >
            {i < step ? "✓" : "·"} {l}
          </span>
          {i < labels.length - 1 && <span className="mx-1 text-ink-low">→</span>}
        </div>
      ))}
    </div>
  );
}

function ScanWizard({
  open, onClose, onLaunch,
}: {
  open: boolean;
  onClose: () => void;
  onLaunch: (w: WizardState) => void;
}) {
  const [step, setStep] = useState(0);
  const [w, setW] = useState<WizardState>({
    targetType: "http",
    url: "https://support-agent-prod.contoso.com/chat",
    authHeader: "Bearer ••••••••",
    policy: "default-strict v14",
    categories: ["hate", "sexual", "violence", "selfHarm", "xpia", "sensitiveLeak", "taskAdherence", "prohibitedActions"],
    strategies: ["Base64", "ROT13", "Leetspeak", "Flip", "UnicodeConfusable", "Tense", "Crescendo", "TAP"],
    judgeModel: "aegis-judge-large",
    schedule: "one-time",
  });
  const [testState, setTestState] = useState<"idle" | "testing" | "ok">("idle");

  const toggleCat = (id: string) =>
    setW((s) => ({ ...s, categories: s.categories.includes(id) ? s.categories.filter((c) => c !== id) : [...s.categories, id] }));
  const toggleStrat = (id: string) =>
    setW((s) => ({ ...s, strategies: s.strategies.includes(id) ? s.strategies.filter((c) => c !== id) : [...s.strategies, id] }));

  const probes = w.categories.length * w.strategies.length * 25;

  const doTest = () => {
    setTestState("testing");
    setTimeout(() => setTestState("ok"), 1100);
  };

  const targetCard = (
    id: WizardState["targetType"], icon: typeof Globe, title: string, caption: string,
  ) => (
    <button
      onClick={() => setW((s) => ({ ...s, targetType: id }))}
      className={cn(
        "rounded-[10px] border p-4 text-left transition-colors",
        w.targetType === id ? "border-violet bg-violet/10 shadow-[0_0_18px_rgba(155,123,255,0.15)]" : "border-line bg-bg-3 hover:border-line-strong",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-ink-hi">{icon && (() => { const I = icon; return <I size={15} className="text-violet" />; })()}<span className="text-[14px] font-medium">{title}</span></div>
      <div className="text-[12px] text-ink-low">{caption}</div>
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[min(720px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] border border-line bg-bg-1 shadow-2xl"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="text-[15px] font-semibold text-ink-hi">New red-team scan</span>
              <button onClick={onClose} className="text-ink-low hover:text-ink-hi"><X size={16} /></button>
            </div>
            <Stepper step={step} />

            <div className="relative min-h-[340px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="p-5"
                >
                  {step === 0 && (
                    <div className="space-y-3">
                      {targetCard("http", Globe, "HTTP endpoint", "any provider — OpenAI, Anthropic, self-hosted")}
                      {w.targetType === "http" && (
                        <div className="grid grid-cols-2 gap-3 rounded-[10px] border border-line bg-bg-2 p-3">
                          <div>
                            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-low">Target URL</label>
                            <input value={w.url} onChange={(e) => setW((s) => ({ ...s, url: e.target.value }))} className="w-full rounded-md border border-line bg-bg-3 px-2 py-1.5 font-mono text-[12px] text-ink-hi outline-none focus:border-violet" />
                          </div>
                          <div>
                            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-low">Auth header</label>
                            <input value={w.authHeader} onChange={(e) => setW((s) => ({ ...s, authHeader: e.target.value }))} className="w-full rounded-md border border-line bg-bg-3 px-2 py-1.5 font-mono text-[12px] text-ink-hi outline-none focus:border-violet" />
                          </div>
                          <div className="col-span-2 flex items-center gap-3">
                            <button onClick={doTest} className="flex items-center gap-1.5 rounded-md border border-violet/50 bg-violet/10 px-3 py-1.5 font-mono text-[11px] text-violet hover:bg-violet/20">
                              {testState === "testing" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Test connection
                            </button>
                            {testState === "ok" && <span className="flex items-center gap-1 font-mono text-[11px] text-aegis"><CircleCheck size={12} /> reachable · 84ms</span>}
                          </div>
                        </div>
                      )}
                      {targetCard("aegis", Cpu, "AegisGate-gated model", "route probes through a published policy gate")}
                      {w.targetType === "aegis" && (
                        <div className="rounded-[10px] border border-line bg-bg-2 p-3">
                          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-low">Policy</label>
                          <select value={w.policy} onChange={(e) => setW((s) => ({ ...s, policy: e.target.value }))} className="w-full rounded-md border border-line bg-bg-3 px-2 py-1.5 font-mono text-[12px] text-ink-hi outline-none focus:border-violet">
                            <option>default-strict v14</option>
                            <option>finance-copilot v7</option>
                            <option>health-triage v3</option>
                          </select>
                        </div>
                      )}
                      {targetCard("python", TerminalSquare, "Custom Python callback", "PyRIT-compatible target — bring your own callable")}
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-low">Content harms · {HARM_CATS.length}</div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[...HARM_CATS].map((c) => (
                          <button
                            key={c.id}
                            onClick={() => toggleCat(c.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-left text-[12px] transition-all",
                              w.categories.includes(c.id)
                                ? "border-violet bg-violet/10 text-ink-hi shadow-[0_0_14px_rgba(155,123,255,0.2)]"
                                : "border-line bg-bg-2 text-ink-mid hover:border-line-strong",
                            )}
                          >
                            <c.icon size={14} className={w.categories.includes(c.id) ? "text-violet" : "text-ink-low"} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <div className="my-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-line" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-violet">agentic risks</span>
                        <div className="h-px flex-1 bg-line" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {AGENTIC_CATS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => toggleCat(c.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-left text-[12px] transition-all",
                              w.categories.includes(c.id)
                                ? "border-violet bg-violet/10 text-ink-hi shadow-[0_0_14px_rgba(155,123,255,0.2)]"
                                : "border-line bg-bg-2 text-ink-mid hover:border-line-strong",
                            )}
                          >
                            <c.icon size={14} className={w.categories.includes(c.id) ? "text-violet" : "text-ink-low"} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-[10px] border border-line bg-bg-2 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-wide text-aegis">Easy</span>
                          <button onClick={() => setW((s) => ({ ...s, strategies: Array.from(new Set([...s.strategies, ...EASY_STRATS])) }))} className="font-mono text-[10px] text-ink-low hover:text-aegis">select all</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {EASY_STRATS.map((s) => (
                            <button key={s} onClick={() => toggleStrat(s)} className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px]", w.strategies.includes(s) ? "border-violet bg-violet/15 text-violet" : "border-line text-ink-low hover:border-line-strong")}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[10px] border border-line bg-bg-2 p-3">
                        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-warn">Moderate</div>
                        <div className="flex flex-wrap gap-1.5">
                          {MODERATE_STRATS.map((s) => (
                            <button key={s.id} onClick={() => toggleStrat(s.id)} className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px]", w.strategies.includes(s.id) ? "border-violet bg-violet/15 text-violet" : "border-line text-ink-low hover:border-line-strong")}>
                              {s.id} <span className="ml-1 rounded bg-bg-3 px-1 text-[9px] text-warn">{s.badge}</span>
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-ink-low">LLM-assisted rewrite strategies shift probe tense/framing to evade literal filters.</p>
                      </div>
                      <div className="rounded-[10px] border border-line bg-bg-2 p-3">
                        <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-danger">Difficult</div>
                        <div className="flex flex-wrap gap-1.5">
                          {DIFFICULT_STRATS.map((s) => (
                            <button key={s.id} onClick={() => toggleStrat(s.id)} className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px]", w.strategies.includes(s.id) ? "border-violet bg-violet/15 text-violet" : "border-line text-ink-low hover:border-line-strong")}>
                              {s.id} <span className="ml-1 rounded bg-bg-3 px-1 text-[9px] text-danger">{s.badge}</span>
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-ink-low">Multi-turn tree-of-attacks and composed converters — highest signal, slowest runs.</p>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-3">
                      <div className="rounded-[10px] border border-line bg-bg-2 p-4 font-mono text-[12px]">
                        {[
                          ["target", w.targetType === "http" ? w.url : w.targetType === "aegis" ? `aegis-gate · ${w.policy}` : "python callback"],
                          ["risk categories", `${w.categories.length} selected`],
                          ["strategies", w.strategies.join(", ")],
                          ["objectives per cell", "25"],
                          ["estimated probes", probes.toLocaleString()],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-line/50 py-1.5 last:border-0">
                            <span className="text-ink-low">{k}</span>
                            <span className="max-w-[60%] truncate text-ink-hi">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-low">Judge model</label>
                          <select value={w.judgeModel} onChange={(e) => setW((s) => ({ ...s, judgeModel: e.target.value }))} className="w-full rounded-md border border-line bg-bg-3 px-2 py-1.5 font-mono text-[12px] text-ink-hi outline-none focus:border-violet">
                            <option>aegis-judge-large</option>
                            <option>aegis-judge-fast</option>
                            <option>gpt-4o (external)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-low">Schedule</label>
                          <div className="flex rounded-md border border-line bg-bg-3 p-0.5">
                            {(["one-time", "weekly"] as const).map((s) => (
                              <button key={s} onClick={() => setW((w2) => ({ ...w2, schedule: s }))} className={cn("flex-1 rounded px-2 py-1 font-mono text-[11px]", w.schedule === s ? "bg-violet/20 text-violet" : "text-ink-low")}>{s === "weekly" ? "weekly cron" : s}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="font-mono text-[11px] text-ink-low">
                {w.categories.length} categories × {w.strategies.length} strategies × 25 objectives ≈ <span className="text-violet">{probes.toLocaleString()} probes</span>
              </span>
              <div className="flex gap-2">
                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} className="rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-ink-mid hover:border-line-strong">Back</button>
                )}
                {step < 3 ? (
                  <button onClick={() => setStep((s) => s + 1)} className="rounded-md border border-violet/50 bg-violet/15 px-4 py-1.5 font-mono text-[12px] text-violet hover:bg-violet/25">Continue</button>
                ) : (
                  <button onClick={() => onLaunch(w)} className="flex items-center gap-1.5 rounded-md border border-violet bg-violet/25 px-5 py-1.5 font-mono text-[12px] font-medium text-violet shadow-[0_0_20px_rgba(155,123,255,0.35)] hover:bg-violet/35">
                    <Play size={12} /> Launch scan
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- live progress panel -------------------------- */

interface LogLine { time: string; probe: number; cat: string; strat: string; hit: boolean }

function LivePanel({ phase, events, probeCount, totalProbes }: { phase: number; events: RedTeamEvent[]; probeCount: number; totalProbes: number }) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLogs((ls) => {
        const pool = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
        const next = [...ls, {
          time: now(),
          probe: Math.min(totalProbes, 180 + ls.length * 7 + Math.floor(Math.random() * 5)),
          cat: pool.cat, strat: pool.strat,
          hit: Math.random() < 0.13,
        }];
        return next.slice(-80);
      });
    }, 650);
    return () => clearInterval(id);
  }, [totalProbes]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  const pct = Math.min(100, (probeCount / totalProbes) * 100);

  return (
    <div className="mb-4 rounded-[10px] border border-violet/30 bg-bg-2 p-4 shadow-[0_0_24px_rgba(155,123,255,0.08)]">
      {/* stage tracker */}
      <div className="mb-4 flex items-center">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[9px]",
                  i < phase ? "border-violet bg-violet text-bg-0" : i === phase ? "border-violet text-violet" : "border-line text-ink-low",
                )}
                style={i === phase ? { boxShadow: `0 0 10px ${VIOLET}88` } : undefined}
              >
                {i < phase ? <Check size={10} /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap font-mono text-[9px]", i <= phase ? "text-violet" : "text-ink-low")}>{s}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="mx-1 mb-4 h-px flex-1 bg-line">
                <motion.div className="h-full bg-violet" initial={false} animate={{ width: i < phase ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* terminal */}
        <div ref={logRef} className="h-44 overflow-y-auto rounded-md border border-line bg-bg-0 p-3 font-mono text-[12px] leading-[1.7]">
          <AnimatePresence initial={false}>
            {logs.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                <span className="text-ink-low">[{l.time}]</span>{" "}
                <span className="text-ink-mid">probe #{l.probe}</span>{" "}
                <span className="text-azure">{l.cat}</span>{" "}
                <span className="text-ink-low">· {l.strat}</span>{" "}
                <span style={{ color: l.hit ? RED : TEAL }}>{l.hit ? "→ ASR hit" : "… defended"}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {events.length > 0 && (
            <div className="text-ink-low">— engine: {events[events.length - 1].message}</div>
          )}
        </div>
        {/* progress */}
        <div className="flex flex-col justify-center">
          <div className="mb-1 flex items-baseline justify-between font-mono text-[12px]">
            <span className="text-ink-low">probes</span>
            <span className="text-ink-hi">{probeCount.toLocaleString()} <span className="text-ink-low">/ {totalProbes.toLocaleString()}</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-3">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${VIOLET}55, ${VIOLET})` }} />
          </div>
          <div className="mt-3 font-mono text-[11px] text-ink-low">
            asr hits so far <span className="text-danger">{Math.round(probeCount * 0.121)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- scorecard --------------------------------- */

const MATRIX_ROWS = [
  "Hate", "Sexual", "Violence", "SelfHarm", "ProtectedMaterial", "CodeVuln",
  "UngroundedAttr", "ProhibitedActions", "SensitiveDataLeak", "TaskAdherence", "XPIA",
];
const MATRIX_BASE = [4.1, 3.2, 8.8, 2.0, 6.5, 9.7, 11.2, 16.8, 14.9, 10.4, 21.3];
const TIER_MULT = [1.45, 0.92, 0.6];

function Scorecard({ result }: { result: RedTeamResult }) {
  const overall = 12.4;
  const catBars = useMemo(
    () => MATRIX_ROWS.map((r, i) => ({ label: r, asr: MATRIX_BASE[i] })).sort((a, b) => b.asr - a.asr),
    [],
  );
  const tiers = [
    { tier: "Easy", asr: 18.2, color: RED },
    { tier: "Moderate", asr: 11.6, color: "#F5823A" },
    { tier: "Difficult", asr: 7.4, color: AMBER },
  ];
  const maxTier = 20;
  const stratCols: Column<{ strategy: string; tier: string; probes: number; asr: number }>[] = [
    { key: "s", header: "Converter", mono: true, render: (r) => <span className="text-ink-hi">{r.strategy}</span> },
    {
      key: "t", header: "Tier", render: (r) => (
        <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px]",
          r.tier === "easy" ? "border-aegis/40 text-aegis" : r.tier === "moderate" ? "border-warn/40 text-warn" : "border-danger/40 text-danger")}>{r.tier}</span>
      ),
    },
    { key: "p", header: "Probes", mono: true, sortable: true, sortValue: (r) => r.probes, render: (r) => r.probes },
    {
      key: "a", header: "ASR", mono: true, sortable: true, sortValue: (r) => r.asr,
      render: (r) => (
        <span className="flex items-center gap-2">
          {r.asr.toFixed(1)}%
          <span className="h-1 w-14 overflow-hidden rounded-full bg-bg-3">
            <span className="block h-full rounded-full bg-danger/80" style={{ width: `${Math.min(100, r.asr * 4)}%` }} />
          </span>
        </span>
      ),
    },
  ];
  const stratRows = useMemo(() => {
    const rows = [
      ...EASY_STRATS.map((s) => ({ strategy: s, tier: "easy", probes: 96, asr: +(Math.random() * 10 + 10).toFixed(1) })),
      { strategy: "Tense", tier: "moderate", probes: 96, asr: 11.6 },
      ...DIFFICULT_STRATS.map((s) => ({ strategy: s.id, tier: "difficult", probes: 96, asr: +(Math.random() * 6 + 4).toFixed(1) })),
    ];
    return rows;
  }, []);

  const owaspChips = useMemo(() => {
    const agg = new Map<string, { name: string; asr: number }>();
    result.byCategory.forEach((c) => {
      const label = CATEGORY_LABEL[c.category as RiskCategory] ?? c.category;
      const asrPct = c.asr * 100;
      const cur = agg.get(c.owasp);
      if (!cur || asrPct > cur.asr) agg.set(c.owasp, { name: label, asr: asrPct });
    });
    const names: Record<string, string> = {
      LLM01: "Prompt Injection", LLM02: "Sensitive Info", LLM09: "Misinformation",
    };
    return Array.from(agg.entries()).map(([code, v]) => ({ code, name: names[code] ?? v.name, asr: v.asr }));
  }, [result]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 lg:grid-cols-3">
      {/* big number */}
      <div className="rounded-[10px] border border-line bg-bg-2 p-5">
        <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Overall ASR</div>
        <div
          className="mt-2 font-mono text-5xl font-semibold"
          style={{ background: `linear-gradient(90deg, ${RED}, ${AMBER})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
        >
          {overall}%
        </div>
        <div className="mt-3 space-y-1 font-mono text-[12px] text-ink-low">
          <div>probes <span className="text-ink-hi">1,200</span></div>
          <div className="flex items-center gap-2">
            judge confidence
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-3">
              <motion.span className="block h-full bg-aegis" initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 0.8 }} />
            </span>
            <span className="text-aegis">0.94</span>
          </div>
          <div>engine <span className="text-ink-hi">{result.runId}</span></div>
        </div>
      </div>

      {/* per-category bars */}
      <div className="rounded-[10px] border border-line bg-bg-2 p-5 lg:col-span-2">
        <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">ASR by risk category</div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {catBars.map((c, i) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="w-32 truncate font-mono text-[11px] text-ink-mid">{c.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: c.asr > 14 ? RED : c.asr > 8 ? "#F5823A" : AMBER }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.asr / 22) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              </div>
              <span className="w-12 text-right font-mono text-[11px] text-ink-hi">{c.asr.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* complexity tiers */}
      <div className="rounded-[10px] border border-line bg-bg-2 p-5">
        <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">By complexity tier</div>
        <div className="space-y-3">
          {tiers.map((t, i) => (
            <div key={t.tier}>
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <span className="text-ink-mid">{t.tier}</span>
                <span className="text-ink-hi">{t.asr}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg-3">
                <motion.div className="h-full rounded-full" style={{ background: t.color }} initial={{ width: 0 }} animate={{ width: `${(t.asr / maxTier) * 100}%` }} transition={{ duration: 0.7, delay: 0.2 + i * 0.12 }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-ink-low">
          Harder encodings fail more often — your gate's decoding layer works.
        </p>
      </div>

      {/* heat matrix */}
      <div className="rounded-[10px] border border-line bg-bg-2 p-5 lg:col-span-2">
        <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Risk × complexity heat matrix</div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
            <thead>
              <tr>
                <th className="w-36" />
                {["Easy", "Moderate", "Difficult"].map((t) => (
                  <th key={t} className="pb-1 text-center font-mono text-[10px] uppercase tracking-wide text-ink-low">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((r, ri) => (
                <tr key={r}>
                  <td className="pr-2 text-right font-mono text-[11px] text-ink-mid">{r}</td>
                  {TIER_MULT.map((m, ti) => {
                    const v = MATRIX_BASE[ri] * m;
                    const clamped = Math.min(28, v);
                    return (
                      <td key={ti}>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + (ri + ti) * 0.03 }}
                          whileHover={{ scale: 1.05 }}
                          title={`${r} · ${["Easy", "Moderate", "Difficult"][ti]} — ${v.toFixed(1)}% ASR`}
                          className="flex h-7 cursor-default items-center justify-center rounded-[4px] font-mono text-[10px] text-ink-hi/80"
                          style={{ background: heatColor(clamped) }}
                        >
                          {v.toFixed(1)}
                        </motion.div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* per-strategy table */}
      <div className="lg:col-span-2">
        <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Per-strategy results</div>
        <DataTable columns={stratCols} rows={stratRows} />
      </div>

      {/* OWASP mapping */}
      <div className="rounded-[10px] border border-line bg-bg-2 p-5">
        <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">OWASP LLM Top 10 mapping</div>
        <div className="flex flex-col gap-2">
          {owaspChips.map((o) => (
            <button key={o.code} className="flex items-center justify-between rounded-[8px] border border-line bg-bg-3 px-3 py-2 text-left hover:border-violet/50">
              <span className="font-mono text-[11px] text-ink-mid"><span className="text-violet">{o.code}</span> {o.name}</span>
              <span className="font-mono text-[11px] text-danger">{o.asr.toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------- conversation drill-down ------------------------- */

function ConversationList({ result, onOpen }: { result: RedTeamResult; onOpen: (c: Conversation) => void }) {
  return (
    <div className="mt-4 rounded-[10px] border border-line bg-bg-2">
      <div className="border-b border-line px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">
        Flagged conversations · {result.conversations.length}
      </div>
      {result.conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onOpen(c)}
          className="flex w-full items-center gap-3 border-b border-line/50 px-4 py-2.5 text-left last:border-0 hover:bg-bg-3"
        >
          <span className="font-mono text-[11px] text-ink-low">{c.id}</span>
          <span className="flex-1 truncate text-[13px] text-ink-mid">
            Attempt to {c.category && "advance objective via"} <span className="font-mono text-[12px] text-azure">{c.strategy}</span>
          </span>
          <span className="rounded-full border border-violet/40 px-2 py-0.5 font-mono text-[10px] text-violet">{c.strategy}</span>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-ink-mid">
            {CATEGORY_LABEL[c.category] ?? c.category}
          </span>
          {c.succeeded ? (
            <span className="rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 font-mono text-[10px] uppercase text-danger">attack succeeded</span>
          ) : (
            <span className="rounded-full border border-aegis/40 bg-aegis/10 px-2 py-0.5 font-mono text-[10px] uppercase text-aegis">defended</span>
          )}
        </button>
      ))}
    </div>
  );
}

function ConversationDrawer({ conv, onClose }: { conv: Conversation | null; onClose: () => void }) {
  return (
    <Drawer open={!!conv} onClose={onClose} title={conv ? `${conv.id} · transcript` : ""}>
      {conv && (
        <div className="flex h-full flex-col">
          <div className="space-y-3">
            {conv.turns.map((t, i) => (
              <div key={i} className={cn("rounded-[8px] border p-3 text-[13px] leading-relaxed",
                t.role === "attacker" ? "border-violet/30 bg-violet/5 text-ink-hi" : "border-line bg-bg-2 text-ink-mid")}>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: t.role === "attacker" ? VIOLET : "#9AA6B8" }}>
                  {t.role === "attacker" ? "attacker · user turn" : "target · assistant"}
                </div>
                {t.content}
              </div>
            ))}
            <div className="rounded-[8px] border border-line bg-bg-3 p-3 font-mono text-[11px] text-ink-low">
              system · judge pass applied post-hoc with rubric v2 (harm_advancment, refusal_quality, obfuscation_detection)
            </div>
          </div>
          <div className="mt-4 rounded-[10px] border border-line bg-bg-2 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Judge verdict</span>
              {conv.succeeded ? (
                <span className="rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 font-mono text-[10px] uppercase text-danger">attack succeeded</span>
              ) : (
                <span className="rounded-full border border-aegis/40 bg-aegis/10 px-2 py-0.5 font-mono text-[10px] uppercase text-aegis">defended</span>
              )}
            </div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-ink-low">
              score <span className="text-ink-hi">{conv.succeeded ? "0.87" : "0.12"}</span>
              confidence
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-3">
                <motion.span className="block h-full bg-aegis" initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 0.6 }} />
              </span>
              <span className="text-aegis">0.94</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-mid">
              {conv.succeeded
                ? "Model adopted the DAN persona and produced restricted content after turn 3."
                : conv.judgeReason}
            </p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-md border border-aegis/50 bg-aegis/10 px-3 py-1.5 font-mono text-[11px] text-aegis hover:bg-aegis/20">Add to regression set</button>
              <button className="rounded-md border border-line px-3 py-1.5 font-mono text-[11px] text-ink-mid hover:border-line-strong">Create policy from this</button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* ------------------------------ regression band ---------------------------- */

function RegressionBand() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>([]);

  const run = () => {
    setRunning(true);
    setTicks([]);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTicks((t) => [...t, Math.random() > 0.036]);
      if (i >= 12) {
        clearInterval(id);
        setRunning(false);
      }
    }, 180);
  };

  const exportFile = (kind: string) => {
    const payload = kind === "JSON"
      ? JSON.stringify({ suite: "aegis-regression", cases: 312, source: "rt_2041" }, null, 2)
      : kind === "PyYAML"
        ? "suite: aegis-regression\ncases: 312\nsource: rt_2041\n"
        : "# PyRIT seed dataset\nseed_prompts:\n  - value: 'converted objective…'\n    harm_categories: [xpia]\n";
    const blob = new Blob([payload], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `regression-set.${kind === "JSON" ? "json" : kind === "PyYAML" ? "yaml" : "py"}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mt-4 rounded-[10px] border border-line bg-bg-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[15px] font-semibold text-ink-hi">Close the loop</div>
          <p className="mt-1 max-w-xl text-[13px] text-ink-mid">
            Every production block &amp; red-team hit becomes a regression test.{" "}
            <span className="font-mono text-[12px] text-ink-low">regression set · 312 cases</span>{" "}
            <span className="font-mono text-[12px] text-aegis">last run 96.4% pass</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={run} disabled={running} className="flex items-center gap-1.5 rounded-md border border-aegis/50 bg-aegis-dim/30 px-3 py-1.5 font-mono text-[12px] text-aegis hover:bg-aegis-dim/60 disabled:opacity-50">
            {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run regression now
          </button>
          {(["JSON", "PyYAML", "PyRIT seed dataset"] as const).map((k) => (
            <button key={k} onClick={() => exportFile(k)} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[11px] text-ink-mid hover:border-line-strong">
              {k === "JSON" ? <FileJson size={12} /> : k === "PyYAML" ? <FileText size={12} /> : <Database size={12} />} {k}
            </button>
          ))}
        </div>
      </div>
      {ticks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ticks.map((ok, i) => (
            <motion.span key={i} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
              {ok ? <CircleCheck size={16} className="text-aegis" /> : <CircleX size={16} className="text-danger" />}
            </motion.span>
          ))}
          {!running && <span className="ml-2 font-mono text-[11px] text-ink-low">sample batch · {ticks.filter(Boolean).length}/{ticks.length} pass</span>}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

interface DrillState {
  runId: string;
  target: string;
  live: boolean;
}

export default function RedTeam() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [result, setResult] = useState<RedTeamResult | null>(null);
  const [phase, setPhase] = useState(0);
  const [events, setEvents] = useState<RedTeamEvent[]>([]);
  const [probeCount, setProbeCount] = useState(180);
  const [conv, setConv] = useState<Conversation | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // baseline completed result for rt_2041 drill
  const baseResult = useMemo(() => simulateRun({ target: "support-agent-prod" }), []);
  const shownResult = drill?.live ? result : drill ? baseResult : null;

  const openDrill = useCallback((row: RunRow) => {
    setDrill({ runId: row.id, target: row.target, live: false });
    setResult(null);
    setPhase(STAGES.length - 1);
  }, []);

  const launch = (w: WizardState) => {
    setWizardOpen(false);
    cancelRef.current?.();
    setEvents([]);
    setResult(null);
    setPhase(0);
    setProbeCount(180);
    setDrill({ runId: `rt_${2042}`, target: w.targetType === "http" ? new URL(w.url || "https://x.invalid").hostname : w.targetType === "aegis" ? "aegis-gate" : "python-callback", live: true });

    const phaseOf = { queued: 0, probing: 1, converting: 2, judging: 4, complete: 5 } as const;
    cancelRef.current = startLiveRun(
      { target: w.url || undefined, categories: ["xpia", "jailbreak", "piiLeak", "hate", "violence", "selfHarm", "ungrounded", "sexual"] },
      (e) => {
        setEvents((ev) => [...ev.slice(-40), e]);
        setPhase((p) => Math.max(p, phaseOf[e.phase]));
        setProbeCount((c) => Math.min(1200, c + 12));
      },
      (r) => {
        setResult(r);
        setPhase(5);
        setProbeCount(1200);
      },
    );
  };

  useEffect(() => () => cancelRef.current?.(), []);

  const runCols: Column<RunRow>[] = [
    { key: "id", header: "Scan", mono: true, render: (r) => <span className="text-ink-hi">{r.id}</span> },
    {
      key: "target", header: "Target",
      render: (r) => <span className="rounded border border-line bg-bg-3 px-1.5 py-0.5 font-mono text-[11px] text-azure">{r.target}</span>,
    },
    {
      key: "cats", header: "Risk categories",
      render: (r) => (
        <span className="flex gap-1">
          {r.categories.map((c) => (
            <span key={c} className={cn("rounded-full border px-1.5 py-px font-mono text-[9px]", c.startsWith("+") ? "border-line text-ink-low" : "border-violet/40 text-violet")}>{c}</span>
          ))}
        </span>
      ),
    },
    { key: "strat", header: "Strategies", mono: true, sortable: true, sortValue: (r) => r.strategies, render: (r) => r.strategies },
    {
      key: "asr", header: "Overall ASR", mono: true, sortable: true, sortValue: (r) => r.asr ?? -1,
      render: (r) =>
        r.asr == null ? <span className="text-ink-low">—</span> : (
          <span className="flex items-center gap-2">
            <span style={{ color: r.asr > 12 ? RED : r.asr > 8 ? AMBER : TEAL }}>{r.asr.toFixed(1)}%</span>
            <span className="h-1 w-10 overflow-hidden rounded-full bg-bg-3">
              <span className="block h-full rounded-full" style={{ width: `${Math.min(100, r.asr * 5)}%`, background: r.asr > 12 ? RED : r.asr > 8 ? AMBER : TEAL }} />
            </span>
          </span>
        ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "dur", header: "Duration", mono: true, render: (r) => r.duration },
    { key: "started", header: "Started", mono: true, render: (r) => <span className="text-ink-low">{r.started}</span> },
    { key: "act", header: "", render: () => <MoreHorizontal size={14} className="text-ink-low" /> },
  ];

  const rows = useMemo<RunRow[]>(() => {
    if (!drill?.live) return INITIAL_RUNS;
    return [
      { id: drill.runId, target: drill.target, categories: ["XPIA", "PII", "Hate", "+5"], strategies: 8, asr: null, status: result ? "complete" : "running", duration: "…", started: "just now" },
      ...INITIAL_RUNS,
    ];
  }, [drill, result]);

  return (
    <ConsoleShell breadcrumb="gate.aegisgate.dev/redteam">
      <AnimatePresence mode="wait">
        {!drill ? (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            <PageHeader
              title="Red Team Lab"
              subtitle="adversarial simulation · PyRIT-compatible engine"
              actions={
                <>
                  <button className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-ink-mid hover:border-line-strong">
                    <Library size={13} /> Attack library
                  </button>
                  <button onClick={() => setWizardOpen(true)} className="flex items-center gap-1.5 rounded-md border border-violet/50 bg-violet/15 px-3 py-1.5 font-mono text-[12px] text-violet hover:bg-violet/25">
                    <Plus size={13} /> New scan
                  </button>
                </>
              }
            />

            <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard label="Total scans" value="47" spark={[3, 5, 4, 7, 6, 9, 8, 11, 10, 12]} />
              <StatCard label="Median ASR" value="11.8%" delta="↓ 2.1 vs last week" deltaUp spark={[14, 13.5, 13.9, 12.8, 12.4, 12.1, 11.8]} />
              <StatCard label="Critical findings" value="6" spark={[1, 2, 1, 3, 2, 4, 3, 6]} />
              <StatCard label="Regression pass rate" value="96.4%" spark={[92, 93, 95, 94, 96, 95.5, 96.4]} />
            </div>

            {/* live running banner row via table */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Recent runs</span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-violet">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet" /> rt_2040 attacking · live
                <LoopProgress />
              </span>
            </div>
            <DataTable columns={runCols} rows={rows} onRowClick={openDrill} />
          </motion.div>
        ) : (
          <motion.div key="drill" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <button onClick={() => { cancelRef.current?.(); setDrill(null); }} className="mb-4 flex items-center gap-1 font-mono text-[12px] text-ink-low hover:text-ink-hi">
              <ArrowLeft size={13} /> all runs
            </button>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Swords size={18} className="text-violet" />
                <h1 className="font-mono text-xl font-semibold text-ink-hi">{drill.runId}</h1>
                <StatusBadge status={drill.live && !result ? "running" : "complete"} />
                <span className="rounded border border-line bg-bg-3 px-1.5 py-0.5 font-mono text-[11px] text-azure">{drill.target}</span>
                <span className="font-mono text-[11px] text-ink-low">elapsed 14m 32s</span>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 rounded-md border border-aegis/50 bg-aegis-dim/30 px-3 py-1.5 font-mono text-[12px] text-aegis hover:bg-aegis-dim/60">
                  <Download size={12} /> Export regression set
                </button>
                {drill.live && !result && (
                  <button onClick={() => { cancelRef.current?.(); setDrill(null); }} className="flex items-center gap-1.5 rounded-md border border-danger/50 bg-danger/10 px-3 py-1.5 font-mono text-[12px] text-danger hover:bg-danger/20">
                    <Square size={12} /> Stop run
                  </button>
                )}
              </div>
            </div>

            {drill.live && !result && <LivePanel phase={phase} events={events} probeCount={probeCount} totalProbes={1200} />}

            {shownResult ? (
              <>
                <Scorecard result={shownResult} />
                <ConversationList result={shownResult} onOpen={setConv} />
                <RegressionBand />
              </>
            ) : (
              <div className="rounded-[10px] border border-line bg-bg-2 p-8 text-center font-mono text-[12px] text-ink-low">
                scorecard materializes when judging completes…
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ScanWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onLaunch={launch} />
      <ConversationDrawer conv={conv} onClose={() => setConv(null)} />
    </ConsoleShell>
  );
}
