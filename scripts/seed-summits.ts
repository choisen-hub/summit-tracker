// Phase 1 (Track A): seed the annual G20 leaders' summits (2008–2025).
// Each summit is a multilateral meeting attended by all G20 members (attributed
// at country level), with era-appropriate agenda categories and the adopted
// Leaders' Declaration. Curated + factual -> source_type 'manual', verified.
import "./load-env";
import { createAdminClient } from "../src/lib/supabase-admin";
import { COUNTRIES } from "../src/data/countries";
import { dedupKey } from "../src/lib/dedup";

const G20 = COUNTRIES.filter((c) => c.is_g20).map((c) => c.id);

type Summit = {
  date: string;
  cityKo: string;
  cityEn: string;
  host: string; // ISO3
  virtual?: boolean;
};

// Approximate opening dates; hosts span all 19 G20 country members.
const SUMMITS: Summit[] = [
  { date: "2008-11-15", cityKo: "워싱턴 D.C.", cityEn: "Washington, D.C.", host: "USA" },
  { date: "2009-04-02", cityKo: "런던", cityEn: "London", host: "GBR" },
  { date: "2009-09-24", cityKo: "피츠버그", cityEn: "Pittsburgh", host: "USA" },
  { date: "2010-06-26", cityKo: "토론토", cityEn: "Toronto", host: "CAN" },
  { date: "2010-11-11", cityKo: "서울", cityEn: "Seoul", host: "KOR" },
  { date: "2011-11-03", cityKo: "칸", cityEn: "Cannes", host: "FRA" },
  { date: "2012-06-18", cityKo: "로스카보스", cityEn: "Los Cabos", host: "MEX" },
  { date: "2013-09-05", cityKo: "상트페테르부르크", cityEn: "Saint Petersburg", host: "RUS" },
  { date: "2014-11-15", cityKo: "브리즈번", cityEn: "Brisbane", host: "AUS" },
  { date: "2015-11-15", cityKo: "안탈리아", cityEn: "Antalya", host: "TUR" },
  { date: "2016-09-04", cityKo: "항저우", cityEn: "Hangzhou", host: "CHN" },
  { date: "2017-07-07", cityKo: "함부르크", cityEn: "Hamburg", host: "DEU" },
  { date: "2018-11-30", cityKo: "부에노스아이레스", cityEn: "Buenos Aires", host: "ARG" },
  { date: "2019-06-28", cityKo: "오사카", cityEn: "Osaka", host: "JPN" },
  { date: "2020-11-21", cityKo: "리야드", cityEn: "Riyadh", host: "SAU", virtual: true },
  { date: "2021-10-30", cityKo: "로마", cityEn: "Rome", host: "ITA" },
  { date: "2022-11-15", cityKo: "발리", cityEn: "Bali", host: "IDN" },
  { date: "2023-09-09", cityKo: "뉴델리", cityEn: "New Delhi", host: "IND" },
  { date: "2024-11-18", cityKo: "리우데자네이루", cityEn: "Rio de Janeiro", host: "BRA" },
  { date: "2025-11-22", cityKo: "요하네스버그", cityEn: "Johannesburg", host: "ZAF" },
];

type Agenda = { topic_ko: string; category: string };

// Recurring G20 agendas, layered by era (COVID health 2020–22, AI/digital &
// geopolitics 2022+). Kept high-level to stay factual.
function agendasFor(year: number): Agenda[] {
  const items: Agenda[] = [
    { topic_ko: "세계 경제·거시정책 공조", category: "trade" },
    { topic_ko: "기후변화·에너지 전환", category: "climate" },
  ];
  if (year >= 2020 && year <= 2022) items.push({ topic_ko: "코로나19 대응·글로벌 보건", category: "health" });
  if (year >= 2022) items.push({ topic_ko: "지정학 긴장·식량 안보", category: "security" });
  if (year >= 2023) items.push({ topic_ko: "디지털 전환·AI 거버넌스", category: "tech" });
  return items;
}

async function main() {
  const supabase = createAdminClient();

  // Idempotency: clear previous G20-summit rows (cascades to children).
  await supabase.from("meetings").delete().eq("context", "G20 정상회의");

  let nMeetings = 0, nParts = 0, nAgendas = 0, nStatements = 0;

  for (const s of SUMMITS) {
    const year = new Date(s.date).getFullYear();
    const hostKo = COUNTRIES.find((c) => c.id === s.host)?.name_ko ?? s.host;

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        date: s.date,
        location_city: s.cityKo,
        location_country_id: s.host,
        meeting_type: "multilateral",
        context: "G20 정상회의",
        title_ko: `${year} ${s.cityKo} G20 정상회의`,
        title_en: `${year} G20 ${s.cityEn} Summit`,
        summary: `${year}년 ${hostKo} ${s.cityKo}에서 열린 제${SUMMITS.indexOf(s) + 1}차 G20 정상회의${s.virtual ? " (화상)" : ""}.`,
        source_type: "manual",
        confidence: 0.9,
        verification_status: "human_verified",
        dedup_key: dedupKey(s.date, G20, s.cityKo),
      })
      .select("id")
      .single();
    if (error || !meeting) {
      console.error(`❌ ${year} ${s.cityKo}:`, error?.message);
      continue;
    }
    nMeetings++;

    const participants = G20.map((cid) => ({
      meeting_id: meeting.id,
      country_id: cid,
      role: cid === s.host ? "host" : "guest",
    }));
    const { error: pErr, count: pCount } = await supabase
      .from("meeting_participants")
      .insert(participants, { count: "exact" });
    if (pErr) console.warn(`  participants ${year}:`, pErr.message);
    else nParts += pCount ?? participants.length;

    const agendas = agendasFor(year).map((a) => ({ meeting_id: meeting.id, ...a }));
    const { error: aErr } = await supabase.from("agendas").insert(agendas);
    if (!aErr) nAgendas += agendas.length;

    const { error: sErr } = await supabase.from("statements").insert({
      meeting_id: meeting.id,
      title_ko: `${year} ${s.cityKo} 정상선언`,
      title_en: `${s.cityEn} Leaders' Declaration`,
      summary: "정상선언문(Leaders' Declaration) 채택.",
      key_points: agendasFor(year).map((a) => a.topic_ko),
      source_type: "official",
    });
    if (!sErr) nStatements++;
  }

  console.log(
    `✅ seeded ${nMeetings} G20 summits · ${nParts} participants · ${nAgendas} agendas · ${nStatements} statements.`,
  );
}

main();
