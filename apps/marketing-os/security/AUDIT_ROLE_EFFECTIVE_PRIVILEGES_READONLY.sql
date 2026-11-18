-- AUDIT ONLY: execute under the EXACT credential used for schema capture.
-- No customer rows, no secrets, no DDL. Fail closed if any privilege is present.
WITH me AS (
 SELECT oid,rolname,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolreplication
 FROM pg_roles WHERE rolname=current_user
), objects AS (
 SELECT c.oid,c.relkind,c.relowner,n.nspname
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname NOT IN ('pg_catalog','information_schema')
 AND n.nspname NOT LIKE 'pg_toast%'
), functions AS (
 SELECT p.oid,p.proowner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname NOT IN ('pg_catalog','information_schema')
 AND n.nspname NOT LIKE 'pg_toast%'
), namespaces AS (
 SELECT oid,nspowner FROM pg_namespace
 WHERE nspname NOT IN ('pg_catalog','information_schema')
 AND nspname NOT LIKE 'pg_toast%'
), findings AS (
 SELECT 'role_flags' AS reason FROM me
 WHERE rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolreplication
 UNION ALL SELECT 'role_owner_or_member'
 FROM me JOIN pg_roles r ON r.oid<>me.oid
 WHERE (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolbypassrls OR r.rolreplication)
 AND pg_has_role(me.oid,r.oid,'MEMBER')
 UNION ALL SELECT 'object_ownership' FROM objects o,me
 WHERE pg_has_role(me.oid,o.relowner,'USAGE')
 UNION ALL SELECT 'function_ownership' FROM functions f,me
 WHERE pg_has_role(me.oid,f.proowner,'USAGE')
 UNION ALL SELECT 'schema_ownership' FROM namespaces n,me
 WHERE pg_has_role(me.oid,n.nspowner,'USAGE')
 UNION ALL SELECT 'table_write' FROM objects o
 WHERE o.relkind IN ('r','p','v','m','f')
 AND (has_table_privilege(o.oid,'INSERT') OR has_table_privilege(o.oid,'UPDATE')
      OR has_table_privilege(o.oid,'DELETE') OR has_table_privilege(o.oid,'TRUNCATE')
      OR has_table_privilege(o.oid,'REFERENCES') OR has_table_privilege(o.oid,'TRIGGER'))
 UNION ALL SELECT 'sequence_write' FROM objects o
 WHERE o.relkind='S' AND (has_sequence_privilege(o.oid,'UPDATE') OR has_sequence_privilege(o.oid,'USAGE'))
 UNION ALL SELECT 'schema_create' FROM namespaces n WHERE has_schema_privilege(n.oid,'CREATE')
 UNION ALL SELECT 'database_create_or_temp'
 WHERE has_database_privilege(current_database(),'CREATE')
 OR has_database_privilege(current_database(),'TEMPORARY')
 UNION ALL SELECT 'function_execute'
 FROM functions f WHERE has_function_privilege(f.oid,'EXECUTE')
)
SELECT current_user AS audit_role,
       session_user AS session_role,
       (SELECT count(*) FROM findings) AS violation_count,
       coalesce((SELECT string_agg(DISTINCT reason,', ' ORDER BY reason) FROM findings),'none') AS violation_categories,
       CASE WHEN EXISTS(SELECT 1 FROM findings) THEN 'FAIL' ELSE 'PASS' END AS decision;
