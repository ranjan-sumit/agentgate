import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { ArrowLeft, CircleAlert, Download, GitCompareArrows, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Drawer from "@/components/primitives/Drawer";
import { generateRows, scoreColor, CONTEXT_CHUNKS } from "./data";
import type { DashRun, ResultRow } from "./data";

function useCountUp(target: number, decimals = 1, dur = 600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(+(target * e).toFixed(decimals));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, dur]);
  return v;
}

function MiniHist({ dist, color = "#5B8CFF" }: { dist: number[]; color?: string }) {
  const max = Math.max(...dist, 1);
  return (
    <svg width="72" height="28" className="opacity-70">
      {dist.map((v, i) => (
        <motion.rect
          key={i}
          x={i * 7.4}
          width={5.4}
          rx={1}
          fill={color}
          initial={{ height: 0, y: 28 }}
          animate={{ height: (v / max) * 26 + 2, y: 28 - ((v / max) * 26 + 2) }}
          transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.02 }}
        />
      ))}
    </svg>
  );
}

interface MetricCard {
  label: string;
  value: number;
  suffix: string;
  decimals: number;
  delta: number;
  dist: number[];
}

function MetricStatCard({ m, i }: { m: MetricCard; i: number }) {
  const v = useCountUp(m.value, m.decimals);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.3 }}
      className="relative overflow-hidden rounded-[10px] border border-line bg-bg-2 p-4"
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">{m.label}</div>
      <div className="mt-2 flex items-end justify-between">
        <span className="font-mono text-[26px] font-semibold leading-none text-ink-hi">
          {v.toFixed(m.decimals)}<span className="text-[14px] text-ink-low">{m.suffix}</span>
        </span>
        <MiniHist dist={m.dist} />
      </div>
      <div className={cn("mt-2 inline-block rounded px-1.5 py-px font-mono text-[10px]",
        m.delta >= 0 ? "bg-aegis/10 text-aegis" : "bg-danger/10 text-danger")}>
        {m.delta >= 0 ? "+" : ""}{m.delta.toFixed(1)} vs baseline
      </div>
    </motion.div>
  );
}

