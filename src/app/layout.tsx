import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProject } from "@/server/project";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiskRegister",
  description: "Governed, auditable project risk management",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const project = await getCurrentProject();
  return (
    <html lang="en">
      <body>
        <header className="bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-5">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Cognition Learning Group"
                className="h-9 w-auto rounded-sm bg-white px-1.5 py-1"
              />
              <span className="font-semibold tracking-tight text-lg">
                Risk<span className="text-paper/60">Register</span>
              </span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline underline-offset-4">Dashboard</Link>
              <Link href="/risks" className="hover:underline underline-offset-4">Register</Link>
              <Link href="/risks/new" className="hover:underline underline-offset-4">New risk</Link>
              <Link href="/issues" className="hover:underline underline-offset-4">Issues</Link>
              <Link href="/import" className="hover:underline underline-offset-4">Import</Link>
            </nav>
            <Link
              href="/projects"
              className="ml-auto text-sm text-paper/80 hover:text-paper hover:underline underline-offset-4"
              title="Switch or create projects"
            >
              {project.name} ▾
            </Link>
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
