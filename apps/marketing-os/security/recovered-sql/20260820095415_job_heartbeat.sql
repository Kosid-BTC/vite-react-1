-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
create function heartbeat_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_service_role() then
    raise exception 'ส่งสัญญาณชีพได้จากฝั่ง server เท่านั้น';
  end if;

  update jobs
     set claimed_at = now()
   where id = p_job_id
     and status = 'claimed';
end;
$$;

revoke execute on function heartbeat_job(uuid) from public;
revoke execute on function heartbeat_job(uuid) from anon, authenticated;
grant execute on function heartbeat_job(uuid) to service_role;

comment on function heartbeat_job(uuid) is
  'worker เรียกระหว่างงานที่รันนาน เพื่อไม่ให้ถูกเข้าใจผิดว่าตาย (ดู pipeline_stuck_jobs)';
