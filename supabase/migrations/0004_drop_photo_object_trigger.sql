-- ================================================================
-- Drop the on_photo_deleted trigger / delete_photo_object() function.
--
-- That trigger deleted directly from storage.objects when a profile_photos
-- row was removed. Supabase's storage.protect_delete trigger now forbids
-- direct SQL deletes from storage tables ("Direct deletion from storage
-- tables is not allowed. Use the Storage API instead."), so EVERY delete of
-- a profile_photos row aborted with an error and silently failed in the app.
--
-- Storage-object cleanup is handled via the Storage API in the application
-- (removePhoto() in src/features/profile/api.ts) instead.
-- ================================================================

drop trigger if exists on_photo_deleted on public.profile_photos;
drop function if exists public.delete_photo_object();
