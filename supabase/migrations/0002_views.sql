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
