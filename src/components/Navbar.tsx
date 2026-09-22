import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/gate", label: "Gate" },
  { to: "/policies", label: "Policies" },
  { to: "/redteam", label: "Red Team" },
  { to: "/evaluations", label: "Evaluations" },
  { to: "/observability", label: "Observability" },
  { to: "/integrations", label: "Docs" },
];

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <img src="/logo.svg" alt="AegisGate" width={size} height={size} />
      <span className="text-[15px] font-semibold tracking-tight text-ink-hi">AegisGate</span>
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 border-b border-line bg-bg-0/80 backdrop-blur-md transition-shadow",
        scrolled && "border-line-strong shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Link to="/"><Logo /></Link>
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn("text-[13px] transition-colors", isActive ? "text-aegis" : "text-ink-mid hover:text-ink-hi")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-ink-low hover:text-ink-hi" aria-label="GitHub">
            <Github size={16} />
          </a>
          <Link to="/integrations" className="hidden text-[13px] text-ink-mid hover:text-ink-hi sm:block">
            Sign in
          </Link>
          <Link
            to="/integrations"
            className="rounded-md border border-aegis/50 bg-aegis-dim/30 px-3.5 py-1.5 font-mono text-[12px] font-medium text-aegis transition-all hover:bg-aegis-dim/60 hover:shadow-[0_0_24px_rgba(56,225,198,0.15)]"
          >
            Get API key
          </Link>
        </div>
      </div>
    </header>
  );
}
