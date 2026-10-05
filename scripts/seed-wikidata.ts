// Phase 1 (Track A): import current G20 summit representatives from Wikidata.
// Presidential / semi-presidential systems are represented by the head of state
// (P35); parliamentary systems by the head of government (P6). The Wikidata QID
// is stored as leaders.wikidata_id (trust anchor); ko/en names seed aliases.
import "./load-env";
import { createAdminClient } from "../src/lib/supabase-admin";

// G20 country (ISO3) -> Wikidata QID
const QID: Record<string, string> = {
  ARG: "Q414", AUS: "Q408", BRA: "Q155", CAN: "Q16", CHN: "Q148",
  FRA: "Q142", DEU: "Q183", IND: "Q668", IDN: "Q252", ITA: "Q38",
  JPN: "Q17", MEX: "Q96", RUS: "Q159", SAU: "Q851", ZAF: "Q258",
  KOR: "Q884", TUR: "Q43", GBR: "Q145", USA: "Q30",
};

// Which office represents the country at summits: "hos" = head of state (P35),
// "hog" = head of government (P6).
const REP: Record<string, "hos" | "hog"> = {
  ARG: "hos", BRA: "hos", CHN: "hos", FRA: "hos", IDN: "hos", KOR: "hos",
  MEX: "hos", RUS: "hos", TUR: "hos", USA: "hos", ZAF: "hos",
  AUS: "hog", CAN: "hog", DEU: "hog", GBR: "hog", IND: "hog", ITA: "hog",
  JPN: "hog", SAU: "hog",
};

const ROLE_KO: Record<string, string> = {
  ARG: "대통령", BRA: "대통령", FRA: "대통령", IDN: "대통령", KOR: "대통령",
  MEX: "대통령", RUS: "대통령", TUR: "대통령", USA: "대통령", ZAF: "대통령",
  CHN: "국가주석",
  AUS: "총리", CAN: "총리", GBR: "총리", IND: "총리", ITA: "총리", JPN: "총리",
  DEU: "총리", SAU: "총리",
};

type Row = {
  country: { value: string };
  hos?: { value: string };
  hosLabel?: { value: string };
  hos_en?: { value: string };
  hog?: { value: string };
  hogLabel?: { value: string };
  hog_en?: { value: string };
};

async function sparql(query: string) {
  const res = await fetch(
    "https://query.wikidata.org/sparql?" +
      new URLSearchParams({ query, format: "json" }),
    { headers: { "User-Agent": "summit-tracker/0.1 (research)", Accept: "application/sparql-results+json" } },
  );
  if (!res.ok) throw new Error(`SPARQL ${res.status}`);
  return (await res.json()).results.bindings as Row[];
}

async function main() {
  const values = Object.values(QID).map((q) => `wd:${q}`).join(" ");
  // Fetch head of state (P35) + head of government (P6) with ko and en labels.
  const query = `
    SELECT ?country ?hos ?hosLabel ?hos_en ?hog ?hogLabel ?hog_en WHERE {
      VALUES ?country { ${values} }
      OPTIONAL { ?country wdt:P35 ?hos.
        ?hos rdfs:label ?hosLabel   FILTER(lang(?hosLabel)="ko")
        OPTIONAL { ?hos rdfs:label ?hos_en FILTER(lang(?hos_en)="en") } }
      OPTIONAL { ?country wdt:P6 ?hog.
        ?hog rdfs:label ?hogLabel   FILTER(lang(?hogLabel)="ko")
        OPTIONAL { ?hog rdfs:label ?hog_en FILTER(lang(?hog_en)="en") } }
    }`;
  const rows = await sparql(query);

  // country QID -> ISO3
  const iso: Record<string, string> = {};
  for (const [k, v] of Object.entries(QID)) iso[v] = k;

  // pick one row per country
  const byCountry = new Map<string, Row>();
  for (const r of rows) {
    const qid = r.country.value.split("/").pop()!;
    if (!byCountry.has(qid)) byCountry.set(qid, r);
  }

  const leaders: {
    wikidata_id: string;
    name_ko: string;
    name_en: string;
    country_id: string;
    role: string;
  }[] = [];

  for (const [qid, r] of byCountry) {
    const cid = iso[qid];
    if (!cid) continue;
    const useHos = REP[cid] === "hos";
    const personUrl = useHos ? r.hos?.value : r.hog?.value;
    const nameKo = useHos ? r.hosLabel?.value : r.hogLabel?.value;
    const nameEn = (useHos ? r.hos_en?.value : r.hog_en?.value) ?? nameKo;
    if (!personUrl || !nameKo) {
      console.warn(`⚠️  ${cid}: no ${REP[cid]} found, skipping`);
      continue;
    }
    leaders.push({
      wikidata_id: personUrl.split("/").pop()!,
      name_ko: nameKo,
      name_en: nameEn!,
      country_id: cid,
      role: ROLE_KO[cid] ?? "정상",
    });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leaders")
    .upsert(leaders, { onConflict: "wikidata_id" })
    .select("id, wikidata_id, name_ko, name_en");
  if (error) {
    console.error("❌ leaders upsert failed:", error.message);
    process.exit(1);
  }

  // Seed aliases (ko + en canonical names) for entity linking.
  const aliases: { leader_id: string; alias: string; lang: string }[] = [];
  for (const l of data!) {
    aliases.push({ leader_id: l.id, alias: l.name_ko, lang: "ko" });
    if (l.name_en && l.name_en !== l.name_ko)
      aliases.push({ leader_id: l.id, alias: l.name_en, lang: "en" });
  }
  const { error: aErr } = await supabase
    .from("leader_aliases")
    .upsert(aliases, { onConflict: "leader_id,alias" });
  if (aErr) console.warn("⚠️  aliases:", aErr.message);

  console.log(`✅ seeded ${data!.length} G20 leaders, ${aliases.length} aliases.`);
  for (const l of data!) console.log(`   ${l.wikidata_id}  ${l.name_ko}`);
}

main();
