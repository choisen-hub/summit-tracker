import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import NetworkGraph from "@/components/NetworkGraph";
import FrequencyChart from "@/components/FrequencyChart";
import { getCountries, getLeaders, getMeetings } from "@/lib/queries";
import { buildNetwork, meetingsPerMonth, topPairs } from "@/lib/aggregate";
import { MEETING_TYPE_KO } from "@/lib/labels";

export const dynamic = "force-dynamic";

function StatTile({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="bg-[var(--surface)] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted-ink)]">{k}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{v}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--muted-ink)]">{sub}</div>}
    </div>
  );
}

function SectionHead({ n, title, en }: { n: string; title: string; en?: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3 border-b border-[var(--rule)] pb-3">
      <span className="font-mono text-lg font-semibold text-[var(--brass)] tabular-nums">{n}</span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {en && <span className="font-mono text-xs text-[var(--muted-ink)]">{en}</span>}
    </div>
  );
}

export default async function Home() {
  const connected = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!connected) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-[var(--muted-ink)]">DB 미연결 — <code>.env.local</code> 설정 후 <code>npm run seed:all</code>.</p>
        </main>
      </>
    );
  }

  const [countries, leaders, meetings] = await Promise.all([
    getCountries(),
    getLeaders(),
    getMeetings(),
  ]);

  const { nodes, edges } = buildNetwork(meetings, countries);
  const monthly = meetingsPerMonth(meetings, 2026, 7);
  const pairs = topPairs(edges, countries, 8);
  const multi = meetings.filter((m) => m.meeting_type === "multilateral").length;
  const bilateral = meetings.length - multi;
  const cIndex = new Map(countries.map((c) => [c.id, c]));
  const recent = meetings.slice(0, 8);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* hero */}
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted-ink)]">
          <span className="text-[var(--brass)]">◆</span> 외교 인텔리전스 · G20 · 2026
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          국가정상 회담 데이터베이스
        </h1>
        <p className="mt-3 max-w-xl text-[var(--muted-ink)]">
          2026년 G20 정상 간의 만남을 관계망·빈도·어젠다로 정리합니다.
          <span className="mt-1 block text-sm">현재 <b>2026년(1–7월)</b>만 표시 중 · 과거 데이터는 비활성화</span>
        </p>

        {/* stat tiles */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-5">
          <StatTile k="총 회담" v={String(meetings.length)} sub="2026년" />
          <StatTile k="다자 정상회의" v={String(multi)} sub="G7 등" />
          <StatTile k="양자·소다자" v={String(bilateral)} />
          <StatTile k="참여국" v={String(nodes.length)} sub="양자 기준" />
          <StatTile k="기간" v="2026 H1" sub="1–7월" />
        </div>

        {/* network */}
        <section className="mt-14">
          <SectionHead n="01" title="관계 네트워크" en="bilateral ties" />
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-4 sm:p-6">
            {edges.length > 0 ? (
              <NetworkGraph nodes={nodes} edges={edges} />
            ) : (
              <p className="py-16 text-center text-[var(--muted-ink)]">양자 회담 데이터 없음 — <code>npm run seed:bilaterals</code></p>
            )}
            <p className="mt-3 text-center text-xs text-[var(--muted-ink)]">
              선 굵기 = 양자·소다자 정상회담 빈도. 국가에 마우스를 올리면 해당 관계만 강조됩니다. (대규모 다자회의 G20·G7 제외)
            </p>
          </div>
        </section>

        {/* frequency + top pairs */}
        <section className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHead n="02" title="월별 빈도" en="2026 monthly" />
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-4">
              <FrequencyChart data={monthly} />
            </div>
          </div>
          <div>
            <SectionHead n="03" title="주요 관계" en="top ties" />
            <ol className="space-y-1.5">
              {pairs.map((p, i) => (
                <li key={`${p.a}-${p.b}`} className="flex items-center gap-3 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-sm">
                  <span className="w-4 font-mono text-xs text-[var(--muted-ink)] tabular-nums">{i + 1}</span>
                  <span className="flex-1">
                    {p.aFlag} {p.aName} · {p.bFlag} {p.bName}
                  </span>
                  <span className="font-mono text-xs text-[var(--brass)] tabular-nums">{p.weight}회</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* leaders */}
        <section className="mt-14">
          <SectionHead n="04" title="G20 현 정상" en="incumbents" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {leaders
              .slice()
              .sort((a, b) => (a.country_id ?? "").localeCompare(b.country_id ?? ""))
              .map((l) => {
                const c = l.country_id ? cIndex.get(l.country_id) : null;
                return (
                  <div key={l.id} className="flex items-center gap-3 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5">
                    <span className="text-xl">{c?.flag_emoji}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{l.name_ko}</div>
                      <div className="truncate text-xs text-[var(--muted-ink)]">
                        {c?.name_ko} · {l.role}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* recent meetings */}
        <section className="mt-14">
          <SectionHead n="05" title="최근 회담" en="recent" />
          <ul className="divide-y divide-[var(--rule)] overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
            {recent.map((m) => (
              <li key={m.id}>
                <Link href={`/meetings/${m.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-2)]">
                  <span className="w-20 shrink-0 font-mono text-xs text-[var(--muted-ink)] tabular-nums">{m.date}</span>
                  <span className="flex shrink-0 gap-0.5 text-sm">
                    {[...new Set(m.meeting_participants.map((p) => p.country_id))]
                      .slice(0, 5)
                      .map((cid) => (
                        <span key={cid}>{cIndex.get(cid)?.flag_emoji}</span>
                      ))}
                    {new Set(m.meeting_participants.map((p) => p.country_id)).size > 5 && (
                      <span className="text-[var(--muted-ink)]">…</span>
                    )}
                  </span>
                  <span className="flex-1 truncate text-sm">{m.title_ko}</span>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-ink)] sm:block">
                    {MEETING_TYPE_KO[m.meeting_type]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-right">
            <Link href="/meetings" className="font-mono text-xs uppercase tracking-wider text-[var(--brass)] hover:underline">
              전체 회담 →
            </Link>
          </div>
        </section>

        <footer className="mt-16 flex flex-wrap justify-between gap-2 border-t-2 border-[var(--foreground)] pt-5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted-ink)]">
          <span>Summit Tracker · v0.1 · G20</span>
          <span className="text-[var(--brass)]">Phase 1–2 · 실데이터</span>
        </footer>
      </main>
    </>
  );
}
