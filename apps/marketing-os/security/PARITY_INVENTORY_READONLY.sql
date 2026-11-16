-- READ ONLY. Run against Production and isolated test, export results as JSON/CSV and diff by object key.
-- Do not call this a PASS unless every row matches, including effective grants and function definitions.
select 'function' kind,p.oid::regprocedure::text key,
 md5(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,'')||coalesce(array_to_string(p.proconfig,';'),'')) fingerprint,
 jsonb_build_object('definer',p.prosecdef,'owner',pg_get_userbyid(p.proowner),'anon',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'service_role',has_function_privilege('service_role',p.oid,'EXECUTE')) detail
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
union all
select 'table',c.oid::regclass::text,
 md5(coalesce(c.relacl::text,'')||c.relrowsecurity::text||c.relforcerowsecurity::text),
 jsonb_build_object('rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner),'anon_select',has_table_privilege('anon',c.oid,'SELECT'),'authenticated_select',has_table_privilege('authenticated',c.oid,'SELECT'))
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')
union all
select 'view',c.oid::regclass::text,md5(pg_get_viewdef(c.oid,true)||coalesce(c.reloptions::text,'')||coalesce(c.relacl::text,'')),
 jsonb_build_object('owner',pg_get_userbyid(c.relowner),'options',c.reloptions)
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v'
union all
select 'policy',schemaname||'.'||tablename||':'||policyname,md5(row_to_json(p)::text),row_to_json(p)::jsonb
from pg_policies p where schemaname='public'
union all
select 'trigger',t.tgrelid::regclass::text||':'||t.tgname,md5(pg_get_triggerdef(t.oid)),jsonb_build_object('enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid))
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal
union all
select 'extension',e.extname,md5(e.extversion||n.nspname),jsonb_build_object('version',e.extversion,'schema',n.nspname)
from pg_extension e join pg_namespace n on n.oid=e.extnamespace
order by kind,key;
-- Also compare columns, constraints, indexes, type definitions, role membership, default privileges, dependency edges, storage policies and cron job metadata separately.
