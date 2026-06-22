-- ================================================================
-- Migration-layer security hardening for already-deployed databases.
--
-- This is the forward upgrade path for databases that already ran
-- 0002/0003/0005/0006 before the storage bucket, onboarding integrity,
-- and prompt-write grants were tightened.
-- ================================================================


-- ================================================================
-- 1. profile-photos storage must be private on existing buckets.
-- ================================================================

-- 0002 originally inserted the bucket with ON CONFLICT DO NOTHING, so an
-- existing bucket that was created as public=true would not be corrected by
-- editing that historical migration. Force the deployed bucket private here.
update storage.buckets
set public = false
where id = 'profile-photos';

-- Drop known/likely public-read policies for this bucket while avoiding the
-- newer authenticated, same-school read policy recreated below.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select p.polname
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and p.polcmd in ('r', '*')
      and (
        p.polname = 'profile-photos read'
        or (
          p.polname ilike '%public%'
          and coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%profile-photos%'
        )
      )
  loop
    execute format('drop policy if exists %I on storage.objects', policy_name);
  end loop;
end;
$$;

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


-- ================================================================
-- 2. Completed onboarding must fall closed when required data is lost.
-- ================================================================

create or replace function public.profile_required_fields_complete(profile_row public.profiles)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    nullif(btrim((profile_row).first_name), '') is not null
    and nullif(btrim((profile_row).university), '') is not null
    and (profile_row).graduation_year is not null
    and coalesce(cardinality((profile_row).majors), 0) >= 1
    and (profile_row).sex_assigned_at_birth is not null
    and (profile_row).sexual_orientation is not null
    and (profile_row).sleep_schedule is not null
    and (profile_row).bedtime is not null
    and (profile_row).wakeup_time is not null
    and (profile_row).cleanliness is not null
    and (profile_row).noise_preference is not null
    and (profile_row).study_style is not null
    and (profile_row).guests_frequency is not null
    and (profile_row).romantic_guests_frequency is not null
    and (profile_row).social_level is not null
    and (profile_row).room_temperature is not null
    and (profile_row).alcohol is not null
    and (profile_row).smoking is not null
    and (profile_row).parties is not null
    and (profile_row).fitness is not null
    and coalesce(cardinality((profile_row).interests), 0) >= 5
    and (profile_row).deal_breakers is not null;
$$;

-- Directly hiding a profile is safe; only completing onboarding must go
-- through complete_onboarding().
create or replace function public.prevent_direct_onboarding_complete_update()
returns trigger
language plpgsql
as $$
begin
  if new.onboarding_complete is distinct from old.onboarding_complete
     and new.onboarding_complete
     and coalesce(current_setting('app.complete_onboarding', true), '') <> 'true' then
    raise exception 'onboarding_complete can only be changed through complete_onboarding()';
  end if;

  return new;
end;
$$;

create or replace function public.uncomplete_profile_if_required_fields_missing()
returns trigger
language plpgsql
as $$
begin
  if old.onboarding_complete
     and new.onboarding_complete
     and (
       nullif(btrim(new.first_name), '') is null
       or nullif(btrim(new.university), '') is null
       or new.graduation_year is null
       or coalesce(cardinality(new.majors), 0) < 1
       or new.sex_assigned_at_birth is null
       or new.sexual_orientation is null
       or new.sleep_schedule is null
       or new.bedtime is null
       or new.wakeup_time is null
       or new.cleanliness is null
       or new.noise_preference is null
       or new.study_style is null
       or new.guests_frequency is null
       or new.romantic_guests_frequency is null
       or new.social_level is null
       or new.room_temperature is null
       or new.alcohol is null
       or new.smoking is null
       or new.parties is null
       or new.fitness is null
       or coalesce(cardinality(new.interests), 0) < 5
       or new.deal_breakers is null
     ) then
    new.onboarding_complete := false;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_uncomplete_if_required_fields_missing on public.profiles;
create trigger profiles_uncomplete_if_required_fields_missing
  before update on public.profiles
  for each row execute function public.uncomplete_profile_if_required_fields_missing();

create or replace function public.uncomplete_profile_if_required_child_count_missing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_profile_id uuid;
  min_count integer;
  remaining_count integer;
