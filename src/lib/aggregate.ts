import type { Country, Meeting } from "./types";

// Large multilateral forums (G20 = 19, G7 = ~10) are excluded from the bilateral
// network: everyone attends, so they'd form a dense uniform clique that drowns
// out real bilateral signal. Small plurilaterals (≤ this many) are kept.
const NETWORK_MAX_PARTICIPANTS = 5;

export type NetNode = { id: string; name_ko: string; flag: string; count: number };
export type NetEdge = { a: string; b: string; weight: number; lastDate: string };

/**
 * Relationship network from bilateral / small-plurilateral summits only.
 * Large forums (G20 annual, G7) are excluded so the graph reflects actual
 * bilateral diplomacy rather than a uniform clique.
 */
export function buildNetwork(meetings: Meeting[], countries: Country[]) {
  const cIndex = new Map(countries.map((c) => [c.id, c]));
  const edges = new Map<string, NetEdge>();
  const nodeCount = new Map<string, number>();

  for (const m of meetings) {
    const ids = [...new Set(m.meeting_participants.map((p) => p.country_id))].sort();
    if (ids.length > NETWORK_MAX_PARTICIPANTS) continue;
    for (const id of ids) nodeCount.set(id, (nodeCount.get(id) ?? 0) + 1);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}|${ids[j]}`;
        const e = edges.get(key);
        if (e) {
          e.weight++;
          if (m.date > e.lastDate) e.lastDate = m.date;
        } else {
          edges.set(key, { a: ids[i], b: ids[j], weight: 1, lastDate: m.date });
        }
      }
    }
  }

  const nodes: NetNode[] = [...nodeCount.entries()]
    .map(([id, count]) => ({
      id,
      name_ko: cIndex.get(id)?.name_ko ?? id,
      flag: cIndex.get(id)?.flag_emoji ?? "",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return { nodes, edges: [...edges.values()].sort((a, b) => b.weight - a.weight) };
}

/** Meetings per month within a given year (for a single-year view). */
export function meetingsPerMonth(meetings: Meeting[], year: number, throughMonth = 12): { label: string; count: number }[] {
  const byMonth = new Map<number, number>();
  for (const m of meetings) {
    const d = new Date(m.date);
    if (d.getFullYear() === year) byMonth.set(d.getMonth() + 1, (byMonth.get(d.getMonth() + 1) ?? 0) + 1);
  }
  const out: { label: string; count: number }[] = [];
  for (let mo = 1; mo <= throughMonth; mo++) out.push({ label: `${mo}월`, count: byMonth.get(mo) ?? 0 });
  return out;
}

/** Meetings per calendar year (all meeting types). */
export function meetingsPerYear(meetings: Meeting[]): { year: number; count: number }[] {
  const byYear = new Map<number, number>();
  for (const m of meetings) {
    const y = new Date(m.date).getFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  const years = [...byYear.keys()];
  if (years.length === 0) return [];
  const min = Math.min(...years);
  const max = Math.max(...years);
  const out: { year: number; count: number }[] = [];
  for (let y = min; y <= max; y++) out.push({ year: y, count: byYear.get(y) ?? 0 });
  return out;
}

export function topPairs(edges: NetEdge[], countries: Country[], n = 8) {
  const cIndex = new Map(countries.map((c) => [c.id, c]));
  return edges.slice(0, n).map((e) => ({
    ...e,
    aName: cIndex.get(e.a)?.name_ko ?? e.a,
    bName: cIndex.get(e.b)?.name_ko ?? e.b,
    aFlag: cIndex.get(e.a)?.flag_emoji ?? "",
    bFlag: cIndex.get(e.b)?.flag_emoji ?? "",
  }));
}
