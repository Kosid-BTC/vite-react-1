-- Recovered from Production catalog; audit only, review before replay
alter table video_generations add column idempotency_key text;

create unique index video_generations_idempotency_idx
  on video_generations (org_id, idempotency_key)
  where idempotency_key is not null;

comment on column video_generations.idempotency_key is
  'กันสั่งซ้ำ — client สร้างครั้งเดียวต่อการกดหนึ่งครั้ง · unique index บังคับที่ระดับฐานข้อมูล เพราะการเช็คก่อน insert มีช่องว่างให้สองคำขอพร้อมกันหลุดไปได้ทั้งคู่';