begin
  if TG_RELID = 'public.profile_photos'::regclass then
    min_count := 1;
  elsif TG_RELID = 'public.profile_prompts'::regclass then
    min_count := 1;
  else
    raise exception 'unsupported table for onboarding child-count trigger: %', TG_TABLE_NAME;
  end if;

  if TG_RELID = 'public.profile_prompts'::regclass
     and coalesce(current_setting('app.replace_prompts', true), '') = 'true' then
    if TG_OP = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if TG_OP = 'DELETE' then
    affected_profile_id := old.profile_id;
  elsif TG_OP = 'UPDATE' then
    if new.profile_id is not distinct from old.profile_id then
      return new;
    end if;

    affected_profile_id := old.profile_id;
  else
    raise exception 'unsupported operation for onboarding child-count trigger: %', TG_OP;
  end if;

  if TG_RELID = 'public.profile_photos'::regclass then
    select count(*)
    into remaining_count
    from public.profile_photos
    where profile_id = affected_profile_id;
  else
    select count(*)
    into remaining_count
    from public.profile_prompts
    where profile_id = affected_profile_id;
  end if;

  if remaining_count - 1 < min_count then
    update public.profiles
    set onboarding_complete = false
    where id = affected_profile_id
      and onboarding_complete = true;
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists profile_photos_uncomplete_if_required_count_missing on public.profile_photos;
create trigger profile_photos_uncomplete_if_required_count_missing
  before update or delete on public.profile_photos
  for each row execute function public.uncomplete_profile_if_required_child_count_missing();

drop trigger if exists profile_prompts_uncomplete_if_required_count_missing on public.profile_prompts;
create trigger profile_prompts_uncomplete_if_required_count_missing
  before update or delete on public.profile_prompts
  for each row execute function public.uncomplete_profile_if_required_child_count_missing();

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

  -- Only count photos backed by a real object that lives under this profile's
  -- own folder, so a forged, orphaned, or foreign-pointing profile_photos row
  -- (including pre-hardening rows) cannot satisfy the photo gate.
  select count(*)
  into photo_count
  from public.profile_photos pp
  where pp.profile_id = target_profile_id
    and (storage.foldername(pp.url))[1] = target_profile_id::text
    and exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'profile-photos'
        and o.name = pp.url
    );

  if not public.profile_required_fields_complete(profile_row)
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

