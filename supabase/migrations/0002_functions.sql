-- ================================================================
-- 0002 · FUNCTIONS — helpers, trigger functions, RPCs
--
-- All function bodies live here (tables from 0001 already exist, so
-- the SQL-language functions that reference them validate cleanly).
-- Triggers that bind these functions are in 0003; EXECUTE grants are
-- in 0005.
-- ================================================================


-- ----------------------------------------------------------------
-- Helpers (read-only; used by RLS policies and RPCs)
-- ----------------------------------------------------------------

-- Canonical school domain from an email address.
--   alice@students.harvard.edu -> harvard.edu  (last two labels;
--   correct for .edu, which registers at the second level).
create or replace function public.school_domain_from_email(addr text)
returns text
language sql
immutable
as $$
  select case
    when addr is null or position('@' in addr) = 0 then null
    else (
      with labels as (
        select string_to_array(lower(split_part(addr, '@', 2)), '.') as a
      )
      select array_to_string(
               a[greatest(array_length(a, 1) - 1, 1) : array_length(a, 1)],
               '.'
             )
      from labels
    )
  end;
$$;

-- can_view_profile(target): may the current user see target's profile?
-- True for yourself always; for others only if same school AND they have
-- completed onboarding AND still have at least one photo backed by a real
-- object under their own folder (so a vanished photo immediately drops the
-- profile from others' view regardless of the cached onboarding_complete
-- flag — that flag is denormalized and can go stale when a user deletes the
-- underlying object directly through the Storage API).
--
-- SECURITY DEFINER is REQUIRED: this is called inside the profiles SELECT
-- policy (reading profiles from within that policy would otherwise recurse)
-- and lets the storage.objects probe bypass RLS without recursing into the
-- storage read policy that itself calls this function.
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

-- Are the current user and `target` matched? (SECURITY DEFINER so it can
-- read matches from inside other tables' policies.)
create or replace function public.is_matched_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches
    where (user_a = (select auth.uid()) and user_b = target)
       or (user_a = target and user_b = (select auth.uid()))
  );
$$;

-- Is the current user a participant in match `m`?
create or replace function public.is_match_participant(m uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matches
    where id = m
      and (user_a = (select auth.uid()) or user_b = (select auth.uid()))
  );
$$;

-- Does a profile row satisfy every required onboarding field? Used by the
-- completion gate and the fall-closed trigger so the two never drift.
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


-- ----------------------------------------------------------------
-- Generic trigger functions
-- ----------------------------------------------------------------

-- Stamp updated_at on every profile update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Identity lock: pin immutable profile columns on any client update.
create or replace function public.lock_profile_identity()
returns trigger language plpgsql as $$
begin
  new.id            := old.id;
  new.email         := old.email;
  new.school_domain := old.school_domain;
  new.created_at    := old.created_at;
  return new;
end;
$$;

-- Reject any change to auth.users.email.
create or replace function public.prevent_email_change()
returns trigger language plpgsql as $$
begin
  raise exception 'Email address cannot be changed.';
end;
$$;

-- Message immutability: only read_at may change.
create or replace function public.lock_message_content()
returns trigger language plpgsql as $$
begin
  new.id         := old.id;
  new.match_id   := old.match_id;
  new.sender_id  := old.sender_id;
  new.body       := old.body;
  new.created_at := old.created_at;
  return new;
end;
$$;


-- ----------------------------------------------------------------
-- Signup: create a profile on new auth user (runs privileged; no
-- session yet). Enforces the .edu requirement.
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  domain text := public.school_domain_from_email(new.email);
begin
  if domain is null or domain not like '%.edu' then
    raise exception 'A .edu email address is required to sign up.';
  end if;

  insert into public.profiles (id, email, school_domain, university, first_name)
  values (
    new.id,
    new.email,
    domain,
    new.raw_user_meta_data ->> 'university',
    new.raw_user_meta_data ->> 'first_name'
  )
  on conflict (id) do update
    set email         = excluded.email,
        school_domain = excluded.school_domain,
        university    = coalesce(public.profiles.university, excluded.university);

  return new;
end;
$$;


-- ----------------------------------------------------------------
-- Matching: a reciprocated like becomes a match.
-- ----------------------------------------------------------------
create or replace function public.handle_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.likes l
    where l.liker_id = new.likee_id
      and l.likee_id = new.liker_id
  ) then
    insert into public.matches (user_a, user_b)
    values (
      least(new.liker_id, new.likee_id),
      greatest(new.liker_id, new.likee_id)
    )
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end;
$$;


-- ----------------------------------------------------------------
-- Onboarding integrity
--
-- onboarding_complete is a server-owned flag. It can only be flipped
-- *true* by complete_onboarding() (which validates every invariant in
-- one transaction); it falls closed automatically when required data
-- is removed.
-- ----------------------------------------------------------------

-- Block direct client completion; allow direct un-completion.
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

-- Fall closed: if a completed profile loses a required field on update,
-- drop onboarding_complete back to false.
create or replace function public.uncomplete_profile_if_required_fields_missing()
returns trigger
language plpgsql
as $$
begin
  if old.onboarding_complete
     and new.onboarding_complete
     and not public.profile_required_fields_complete(new) then
    new.onboarding_complete := false;
  end if;

  return new;
end;
$$;

-- Fall closed: if removing a photo/prompt drops a completed profile below
-- the required minimum, un-complete it. Skips the bulk delete inside
-- replace_prompts() (guarded by app.replace_prompts), which re-inserts in
-- the same transaction.
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

-- profile_photos is client-writable, and complete_onboarding()'s photo gate
-- trusts its rows. Enforce at write time that url lives under the owning
-- profile's folder, is immutable once set, and references an object that
-- actually exists in the private bucket — so a client cannot become
-- discoverable with a bogus / foreign / missing-object photo row.
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


-- ----------------------------------------------------------------
-- RPCs (SECURITY DEFINER; the only sanctioned write path for the
-- onboarding-complete flag and the prompt set)
-- ----------------------------------------------------------------

-- Validate every invariant, then flip onboarding_complete true in one
-- transaction. The photo gate counts only photos backed by a real object
-- under this profile's own folder, so a forged / orphaned / foreign-pointing
-- row cannot satisfy it.
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

-- Replace the full prompt set atomically (delete-all + reinsert by array
-- order). The profile row lock serializes competing saves; app.replace_prompts
-- tells the child-count trigger to ignore the interim delete.
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
