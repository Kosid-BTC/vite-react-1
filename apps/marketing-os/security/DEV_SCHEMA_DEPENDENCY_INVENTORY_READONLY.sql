-- Development-only, read-only schema dependency inventory.
-- No tenant data, auth user records, secrets, or production writes.
-- Presence is NOT proof of semantic equivalence or successful migrations.
WITH required(name) AS (
 VALUES ('workspaces'),('workspace_members'),('workspace_state'),
        ('marketing_audience_segments'),('marketing_business_types'),
        ('marketing_segment_business_types')
), objects AS (
 SELECT r.name, to_regclass('public.'||r.name) AS oid FROM required r
), table_summary AS (
 SELECT o.name, o.oid IS NOT NULL AS exists_in_public,
        coalesce(c.relrowsecurity,false) AS rls_enabled,
        coalesce(c.relforcerowsecurity,false) AS force_rls,
        (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname='public' AND p.tablename=o.name) AS policy_count,
        (SELECT count(*) FROM pg_constraint k
         WHERE k.conrelid=o.oid AND k.contype='f') AS outgoing_fk_count,
        (SELECT count(*) FROM pg_constraint k
         WHERE k.confrelid=o.oid AND k.contype='f') AS incoming_fk_count
 FROM objects o LEFT JOIN pg_class c ON c.oid=o.oid
)
SELECT name,exists_in_public,rls_enabled,force_rls,
       policy_count,outgoing_fk_count,incoming_fk_count
FROM table_summary ORDER BY name;
