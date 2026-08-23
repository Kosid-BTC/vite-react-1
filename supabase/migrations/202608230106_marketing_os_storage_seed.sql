-- CEO AI Marketing OS — Phase 1 Storage + Seed
begin;

insert into storage.buckets (id, name, public)
values ('marketing-assets', 'marketing-assets', false)
on conflict (id) do update set public = excluded.public;

-- Object paths must start with {workspace_id}/...
drop policy if exists marketing_assets_select on storage.objects;
create policy marketing_assets_select on storage.objects
for select to authenticated
using (
  bucket_id = 'marketing-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.is_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists marketing_assets_insert on storage.objects;
create policy marketing_assets_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'marketing-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.can_edit_workspace(((storage.foldername(name))[1])::uuid)
);

drop policy if exists marketing_assets_update on storage.objects;
create policy marketing_assets_update on storage.objects
for update to authenticated
using (
  bucket_id = 'marketing-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.can_edit_workspace(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'marketing-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and public.can_edit_workspace(((storage.foldername(name))[1])::uuid)
);

create or replace function public.seed_ceo_ai_marketing_strategy(p_workspace uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand uuid;
begin
  if not public.can_manage_workspace(p_workspace) then
    raise exception 'forbidden';
  end if;

  select id into v_brand
  from public.marketing_brands
  where workspace_id = p_workspace and name = 'CEO AI Thailand'
  limit 1;

  if v_brand is null then
    insert into public.marketing_brands(
      workspace_id, name, website_url, description, positioning, voice
    ) values (
      p_workspace,
      'CEO AI Thailand',
      'https://ceoaithailand.org',
      'AI-assisted business builder and marketing operating system for people starting and growing a business.',
      'ช่วยจากอยากมีธุรกิจ → ทดลองตลาด → ลูกค้าคนแรก → เติบโตอย่างเป็นระบบ',
      '{"language":"th","tone":"direct, practical, evidence-first"}'::jsonb
    ) returning id into v_brand;
  end if;

  insert into public.marketing_audience_segments(workspace_id, brand_id, code, name, description, evidence_status)
  values
    (p_workspace,v_brand,'employee','คนทำงานประจำที่ต้องการเริ่มธุรกิจ','ต้องการรายได้เพิ่มแต่มีเวลาและความเสี่ยงที่จำกัด','hypothesis'),
    (p_workspace,v_brand,'graduate','นักศึกษาจบใหม่ที่ต้องการเริ่มธุรกิจ','มีไอเดียหรือแรงจูงใจแต่ประสบการณ์และเงินทุนจำกัด','hypothesis'),
    (p_workspace,v_brand,'newbie','คนที่ต้องการเริ่มทำธุรกิจ','ต้องการเส้นทางจากไอเดียไปสู่การทดลองตลาดและลูกค้าคนแรก','hypothesis'),
    (p_workspace,v_brand,'growth','เจ้าของธุรกิจที่ต้องการเติบโต','กลุ่มรองสำหรับ margin, process, KPI และ scale','hypothesis'),
    (p_workspace,v_brand,'audit','ISO / Audit intent','Side-door สำหรับ search/trigger ด้านมาตรฐานและ compliance','hypothesis')
  on conflict (brand_id, code) do update
    set name = excluded.name, description = excluded.description;

  insert into public.marketing_message_pillars(workspace_id,brand_id,code,name,problem,promise,priority)
  values
    (p_workspace,v_brand,'start','Start a Business','อยากมีธุรกิจแต่ไม่รู้เริ่มตรงไหน','เปลี่ยนความตั้งใจเป็นแผนทดลองที่ทำได้',100),
    (p_workspace,v_brand,'side-income','Side Income','อยากเพิ่มรายได้แต่ไม่อยากเสี่ยงก้อนใหญ่','เริ่มเล็กและตรวจตลาดก่อนลงทุน',95),
    (p_workspace,v_brand,'validate','Validate Before Invest','ไม่รู้ว่าจะมีใครซื้อหรือไม่','ตรวจลูกค้าและสมมติฐานก่อนขยาย',90),
    (p_workspace,v_brand,'first-customer','First Customer','มีไอเดียแต่ยังไม่มีลูกค้าจริง','ออกแบบข้อเสนอเพื่อหาลูกค้าคนแรก',85),
    (p_workspace,v_brand,'money','Money','ขายได้แต่ไม่เห็นกำไรจริง','เข้าใจราคา ต้นทุน กำไร และจุดคุ้มทุน',75),
    (p_workspace,v_brand,'marketing','Marketing','ทำคอนเทนต์แต่ไม่รู้ว่าอะไรสร้างความสนใจ','วัดจาก evidence และปรับรอบถัดไป',70),
    (p_workspace,v_brand,'systemize','Systemize & Scale','ธุรกิจเริ่มโตแต่พึ่งเจ้าของมากเกินไป','เปลี่ยนงานซ้ำให้เป็น process, KPI และระบบ',60)
  on conflict (brand_id, code) do update
    set name=excluded.name, problem=excluded.problem, promise=excluded.promise, priority=excluded.priority;

  insert into public.marketing_brand_rules(workspace_id,brand_id,rule_type,severity,pattern,description)
  select p_workspace,v_brand,x.rule_type,x.severity,x.pattern,x.description
  from (values
    ('forbidden_claim','blocking','การันตี','ห้ามใช้คำรับประกันผลโดยไม่มีฐานทางกฎหมายและหลักฐาน'),
    ('forbidden_claim','blocking','อันดับ 1','ห้ามอ้างอันดับหนึ่งโดยไม่มีหลักฐานตรวจสอบได้'),
    ('forbidden_claim','blocking','ดีที่สุด','ห้ามใช้ superlative ที่ไม่มีหลักฐาน'),
    ('testimonial','blocking',null,'ห้ามสร้าง testimonial หรือ case success ที่ไม่มีลูกค้าจริงและหลักฐาน'),
    ('dark_pattern','blocking',null,'ห้าม fake urgency และ fake scarcity'),
    ('message','warning',null,'สำหรับ general traffic ห้ามใช้ ISO/Audit เป็นสารนำ'),
    ('evidence','blocking',null,'ห้ามใช้สถิติที่ไม่มี source/date/sample/methodology ที่ตรวจสอบได้')
  ) as x(rule_type,severity,pattern,description)
  where not exists (
    select 1 from public.marketing_brand_rules r
    where r.workspace_id=p_workspace and r.brand_id=v_brand and r.description=x.description
  );

  return v_brand;
end;
$$;

revoke all on function public.seed_ceo_ai_marketing_strategy(uuid) from public;
grant execute on function public.seed_ceo_ai_marketing_strategy(uuid) to authenticated;

commit;
