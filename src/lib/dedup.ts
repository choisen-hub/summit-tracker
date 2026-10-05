// Meeting de-duplication (see docs/DESIGN.md §8).
// The same meeting is reported by many sources, so we cluster by
// (date within ±1 day, participant country set, place).

/** Slug a city name for stable comparison ("Camp David" -> "camp-david"). */
function slugCity(city?: string | null): string {
  if (!city) return "";
  return city
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Location-independent signature: sorted country set + city.
 * Date proximity is checked separately in `isSameMeeting` so that meetings a
 * day apart still collide.
 */
export function meetingSignature(countryIds: string[], city?: string | null): string {
  const countries = [...new Set(countryIds.filter(Boolean))].sort();
  return `${countries.join("+")}|${slugCity(city)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Two candidate meetings are the same event if signatures match and dates are within ±1 day. */
export function isSameMeeting(
  a: { date: string | Date; countryIds: string[]; city?: string | null },
  b: { date: string | Date; countryIds: string[]; city?: string | null },
  dayWindow = 1,
): boolean {
  if (meetingSignature(a.countryIds, a.city) !== meetingSignature(b.countryIds, b.city)) {
    return false;
  }
  const diff = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime());
  return diff <= dayWindow * DAY_MS;
}

/** Deterministic cluster key stored on `meetings.dedup_key` (date floored to the day). */
export function dedupKey(date: string | Date, countryIds: string[], city?: string | null): string {
  const day = new Date(date).toISOString().slice(0, 10);
  return `${day}|${meetingSignature(countryIds, city)}`;
}
