import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  mono?: boolean;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export default function DataTable<T extends object>({
  columns,
  rows,
  onRowClick,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const col = columns.find((c) => c.key === sort.key)!;
        const av = col.sortValue ? col.sortValue(a) : String(col.render(a));
        const bv = col.sortValue ? col.sortValue(b) : String(col.render(b));
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      })
    : rows;

  return (
    <div className={cn("overflow-hidden rounded-[10px] border border-line bg-bg-2", className)}>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line bg-bg-1">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-ink-low",
                  c.sortable && "cursor-pointer select-none hover:text-ink-mid",
                )}
                onClick={() =>
                  c.sortable &&
                  setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))
                }
              >
                <span className="inline-flex items-center gap-1">
                  {c.header}
                  {c.sortable && <ArrowUpDown size={11} className="opacity-50" />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className={cn("h-10 border-b border-line/60 last:border-0 hover:bg-bg-3", onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 text-ink-mid", c.mono && "font-mono text-[12px]", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