create or replace function public.replace_prompts(p_profile_id uuid, p_prompts jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  was_complete boolean;
  prompt_count integer;
begin
  if p_profile_id is distinct from (select auth.uid()) then
    raise exception 'cannot replace prompts for another profile';
  end if;

  if p_prompts is null or jsonb_typeof(p_prompts) <> 'array' then
    raise exception 'prompts must be a json array';
  end if;

  select onboarding_complete
  into was_complete
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  perform set_config('app.replace_prompts', 'true', true);

  delete from public.profile_prompts
  where profile_id = p_profile_id;

  insert into public.profile_prompts (profile_id, prompt, answer, position)
  select
    p_profile_id,
    item.value ->> 'prompt',
    btrim(item.value ->> 'answer'),
    item.ordinality - 1
  from jsonb_array_elements(p_prompts) with ordinality as item(value, ordinality);

  select count(*)
  into prompt_count
  from public.profile_prompts
  where profile_id = p_profile_id;

  if was_complete and prompt_count < 1 then
    update public.profiles
    set onboarding_complete = false
    where id = p_profile_id
      and onboarding_complete = true;
  end if;
end;
$$;

revoke all on function public.replace_prompts(uuid, jsonb) from public;
grant execute on function public.replace_prompts(uuid, jsonb) to authenticated;

-- Remove pre-hardening photo rows that the new write-time trigger would now
-- reject: empty url, url outside the owner's folder, or no backing object.
-- Such rows can never be read under the storage policy, and would otherwise
-- both satisfy the completion gate and break signed-URL generation on load.
delete from public.profile_photos pp
where nullif(btrim(pp.url), '') is null
   or (storage.foldername(pp.url))[1] is distinct from pp.profile_id::text
   or not exists (
     select 1
     from storage.objects o
     where o.bucket_id = 'profile-photos'
       and o.name = pp.url
   );

-- Fall closed: un-complete any profile that no longer meets the invariants,
-- counting only photos backed by a real object under the owner's own folder
-- (mirrors the gate in complete_onboarding()).
update public.profiles p
set onboarding_complete = false
where p.onboarding_complete
  and (
    not public.profile_required_fields_complete(p)
    or (
      select count(*)
      from public.profile_photos pp
      where pp.profile_id = p.id
        and (storage.foldername(pp.url))[1] = p.id::text
        and exists (
          select 1
          from storage.objects o
          where o.bucket_id = 'profile-photos'
            and o.name = pp.url
        )
    ) < 1
    or (
      select count(*)
      from public.profile_prompts pr
      where pr.profile_id = p.id
    ) < 1
  );


-- ================================================================
-- 3. Prompt writes must go through replace_prompts().
-- ================================================================

revoke insert, update, delete on public.profile_prompts from authenticated;
grant select on public.profile_prompts to authenticated;

alter function public.replace_prompts(uuid, jsonb) security definer;
alter function public.replace_prompts(uuid, jsonb) set search_path = public;


-- ================================================================
-- 4. Profile UPDATE must stay column-scoped on existing databases.
-- ================================================================

-- A database that already ran the original 0003 was granted a table-wide
-- `update on public.profiles`. Editing 0003 in place does not re-run on
-- deployed DBs, so those clients keep the broad privilege and can write
-- identity columns (e.g. university) and any future profile column.
-- Revoke the table-level UPDATE and re-grant the exact column allowlist so
-- fresh and upgraded databases enforce the same boundary. onboarding_complete
-- stays excluded (flipped only by complete_onboarding()); university/email/
-- school_domain stay excluded (identity, pinned by lock_profile_identity).
revoke update on public.profiles from authenticated;
grant update (
  first_name,
  pronouns,
  graduation_year,
  majors,
  gender_identity,
  sex_assigned_at_birth,
  sexual_orientation,
  sleep_schedule,
  bedtime,
  wakeup_time,
  cleanliness,
  noise_preference,
  study_style,
  guests_frequency,
  romantic_guests_frequency,
  social_level,
  room_temperature,
  alcohol,
  smoking,
  parties,
  fitness,
  interests,
  deal_breakers,
  dorm_preference,
  living_program,
  clubs,
  instagram,
  linkedin
) on public.profiles to authenticated;


-- ================================================================
-- 5. Photo rows must reference a real, owned storage object.
-- ================================================================

-- profile_photos is client-writable (0003 grants insert/update/delete) and
-- its RLS only checks profile_id = auth.uid(). complete_onboarding()'s
-- photo gate trusts these rows, so without this a client could insert a
-- bogus row (or one pointing at a missing/foreign object) and become
-- discoverable with no readable photo. Enforce at write time that url lives
-- under the owning profile's folder, is immutable once set, and references
-- an object that actually exists in the private bucket.
--
-- SECURITY DEFINER so the existence probe bypasses the storage.objects read
-- policy (which itself depends on a profile_photos row, and so cannot see a
-- freshly uploaded object at insert time).
create or replace function public.validate_profile_photo_object()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(btrim(new.url), '') is null then
    raise exception 'profile photo url is required';
  end if;

  -- Object path convention is "<profile_id>/<filename>"; the first segment
  -- must be the owning profile so a client cannot reference another folder.
  if (storage.foldername(new.url))[1] is distinct from new.profile_id::text then
    raise exception 'profile photo url must live under the owning profile folder';
  end if;

  -- url is immutable once set (only position is meant to change).
  if TG_OP = 'UPDATE' and new.url is distinct from old.url then
    raise exception 'profile photo url is immutable';
  end if;

  -- The referenced object must actually exist in the private bucket.
  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'profile-photos'
      and o.name = new.url
  ) then
    raise exception 'profile photo must reference an uploaded object';
  end if;

  return new;
end;
$$;

drop trigger if exists profile_photos_validate_object on public.profile_photos;
create trigger profile_photos_validate_object
  before insert or update on public.profile_photos
  for each row execute function public.validate_profile_photo_object();


-- ================================================================
-- 6. Visibility must fail closed when a profile has no readable photo.
-- ================================================================

-- can_view_profile() is the single gate behind every cross-user read
-- (profiles/photos/prompts SELECT policies, the storage read policy, and
-- likes/passes). It previously trusted onboarding_complete alone, but that
-- flag is a denormalized cache: a user can complete onboarding and then delete
-- the underlying object directly through the Storage API, leaving
-- onboarding_complete = true with no readable photo. That delete happens on
-- storage.objects, so no profile_photos trigger can intercept it, and 0004
-- deliberately keeps storage-object handling out of DB triggers. Instead,
-- require at read time that the target still has at least one photo backed by a
-- real object under its own folder, so a vanished photo immediately drops the
-- profile from others' view regardless of the cached flag — no storage trigger
-- and no dependency on cleanup running.
--
-- SECURITY DEFINER (unchanged) lets the storage.objects probe bypass RLS, so
-- there is no recursion with the storage read policy that calls this function.
-- The self branch is untouched: you can always see your own profile.
create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles me, public.profiles them
    where me.id   = (select auth.uid())
      and them.id = target
      and (
        them.id = me.id
        or (
          me.school_domain is not null
          and me.school_domain = them.school_domain
          and them.onboarding_complete
          and exists (
            select 1
            from public.profile_photos pp
            join storage.objects o
              on o.bucket_id = 'profile-photos'
             and o.name = pp.url
            where pp.profile_id = them.id
              and (storage.foldername(pp.url))[1] = them.id::text
          )
        )
      )
  );
$$;
