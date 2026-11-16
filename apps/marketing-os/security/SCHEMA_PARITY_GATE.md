# Marketing OS Supabase schema parity — fail-closed gate

Status: **BLOCKED — no Production security change authorized until all checks PASS.**

Production project: `bjozpwdtqbpwcxnqguka`. Baseline observed 2026-11-16:
- public: 44 tables, 2 views, 47 functions, **42 SECURITY DEFINER**.
- 26 SECURITY DEFINER functions were reported by Security Advisor as executable by `authenticated`; do not conflate 26 with all 42.
- `pg_net` 0.20.4 in public.
- `supabase_migrations.schema_migrations`: 47 entries, most recent `20261116014321_harden_and_extend_ceo_ai_marketing_strategy_seed`.
- Repository `supabase/migrations` on main has 44 files; filename/version comparison is incomplete, and may differ due to alternate migration locations. **Do not mark migrations reconstructed based on filenames alone.**

## Requirements before any production DDL
1. Recover **actual SQL bodies** for missing migrations from trusted Git history/CI artifacts or a schema-only dump; migration names alone are NOT executable reconstruction. Compare current schema, not just migration names. Do not commit live secrets, credentials, Vault contents, OAuth tokens, or customer data.
2. Reconstruct isolated database, install matching extensions, schemas, types, tables, views, constraints, indexes, triggers, grants, RLS and policies, and all 47 functions. Validate `SECURITY DEFINER=42`.
3. For all 47 functions compare normalized `pg_get_functiondef`, identity arguments, owner, `prosecdef`, `proconfig`, ACL and effective EXECUTE for `anon`, `authenticated`, `service_role`; for all 26 flagged functions compare full definitions and effective grants against Production. Match fingerprints, never manually invent missing bodies.
4. Compare triggers, policies, table/column grants, extension versions, and dependency graph. Use synthetic identities and tenant fixtures only. Ensure the negative cases: anon, non-member authenticated, cross-tenant authenticated, member, owner/admin, service role.
5. In isolated environment apply one narrowly scoped migration, run positive/negative authorization regression, then rollback and re-check every fingerprint and grant. Record evidence.
6. Production changes only if parity, security regression, rollback and deployment gates all PASS; separate review of actual SQL diff and backup/restore point.

## Read-only parity inventory SQL (run separately on Production and test)
```sql
select count(*) as total_functions,
       count(*) filter (where p.prosecdef) as security_definer
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public';

select p.oid::regprocedure::text as signature,
       md5(pg_get_functiondef(p.oid)) as definition_md5,
       p.prosecdef,
       pg_get_userbyid(p.proowner) as owner,
       p.proconfig,
       p.proacl::text as acl,
       has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
order by signature;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname='public'
order by tablename,policyname;

select event_object_schema,event_object_table,trigger_name,action_timing,event_manipulation,action_statement
from information_schema.triggers where event_object_schema='public'
order by event_object_table,trigger_name;

select e.extname,e.extversion,n.nspname as schema
from pg_extension e join pg_namespace n on n.oid=e.extnamespace order by e.extname;
```

## Observed blocker and cost guardrail
A prior ephemeral branch had **zero** public SECURITY DEFINER functions and was deleted; it cannot serve as regression evidence. No new billable branch should be left running unattended. Prior authorization was up to 8h at US$0.01344/hour; verify whether that authorization remains applicable before a new charge. This audit branch is documentation only.

**Current status:** Migration recovery INCOMPLETE; isolated environment NOT CREATED; parity NOT PASS; regression NOT RUN; rollback NOT RUN; Production unchanged.
