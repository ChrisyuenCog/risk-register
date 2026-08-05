import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProject } from "@/server/project";
import "./globals.css";

export const metadata: Metadata = {
  title: "RICAL System — Cognition Learning Group",
  description: "Risk, Issue, Change, Action & Lessons management",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const project = await getCurrentProject();
  return (
    <html lang="en">
      <body>
        <header className="bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-sm bg-white px-2 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Cognition Learning Group"
                  width={109}
                  height={37}
                  className="block"
                />
              </span>
              <span className="font-semibold tracking-tight text-lg">
                RICAL<span className="text-paper/60"> System</span>
              </span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline underline-offset-4">Dashboard</Link>
              <Link href="/risks" className="hover:underline underline-offset-4">Register</Link>
              <Link href="/risks/new" className="hover:underline underline-offset-4">New risk</Link>
              <Link href="/issues" className="hover:underline underline-offset-4">Issues</Link>
              <Link href="/changes" className="hover:underline underline-offset-4">Changes</Link>
              <Link href="/actions" className="hover:underline underline-offset-4">Actions</Link>
              <Link href="/lessons" className="hover:underline underline-offset-4">Lessons</Link>
              <Link href="/import" className="hover:underline underline-offset-4">Import</Link>
              <Link href="/activity" className="hover:underline underline-offset-4">Activity</Link>
              <Link href="/help" className="hover:underline underline-offset-4">Help</Link>
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
