import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Download, Plus, Radio, ChevronDown, ShieldCheck, Database } from "lucide-react";
import ConsoleShell, { PageHeader } from "@/components/ConsoleShell";
import { VerdictBadge, StatCard, DataTable, Drawer } from "@/components/primitives";
import type { Column } from "@/components/primitives";
import type { Verdict } from "@/engines/ScanEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  seedEvents, makeEvent, severitySeries, latencySeries, VERDICT_MIX, INCIDENTS, makeTraces, SPAN_COLORS,
} from "@/components/observability/data";
import type { LiveEvent, Incident, Trace } from "@/components/observability/data";

const SEV_COLORS = { safe: "#38E1C6", low: "#F5B544", medium: "#F5823A", high: "#F5586B" };

const tooltipStyle = {
  contentStyle: { background: "#10141C", border: "1px solid #2A3242", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" },
  labelStyle: { color: "#5C6B7F" },
  itemStyle: { color: "#9AA6B8" },
} as const;

const axisProps = {
  stroke: "#5C6B7F",
  fontSize: 10,
  fontFamily: "JetBrains Mono",
  tickLine: false,
  axisLine: { stroke: "#1E2532" },
} as const;

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

export default function Observability() {
  const [live, setLive] = useState(true);
  const [kpis, setKpis] = useState({ scans: 1284311, shields: 8412, pii: 19204, p50: 41, blockRate: 3.7 });
  const [flash, setFlash] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>(() => seedEvents(18));
  const [verdictFilter, setVerdictFilter] = useState<Record<Verdict, boolean>>({ PASS: true, FLAG: true, MASK: true, BLOCK: true });
  const [incident, setIncident] = useState<Incident | null>(null);
  const traces = useMemo(() => makeTraces(14), []);
  const [trace, setTrace] = useState<Trace | null>(null);
  const sevData = useMemo(severitySeries, []);
  const latData = useMemo(latencySeries, []);
  const [hiddenSev, setHiddenSev] = useState<Record<string, boolean>>({});

  // live ticking
  useEffect(() => {
    if (!live) return;
    const ev = setInterval(() => setEvents((prev) => [makeEvent(), ...prev].slice(0, 30)), 2500);
    const kpi = setInterval(() => {
      setKpis((k) => ({
        scans: k.scans + Math.round(3 + Math.random() * 12),
        shields: k.shields + (Math.random() < 0.4 ? 1 : 0),
        pii: k.pii + (Math.random() < 0.5 ? Math.round(1 + Math.random() * 3) : 0),
        p50: Math.max(34, Math.min(52, k.p50 + Math.round(Math.random() * 4 - 2))),
        blockRate: Math.round(Math.max(2.8, Math.min(4.6, k.blockRate + (Math.random() - 0.5) * 0.2)) * 10) / 10,
      }));
      setFlash(true);
      setTimeout(() => setFlash(false), 160);
    }, 4000);
    return () => { clearInterval(ev); clearInterval(kpi); };
  }, [live]);

  const filtered = events.filter((e) => verdictFilter[e.verdict]);

  return (
    <ConsoleShell breadcrumb="gate.aegisgate.dev/observability">
      <Toaster position="top-right" theme="dark" />
      <PageHeader
        title="Observability"
        subtitle="traces · scans · incidents"
        actions={
          <>
            <GhostButton onClick={() => toast.info("Time range pinned to last 24h")}>Last 24h <ChevronDown size={13} /></GhostButton>
            <button
              onClick={() => setLive((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[12px] transition-colors",
                live ? "border-aegis/50 bg-aegis-dim/30 text-aegis" : "border-line bg-bg-2 text-ink-low",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-aegis pulse-dot" : "bg-ink-low")} />
              <Radio size={12} /> Live
            </button>
            <GhostButton onClick={() => toast.success("Telemetry export queued — link sent to admin@aegisgate.dev")}>
              <Download size={13} /> Export
            </GhostButton>
          </>
        }
      />

      {/* S1 — KPI band */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Scans 24h", value: kpis.scans.toLocaleString(), spark: [12, 14, 13, 16, 18, 17, 19], delta: "4.2%", up: true, color: "#38E1C6" },
          { label: "Block rate", value: `${kpis.blockRate}%`, spark: [3.1, 3.4, 3.2, 3.8, 4.1, 3.6, 3.7], delta: "0.4%", up: false, color: "#F5586B" },
          { label: "p50 latency", value: `${kpis.p50}ms`, spark: [44, 42, 45, 40, 41, 39, 41], delta: "2ms", up: true, color: "#5B8CFF" },
          { label: "Shield triggers", value: kpis.shields.toLocaleString(), spark: [70, 74, 80, 78, 90, 96, 92], delta: "11.8%", up: true, color: "#9B7BFF" },
          { label: "PII masked", value: kpis.pii.toLocaleString(), spark: [180, 175, 190, 210, 205, 220, 228], delta: "6.1%", up: true, color: "#5B8CFF" },
        ].map((s) => (
          <div key={s.label} className={cn("transition-colors duration-150 rounded-[10px]", flash && live && "bg-aegis/[0.03]")}>
            <StatCard
              label={s.label}
              value={s.value}
              delta={s.delta}
              deltaUp={s.up}
              spark={s.spark}
              className={flash && live ? "border-line-strong" : ""}
            />
          </div>
        ))}
      </div>

      {/* S2 — charts row */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartPanel title="Severity distribution" sub="24h · stacked by severity">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <XAxis dataKey="h" {...axisProps} interval={5} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
                onClick={(e) => setHiddenSev((h) => ({ ...h, [e.dataKey as string]: !h[e.dataKey as string] }))}
                formatter={(v: string, e) => (
                  <span style={{ color: hiddenSev[String((e as { dataKey?: unknown }).dataKey)] ? "#3a4354" : "#9AA6B8" }}>{v}</span>
                )}
              />
              <Bar dataKey="safe" name="Safe" stackId="a" fill={SEV_COLORS.safe} hide={!!hiddenSev.safe} isAnimationActive animationDuration={700} />
              <Bar dataKey="low" name="Low" stackId="a" fill={SEV_COLORS.low} hide={!!hiddenSev.low} isAnimationActive animationDuration={700} />
              <Bar dataKey="medium" name="Medium" stackId="a" fill={SEV_COLORS.medium} hide={!!hiddenSev.medium} isAnimationActive animationDuration={700} />
              <Bar dataKey="high" name="High" stackId="a" fill={SEV_COLORS.high} radius={[2, 2, 0, 0]} hide={!!hiddenSev.high} isAnimationActive animationDuration={700} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Latency percentiles" sub="gate scan path · ms">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={latData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="gp50" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B8CFF" stopOpacity={0.35} /><stop offset="100%" stopColor="#5B8CFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B7BFF" stopOpacity={0.25} /><stop offset="100%" stopColor="#9B7BFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp99" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5586B" stopOpacity={0.22} /><stop offset="100%" stopColor="#F5586B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="h" {...axisProps} interval={5} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ stroke: "#2A3242", strokeWidth: 1 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Area type="monotone" dataKey="p99" stroke="#F5586B" fill="url(#gp99)" strokeWidth={1.5} isAnimationActive animationDuration={700} />
              <Area type="monotone" dataKey="p95" stroke="#9B7BFF" fill="url(#gp95)" strokeWidth={1.5} isAnimationActive animationDuration={700} />
              <Area type="monotone" dataKey="p50" stroke="#5B8CFF" fill="url(#gp50)" strokeWidth={1.5} isAnimationActive animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Verdict mix" sub="last 24h · all policies">
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip {...tooltipStyle} />
                <Pie
                  data={VERDICT_MIX}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive
                  animationDuration={800}
                >
                  {VERDICT_MIX.map((v) => (
                    <Cell key={v.name} fill={v.color} style={{ cursor: "pointer" }} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} formatter={(v: string) => <span style={{ color: "#9AA6B8" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute left-1/2 top-[92px] -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="font-mono text-lg font-semibold text-ink-hi">1.28M</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-low">verdicts</div>
            </div>
          </div>
        </ChartPanel>
      </div>

      {/* S3 — live feed + incidents */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[55%_minmax(0,1fr)]">
        <div className="rounded-[10px] border border-line bg-bg-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <div className="text-[15px] font-semibold text-ink-hi">Live scan events</div>
              <div className="font-mono text-[11px] text-ink-low">{live ? "streaming · 2.5s interval" : "paused"}</div>
            </div>
            <div className="flex gap-1.5">
              {(["PASS", "FLAG", "MASK", "BLOCK"] as Verdict[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdictFilter((f) => ({ ...f, [v]: !f[v] }))}
                  className={cn("transition-opacity", !verdictFilter[v] && "opacity-30 grayscale")}
                >
                  <VerdictBadge verdict={v} />
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[420px] overflow-hidden px-2 py-1">
            <AnimatePresence initial={false}>
              {filtered.map((e, idx) => (
                <motion.button
                  key={e.id}
                  layout="position"
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: idx > 22 ? 0.35 : 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setTrace(traces[idx % traces.length])}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left font-mono text-[12px] hover:bg-bg-3"
                >
                  <span className="w-[70px] shrink-0 text-ink-low">{e.ts}</span>
                  <span className="hidden w-[110px] shrink-0 truncate text-azure md:inline">{e.reqId}</span>
                  <VerdictBadge verdict={e.verdict} className="!px-2 !py-0 text-[10px]" />
                  <span className="hidden min-w-0 flex-1 truncate text-ink-mid lg:inline">
                    {e.category} · {e.severity}
                  </span>
                  <span className={cn("ml-auto shrink-0", e.latency > 180 ? "text-warn" : "text-ink-low")}>{e.latency}ms</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-[10px] border border-line bg-bg-2">
          <div className="border-b border-line px-4 py-3">
            <div className="text-[15px] font-semibold text-ink-hi">Incident queue</div>
            <div className="font-mono text-[11px] text-ink-low">2 active · 3 resolved (24h)</div>
          </div>
          <div>
            {INCIDENTS.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setIncident(inc)}
                className="flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left last:border-0 hover:bg-bg-3"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase",
                    inc.sev === "sev-1" ? "border-danger/40 bg-danger/10 text-danger" : "border-warn/40 bg-warn/10 text-warn",
                  )}
                >
                  {inc.sev}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-ink-hi">{inc.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink-low">
                    <span>{inc.id}</span>·<span>{inc.opened}</span>·
                    <span className={cn("flex items-center gap-1", inc.status === "resolved" ? "text-aegis" : "text-warn")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", inc.status === "resolved" ? "bg-aegis" : "bg-warn pulse-dot")} style={inc.status !== "resolved" ? { animationDuration: "1.6s" } : undefined} />
                      {inc.status}
                    </span>
                  </div>
                </div>
                <MiniSpark points={inc.spark} color={inc.status === "resolved" ? "#38E1C6" : inc.sev === "sev-1" ? "#F5586B" : "#F5B544"} />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aegis-dim font-mono text-[10px] text-aegis">
                  {inc.assignee}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* S4 — traces */}
      <div className="mt-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink-hi">OTel GenAI traces</h2>
            <div className="font-mono text-[11px] text-ink-low">gen_ai.* semantic conventions · auto-instrumented by the proxy</div>
          </div>
        </div>
        <DataTable
          rows={traces}
          onRowClick={setTrace}
          columns={traceColumns()}
        />
      </div>

      {/* S5 — alerting */}
      <AlertRules />

      {/* drawers */}
      <Drawer open={!!trace} onClose={() => setTrace(null)} title={trace ? `trace · ${trace.id.slice(0, 14)}…` : ""}>
        {trace && <TraceDetail trace={trace} />}
      </Drawer>
      <Drawer open={!!incident} onClose={() => setIncident(null)} title={incident ? `${incident.id} · ${incident.sev}` : ""}>
        {incident && <IncidentDetail incident={incident} />}
      </Drawer>
    </ConsoleShell>
  );
}

function ChartPanel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-line bg-bg-2 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-[15px] font-semibold text-ink-hi">{title}</div>
        <div className="font-mono text-[10px] text-ink-low">{sub}</div>
      </div>
      {children}
    </div>
  );
}

function MiniSpark({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points); const min = Math.min(...points); const range = max - min || 1;
  const w = 56; const h = 20; const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - 1 - ((p - min) / range) * (h - 2)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} className="hidden shrink-0 sm:block">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function traceColumns(): Column<Trace>[] {
  return [
    {
      key: "id", header: "Trace ID", mono: true,
      render: (t) => <span className="text-azure hover:underline">{t.id.slice(0, 12)}…</span>,
    },
    { key: "op", header: "Operation", mono: true, render: (t) => t.operation },
    {
      key: "model", header: "Model",
      render: (t) => (
        <span className="rounded border border-line bg-bg-3 px-1.5 py-0.5 font-mono text-[11px] text-ink-mid">{t.model}</span>
      ),
    },
    { key: "spans", header: "Spans", mono: true, sortable: true, sortValue: (t) => t.spans.length, render: (t) => t.spans.length },
    {
      key: "dur", header: "Duration", mono: true, sortable: true, sortValue: (t) => t.durationMs,
      render: (t) => <span className={t.durationMs > 1000 ? "text-warn" : "text-ink-mid"}>{t.durationMs}ms</span>,
    },
    { key: "tok", header: "Tokens in/out", mono: true, render: (t) => <span className="text-ink-low">{t.tokensIn}/{t.tokensOut}</span> },
    { key: "verdict", header: "Gate verdict", render: (t) => <VerdictBadge verdict={t.verdict} /> },
    { key: "ts", header: "Timestamp", mono: true, render: (t) => <span className="text-ink-low">{t.ts}</span> },
  ];
}

function TraceDetail({ trace }: { trace: Trace }) {
  const [tab, setTab] = useState<"waterfall" | "attrs">("waterfall");
  const [hovered, setHovered] = useState<number | null>(null);
  const total = trace.spans[0].durationMs;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <VerdictBadge verdict={trace.verdict} />
        <span className="rounded border border-line bg-bg-3 px-1.5 py-0.5 font-mono text-[11px] text-ink-mid">{trace.model}</span>
        <span className="font-mono text-[11px] text-ink-low">{trace.operation} · {trace.durationMs}ms · {trace.tokensIn + trace.tokensOut} tok</span>
      </div>
      <div className="flex gap-1 border-b border-line">
        {(["waterfall", "attrs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider",
              tab === t ? "border-aegis text-aegis" : "border-transparent text-ink-low hover:text-ink-mid",
            )}
          >
            {t === "waterfall" ? "Waterfall" : "Attributes"}
          </button>
        ))}
      </div>
      {tab === "waterfall" ? (
        <div className="space-y-2">
          {trace.spans.map((s, i) => (
            <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-ink-mid">
                  {s.kind === "scan" && <ShieldCheck size={11} className="text-aegis" />}
                  {s.name}
                </span>
                <span className={s.durationMs > 1000 ? "text-warn" : "text-ink-low"}>{s.durationMs}ms</span>
              </div>
              <div className="relative h-4 rounded-sm bg-bg-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, (s.durationMs / total) * 100)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                  className="absolute top-0 h-full rounded-sm"
                  style={{ left: `${(s.startMs / total) * 100}%`, backgroundColor: SPAN_COLORS[s.kind], opacity: hovered === null || hovered === i ? 0.9 : 0.35 }}
                />
              </div>
              {hovered === i && (
                <div className="mt-1 rounded-md border border-line bg-bg-3 p-2 font-mono text-[10px] text-ink-low">
                  start {s.startMs}ms · duration {s.durationMs}ms · {Object.keys(s.attrs).length} attributes
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          {trace.spans.flatMap((s, i) =>
            Object.entries(s.attrs).map(([k, v]) => (
              <div key={`${i}-${k}`} className="flex justify-between gap-3 border-b border-line/50 bg-bg-2 px-3 py-1.5 font-mono text-[11px] last:border-0">
                <span className="text-azure">{k}</span>
                <span className="truncate text-ink-mid">{String(v)}</span>
              </div>
            )),
          )}
        </div>
      )}
      <PrimaryButton
        className="w-full justify-center"
        onClick={() => toast.success("12 spans added to dataset ds_104")}
      >
        <Database size={13} /> Harvest to eval dataset
      </PrimaryButton>
    </div>
  );
}

function IncidentDetail({ incident }: { incident: Incident }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[15px] font-semibold text-ink-hi">{incident.title}</div>
        <div className="mt-1 font-mono text-[11px] text-ink-low">opened {incident.opened} · assignee {incident.assignee}</div>
      </div>
      <div>
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-low">Timeline</div>
        <div className="space-y-0">
          {incident.timeline.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 rounded-full border",
                    step.done ? "border-aegis bg-aegis" : "border-line-strong bg-bg-3",
                  )}
                />
                {i < incident.timeline.length - 1 && <span className={cn("w-px flex-1", step.done ? "bg-aegis/40" : "bg-line")} />}
              </div>
              <div className="pb-4">
                <div className={cn("text-[13px]", step.done ? "text-ink-hi" : "text-ink-low")}>{step.label}</div>
                <div className="font-mono text-[11px] text-ink-low">{step.ts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-low">Related scans</div>
        <div className="overflow-hidden rounded-md border border-line">
          {incident.relatedScans.map((r) => (
            <div key={r.reqId} className="flex items-center gap-3 border-b border-line/50 bg-bg-2 px-3 py-2 font-mono text-[11px] last:border-0">
              <span className="text-azure">{r.reqId}</span>
              <VerdictBadge verdict={r.verdict} className="!px-2 !py-0 text-[10px]" />
              <span className="ml-auto text-ink-low">{r.latency}ms · {r.ts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Rule { id: string; label: string; on: boolean }
function AlertRules() {
  const [rules, setRules] = useState<Rule[]>([
    { id: "r1", label: "Block rate > 5% / 5m → page", on: true },
    { id: "r2", label: "p99 > 500ms → slack", on: true },
    { id: "r3", label: "Shield confidence drop → email", on: false },
  ]);
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState("block_rate");
  const [threshold, setThreshold] = useState(5);
  const [channels, setChannels] = useState({ page: true, slack: false, email: false });

  const save = () => {
    const ch = (Object.entries(channels).filter(([, v]) => v).map(([k]) => k).join("+")) || "email";
    setRules((r) => [...r, { id: `r${Date.now()}`, label: `${metric.replace(/_/g, " ")} > ${threshold}${metric === "block_rate" ? "%" : metric === "p99_latency" ? "ms" : ""} → ${ch}`, on: true }]);
    setOpen(false);
    toast.success("Alert rule created");
  };

  return (
    <div className="mt-4 rounded-[10px] border border-line bg-bg-2 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold text-ink-hi">Alert rules</div>
          <div className="font-mono text-[11px] text-ink-low">evaluate every 60s · routed via pagerduty / slack / email</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 py-1.5 font-mono text-[12px] text-ink-low transition-colors hover:border-aegis/50 hover:text-aegis"
        >
          <Plus size={13} /> New rule
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {rules.map((r) => (
            <motion.div
              key={r.id}
              layout="position"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="flex items-center gap-2.5 rounded-full border border-line bg-bg-3 py-1.5 pl-4 pr-2"
            >
              <span className="font-mono text-[12px] text-ink-mid">{r.label}</span>
              <button
                onClick={() => setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, on: !x.on } : x)))}
                className={cn("relative h-4 w-7 rounded-full transition-colors", r.on ? "bg-aegis/70" : "bg-bg-1 border border-line")}
                aria-label={`Toggle ${r.label}`}
              >
                <span className={cn("absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white transition-all", r.on ? "left-3.5" : "left-0.5")} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-line bg-bg-1 p-5"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              <div className="mb-4 text-[15px] font-semibold text-ink-hi">New alert rule</div>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-low">Metric</div>
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="w-full rounded-md border border-line bg-bg-3 px-3 py-2 font-mono text-[13px] text-ink-hi outline-none focus:border-aegis/50"
                  >
                    <option value="block_rate">block_rate</option>
                    <option value="p99_latency">p99_latency</option>
                    <option value="shield_confidence">shield_confidence</option>
                    <option value="pii_mask_rate">pii_mask_rate</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1 flex justify-between font-mono text-[11px] uppercase tracking-wider text-ink-low">
                    <span>Threshold</span>
                    <span className="text-aegis">{threshold}</span>
                  </div>
                  <input
                    type="range" min={1} max={metric === "p99_latency" ? 1000 : 50} value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-[#38E1C6]"
                  />
                </div>
                <div>
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-low">Channels</div>
                  <div className="flex gap-3">
                    {(["page", "slack", "email"] as const).map((c) => (
                      <label key={c} className="flex cursor-pointer items-center gap-1.5 font-mono text-[12px] text-ink-mid">
                        <input
                          type="checkbox" checked={channels[c]}
                          onChange={() => setChannels((ch) => ({ ...ch, [c]: !ch[c] }))}
                          className="accent-[#38E1C6]"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
                  <PrimaryButton onClick={save}>Save rule</PrimaryButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
