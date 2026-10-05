import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getCountries, getMeetings } from "@/lib/queries";
import { MEETING_TYPE_KO, VERIFICATION } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const [countries, meetings] = await Promise.all([getCountries(), getMeetings()]);
  const cIndex = new Map(countries.map((c) => [c.id, c]));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted-ink)]">All records</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">회담 {meetings.length}건</h1>

        <ul className="mt-8 divide-y divide-[var(--rule)] overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
          {meetings.map((m) => {
            const v = VERIFICATION[m.verification_status];
            const cids = [...new Set(m.meeting_participants.map((p) => p.country_id))];
            return (
              <li key={m.id}>
                <Link href={`/meetings/${m.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-[var(--surface-2)]">
                  <span className="w-24 shrink-0 font-mono text-xs text-[var(--muted-ink)] tabular-nums">{m.date}</span>
                  <span className="flex shrink-0 gap-0.5 text-sm">
                    {cids.slice(0, 6).map((cid) => (
                      <span key={cid} title={cIndex.get(cid)?.name_ko}>{cIndex.get(cid)?.flag_emoji}</span>
                    ))}
                    {cids.length > 6 && <span className="text-[var(--muted-ink)]">+{cids.length - 6}</span>}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{m.title_ko}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted-ink)]">
                    {MEETING_TYPE_KO[m.meeting_type]}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${v.cls}`}>{v.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
