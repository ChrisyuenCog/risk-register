import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiskRegister",
  description: "Governed, auditable project risk management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-baseline gap-6">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              Risk<span className="text-paper/60">Register</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline underline-offset-4">Dashboard</Link>
              <Link href="/risks" className="hover:underline underline-offset-4">Register</Link>
              <Link href="/risks/new" className="hover:underline underline-offset-4">New risk</Link>
              <Link href="/issues" className="hover:underline underline-offset-4">Issues</Link>
              <Link href="/import" className="hover:underline underline-offset-4">Import</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink/50">
          Phase 1 — core register. Scoring per docs/SCORING.md; every change is audit-logged.
        </footer>
      </body>
    </html>
  );
}
