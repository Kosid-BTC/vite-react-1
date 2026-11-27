# Marketing OS Supabase target — Development Preview only

## Approved target
- Supabase project ref: `waigsnxhrlwtiotspaim`
- Project API URL: `https://waigsnxhrlwtiotspaim.supabase.co`
- Postgres schema: `marketing_os`
- PostgreSQL: 17.6.1, Singapore region
- Target schema currently contains 23 tables; all inspected tables have RLS enabled.

## Application changes
- The Marketing OS server-side Supabase client selects `marketing_os` as its PostgREST schema.
- The schema is allowlisted: any configured value other than `marketing_os` fails closed.
- `.env.example` documents the target URL and schema.
- No service-role key is added to browser-facing configuration. The service-role placeholder remains server-only and empty.
- Middleware continues to use Supabase Auth only; it does not read Marketing OS application tables.

## Required Preview environment
Set these variables on the authoritative Vercel project for the dedicated Development Preview branch only:
- `NEXT_PUBLIC_SUPABASE_URL=https://waigsnxhrlwtiotspaim.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase publishable key for this project>`
- `NEXT_PUBLIC_SUPABASE_SCHEMA=marketing_os`

Do not update Production environment variables as part of this change.

## Database API readiness — not yet accepted
Catalog checks confirmed:
- `marketing_os` exists with 23 base tables.
- RLS is enabled on all 23 tables.
- `authenticated` has schema USAGE; `anon` does not.
- The four behavior tables have no authenticated table privileges and no RLS policies (fail-closed).
- `marketing_brand_rules` has authenticated SELECT only.
- `workspace_members` and `workspaces` have authenticated SELECT only.
- The PostgREST exposed-schema setting could not be verified from the database session.

Before authenticated Preview E2E, the project owner must confirm `marketing_os` is listed in Supabase Data API exposed schemas. Do not grant `anon` schema/table access merely to make the UI work. Validate all application reads against authenticated user sessions and workspace RLS.

## Explicitly out of scope
- No DDL, DML, migration, policy, grant, Auth, Storage, or Edge Function changes.
- No cross-project reads or CEO website User/Auth database integration.
- No Production environment or Production database changes.
- No claim of runtime acceptance until Preview has been deployed from the exact PR SHA and authenticated workspace tests pass.

## Current limitations
Vercel API denied access to list the authoritative project's environment variables (HTTP 403). Therefore the branch-specific Preview variables have not been inspected or changed. No deployment has been initiated.
