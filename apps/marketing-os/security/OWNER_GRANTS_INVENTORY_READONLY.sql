-- AUDIT ONLY: read-only, no customer rows, no secrets, no dynamic SQL.
-- Execute with a role that can inspect all relevant catalog metadata.
-- Store outputs as protected audit evidence; never publish raw inventory.
-- Inventory is an input to parity, NOT evidence of a successful restore.
-- Output columns: kind, object_key, fingerprint, detail.
WITH public_objects AS (
 SELECT 'table'::text AS kind, n.nspname||'.'||c.relname AS object_key,
        pg_get_userbyid(c.relowner) AS owner_name, c.relacl::text AS acl,
        jsonb_build_object('relkind',c.relkind,'rls',c.relrowsecurity,
          'force_rls',c.relforcerowsecurity,'acl',coalesce(c.relacl::text,'')) AS attrs
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')
 UNION ALL
 SELECT 'function',n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
        pg_get_userbyid(p.proowner),p.proacl::text,
        jsonb_build_object('definer',p.prosecdef,'acl',coalesce(p.proacl::text,''),
          'config',coalesce(array_to_string(p.proconfig,';'),''))
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
 UNION ALL
 SELECT 'schema',n.nspname,pg_get_userbyid(n.nspowner),n.nspacl::text,
        jsonb_build_object('acl',coalesce(n.nspacl::text,''))
 FROM pg_namespace n WHERE n.nspname='public'
)
SELECT kind,object_key,md5(owner_name||'|'||coalesce(acl,'')||'|'||attrs::text) AS fingerprint,
       jsonb_build_object('owner',owner_name,'attributes',attrs) AS detail
FROM public_objects
UNION ALL
SELECT 'column',n.nspname||'.'||c.relname||'.'||a.attname,
       md5(concat_ws('|',a.atttypid::regtype::text,a.atttypmod::text,
                     a.attnotnull::text,coalesce(pg_get_expr(d.adbin,d.adrelid),''))),
       jsonb_build_object('type',a.atttypid::regtype::text,'typmod',a.atttypmod,
          'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid))
FROM pg_attribute a
JOIN pg_class c ON c.oid=a.attrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
  AND a.attnum>0 AND NOT a.attisdropped
UNION ALL
SELECT 'index',n.nspname||'.'||i.relname,md5(pg_get_indexdef(i.oid)),
       jsonb_build_object('definition',pg_get_indexdef(i.oid))
FROM pg_class i JOIN pg_namespace n ON n.oid=i.relnamespace
WHERE n.nspname='public' AND i.relkind='i'
UNION ALL
SELECT 'constraint',n.nspname||'.'||c.relname||':'||k.conname,
       md5(pg_get_constraintdef(k.oid,true)),
       jsonb_build_object('definition',pg_get_constraintdef(k.oid,true))
FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
UNION ALL
SELECT 'default_acl',coalesce(n.nspname,'<global>')||':'||r.rolname||':'||d.defaclobjtype,
       md5(coalesce(d.defaclacl::text,'')),
       jsonb_build_object('role',r.rolname,'acl',coalesce(d.defaclacl::text,''))
FROM pg_default_acl d JOIN pg_roles r ON r.oid=d.defaclrole
LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
WHERE n.nspname='public' OR d.defaclnamespace=0
UNION ALL
SELECT 'role_membership',role.rolname||':'||member.rolname,
       md5(m.admin_option::text||'|'||m.inherit_option::text||'|'||m.set_option::text),
       jsonb_build_object('role',role.rolname,'member',member.rolname,
         'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option)
FROM pg_auth_members m JOIN pg_roles role ON role.oid=m.roleid
JOIN pg_roles member ON member.oid=m.member
WHERE role.rolname IN ('anon','authenticated','service_role','postgres','authenticator')
   OR member.rolname IN ('anon','authenticated','service_role','postgres','authenticator')
ORDER BY kind,object_key;
