# Development Branch Parity Failure — 2026-11-16

Read-only verification of Production `bjozpwdtqbpwcxnqguka` against existing data-free branch `roprejhnhoaqlctltwfs` (`dev-marketing-mapping-attestation`, status `MIGRATIONS_FAILED`).

| Metric | Production | Development |
|---|---:|---:|
| Public tables | 44 | 17 |
| Views | 2 | 1 |
| Functions | 47 | 34 |
| SECURITY DEFINER functions | 42 | 31 |
| RLS policies | 96 | 24 |
| User-defined triggers | 8 | 7 |
| pg_depend rows for public functions | 91 | 71 |

Function aggregate fingerprints:
- Production `bc4e20c5b541594e5ed1ec8bf3a26128`
- Development `6fc86e9e9c0257c1ff2c01f0a0c0296b`

Missing public function signatures:
```
can_edit_workspace(uuid)
can_manage_workspace(uuid)
can_review_workspace(uuid)
ensure_default_workspace()
expand_marketing_behavior_batch()
is_member(uuid)
list_members(uuid)
marketing_content_ready(uuid,uuid)
receive_marketing_behavior(uuid,uuid,text,jsonb,text,text)
remove_member(uuid,uuid)
seed_ceo_ai_marketing_strategy(uuid)
set_member_role(uuid,uuid,text)
workspace_role_for(uuid)
```

Three present functions have identical body fingerprints but differing effective EXECUTE grants/definer metadata: `has_org_role(uuid,org_role[])`, `is_org_member(uuid)`, `is_service_role()`. Full permissions parity is **not** achieved.

**FAIL CLOSED**: This branch is not a valid test baseline. Do not run security regression or rollback against it. Do not run recovered migrations in arbitrary order. Do not merge security changes or alter Production.

Next: diagnose first migration failure; recover the 13 missing SQL bodies from versioned files or a schema-only dump, reconstruct a data-free isolated environment with correct dependency ordering, and rerun the entire inventory including exact function definitions and effective grants. Isolated branch may incur ongoing charges; evaluate and retire when no longer needed. Never copy Production data, Vault secrets, or embedded JWT.
