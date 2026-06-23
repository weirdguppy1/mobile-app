-- ================================================================
-- 0003 · TRIGGERS — bind the functions from 0002 to their tables
-- ================================================================


-- ----------------------------------------------------------------
-- auth.users
-- ----------------------------------------------------------------

-- Create a profile when a new auth user is inserted.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reject email changes.
drop trigger if exists on_auth_user_email_updated on auth.users;
drop trigger if exists prevent_auth_email_change on auth.users;
create trigger prevent_auth_email_change
  before update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.prevent_email_change();


-- ----------------------------------------------------------------
-- profiles  (BEFORE UPDATE fire alphabetically: lock_identity →
-- prevent_direct_onboarding_complete → set_updated_at → uncomplete)
-- ----------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_lock_identity on public.profiles;
create trigger profiles_lock_identity
  before update on public.profiles
  for each row execute function public.lock_profile_identity();

drop trigger if exists profiles_prevent_direct_onboarding_complete_update on public.profiles;
create trigger profiles_prevent_direct_onboarding_complete_update
  before update of onboarding_complete on public.profiles
  for each row execute function public.prevent_direct_onboarding_complete_update();

drop trigger if exists profiles_uncomplete_if_required_fields_missing on public.profiles;
create trigger profiles_uncomplete_if_required_fields_missing
  before update on public.profiles
  for each row execute function public.uncomplete_profile_if_required_fields_missing();


-- ----------------------------------------------------------------
-- profile_photos
-- ----------------------------------------------------------------

drop trigger if exists profile_photos_validate_object on public.profile_photos;
create trigger profile_photos_validate_object
  before insert or update on public.profile_photos
  for each row execute function public.validate_profile_photo_object();

drop trigger if exists profile_photos_uncomplete_if_required_count_missing on public.profile_photos;
create trigger profile_photos_uncomplete_if_required_count_missing
  before update or delete on public.profile_photos
  for each row execute function public.uncomplete_profile_if_required_child_count_missing();


-- ----------------------------------------------------------------
-- profile_prompts
-- ----------------------------------------------------------------

drop trigger if exists profile_prompts_uncomplete_if_required_count_missing on public.profile_prompts;
create trigger profile_prompts_uncomplete_if_required_count_missing
  before update or delete on public.profile_prompts
  for each row execute function public.uncomplete_profile_if_required_child_count_missing();


-- ----------------------------------------------------------------
-- likes
-- ----------------------------------------------------------------

-- Reciprocated like → match.
drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute function public.handle_like();


-- ----------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------

drop trigger if exists messages_lock_content on public.messages;
create trigger messages_lock_content
  before update on public.messages
  for each row execute function public.lock_message_content();
