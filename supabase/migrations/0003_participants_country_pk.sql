-- Allow country-level participation (multilateral summits are attributed at the
-- country level; the exact historical leader per year is resolved later).
-- Old PK (meeting_id, leader_id) forbade null leader_id — switch to a surrogate
-- key with a (meeting_id, country_id) uniqueness constraint.

drop view if exists country_pair_stats;
drop table if exists meeting_participants cascade;

create table meeting_participants (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references meetings(id) on delete cascade,
  leader_id   uuid references leaders(id),           -- optional: null when unresolved
  country_id  text not null references countries(id),
  role        text check (role in ('host','guest')),
  unique (meeting_id, country_id)
);
create index meeting_participants_meeting_idx on meeting_participants(meeting_id);
create index meeting_participants_leader_idx on meeting_participants(leader_id);
create index meeting_participants_country_idx on meeting_participants(country_id);

alter table meeting_participants enable row level security;
create policy "public read meeting_participants" on meeting_participants for select using (true);

-- Recreate the network-edge view (body unchanged from 0002).
create view country_pair_stats as
with pairs as (
  select
    mp1.meeting_id,
    least(mp1.country_id, mp2.country_id)    as country_a,
    greatest(mp1.country_id, mp2.country_id) as country_b
  from meeting_participants mp1
  join meeting_participants mp2
    on mp1.meeting_id = mp2.meeting_id
   and mp1.country_id < mp2.country_id
)
select
  p.country_a,
  p.country_b,
  count(*)    as meeting_count,
  max(m.date) as last_meeting_date
from pairs p
join meetings m on m.id = p.meeting_id
group by p.country_a, p.country_b;
