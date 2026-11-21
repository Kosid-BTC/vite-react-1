-- Marketing OS development-only audit credential preflight (READ ONLY).
-- Run as the EXACT credential intended for the schema audit, never as postgres,
-- service_role, or a role with BYPASSRLS. Do not use this result to approve
-- cross-project reads, schema restores, or production changes.
-- A PASS here is necessary, NOT sufficient: verify secret metadata, backup,
-- isolated restore, SQL semantic parity, and authenticated tenant A/B separately.
WITH principal AS (
  SELECT current_user AS audit_user, session_user AS login_user
), role_closure AS (
  -- MEMBER includes roles the principal may SET ROLE into, not just
  -- currently inherited grants; fail closed for privileged membership.
  SELECT r.rolname, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
         r.rolbypassrls, r.rolreplication
  FROM pg_roles r CROSS JOIN principal p
  WHERE pg_has_role(p.audit_user, r.oid, 'MEMBER')
     OR pg_has_role(p.login_user, r.oid, 'MEMBER')
), dangerous_tables AS (
  SELECT n.nspname, c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND c.relkind IN ('r','p','v','m','f')
    AND (
      has_table_privilege(c.oid, 'INSERT')
      OR has_table_privilege(c.oid, 'UPDATE')
      OR has_table_privilege(c.oid, 'DELETE')
      OR has_table_privilege(c.oid, 'TRUNCATE')
      OR has_table_privilege(c.oid, 'REFERENCES')
      OR has_table_privilege(c.oid, 'TRIGGER')
    )
), dangerous_schemas AS (
  SELECT n.nspname FROM pg_namespace n
  WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND has_schema_privilege(n.oid, 'CREATE')
), checks AS (
  SELECT p.audit_user, p.login_user,
         current_setting('row_security') = 'on' AS row_security_on,
         p.audit_user = p.login_user AS same_session_principal,
         NOT EXISTS (
           SELECT 1 FROM role_closure
           WHERE rolsuper OR rolcreatedb OR rolcreaterole
              OR rolbypassrls OR rolreplication
         ) AS no_privileged_role_or_membership,
         NOT EXISTS (SELECT 1 FROM dangerous_tables) AS no_table_write_grants,
         NOT EXISTS (SELECT 1 FROM dangerous_schemas) AS no_schema_create_grants,
         NOT pg_has_role(p.audit_user, 'service_role', 'MEMBER')
           AS not_service_role
  FROM principal p
)
SELECT audit_user, login_user, row_security_on, same_session_principal,
       no_privileged_role_or_membership, no_table_write_grants,
       no_schema_create_grants, not_service_role,
       (row_security_on AND same_session_principal
        AND no_privileged_role_or_membership AND no_table_write_grants
        AND no_schema_create_grants AND not_service_role) AS audit_preflight_pass
FROM checks;
