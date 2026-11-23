-- Recovered from Production supabase_migrations.schema_migrations (2026-11-16).
-- Guarded source-control restoration for Development reproducibility.
-- This migration MUST NOT create a workspace or brand. If either prerequisite is
-- absent, it records a NOTICE and leaves the seller hypothesis absent. A later
-- owner-attested seed must be a separate, explicit operation.
-- If duplicate canonical workspace/brand rows exist, fail closed.
--
-- Production already records version 20261116014116. Do not replay it in
-- Production. Remote Development replay is blocked until backup integrity,
-- PostgreSQL 17 isolated restore, rollback parity and audit-identity gates pass.

do $$
declare
  target_workspace_id uuid;
  target_brand_id uuid;
  workspace_matches bigint;
  brand_matches bigint;
begin
  select count(*)
    into workspace_matches
  from public.workspaces w
  where w.slug = 'ceo-ai-thailand';

  if workspace_matches = 0 then
    raise notice 'seller hypothesis seed skipped: workspace slug ceo-ai-thailand not found; no workspace or brand rows created';
  elsif workspace_matches > 1 then
    raise exception 'seller hypothesis seed blocked: expected exactly one workspace with slug ceo-ai-thailand, found %', workspace_matches;
  else
    select w.id
      into target_workspace_id
    from public.workspaces w
    where w.slug = 'ceo-ai-thailand';

    select count(*)
      into brand_matches
    from public.marketing_brands b
    where b.workspace_id = target_workspace_id
      and b.name = 'CEO AI Thailand';

    if brand_matches = 0 then
      raise notice 'seller hypothesis seed skipped: brand CEO AI Thailand not found in canonical workspace; no brand row created';
    elsif brand_matches > 1 then
      raise exception 'seller hypothesis seed blocked: expected exactly one CEO AI Thailand brand in workspace %, found %', target_workspace_id, brand_matches;
    else
      select b.id
        into target_brand_id
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
    end if;
  end if;
end
$$;
