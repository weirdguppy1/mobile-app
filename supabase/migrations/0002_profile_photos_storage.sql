-- ================================================================
-- profile-photos storage bucket + owner-scoped RLS.
-- 0001's delete_photo_object() trigger already deletes objects from
-- this bucket by name; this creates the bucket and write policies.
-- Object path convention: "<user_id>/<filename>".
-- ================================================================

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Public read (bucket is public; same-school visibility is enforced at the
-- profile_photos row level in 0001).
drop policy if exists "profile-photos read" on storage.objects;
create policy "profile-photos read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Owners (path prefix = their uid) may write/replace/delete their own files.
drop policy if exists "profile-photos insert own" on storage.objects;
create policy "profile-photos insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "profile-photos update own" on storage.objects;
create policy "profile-photos update own"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "profile-photos delete own" on storage.objects;
create policy "profile-photos delete own"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
