import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATALOG } from "./data";

const TYPE_COLORS: Record<string, string> = {
  builtin: "text-azure border-azure/40",
  composite: "text-aegis border-aegis/40",
  custom: "text-violet border-violet/40",
};

export default function CatalogDrawer({
  open,
  onClose,
  added,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  added: string[];
  onAdd: (name: string) => void;
}) {
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = CATALOG.map((g) => ({
    ...g,
    entries: g.entries.filter(
      (e) => !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.desc.toLowerCase().includes(q.toLowerCase()),
    ),
  })).filter((g) => g.entries.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col border-l border-line bg-bg-1"
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-low">Evaluator catalog</span>
              <button onClick={onClose} className="text-ink-low hover:text-ink-hi" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="border-b border-line p-3">
              <div className="flex items-center gap-2 rounded-md border border-line bg-bg-3 px-3 py-2">
                <Search size={13} className="text-ink-low" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search evaluators…"
                  className="w-full bg-transparent text-[13px] text-ink-hi placeholder:text-ink-low focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {groups.map((g) => {
                const isClosed = collapsed[g.family];
                return (
                  <div key={g.family} className="mb-2 overflow-hidden rounded-[10px] border border-line bg-bg-2">
                    <button
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                      onClick={() => setCollapsed((c) => ({ ...c, [g.family]: !c[g.family] }))}
                    >
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-mid">{g.family}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-ink-low">{g.entries.length}</span>
                        <ChevronDown size={14} className={cn("text-ink-low transition-transform", isClosed && "-rotate-90")} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {!isClosed && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          {g.entries.map((e) => {
                            const isAdded = added.includes(e.name);
                            return (
                              <div key={e.name} className="flex items-start justify-between gap-3 border-t border-line px-3 py-2.5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-medium text-ink-hi">{e.name}</span>
                                    <span className={cn("rounded border px-1.5 py-px font-mono text-[10px]", TYPE_COLORS[e.type])}>
                                      {e.type}
                                    </span>
                                    {e.type === "composite" && (
                                      <span className="rounded bg-aegis-dim/30 px-1.5 py-px font-mono text-[10px] text-aegis">curated</span>
                                    )}
                                  </div>
                                  <div className="mt-0.5 text-[12px] text-ink-low">{e.desc}</div>
                                  {e.create && (
                                    <button className="mt-1 font-mono text-[11px] text-azure hover:underline">{e.create} →</button>
                                  )}
                                </div>
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => onAdd(e.name)}
                                  disabled={isAdded}
                                  className={cn(
                                    "mt-0.5 flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px]",
                                    isAdded
                                      ? "cursor-default border-aegis/40 bg-aegis/10 text-aegis"
                                      : "border-line text-ink-mid hover:border-aegis/50 hover:text-aegis",
                                  )}
                                >
                                  <Plus size={11} /> {isAdded ? "Added" : "Add"}
                                </motion.button>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
