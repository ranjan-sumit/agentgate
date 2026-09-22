import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, Copy, Check, Eye, RefreshCw, Trash2, ArrowUpRight, Puzzle,
  Terminal, Layers, Workflow, Braces, Server, Globe, CheckCircle2, ChevronDown,
} from "lucide-react";
import ConsoleShell, { PageHeader } from "@/components/ConsoleShell";
import { CodeBlock } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// ---------- shared bits ----------
function GhostButton({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-line bg-bg-2 px-3 py-1.5 font-mono text-[12px] text-ink-mid transition-colors hover:border-line-strong hover:text-ink-hi",
        className,
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-aegis/50 bg-aegis-dim/30 px-3 py-1.5 font-mono text-[12px] text-aegis transition-all hover:bg-aegis-dim/60 hover:glow-aegis",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-line bg-bg-1 p-5",
              wide ? "max-w-[560px]" : "max-w-[440px]",
            )}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- data ----------
interface ApiKey { id: string; name: string; prefix: string; env: string; created: string; lastUsed: string; scopes: string[] }
const INITIAL_KEYS: ApiKey[] = [
  { id: "k1", name: "prod-backend", prefix: "ag_live_4kF9", env: "prod", created: "2025-09-02", lastUsed: "12s ago", scopes: ["scan", "redteam", "eval"] },
  { id: "k2", name: "staging-ci", prefix: "ag_test_8mQ2", env: "staging", created: "2025-10-14", lastUsed: "3m ago", scopes: ["scan", "redteam"] },
  { id: "k3", name: "local-dev", prefix: "ag_test_x7Tn", env: "dev", created: "2025-11-28", lastUsed: "2d ago", scopes: ["scan"] },
];

const PY_SNIPPET = `from aegisgate import AegisGate
import os

gate = AegisGate(api_key=os.environ["AEGISGATE_KEY"])
verdict = gate.scan(input=user_prompt, policy="prod-default")
if verdict.action == "block":
    return fallback_response()`;
const JS_SNIPPET = `import { AegisGate } from "aegisgate";

const gate = new AegisGate({ apiKey: process.env.AEGISGATE_KEY });
const verdict = await gate.scan({ input: userPrompt, policy: "prod-default" });
if (verdict.action === "block") return fallbackResponse();`;
const CURL_SNIPPET = `curl https://gate.aegisgate.dev/v1/scan \\
  -H "Authorization: Bearer $AEGISGATE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "...", "policy": "prod-default"}'`;

const STEPS = [
  { n: "01", title: "Install", code: "pip install aegisgate" },
  { n: "02", title: "Set your key", code: 'export AEGISGATE_KEY="ag_live_…"' },
  { n: "03", title: "Scan a prompt", code: "verdict = gate.scan(...)" },
  { n: "04", title: "Or switch your base URL", code: 'base_url="https://gate.aegisgate.dev/v1/proxy"' },
];

const PROXY_BEFORE = `from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
)

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
)`;
const PROXY_AFTER = `from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AEGISGATE_KEY"],
    base_url="https://gate.aegisgate.dev/v1/proxy",
)

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
)
# x-aegis-verdict, x-aegis-latency-ms, x-aegis-shield-confidence`;

const PLUGINS = [
  { icon: Layers, name: "LiteLLM", desc: "Pre/post-call guardrail hook for the LiteLLM proxy.", install: "pip install aegisgate-litellm" },
  { icon: Workflow, name: "LangChain", desc: "AegisGateCallbackHandler scans every chain I/O.", install: "pip install aegisgate-langchain" },
  { icon: Puzzle, name: "LlamaIndex", desc: "Query-stage guardrail for RAG pipelines.", install: "pip install aegisgate-llamaindex" },
  { icon: Braces, name: "Vercel AI SDK", desc: "Middleware for streamText / generateText.", install: "npm i @aegisgate/ai-sdk" },
  { icon: Server, name: "FastAPI middleware", desc: "ASGI middleware enforcing policy per-route.", install: "pip install aegisgate-fastapi" },
  { icon: Globe, name: "Kong / Envoy gateway", desc: "Edge WASM filter — enforce at the gateway.", install: "kong plugins install aegisgate", beta: true },
];

