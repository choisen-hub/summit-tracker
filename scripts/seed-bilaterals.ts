// Phase 1 (Track A): curated set of well-known bilateral / plurilateral summits
// among G20 members (+ PRK/UKR). Without these the network is uniform (every G20
// pair meets at every annual summit); these give varied edge weights so the
// relationship graph and frequency analysis are meaningful.
//
// Dates are approximate opening dates of documented summits; curated seed data
// (source_type 'manual', confidence 0.7). The daily news pipeline refines these.
import "./load-env";
import { createAdminClient } from "../src/lib/supabase-admin";
import { COUNTRIES } from "../src/data/countries";
import { dedupKey } from "../src/lib/dedup";

type Bi = {
  date: string;
  cityKo: string;
  host: string;              // ISO3 (venue country)
  countries: string[];       // participating countries (ISO3)
  titleKo: string;
  type?: "summit_bilateral" | "multilateral";
  agendas: { topic_ko: string; category: string }[];
};

const BILATERALS: Bi[] = [
  { date: "2018-04-27", cityKo: "판문점", host: "KOR", countries: ["KOR", "PRK"], titleKo: "2018 남북정상회담 (판문점)", agendas: [{ topic_ko: "한반도 비핵화·평화체제", category: "security" }] },
  { date: "2018-06-12", cityKo: "싱가포르", host: "IDN", countries: ["USA", "PRK"], titleKo: "북미정상회담 (싱가포르)", agendas: [{ topic_ko: "비핵화·체제안전보장", category: "security" }] },
  { date: "2018-09-18", cityKo: "평양", host: "PRK", countries: ["KOR", "PRK"], titleKo: "2018 남북정상회담 (평양)", agendas: [{ topic_ko: "군사적 긴장완화·경제협력", category: "security" }] },
  { date: "2019-02-27", cityKo: "하노이", host: "IDN", countries: ["USA", "PRK"], titleKo: "북미정상회담 (하노이)", agendas: [{ topic_ko: "비핵화 로드맵·제재", category: "security" }] },
  { date: "2019-06-30", cityKo: "판문점", host: "KOR", countries: ["USA", "PRK", "KOR"], titleKo: "판문점 북미 회동", type: "multilateral", agendas: [{ topic_ko: "대화 재개", category: "security" }] },
  { date: "2021-06-16", cityKo: "제네바", host: "FRA", countries: ["USA", "RUS"], titleKo: "미러정상회담 (제네바)", agendas: [{ topic_ko: "전략적 안정성·사이버", category: "security" }] },
  { date: "2022-02-04", cityKo: "베이징", host: "CHN", countries: ["CHN", "RUS"], titleKo: "중러정상회담 (베이징)", agendas: [{ topic_ko: "전략적 협력 '한계 없는 우정'", category: "security" }] },
  { date: "2022-05-21", cityKo: "서울", host: "KOR", countries: ["USA", "KOR"], titleKo: "한미정상회담 (서울)", agendas: [{ topic_ko: "동맹 강화·공급망", category: "trade" }] },
  { date: "2022-11-14", cityKo: "발리", host: "IDN", countries: ["USA", "CHN"], titleKo: "미중정상회담 (발리)", agendas: [{ topic_ko: "경쟁 관리·대만", category: "security" }] },
  { date: "2023-03-20", cityKo: "모스크바", host: "RUS", countries: ["CHN", "RUS"], titleKo: "중러정상회담 (모스크바)", agendas: [{ topic_ko: "우크라이나·경제협력", category: "trade" }] },
  { date: "2023-04-06", cityKo: "베이징", host: "CHN", countries: ["FRA", "CHN"], titleKo: "프중정상회담 (베이징)", agendas: [{ topic_ko: "우크라이나·교역", category: "trade" }] },
  { date: "2023-04-26", cityKo: "워싱턴 D.C.", host: "USA", countries: ["USA", "KOR"], titleKo: "한미정상회담 (국빈방문)", agendas: [{ topic_ko: "확장억제·첨단기술", category: "security" }] },
  { date: "2023-08-18", cityKo: "캠프데이비드", host: "USA", countries: ["USA", "JPN", "KOR"], titleKo: "한미일 정상회의 (캠프데이비드)", type: "multilateral", agendas: [{ topic_ko: "3국 안보협력 제도화", category: "security" }] },
  { date: "2023-11-15", cityKo: "샌프란시스코", host: "USA", countries: ["USA", "CHN"], titleKo: "미중정상회담 (샌프란시스코)", agendas: [{ topic_ko: "군사대화 복원·펜타닐", category: "security" }] },
  { date: "2024-05-16", cityKo: "베이징", host: "CHN", countries: ["RUS", "CHN"], titleKo: "러중정상회담 (베이징)", agendas: [{ topic_ko: "전략협력 심화", category: "trade" }] },
  { date: "2024-07-08", cityKo: "모스크바", host: "RUS", countries: ["IND", "RUS"], titleKo: "인러정상회담 (모스크바)", agendas: [{ topic_ko: "에너지·방산 협력", category: "energy" }] },
];

async function main() {
  const supabase = createAdminClient();
  const iso = new Set(COUNTRIES.map((c) => c.id));

  await supabase.from("meetings").delete().eq("context", "양자·소다자 정상회담");

  let nM = 0, nP = 0, nA = 0;
  for (const b of BILATERALS) {
    const bad = b.countries.filter((c) => !iso.has(c));
    if (bad.length) { console.warn(`skip ${b.titleKo}: unknown ${bad}`); continue; }

    const { data: m, error } = await supabase
      .from("meetings")
      .insert({
        date: b.date,
        location_city: b.cityKo,
        location_country_id: b.host,
        meeting_type: b.type ?? "summit_bilateral",
        context: "양자·소다자 정상회담",
        title_ko: b.titleKo,
        source_type: "manual",
        confidence: 0.7,
        verification_status: "auto_verified",
        dedup_key: dedupKey(b.date, b.countries, b.cityKo),
      })
      .select("id")
      .single();
    if (error || !m) { console.error(b.titleKo, error?.message); continue; }
    nM++;

    const parts = b.countries.map((cid) => ({
      meeting_id: m.id,
      country_id: cid,
      role: cid === b.host ? "host" : "guest",
    }));
    const { error: pErr } = await supabase.from("meeting_participants").insert(parts);
    if (!pErr) nP += parts.length;

    const ag = b.agendas.map((a) => ({ meeting_id: m.id, ...a }));
    const { error: aErr } = await supabase.from("agendas").insert(ag);
    if (!aErr) nA += ag.length;
  }
  console.log(`✅ seeded ${nM} bilateral/plurilateral summits · ${nP} participants · ${nA} agendas.`);
}

main();
