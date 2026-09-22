import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Marketing layout — children pattern (App.tsx wraps routes as children).
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg-0 text-ink-hi">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