const FRAMEWORKS = [
  {
    id: "owasp", name: "OWASP LLM Top 10",
    rows: [
      ["LLM01 Prompt Injection", "Prompt Shields · Red Team XPIA"],
      ["LLM02 Sensitive Info Disclosure", "PII mask · leakage scans"],
      ["LLM05 Improper Output Handling", "Output scan · blocklists"],
      ["LLM06 Excessive Agency", "Tool-call gating · Task Adherence eval"],
      ["LLM07 System Prompt Leakage", "Shield rule-change detection"],
      ["LLM10 Unbounded Consumption", "Rate policies · token budgets"],
    ],
  },
  {
    id: "atlas", name: "MITRE ATLAS",
    rows: [
      ["AML.T0051 Prompt Injection", "Crescendo + multi-turn coverage"],
      ["AML.T0043 Craft Adversarial Data", "Encoding/base64 strategies"],
      ["AML.T0048 Exfiltration", "PII egress scans on tool calls"],
      ["AML.T0054 LLM Jailbreak", "DAN / role-play shield subtypes"],
    ],
  },
  {
    id: "nist", name: "NIST AI RMF",
    rows: [
      ["Govern", "Policy versions · audit log · RBAC"],
      ["Map", "Risk register · attack library taxonomy"],
      ["Measure", "Eval runs · ASR scorecards · drift alerts"],
      ["Manage", "Incidents · alert rules · rollback"],
    ],
  },
  {
    id: "eu", name: "EU AI Act",
    rows: [
      ["Art. 9 Risk management", "Continuous red-team regression"],
      ["Art. 12 Record keeping", "OTel trace retention 400d"],
      ["Art. 13 Transparency", "Verdict reasons in every response"],
      ["Art. 14 Human oversight", "Review queue · override hooks"],
    ],
  },
];

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Integrations() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeKey, setRevokeKey] = useState<ApiKey | null>(null);
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null);
  const [step, setStep] = useState(2);
  const [copied, setCopied] = useState(false);

  const copyNewKey = async () => {
    if (!newKey) return;
    try { await navigator.clipboard.writeText(newKey.key); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
    toast.success("Key copied — store it safely");
  };

  return (
    <ConsoleShell breadcrumb="gate.aegisgate.dev/integrations">
      <Toaster position="top-right" theme="dark" />
      <PageHeader
        title="Integrations"
        subtitle="ship the gate in 5 minutes"
        actions={
          <>
            <GhostButton onClick={() => toast.info("docs.aegisgate.dev/api — opens in new tab")}>API reference <ArrowUpRight size={12} /></GhostButton>
            <PrimaryButton onClick={() => { setNewKey(null); setCreateOpen(true); }}>
              <KeyRound size={13} /> Create API key
            </PrimaryButton>
          </>
        }
      />

      <motion.div
        initial="off"
        animate="on"
        variants={{ off: {}, on: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* S1 — keys + usage */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[60%_minmax(0,1fr)]">
          <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="rounded-[10px] border border-line bg-bg-2">
            <div className="border-b border-line px-4 py-3">
              <div className="text-[15px] font-semibold text-ink-hi">API keys</div>
              <div className="font-mono text-[11px] text-ink-low">scoped per environment · rotate any time</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-bg-1">
                    {["Name", "Key", "Env", "Created", "Last used", "Scopes", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <KeyRow key={k.id} k={k} onRevoke={() => setRevokeKey(k)} onRotate={() => toast.success(`Key rotated · ${k.name}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="rounded-[10px] border border-line bg-bg-2 p-5">
            <div className="text-[15px] font-semibold text-ink-hi">Usage this month</div>
            <div className="mt-3 font-mono text-3xl font-semibold text-ink-hi">412,204,933</div>
            <div className="font-mono text-[11px] text-ink-low">scans · resets in 11 days</div>
            <div className="mt-5 flex items-center gap-6">
              <UsageRing label="scan" pct={82} color="#38E1C6" />
              <UsageRing label="redteam" pct={46} color="#9B7BFF" />
              <UsageRing label="eval" pct={61} color="#5B8CFF" />
            </div>
            <div className="mt-5 rounded-md border border-aegis/25 bg-aegis/[0.06] px-3 py-2 font-mono text-[11px] text-aegis">
              Scale plan · unlimited overage — you will never be throttled mid-attack.
            </div>
          </motion.div>
        </div>

        {/* S2 — quickstart */}
        <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="mt-4 rounded-[10px] border border-line bg-bg-2 p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-ink-hi">Quickstart</h2>
            <div className="font-mono text-[11px] text-ink-low">first verdict in under 5 minutes</div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-1">
              {STEPS.map((s, i) => (
                <button
                  key={s.n}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-md border px-4 py-3 text-left transition-colors",
                    step === i ? "border-aegis/40 bg-aegis/[0.06]" : "border-transparent hover:bg-bg-3",
                  )}
                >
                  <span className={cn("font-mono text-lg font-semibold", step === i ? "text-aegis" : "text-ink-low")}>{s.n}</span>
                  <span className="min-w-0">
                    <span className={cn("block text-[14px] font-medium", step === i ? "text-ink-hi" : "text-ink-mid")}>{s.title}</span>
                    <span className="block truncate font-mono text-[11px] text-ink-low">{s.code}</span>
                  </span>
                </button>
              ))}
            </div>
            <div>
              <CodeBlock
                code={PY_SNIPPET}
                lang="python"
                tabs={[
                  { label: "Python", code: PY_SNIPPET, lang: "python" },
                  { label: "JavaScript", code: JS_SNIPPET, lang: "javascript" },
                  { label: "cURL", code: CURL_SNIPPET, lang: "bash" },
                ]}
              />
              <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-ink-low">
                <Terminal size={12} className="text-aegis" />
                verdicts include per-category severity 0/2/4/6 + shield confidence
              </div>
            </div>
          </div>
        </motion.div>

        {/* S3 — proxy band */}
        <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="mt-4 rounded-[10px] border border-line bg-bg-1 p-6">
          <h2 className="text-xl font-semibold text-ink-hi">One line. Total control.</h2>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-mid">
            Works with any OpenAI SDK. Your policy enforced in-line — block, mask, or annotate — with scan metadata returned in <span className="font-mono text-aegis">x-aegis-*</span> headers.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-low">Before</div>
              <CodeBlock code={PROXY_BEFORE} lang="python" />
            </div>
            <div>
              <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-aegis">After</div>
              <div className="overflow-hidden rounded-[10px] border border-aegis/40 bg-bg-3 glow-aegis">
                <div className="flex items-center justify-between border-b border-line bg-bg-2 px-3 py-1.5">
                  <span className="font-mono text-[11px] text-ink-low">python · proxy mode</span>
                </div>
                <pre className="overflow-auto p-3 font-mono text-[13px] leading-relaxed">
                  <code>
                    {PROXY_AFTER.split("\n").map((line, i) => {
                      const hot = line.includes("AEGISGATE_KEY") || line.includes("base_url") || line.includes("x-aegis");
                      return (
                        <div key={i} className={cn(hot && "bg-aegis/10 -mx-3 px-3 border-l-2 border-aegis")}>
                          <span className={hot ? "text-aegis" : "text-ink-mid"}>{line || " "}</span>
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["x-aegis-verdict", "x-aegis-latency-ms", "x-aegis-shield-confidence", "x-aegis-policy-version", "x-aegis-pii-masked"].map((h) => (
              <span key={h} className="rounded-full border border-line bg-bg-2 px-2.5 py-1 font-mono text-[11px] text-ink-mid">{h}</span>
            ))}
          </div>
        </motion.div>

        {/* S4 — plugins */}
        <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="mt-4">
          <h2 className="mb-3 text-xl font-semibold text-ink-hi">Gateway & framework plugins</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PLUGINS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.07, ease: easeOut }}
                whileHover={{ y: -3 }}
                className="group rounded-[10px] border border-line bg-bg-2 p-4 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-bg-3 text-aegis">
                    <p.icon size={15} />
                  </span>
                  <span className="text-[15px] font-semibold text-ink-hi">{p.name}</span>
                  {p.beta && (
                    <span className="rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 font-mono text-[10px] uppercase text-violet">wasm · beta</span>
                  )}
                </div>
                <p className="mt-2 text-[13px] text-ink-mid">{p.desc}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <code className="truncate rounded bg-bg-3 px-2 py-1 font-mono text-[11px] text-aegis">{p.install}</code>
                  <button onClick={() => toast.info(`docs.aegisgate.dev/plugins/${p.name.toLowerCase().split(" ")[0]}`)} className="shrink-0 font-mono text-[11px] text-ink-low hover:text-aegis">
                    Docs →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* S5 — compliance */}
        <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="mt-6 rounded-[10px] border border-line bg-bg-2 p-6">
          <h2 className="text-xl font-semibold text-ink-hi">Mapped to the frameworks your auditors know.</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[10px] border border-line bg-bg-1 p-3">
              <img src="/owasp-map.svg" alt="OWASP LLM Top 10 mapping matrix" className="h-auto w-full" />
            </div>
            <ComplianceAccordion />
          </div>
        </motion.div>

        {/* S6 — status band */}
        <motion.div variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } } }} className="mt-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-bg-2 px-4 py-3">
          <button onClick={() => toast.success("status.aegisgate.dev — all systems nominal")} className="flex items-center gap-2 rounded-full border border-aegis/40 bg-aegis/10 px-3 py-1 font-mono text-[11px] text-aegis">
            <span className="h-1.5 w-1.5 rounded-full bg-aegis pulse-dot" /> All systems nominal · status.aegisgate.dev
          </button>
          <span className="rounded-full border border-line bg-bg-3 px-3 py-1 font-mono text-[11px] text-ink-mid">99.99% uptime</span>
          <span className="rounded-full border border-line bg-bg-3 px-3 py-1 font-mono text-[11px] text-ink-mid">p99 &lt; 250ms contractual</span>
          <span className="ml-auto font-mono text-[11px] text-ink-low">aegis-gate v2.4.1 · api 2025-01-preview</span>
        </motion.div>
      </motion.div>

      {/* create key modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} wide={!!newKey}>
        {!newKey ? (
          <CreateKeyForm
            onCreate={(name) => {
              const key = `ag_live_${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
              setNewKey({ name, key });
              setKeys((ks) => [{ id: `k${Date.now()}`, name, prefix: key.slice(0, 10), env: "prod", created: "2025-12-19", lastUsed: "never", scopes: ["scan"] }, ...ks]);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        ) : (
          <div>
            <div className="mb-1 text-[15px] font-semibold text-ink-hi">Key created — shown once</div>
            <p className="mb-4 text-[13px] text-ink-mid">Store it somewhere safe. You will not be able to see <span className="font-mono">{newKey.name}</span> again.</p>
            <div className="flex items-center gap-2 rounded-[10px] border border-aegis/50 bg-bg-3 p-3 glow-aegis">
              <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-aegis">{newKey.key}</code>
              <button onClick={copyNewKey} className="shrink-0 text-ink-low hover:text-aegis" aria-label="Copy key">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-warn">
              <Eye size={12} /> This is the only time the full key is displayed.
            </div>
            <div className="mt-4 flex justify-end">
              <PrimaryButton onClick={() => setCreateOpen(false)}>Done</PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      {/* revoke modal */}
      <Modal open={!!revokeKey} onClose={() => setRevokeKey(null)}>
        <div className="mb-1 text-[15px] font-semibold text-ink-hi">Revoke key</div>
        <p className="mb-4 text-[13px] text-ink-mid">
          Revoking <span className="font-mono text-ink-hi">{revokeKey?.name}</span> immediately rejects all requests using it. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={() => setRevokeKey(null)}>Cancel</GhostButton>
          <button
            onClick={() => {
              setKeys((ks) => ks.filter((k) => k.id !== revokeKey?.id));
              toast.success(`Key revoked · ${revokeKey?.name}`);
              setRevokeKey(null);
            }}
            className="rounded-md border border-danger/50 bg-danger/15 px-3 py-1.5 font-mono text-[12px] text-danger hover:bg-danger/25"
          >
            Revoke key
          </button>
        </div>
      </Modal>
    </ConsoleShell>
  );
}

function KeyRow({ k, onRevoke, onRotate }: { k: ApiKey; onRevoke: () => void; onRotate: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <tr className="h-11 border-b border-line/60 last:border-0 hover:bg-bg-3">
      <td className="px-3 font-medium text-ink-hi">{k.name}</td>
      <td className="px-3 font-mono text-[12px] text-ink-mid" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <span className="inline-flex items-center gap-1.5">
          {hover ? `${k.prefix}••••••••` : `${k.prefix}…`}
          <Eye size={12} className={cn("transition-opacity", hover ? "text-aegis opacity-100" : "opacity-30")} />
        </span>
      </td>
      <td className="px-3">
        <span className={cn(
          "rounded-full border px-2 py-0.5 font-mono text-[10px]",
          k.env === "prod" ? "border-aegis/40 bg-aegis/10 text-aegis" : k.env === "staging" ? "border-warn/40 bg-warn/10 text-warn" : "border-line bg-bg-3 text-ink-low",
        )}>
          {k.env}
        </span>
      </td>
      <td className="px-3 font-mono text-[12px] text-ink-low">{k.created}</td>
      <td className="px-3 font-mono text-[12px] text-ink-low">{k.lastUsed}</td>
      <td className="px-3">
        <span className="flex gap-1">
          {k.scopes.map((s) => (
            <span key={s} className="rounded border border-line bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] text-ink-mid">{s}</span>
          ))}
        </span>
      </td>
      <td className="px-3">
        <span className="flex justify-end gap-2">
          <button onClick={onRotate} className="text-ink-low hover:text-aegis" aria-label={`Rotate ${k.name}`}><RefreshCw size={14} /></button>
          <button onClick={onRevoke} className="text-ink-low hover:text-danger" aria-label={`Revoke ${k.name}`}><Trash2 size={14} /></button>
        </span>
      </td>
    </tr>
  );
}

function UsageRing({ label, pct, color }: { label: string; pct: number; color: string }) {
  const r = 26; const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="64" height="64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1E2532" strokeWidth="5" />
          <motion.circle
            cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c * (1 - pct / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-ink-hi">{pct}%</span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-low">{label}</span>
    </div>
  );
}

function CreateKeyForm({ onCreate, onCancel }: { onCreate: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [env, setEnv] = useState("prod");
  const [scopes, setScopes] = useState({ scan: true, redteam: false, eval: false });
  return (
    <div>
      <div className="mb-4 text-[15px] font-semibold text-ink-hi">Create API key</div>
      <div className="space-y-4">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-low">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. prod-backend-eu"
            className="w-full rounded-md border border-line bg-bg-3 px-3 py-2 font-mono text-[13px] text-ink-hi outline-none placeholder:text-ink-low focus:border-aegis/50"
          />
        </div>
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-low">Environment</div>
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            className="w-full rounded-md border border-line bg-bg-3 px-3 py-2 font-mono text-[13px] text-ink-hi outline-none focus:border-aegis/50"
          >
            <option value="prod">prod</option>
            <option value="staging">staging</option>
            <option value="dev">dev</option>
          </select>
        </div>
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-low">Scopes</div>
          <div className="flex gap-3">
            {(["scan", "redteam", "eval"] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-1.5 font-mono text-[12px] text-ink-mid">
                <input type="checkbox" checked={scopes[s]} onChange={() => setScopes((x) => ({ ...x, [s]: !x[s] }))} className="accent-[#38E1C6]" />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <PrimaryButton onClick={() => onCreate(name.trim() || "unnamed-key")}>Create key</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ComplianceAccordion() {
  const [open, setOpen] = useState<string | null>("owasp");
  return (
    <div className="overflow-hidden rounded-[10px] border border-line">
      {FRAMEWORKS.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className="border-b border-line last:border-0">
            <button
              onClick={() => setOpen(isOpen ? null : f.id)}
              className="flex w-full items-center justify-between bg-bg-1 px-4 py-3 text-left hover:bg-bg-2"
            >
              <span className="text-[14px] font-semibold text-ink-hi">{f.name}</span>
              <ChevronDown size={15} className={cn("text-ink-low transition-transform duration-200", isOpen && "rotate-180 text-aegis")} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="overflow-hidden"
                >
                  <div className="bg-bg-2 px-4 py-3">
                    {f.rows.map((row, i) => (
                      <motion.div
                        key={row[0]}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-line/50 py-2 last:border-0"
                      >
                        <span className="font-mono text-[12px] text-ink-mid">{row[0]}</span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-aegis" />
                          <span className="rounded-full border border-aegis/30 bg-aegis/[0.08] px-2 py-0.5 font-mono text-[10px] text-aegis">{row[1]}</span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
