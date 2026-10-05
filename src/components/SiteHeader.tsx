import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-[var(--rule)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-semibold tracking-tight">Summit&nbsp;Tracker</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brass)]">G20</span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-[0.1em] text-[var(--muted-ink)]">
          <Link href="/" className="hover:text-[var(--foreground)]">대시보드</Link>
          <Link href="/meetings" className="hover:text-[var(--foreground)]">회담</Link>
        </nav>
      </div>
    </header>
  );
}
