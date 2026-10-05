import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { getCountries, getLeaders, getMeeting } from "@/lib/queries";
import { CATEGORY_KO, CATEGORY_COLOR, MEETING_TYPE_KO, VERIFICATION } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function MeetingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [meeting, countries, leaders] = await Promise.all([
    getMeeting(id),
    getCountries(),
    getLeaders(),
  ]);
  if (!meeting) notFound();

  const cIndex = new Map(countries.map((c) => [c.id, c]));
  const lIndex = new Map(leaders.map((l) => [l.id, l]));
  const v = VERIFICATION[meeting.verification_status];
  const host = meeting.location_country_id ? cIndex.get(meeting.location_country_id) : null;
  const participants = [...meeting.meeting_participants].sort((a, b) =>
    a.role === "host" ? -1 : b.role === "host" ? 1 : 0,
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/meetings" className="font-mono text-xs uppercase tracking-wider text-[var(--muted-ink)] hover:text-[var(--foreground)]">
          ← 회담
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--muted-ink)]">
          <span>{MEETING_TYPE_KO[meeting.meeting_type]}</span>
          <span>·</span>
          <span>{meeting.context}</span>
          <span className={`rounded-full border px-2 py-0.5 ${v.cls}`}>{v.label}</span>
          <span className="rounded-full border border-[var(--rule)] px-2 py-0.5">
            신뢰도 {Math.round(meeting.confidence * 100)}%
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{meeting.title_ko}</h1>
        {meeting.title_en && <p className="mt-1 font-mono text-sm text-[var(--muted-ink)]">{meeting.title_en}</p>}

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
          {[
            { k: "일자", v: meeting.date },
            { k: "장소", v: `${meeting.location_city ?? "—"}${host ? ` ${host.flag_emoji}` : ""}` },
            { k: "출처", v: meeting.source_type },
          ].map((row) => (
            <div key={row.k} className="bg-[var(--surface)] p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted-ink)]">{row.k}</dt>
              <dd className="mt-1 text-sm">{row.v}</dd>
            </div>
          ))}
        </dl>

        {meeting.summary && <p className="mt-6 text-[var(--muted-ink)]">{meeting.summary}</p>}

        {/* participants */}
        <section className="mt-10">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-ink)]">참가국 {participants.length}</h2>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const c = cIndex.get(p.country_id);
              const leader = p.leader_id ? lIndex.get(p.leader_id) : null;
              return (
                <div key={p.country_id} className="flex items-center gap-2 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2">
                  <span className="text-lg">{c?.flag_emoji}</span>
                  <div>
                    <div className="text-sm font-medium">{c?.name_ko}</div>
                    {leader && <div className="text-xs text-[var(--muted-ink)]">{leader.name_ko}</div>}
                  </div>
                  {p.role === "host" && (
                    <span className="ml-1 font-mono text-[9px] uppercase tracking-wider text-[var(--brass)]">host</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* agendas */}
        {meeting.agendas.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-ink)]">주요 어젠다</h2>
            <ul className="space-y-2">
              {meeting.agendas.map((a, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2">
                  {a.category && (
                    <span
                      className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white"
                      style={{ backgroundColor: CATEGORY_COLOR[a.category] ?? "#6A7386" }}
                    >
                      {CATEGORY_KO[a.category] ?? a.category}
                    </span>
                  )}
                  <span className="text-sm">{a.topic_ko}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* statements */}
        {meeting.statements.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-ink)]">공동성명 / 합의문</h2>
            {meeting.statements.map((s, i) => (
              <div key={i} className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-4">
                <div className="text-sm font-medium">{s.title_ko}</div>
                {s.summary && <p className="mt-1 text-sm text-[var(--muted-ink)]">{s.summary}</p>}
                {s.key_points && s.key_points.length > 0 && (
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--muted-ink)]">
                    {s.key_points.map((kp, j) => (
                      <li key={j}>{kp}</li>
                    ))}
                  </ul>
                )}
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-block font-mono text-xs text-[var(--brass)] hover:underline">
                    원문 →
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {/* sources */}
        {meeting.sources.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-ink)]">출처</h2>
            <ul className="space-y-1.5">
              {meeting.sources.map((s, i) => (
                <li key={i} className="text-sm">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-[var(--brass)] hover:underline">
                      {s.publisher ?? s.url}
                    </a>
                  ) : (
                    <span>{s.publisher}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
