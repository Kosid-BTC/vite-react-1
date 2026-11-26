-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
create type script_style as enum ('informative', 'direct');

create function proof_points_ok(p jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) <= 6
     and not exists (
       select 1
       from jsonb_array_elements(p) as e
       where jsonb_typeof(e) <> 'object'
          or jsonb_typeof(e -> 'claim') is distinct from 'string'
          or jsonb_typeof(e -> 'source') is distinct from 'string'
          or length(btrim(e ->> 'claim')) = 0
          or length(e ->> 'claim') > 80
          or length(btrim(e ->> 'source')) = 0
          or length(e ->> 'source') > 200
     );
$$;

alter table channels
  add column script_style script_style not null default 'direct',
  add column proof_points jsonb not null default '[]'::jsonb
    constraint channels_proof_points_shape check (proof_points_ok(proof_points));

comment on column channels.script_style is
  'informative = เล่าให้เข้าใจ · direct = ชวนให้ลงมือ (ต้องมี proof_points ถึงจะพูดตัวเลขได้)';
comment on column channels.proof_points is
  'หลักฐานที่ช่องนี้อ้างได้ [{claim, source}] — โมเดลใช้ตัวเลขได้เฉพาะในรายการนี้';
