-- ================================================================
-- Server-side onboarding completion gate.
-- Clients may edit profile fields directly (column-scoped UPDATE grant
-- in 0003), but onboarding_complete can only be flipped by
-- complete_onboarding() after all invariants are validated in one
-- transaction.
-- ================================================================

create or replace function public.prevent_direct_onboarding_complete_update()
returns trigger
language plpgsql
as $$
begin
  if new.onboarding_complete is distinct from old.onboarding_complete
     and coalesce(current_setting('app.complete_onboarding', true), '') <> 'true' then
    raise exception 'onboarding_complete can only be changed through complete_onboarding()';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_direct_onboarding_complete_update on public.profiles;
create trigger profiles_prevent_direct_onboarding_complete_update
  before update of onboarding_complete on public.profiles
  for each row execute function public.prevent_direct_onboarding_complete_update();

create or replace function public.complete_onboarding(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  prompt_count integer;
  photo_count integer;
begin
  if target_profile_id <> (select auth.uid()) then
    raise exception 'cannot complete onboarding for another profile';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  select count(*)
  into prompt_count
  from public.profile_prompts
  where profile_prompts.profile_id = target_profile_id;

  select count(*)
  into photo_count
  from public.profile_photos
  where profile_photos.profile_id = target_profile_id;

  if nullif(btrim(profile_row.first_name), '') is null
     or nullif(btrim(profile_row.university), '') is null
     or profile_row.graduation_year is null
     or coalesce(cardinality(profile_row.majors), 0) < 1
     or profile_row.sex_assigned_at_birth is null
     or profile_row.sexual_orientation is null
     or profile_row.sleep_schedule is null
     or profile_row.bedtime is null
     or profile_row.wakeup_time is null
     or profile_row.cleanliness is null
     or profile_row.noise_preference is null
     or profile_row.study_style is null
     or profile_row.guests_frequency is null
     or profile_row.romantic_guests_frequency is null
     or profile_row.social_level is null
     or profile_row.room_temperature is null
     or profile_row.alcohol is null
     or profile_row.smoking is null
     or profile_row.parties is null
     or profile_row.fitness is null
     or coalesce(cardinality(profile_row.interests), 0) < 5
     or profile_row.deal_breakers is null
     or prompt_count < 1
     or photo_count < 1 then
    raise exception 'profile is incomplete';
  end if;

  perform set_config('app.complete_onboarding', 'true', true);

  update public.profiles
  set onboarding_complete = true
  where id = target_profile_id;
end;
$$;

revoke all on function public.complete_onboarding(uuid) from public;
grant execute on function public.complete_onboarding(uuid) to authenticated;
