-- Stable URL identity for multi-tenant Marketing OS routes.
begin;

alter table public.workspaces add column if not exists slug text;

update public.workspaces
set slug = 'ws-' || left(replace(id::text, '-', ''), 12)
where slug is null or btrim(slug) = '';

alter table public.workspaces alter column slug set not null;

create unique index if not exists workspaces_slug_uidx on public.workspaces(slug);

alter table public.workspaces
  drop constraint if exists workspaces_slug_format_check;

alter table public.workspaces
  add constraint workspaces_slug_format_check
  check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$');

commit;
