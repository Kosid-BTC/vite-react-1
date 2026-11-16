-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('generated-images', 'generated-images', false, 33554432, array['image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "org members read own generated images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'generated-images'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );
