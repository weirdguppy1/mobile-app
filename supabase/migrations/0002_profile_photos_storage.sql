-- ================================================================
-- profile-photos storage bucket (private) + RLS.
-- Photos are private at the object layer: the owner and same-school
-- members may read; only the owner may write. The bucket is NOT public,
-- so the app serves images via short-lived signed URLs
-- (createPhotoSignedUrl() in src/features/profile/api.ts).
-- Object path convention: "<profile_id>/<filename>".
-- ================================================================

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

-- Read: the owner, or a same-school member who can view the profile
-- (mirrors the profile_photos row-level visibility enforced in 0001).
drop policy if exists "profile-photos read" on storage.objects;
drop policy if exists "profile-photos read visible profiles" on storage.objects;
create policy "profile-photos read visible profiles"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and exists (
      select 1
      from public.profile_photos pp
      where pp.url = storage.objects.name
        and pp.profile_id::text = (storage.foldername(storage.objects.name))[1]
        and public.can_view_profile(pp.profile_id)
    )
  );

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
