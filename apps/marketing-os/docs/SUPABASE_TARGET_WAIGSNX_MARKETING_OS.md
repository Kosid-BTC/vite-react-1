# Marketing OS Supabase target — Development Preview only

## Target
- Project ref: `waigsnxhrlwtiotspaim`
- API URL: `https://waigsnxhrlwtiotspaim.supabase.co`
- Postgres schema: `marketing_os`
- PostgreSQL 17.6.1, Singapore region
- Schema exists and contains 23 base tables; all 23 inspected tables have RLS enabled.

## Code and environment contract
- The server-side Marketing OS Supabase client selects `marketing_os`.
- The schema is allowlisted; any configured schema other than `marketing_os` fails closed.
- The example environment file documents the target URL and schema.
- Keep service-role credentials server-only; never place them in `NEXT_PUBLIC_*` variables.
- Middleware uses Supabase Auth only and does not query Marketing OS application tables.

## Required Vercel Preview variables
Configure only on the dedicated Development Preview branch:
- `NEXT_PUBLIC_SUPABASE_URL=https://waigsnxhrlwtiotspaim.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key for waigsnxhrlwtiotspaim>`
- `NEXT_PUBLIC_SUPABASE_SCHEMA=marketing_os`

Do not change Production environment variables in this PR.

## API and RLS preflight
Catalog checks found:
- All 23 tables in `marketing_os` have RLS enabled; FORCE RLS is false.
- `authenticated` has schema USAGE; `anon` does not.
- Four behavior tables have no authenticated table privileges and no RLS policies (fail-closed).
- `marketing_brand_rules`, `workspace_members`, and `workspaces` have authenticated SELECT only.
- Workspace policies call `marketing_os.is_workspace_member(uuid)`, a SECURITY DEFINER function owned by postgres with an empty search_path; it is executable by authenticated but not anon.
- The PostgREST exposed-schema setting could not be confirmed from the database session.

Before Preview E2E, confirm `marketing_os` is enabled in Supabase Data API exposed schemas. Do not grant `anon` access just to make the app work. Test all reads under authenticated end-user sessions and workspace RLS.

## Type safety
The existing repository-generated `Database` type describes the `public` schema, not `marketing_os`. The server client temporarily uses an explicit generic escape until a schema-specific type contract is generated and verified. This is a type-safety debt and blocks final acceptance; do not treat this change as fully production-ready.

## Out of scope
- No DDL, DML, migrations, grants, RLS changes, Auth/User DB reads, Storage or Edge Function changes.
- No cross-project application-data reads.
- No Production environment/database changes.
- No runtime acceptance until exact-SHA authenticated Preview, workspace isolation tests, and V4 visual acceptance pass.

## Current access limitation
The Vercel API denied permission to list the authoritative project's environment variables (HTTP 403). Therefore this PR does not claim Preview environment variables were inspected or changed, and no deployment was initiated.
