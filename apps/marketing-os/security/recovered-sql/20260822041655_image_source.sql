-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
create type image_source as enum ('pexels', 'generated');

alter table channels
  add column image_source image_source not null default 'pexels';

comment on column channels.image_source is
  'pexels = ค้นภาพสต็อก (ฟรี ชนโควตา 200/ชม.) · generated = ให้ AI วาด (เสียเงินต่อภาพ)';

alter table video_assets
  alter column photographer drop not null,
  alter column source_url  drop not null;

alter table video_assets
  add constraint video_assets_pexels_needs_credit
  check (
    provider <> 'pexels'
    or (photographer is not null and source_url is not null)
  );

comment on constraint video_assets_pexels_needs_credit on video_assets is
  'ภาพจาก Pexels ต้องมีเครดิตช่างภาพเสมอ — เป็นข้อสัญญาที่ให้ไว้ตอนขอ API key';
