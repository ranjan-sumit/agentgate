import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

// Lightweight JSON syntax coloring
function highlight(code: string, lang: string) {
  if (lang !== "json") return <span className="text-ink-mid">{code}</span>;
  const parts = code.split(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (/^".*":$/.test(p) || /^".*"\s*:$/.test(p.trim())) return <span key={i} className="text-azure">{p}</span>;
        if (/^"/.test(p)) return <span key={i} className="text-aegis">{p}</span>;
        if (/^\d/.test(p) || /^(true|false|null)/.test(p)) return <span key={i} className="text-warn">{p}</span>;
        return <span key={i} className="text-ink-mid">{p}</span>;
      })}
    </>
  );
}

export default function CodeBlock({
  code,
  lang = "json",
  tabs,
  className,
  maxHeight,
}: {
  code: string;
  lang?: string;
  tabs?: { label: string; code: string; lang: string }[];
  className?: string;
  maxHeight?: number;
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = tabs ? tabs[active] : { code, lang };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <div className={cn("overflow-hidden rounded-[10px] border border-line bg-bg-3", className)}>
      <div className="flex items-center justify-between border-b border-line bg-bg-2 px-3 py-1.5">
        <div className="flex gap-1">
          {tabs ? (
            tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActive(i)}
                className={cn(
                  "rounded px-2 py-0.5 font-mono text-[11px]",
                  i === active ? "bg-bg-3 text-aegis" : "text-ink-low hover:text-ink-mid",
                )}
              >
                {t.label}
              </button>
            ))
          ) : (
            <span className="font-mono text-[11px] text-ink-low">{lang}</span>
          )}
        </div>
        <button onClick={copy} className="text-ink-low hover:text-aegis" aria-label="Copy">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <pre
        className="overflow-auto p-3 font-mono text-[13px] leading-relaxed"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code>{highlight(current.code, current.lang)}</code>
      </pre>
    </div>
  );
}
