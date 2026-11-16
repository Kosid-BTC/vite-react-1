-- RECOVERED FROM Production supabase_migrations.schema_migrations, 2026-11-16
-- AUDIT ONLY: do not replay automatically; review dependencies, data writes and security before use.
do $$
declare
  target_workspace_id uuid;
  target_brand_id uuid;
begin
  select w.id
    into strict target_workspace_id
  from public.workspaces w
  where w.slug = 'ceo-ai-thailand';

  select b.id
    into strict target_brand_id
  from public.marketing_brands b
  where b.workspace_id = target_workspace_id
    and b.name = 'CEO AI Thailand';

  insert into public.marketing_audience_segments (
    workspace_id,
    brand_id,
    code,
    name,
    description,
    evidence_status,
    active
  )
  values (
    target_workspace_id,
    target_brand_id,
    'seller',
    'เจ้าของที่มีของขายแล้ว แต่ลูกค้าหาไม่เจอ',
    'Pain: การถูกค้นพบและเข้าถึงลูกค้า แตกต่างจาก growth ซึ่งเน้นการเติบโตอย่างมีระบบและลดการพึ่งพาเจ้าของ',
    'hypothesis',
    true
  )
  on conflict (brand_id, code) do update
  set
    workspace_id = excluded.workspace_id,
    name = excluded.name,
    description = excluded.description,
    evidence_status = excluded.evidence_status,
    active = excluded.active,
    updated_at = now();
end
$$;
