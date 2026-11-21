-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
alter type video_format add value if not exists 'feature';

comment on type video_format is
  'long = ยาว 16:9 เขียนรวดเดียว · short = สั้น 9:16 · feature = ยาวพิเศษ 16:9 เขียนทีละท่อนตามโครง';
