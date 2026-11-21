-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
alter table videos
  add column render_total smallint check (render_total > 0),
  add column render_done  smallint not null default 0 check (render_done >= 0),
  add column render_started_at timestamptz;

alter table videos
  add constraint videos_render_progress_sane
  check (render_total is null or render_done <= render_total);

comment on column videos.render_total is 'จำนวนช่วงที่ต้องเรนเดอร์ทั้งหมด (1 = ไม่ได้แบ่ง)';
comment on column videos.render_done is 'จำนวนช่วงที่เรนเดอร์เสร็จแล้ว';
comment on column videos.render_started_at is 'เวลาที่เริ่มเรนเดอร์ — ใช้ประมาณเวลาที่เหลือ';
