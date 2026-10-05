import "server-only";
import { createSupabaseClient } from "./supabase";
import type { Country, Leader, Meeting, PairStat } from "./types";

// Only surface meetings on/after this date. Historical data (2008–2025 G20
// summits + pre-2026 bilaterals) stays in the DB but is hidden — set to null
// to show everything again.
export const ACTIVE_SINCE: string | null = "2026-01-01";

const MEETING_SELECT =
  "id,date,end_date,location_city,location_country_id,meeting_type,context,title_ko,title_en,summary,confidence,verification_status,source_type," +
  "meeting_participants(country_id,role,leader_id),agendas(topic_ko,topic_en,category),statements(title_ko,summary,key_points,source_url),sources(url,publisher,published_at)";

export async function getCountries(): Promise<Country[]> {
  const supabase = createSupabaseClient();
  const { data } = await supabase.from("countries").select("*").order("name_ko");
  return (data as Country[]) ?? [];
}

export async function getLeaders(): Promise<Leader[]> {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("leaders")
    .select("id,wikidata_id,name_ko,name_en,country_id,role");
  return (data as Leader[]) ?? [];
}

export async function getMeetings(): Promise<Meeting[]> {
  const supabase = createSupabaseClient();
  let q = supabase.from("meetings").select(MEETING_SELECT);
  if (ACTIVE_SINCE) q = q.gte("date", ACTIVE_SINCE);
  const { data } = await q.order("date", { ascending: false });
  return (data as unknown as Meeting[]) ?? [];
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Meeting) ?? null;
}

export async function getPairStats(): Promise<PairStat[]> {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("country_pair_stats")
    .select("*")
    .order("meeting_count", { ascending: false });
  return (data as PairStat[]) ?? [];
}
