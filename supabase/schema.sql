-- Summit Tracker schema (0001 + 0002 combined) — paste into Supabase SQL Editor

-- Summit Tracker — core schema
-- See docs/DESIGN.md §3. Meetings <-> leaders is N:N (bilateral + multilateral),
-- meetings -> agendas/statements is 1:N. Every record carries provenance + confidence.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference: controlled vocabularies as check constraints (kept inline so the
-- schema stays single-file; promote to lookup tables if they start to churn).
-- meeting_type:        summit_bilateral | multilateral | phone_call | video_call | state_visit
-- source_type:         wikidata | official | news_llm | manual
-- verification_status: unverified | auto_verified | human_verified
-- participant role:    host | guest
-- agenda category:     security | trade | climate | tech | energy | health | culture | migration | other
-- ---------------------------------------------------------------------------

-- Countries -----------------------------------------------------------------
create table countries (
  id          text primary key,                 -- ISO 3166-1 alpha-3, e.g. KOR
  name_ko     text not null,
  name_en     text not null,
  continent   text,
  is_g20      boolean not null default false,    -- backfill priority flag
  lat         double precision,                  -- representative map coordinate
  lng         double precision,
  flag_emoji  text
);

-- Leaders -------------------------------------------------------------------
create table leaders (
  id           uuid primary key default gen_random_uuid(),
  wikidata_id  text unique,                      -- trust anchor for entity linking
  name_ko      text not null,
  name_en      text not null,
  country_id   text references countries(id),
  role         text,                             -- 대통령 / 총리 / 주석 ...
  term_start   date,
  term_end     date,                             -- null = incumbent
  photo_url    text,
  created_at   timestamptz not null default now()
);
create index leaders_country_idx on leaders(country_id);

-- Leader aliases (entity linking: 시진핑 / Xi Jinping / 習近平) ---------------
create table leader_aliases (
  leader_id  uuid not null references leaders(id) on delete cascade,
  alias      text not null,
  lang       text,
  primary key (leader_id, alias)
);
create index leader_aliases_alias_idx on leader_aliases(lower(alias));

-- Meetings ------------------------------------------------------------------
create table meetings (
  id                  uuid primary key default gen_random_uuid(),
  date                date not null,
  end_date            date,                       -- multi-day meetings
  location_city       text,
  location_country_id text references countries(id),
  meeting_type        text not null
    check (meeting_type in ('summit_bilateral','multilateral','phone_call','video_call','state_visit')),
  context             text,                       -- e.g. "G20 정상회의", "APEC"
  title_ko            text,
  title_en            text,
  summary             text,                       -- LLM-generated
  source_type         text not null default 'news_llm'
    check (source_type in ('wikidata','official','news_llm','manual')),
  confidence          real not null default 0.5
    check (confidence >= 0 and confidence <= 1),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','auto_verified','human_verified')),
  dedup_key           text,                       -- (date-window, participant-set, place) cluster id
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index meetings_date_idx on meetings(date desc);
create index meetings_type_idx on meetings(meeting_type);
create index meetings_verif_idx on meetings(verification_status);
create index meetings_dedup_idx on meetings(dedup_key);

-- Meeting participants (N:N — bilateral & multilateral in one shape) ---------
create table meeting_participants (
  meeting_id  uuid not null references meetings(id) on delete cascade,
  leader_id   uuid references leaders(id),
  country_id  text references countries(id),      -- country when leader is unresolved
  role        text check (role in ('host','guest')),
  primary key (meeting_id, leader_id)
);
create index meeting_participants_leader_idx on meeting_participants(leader_id);
create index meeting_participants_country_idx on meeting_participants(country_id);

-- Agendas -------------------------------------------------------------------
create table agendas (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references meetings(id) on delete cascade,
  topic_ko    text not null,
  topic_en    text,
  category    text check (category in
    ('security','trade','climate','tech','energy','health','culture','migration','other'))
);
create index agendas_meeting_idx on agendas(meeting_id);
create index agendas_category_idx on agendas(category);

-- Statements (joint communiqués / agreements) -------------------------------
create table statements (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references meetings(id) on delete cascade,
  title_ko    text,
  title_en    text,
  summary     text,
  key_points  jsonb,                              -- array of key clauses
  source_url  text,
  source_type text check (source_type in ('wikidata','official','news_llm','manual'))
);
create index statements_meeting_idx on statements(meeting_id);

-- Sources (one meeting can be reported by many articles) ---------------------
create table sources (
  id           uuid primary key default gen_random_uuid(),
  meeting_id   uuid not null references meetings(id) on delete cascade,
  url          text,
  publisher    text,
  published_at timestamptz,
  raw_excerpt  text
);
create index sources_meeting_idx on sources(meeting_id);

-- updated_at trigger --------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger meetings_set_updated_at
  before update on meetings
  for each row execute function set_updated_at();

-- Row Level Security --------------------------------------------------------
-- Public read for verified/curated data; writes go through the service role
-- (seed scripts + pipeline). Admin verification UI will use authenticated role.
alter table countries enable row level security;
alter table leaders enable row level security;
alter table leader_aliases enable row level security;
alter table meetings enable row level security;
alter table meeting_participants enable row level security;
alter table agendas enable row level security;
alter table statements enable row level security;
alter table sources enable row level security;

create policy "public read countries" on countries for select using (true);
create policy "public read leaders" on leaders for select using (true);
create policy "public read leader_aliases" on leader_aliases for select using (true);
create policy "public read meetings" on meetings for select using (true);
create policy "public read meeting_participants" on meeting_participants for select using (true);
create policy "public read agendas" on agendas for select using (true);
create policy "public read statements" on statements for select using (true);
create policy "public read sources" on sources for select using (true);


-- Summit Tracker — derived views for analytics (see docs/DESIGN.md §3.1)

-- Country-pair meeting stats — network graph edges.
-- Each meeting contributes every unordered pair of participating countries.
create or replace view country_pair_stats as
with pairs as (
  select
    mp1.meeting_id,
    least(mp1.country_id, mp2.country_id)    as country_a,
    greatest(mp1.country_id, mp2.country_id) as country_b
  from meeting_participants mp1
  join meeting_participants mp2
    on mp1.meeting_id = mp2.meeting_id
   and mp1.country_id < mp2.country_id
  where mp1.country_id is not null
    and mp2.country_id is not null
)
select
  p.country_a,
  p.country_b,
  count(*)          as meeting_count,
  max(m.date)       as last_meeting_date
from pairs p
join meetings m on m.id = p.meeting_id
group by p.country_a, p.country_b;

-- Agenda trends — (year, category) frequency for the trend chart.
create or replace view agenda_trends as
select
  extract(year from m.date)::int as year,
  a.category,
  count(*)                       as topic_count
from agendas a
join meetings m on m.id = a.meeting_id
where a.category is not null
group by 1, 2;

-- Leader activity — meeting count + distinct counterpart countries.
create or replace view leader_activity as
select
  l.id            as leader_id,
  l.name_ko,
  l.name_en,
  l.country_id,
  count(distinct mp.meeting_id) as meeting_count,
  count(distinct other.country_id) filter (
    where other.country_id is not null and other.country_id <> l.country_id
  ) as counterpart_countries,
  max(m.date)     as last_meeting_date
from leaders l
join meeting_participants mp on mp.leader_id = l.id
join meetings m on m.id = mp.meeting_id
left join meeting_participants other
  on other.meeting_id = mp.meeting_id and other.leader_id <> l.id
group by l.id, l.name_ko, l.name_en, l.country_id;
