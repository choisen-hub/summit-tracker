export type Country = {
  id: string;
  name_ko: string;
  name_en: string;
  continent: string | null;
  is_g20: boolean;
  lat: number | null;
  lng: number | null;
  flag_emoji: string | null;
};

export type Leader = {
  id: string;
  wikidata_id: string | null;
  name_ko: string;
  name_en: string;
  country_id: string | null;
  role: string | null;
};

export type Participant = {
  country_id: string;
  role: "host" | "guest" | null;
  leader_id: string | null;
};

export type Agenda = { topic_ko: string; topic_en: string | null; category: string | null };

export type Statement = {
  title_ko: string | null;
  summary: string | null;
  key_points: string[] | null;
  source_url: string | null;
};

export type Source = { url: string | null; publisher: string | null; published_at: string | null };

export type Meeting = {
  id: string;
  date: string;
  end_date: string | null;
  location_city: string | null;
  location_country_id: string | null;
  meeting_type: string;
  context: string | null;
  title_ko: string | null;
  title_en: string | null;
  summary: string | null;
  confidence: number;
  verification_status: "unverified" | "auto_verified" | "human_verified";
  source_type: string;
  meeting_participants: Participant[];
  agendas: Agenda[];
  statements: Statement[];
  sources: Source[];
};

export type PairStat = {
  country_a: string;
  country_b: string;
  meeting_count: number;
  last_meeting_date: string | null;
};