const ttStyle = {
  contentStyle: { background: "#161B26", border: "1px solid #2A3242", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" },
  labelStyle: { color: "#9AA6B8" },
  itemStyle: { color: "#E8EDF4" },
};

export default function ResultsView({
  run,
  onBack,
  onCompare,
}: {
  run: DashRun;
  onBack: () => void;
  onCompare: () => void;
}) {
  const rows = useMemo(() => generateRows(60, parseInt(run.id.replace(/\D/g, ""), 10) || 7), [run.id]);
  const [page, setPage] = useState(0);
  const [selRow, setSelRow] = useState<ResultRow | null>(null);
  const perPage = 25;

  const metricCards: MetricCard[] = [
    { label: "Groundedness", value: 4.3, suffix: "/5", decimals: 1, delta: 0.3, dist: [0, 0, 1, 2, 4, 7, 12, 16, 10, 8] },
    { label: "Relevance", value: 4.6, suffix: "/5", decimals: 1, delta: 0.1, dist: [0, 0, 0, 1, 3, 6, 12, 18, 12, 8] },
    { label: "Coherence", value: 4.5, suffix: "/5", decimals: 1, delta: 0.2, dist: [0, 0, 1, 2, 3, 7, 11, 17, 12, 7] },
    { label: "Retrieval", value: 0.87, suffix: "", decimals: 2, delta: 0.04, dist: [1, 1, 2, 3, 4, 6, 9, 13, 12, 9] },
    { label: "Task Adherence", value: 92, suffix: "%", decimals: 0, delta: 2, dist: [0, 1, 1, 2, 4, 8, 12, 14, 11, 7] },
    { label: "Safety pass", value: 98.1, suffix: "%", decimals: 1, delta: -0.1, dist: [0, 0, 0, 0, 1, 1, 2, 4, 10, 42] },
  ];

  const histData = useMemo(() => {
    const bins = ["1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"];
    return bins.map((b, i) => {
      const lo = 1 + i * 0.5;
      const inBin = (v: number) => (i === bins.length - 1 ? v >= lo : v >= lo && v < lo + 0.5);
      return {
        bin: b,
        groundedness: rows.filter((r) => inBin(r.groundedness)).length,
        relevance: rows.filter((r) => inBin(r.relevance)).length,
      };
    });
  }, [rows]);

  const scatterData = useMemo(
    () => rows.map((r) => ({ x: r.groundedness, y: r.relevance, outlier: r.groundedness < 3 || r.relevance < 3, row: r })),
    [rows],
  );

  const pageRows = rows.slice(page * perPage, (page + 1) * perPage);
  const pages = Math.ceil(rows.length / perPage);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-ink-mid hover:border-line-strong">
            <ArrowLeft size={13} /> Runs
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-semibold text-ink-hi">{run.id}</span>
              <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-ink-low">{run.target}</span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-ink-low">finished 12m ago · {run.rows} rows · {run.tokens} tokens · {run.cost}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCompare} className="flex items-center gap-1.5 rounded-md border border-azure/50 bg-azure/10 px-3 py-1.5 font-mono text-[12px] text-azure hover:bg-azure/20">
            <GitCompareArrows size={13} /> Compare
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-ink-mid hover:border-line-strong">
            <Download size={13} /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-ink-mid hover:border-line-strong">
            <RotateCw size={13} /> Re-run
          </button>
        </div>
      </div>

      {/* Aggregate cards */}
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((m, i) => <MetricStatCard key={m.label} m={m} i={i} />)}
      </div>

      {/* Charts row */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[10px] border border-line bg-bg-2 p-4">
          <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Score distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histData} barCategoryGap="20%">
              <XAxis dataKey="bin" tick={{ fill: "#5C6B7F", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#1E2532" }} tickLine={false} />
              <YAxis tick={{ fill: "#5C6B7F", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <RTooltip {...ttStyle} cursor={{ fill: "#161B26" }} />
              <Bar dataKey="groundedness" name="Groundedness" fill="#5B8CFF" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={500} />
              <Bar dataKey="relevance" name="Relevance" fill="#38E1C6" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-1 flex items-center gap-4 font-mono text-[10px] text-ink-low">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-azure" /> groundedness · mean 4.3</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-aegis" /> relevance · mean 4.6</span>
          </div>
        </div>
        <div className="rounded-[10px] border border-line bg-bg-2 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-low">Groundedness vs relevance (per row)</span>
            <span className="font-mono text-[10px] text-danger">red = outlier · click to inspect</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: 4, right: 8 }}>
              <CartesianGrid stroke="#1E2532" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={[1, 5]} name="groundedness" tick={{ fill: "#5C6B7F", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#1E2532" }} tickLine={false} />
              <YAxis type="number" dataKey="y" domain={[1, 5]} name="relevance" tick={{ fill: "#5C6B7F", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <RTooltip {...ttStyle} cursor={{ strokeDasharray: "3 3", stroke: "#2A3242" }} />
              <ReferenceLine y={4.6} stroke="#38E1C6" strokeDasharray="4 4" strokeOpacity={0.6} />
              <Scatter
                data={scatterData}
                isAnimationActive
                animationDuration={400}
                onClick={(d: unknown) => {
                  const p = d as { payload?: { row?: ResultRow } };
                  if (p?.payload?.row) setSelRow(p.payload.row);
                }}
              >
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.outlier ? "#F5586B" : "#5B8CFF"} fillOpacity={d.outlier ? 0.95 : 0.7} cursor="pointer" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-row table */}
      <div className="overflow-hidden rounded-[10px] border border-line bg-bg-2">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-bg-1 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Query</th>
              <th className="px-3 py-2.5">Response</th>
              <th className="px-3 py-2.5">Ground</th>
              <th className="px-3 py-2.5">Relev</th>
              <th className="px-3 py-2.5">Coher</th>
              <th className="px-3 py-2.5">Retr</th>
              <th className="px-3 py-2.5">Safety</th>
              <th className="px-3 py-2.5">Reason</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.n} onClick={() => setSelRow(r)} className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-bg-3">
                <td className="px-3 py-2 font-mono text-[12px] text-ink-low">{String(r.n).padStart(3, "0")}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-ink-mid">{r.query}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-ink-low">{r.response}</td>
                {([r.groundedness, r.relevance, r.coherence] as number[]).map((v, i) => (
                  <td key={i} className={cn("px-3 py-2 font-mono text-[12px]", scoreColor(v))}>{v.toFixed(1)}</td>
                ))}
                <td className={cn("px-3 py-2 font-mono text-[12px]", scoreColor(r.retrieval, 1))}>{r.retrieval.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <span className={cn("font-mono text-[11px]", r.safetyPass ? "text-aegis" : "text-danger")}>{r.safetyPass ? "PASS" : "FAIL"}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="group relative inline-flex">
                    <CircleAlert size={14} className="text-ink-low group-hover:text-azure" />
                    <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden w-64 rounded-md border border-line bg-bg-3 p-2 text-[11px] leading-snug text-ink-mid shadow-xl group-hover:block">
                      {r.reason}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-line px-3 py-2 font-mono text-[11px] text-ink-low">
          <span>{rows.length} rows · {perPage}/page</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={cn("rounded px-2 py-0.5", page === i ? "bg-aegis-dim/40 text-aegis" : "text-ink-low hover:text-ink-hi")}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row drawer */}
      <Drawer open={!!selRow} onClose={() => setSelRow(null)} title={selRow ? `row ${String(selRow.n).padStart(3, "0")} · ${run.id}` : ""}>
        {selRow && (
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">Query</div>
              <div className="rounded-md border border-line bg-bg-3 p-3 text-[13px] text-ink-hi">{selRow.query}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">Response</div>
              <div className="rounded-md border border-line bg-bg-3 p-3 text-[13px] leading-relaxed text-ink-mid">{selRow.response}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">Retrieved context</div>
              <div className="space-y-1.5">
                {CONTEXT_CHUNKS.map((c, i) => (
                  <div key={i} className="flex gap-2 rounded-md border border-line bg-bg-2 p-2.5 text-[12px] text-ink-mid">
                    <span className="shrink-0 font-mono text-[11px] text-azure">chunk {i + 1}</span>
                    {c}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low">Metric scores</div>
              <div className="space-y-2">
                {([
                  ["Groundedness", selRow.groundedness],
                  ["Relevance", selRow.relevance],
                  ["Coherence", selRow.coherence],
                ] as [string, number][]).map(([label, v]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="text-ink-mid">{label}</span>
                      <span className={cn("font-mono", scoreColor(v))}>{v.toFixed(1)}/5</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-3">
                      <motion.div
                        className={cn("h-full rounded-full", v >= 4 ? "bg-aegis" : v >= 3 ? "bg-warn" : "bg-danger")}
                        initial={{ width: 0 }}
                        animate={{ width: `${(v / 5) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
                <div className="rounded-md border border-line bg-bg-3 p-3 text-[12px] leading-relaxed text-ink-mid">
                  <span className="font-mono text-[11px] text-azure">judge reason · </span>{selRow.reason}
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-mono text-[11px] text-ink-low">
              <span>latency {selRow.latencyMs}ms</span>
              <span>{selRow.tokens} tokens</span>
              <span>judge: gpt-4o-judge</span>
            </div>
          </div>
        )}
      </Drawer>
    </motion.div>
  );
}
