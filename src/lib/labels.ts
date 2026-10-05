// Human-readable labels + semantic colors (see dataviz: status color is separate
// from the brass accent, and always ships with a label, never color alone).

export const MEETING_TYPE_KO: Record<string, string> = {
  summit_bilateral: "양자 정상회담",
  multilateral: "다자 정상회의",
  phone_call: "정상 통화",
  video_call: "화상 정상회담",
  state_visit: "국빈 방문",
};

export const CATEGORY_KO: Record<string, string> = {
  security: "안보",
  trade: "경제·통상",
  climate: "기후",
  tech: "기술·디지털",
  energy: "에너지",
  health: "보건",
  culture: "문화",
  migration: "이주",
  other: "기타",
};

export type VerificationMeta = { label: string; cls: string };

// Confidence tiers -> status styling. Tailwind classes (semantic, not brass).
export const VERIFICATION: Record<string, VerificationMeta> = {
  human_verified: { label: "검증됨", cls: "text-emerald-700 border-emerald-600/40 bg-emerald-500/10 dark:text-emerald-300" },
  auto_verified: { label: "교차확인", cls: "text-amber-700 border-amber-600/40 bg-amber-500/10 dark:text-amber-300" },
  unverified: { label: "미검증", cls: "text-rose-700 border-rose-600/40 bg-rose-500/10 dark:text-rose-300" },
};

export const CATEGORY_COLOR: Record<string, string> = {
  security: "#A9503F",
  trade: "#8A5E24",
  climate: "#2F7A5C",
  tech: "#3E5C8A",
  energy: "#9A7420",
  health: "#7A5C8A",
  culture: "#5A6577",
  migration: "#6A7386",
  other: "#8B96AC",
};
