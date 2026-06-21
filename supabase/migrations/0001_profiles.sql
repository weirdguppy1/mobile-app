-- ================================================================
-- Roommate-finder -- production MVP schema
-- Hinge-style, same-school matching, .edu trust anchor
--
-- Run against your Supabase project (SQL editor or `supabase db push`).
--
-- WHAT THIS SETS UP
--   * Passwordless (.edu OTP) signup that auto-creates a profile and
--     locks the user's email + derived school permanently.
--   * Rich onboarding profile (basics, compatibility, lifestyle,
--     interests, deal-breakers, socials), plus a scrollable gallery
--     of photos and Hinge-style prompt answers.
--   * Phone number hidden until two people match.
--   * Content-targeted likes with a visible "Likes You" inbox,
--     private passes, reciprocated-like -> match, and 1:1 messaging
--     inside a match.
--   * Same-school visibility, identity immutability, and match-gated
--     access all enforced in the database (not just the client).
--
-- SECTIONS
--   0.  Helper: school domain from email
--   1.  profiles            (identity + onboarding fields)
--   2.  can_view_profile    (visibility helper)
--   3.  profiles RLS + triggers (signup, locks, email lock)
--   4.  matches             (+ participant/match helpers, RLS)
--   5.  private_contacts    (phone; match-gated)
--   6.  profile_photos      (gallery; + storage cleanup)
--   7.  profile_prompts     (prompt answers)
--   8.  likes               (content-targeted, recipient-visible)
--   9.  passes              (private)
--   10. messages            (1:1 chat inside a match)
--   11. realtime publication
-- ================================================================


-- ================================================================
-- 0. Helper: canonical school domain from an email address
--    alice@students.harvard.edu -> harvard.edu  (last two labels;
--    correct for .edu, which registers at the second level).
-- ================================================================

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


-- ================================================================
-- 1. profiles  (one row per user; created at signup, filled in
--               during onboarding)
-- ================================================================

create table if not exists public.profiles (
  id                   uuid        primary key references auth.users (id) on delete cascade,

  -- identity (locked after signup)
  email                text        not null,
  school_domain        text,                          -- derived, matched on

  -- required basics
  first_name           text,
  pronouns             text,                           -- optional, free text
  university           text,                           -- display label
  graduation_year      int         check (graduation_year is null
                                           or graduation_year between 2024 and 2035),
  majors               text[]      check (majors is null
                                           or cardinality(majors) between 1 and 3),
  gender_identity      text,                           -- optional, free text
  sex_assigned_at_birth text       check (sex_assigned_at_birth is null
                                           or sex_assigned_at_birth in
                                              ('female','male','intersex')),
  sexual_orientation   text        check (sexual_orientation is null
                                           or sexual_orientation in
                                              ('straight','gay','lesbian','bisexual','pansexual',
                                               'asexual','queer','questioning','prefer_not_to_say')),

  -- roommate compatibility
  sleep_schedule       text        check (sleep_schedule is null
                                           or sleep_schedule in
                                              ('early_bird','night_owl','in_between')),
  bedtime              text        check (bedtime is null
                                           or bedtime in
                                              ('before_10pm','10_to_11pm','11pm_to_12am','after_midnight')),
  wakeup_time          text        check (wakeup_time is null
                                           or wakeup_time in
                                              ('before_7am','7_to_8am','8_to_9am','after_9am')),
  cleanliness          smallint    check (cleanliness is null
                                           or cleanliness between 1 and 5),
  noise_preference     text        check (noise_preference is null
                                           or noise_preference in
                                              ('need_quiet','moderate_ok','doesnt_matter')),
  study_style          text        check (study_style is null
                                           or study_style in
                                              ('mostly_room','mostly_library','mix')),
  guests_frequency     text        check (guests_frequency is null
                                           or guests_frequency in
                                              ('rarely','occasionally','frequently')),
  romantic_guests_frequency text   check (romantic_guests_frequency is null
                                           or romantic_guests_frequency in
                                              ('rarely','occasionally','frequently')),
  social_level         smallint    check (social_level is null
                                           or social_level between 1 and 5),
  room_temperature     text        check (room_temperature is null
                                           or room_temperature in
                                              ('cold','moderate','warm')),

  -- lifestyle
  alcohol              text        check (alcohol is null
                                           or alcohol in
                                              ('never','occasionally','frequently','prefer_not_to_say')),
  smoking              text        check (smoking is null
                                           or smoking in
                                              ('no','occasionally','frequently')),
  parties              text        check (parties is null
                                           or parties in
                                              ('not_my_thing','sometimes','often')),
  fitness              text        check (fitness is null
                                           or fitness in
                                              ('never','occasionally','regularly')),

  -- interests: pick 5-10 from the allowed vocabulary
  interests            text[]      check (
                                     interests is null
                                     or (
                                       cardinality(interests) between 5 and 10
                                       and interests <@ array[
                                         'basketball','gym','running','gaming','music',
                                         'reading','entrepreneurship','coding','movies',
                                         'hiking','fashion','cooking','content_creation',
                                         'greek_life','esports','volunteering'
                                       ]::text[]
                                     )
                                   ),

  -- deal breakers: mark any of the allowed set
  deal_breakers        text[]      check (
                                     deal_breakers is null
                                     or deal_breakers <@ array[
                                       'smoking','heavy_partying','overnight_guests',
                                       'different_sleep_schedules','cleanliness_mismatch',
                                       'noise_levels'
                                     ]::text[]
                                   ),

  -- nice-to-have
  dorm_preference      text,                           -- free text
  living_program       text,                           -- e.g. LLC / Honors
  clubs                text[]      check (clubs is null or cardinality(clubs) <= 10),
  instagram            text,                           -- visible to same school
  linkedin             text,                           -- visible to same school
  -- NOTE: phone lives in private_contacts (match-gated), NOT here.

  -- onboarding gate: false until the user finishes setup
  onboarding_complete  boolean     not null default false,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists profiles_school_domain_idx
  on public.profiles (school_domain);
create index if not exists profiles_email_idx
  on public.profiles (email);
-- Discovery scans same-school, completed profiles.
create index if not exists profiles_discovery_idx
  on public.profiles (school_domain, onboarding_complete);


-- ================================================================
-- 2. can_view_profile(target): can the current user see target's
--    profile? True for yourself always; for others only if same
--    school AND they've completed onboarding.
--
--    SECURITY DEFINER is REQUIRED: this is called inside the
--    profiles SELECT policy, and reading profiles from within that
--    policy would otherwise recurse. Definer bypasses RLS here.
-- ================================================================

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
        )
      )
  );
$$;


-- ================================================================
-- 3. profiles RLS + triggers
-- ================================================================

alter table public.profiles enable row level security;

-- SELECT: yourself, or same-school completed profiles.
drop policy if exists "View visible profiles" on public.profiles;
create policy "View visible profiles"
  on public.profiles for select
  using (public.can_view_profile(id));

-- UPDATE: edit your own row (identity columns pinned by trigger).
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
  on public.profiles for update
  using  ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- DELETE: delete your own row (GDPR / account deletion).
drop policy if exists "Delete own profile" on public.profiles;
create policy "Delete own profile"
  on public.profiles for delete
  using ((select auth.uid()) = id);

-- No INSERT policy: profiles are created by the signup trigger.


-- updated_at stamp
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- identity lock: pin immutable columns on any client update
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

drop trigger if exists profiles_lock_identity on public.profiles;
create trigger profiles_lock_identity
  before update on public.profiles
  for each row execute function public.lock_profile_identity();


-- create profile on new auth user (runs privileged; no session yet)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- email lock: reject any change to auth.users.email
create or replace function public.prevent_email_change()
returns trigger language plpgsql as $$
begin
  raise exception 'Email address cannot be changed.';
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
drop trigger if exists prevent_auth_email_change on auth.users;
create trigger prevent_auth_email_change
  before update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.prevent_email_change();


-- ================================================================
-- 4. matches  (one canonical row per pair; surrogate id for FKs)
-- ================================================================

create table if not exists public.matches (
  id         uuid        primary key default gen_random_uuid(),
  user_a     uuid        not null references public.profiles (id) on delete cascade,
  user_b     uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),                       -- dedup target for the like trigger
  constraint matches_canonical_order check (user_a < user_b)
);

create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);


-- Are the current user and `target` matched?  (SECURITY DEFINER so
-- it can read matches from inside other tables' policies.)
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

alter table public.matches enable row level security;

drop policy if exists "Read own matches" on public.matches;
create policy "Read own matches"
  on public.matches for select
  using (
    (select auth.uid()) = user_a
    or (select auth.uid()) = user_b
  );

drop policy if exists "Unmatch" on public.matches;
create policy "Unmatch"
  on public.matches for delete
  using (
    (select auth.uid()) = user_a
    or (select auth.uid()) = user_b
  );

-- No INSERT policy: matches are created by the like trigger.


-- ================================================================
-- 5. private_contacts  (phone -- hidden until matched)
-- ================================================================

create table if not exists public.private_contacts (
  profile_id uuid        primary key references public.profiles (id) on delete cascade,
  phone      text,
  updated_at timestamptz not null default now()
);

alter table public.private_contacts enable row level security;

-- SELECT: only yourself, or someone you've matched with.
drop policy if exists "Read contacts when matched" on public.private_contacts;
create policy "Read contacts when matched"
  on public.private_contacts for select
  using (
    (select auth.uid()) = profile_id
    or public.is_matched_with(profile_id)
  );

-- INSERT / UPDATE: manage only your own contact info.
drop policy if exists "Insert own contacts" on public.private_contacts;
create policy "Insert own contacts"
  on public.private_contacts for insert
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Update own contacts" on public.private_contacts;
create policy "Update own contacts"
  on public.private_contacts for update
  using  ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);


-- ================================================================
-- 6. profile_photos  (scrollable gallery; primary photo = position 0)
-- ================================================================

create table if not exists public.profile_photos (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  url        text        not null,           -- storage path of the image
  position   int         not null default 0, -- display order (0 = primary)
  created_at timestamptz not null default now()
);

create index if not exists profile_photos_profile_idx
  on public.profile_photos (profile_id, position);

alter table public.profile_photos enable row level security;

drop policy if exists "View photos of visible profiles" on public.profile_photos;
create policy "View photos of visible profiles"
  on public.profile_photos for select
  using (public.can_view_profile(profile_id));

drop policy if exists "Insert own photos" on public.profile_photos;
create policy "Insert own photos"
  on public.profile_photos for insert
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Update own photos" on public.profile_photos;
create policy "Update own photos"
  on public.profile_photos for update
  using  ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Delete own photos" on public.profile_photos;
create policy "Delete own photos"
  on public.profile_photos for delete
  using ((select auth.uid()) = profile_id);

-- Storage cleanup: when a photo row is removed (directly or via the
-- account-deletion cascade), delete the underlying file too.
-- Assumes images live in a bucket named 'profile-photos' and that
-- profile_photos.url stores the object's storage path (its `name`).
create or replace function public.delete_photo_object()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where bucket_id = 'profile-photos'
    and name = old.url;
  return old;
end;
$$;

drop trigger if exists on_photo_deleted on public.profile_photos;
create trigger on_photo_deleted
  after delete on public.profile_photos
  for each row execute function public.delete_photo_object();


-- ================================================================
-- 7. profile_prompts  (Hinge-style prompt answers)
--    Suggested prompts (enforced in the app, not the DB):
--      "My ideal Friday night is..."
--      "One thing I can't live without..."
--      "You should room with me if..."
--      "My biggest dorm pet peeve is..."
--      "A fun fact about me..."
--      "My morning routine..."
--      "The cleanest part of my room is..."
--      "The messiest part of my room is..."
-- ================================================================

create table if not exists public.profile_prompts (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  prompt     text        not null,
  answer     text        not null check (length(trim(answer)) > 0),
  position   int         not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists profile_prompts_profile_idx
  on public.profile_prompts (profile_id, position);

alter table public.profile_prompts enable row level security;

drop policy if exists "View prompts of visible profiles" on public.profile_prompts;
create policy "View prompts of visible profiles"
  on public.profile_prompts for select
  using (public.can_view_profile(profile_id));

drop policy if exists "Insert own prompts" on public.profile_prompts;
create policy "Insert own prompts"
  on public.profile_prompts for insert
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Update own prompts" on public.profile_prompts;
create policy "Update own prompts"
  on public.profile_prompts for update
  using  ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Delete own prompts" on public.profile_prompts;
create policy "Delete own prompts"
  on public.profile_prompts for delete
  using ((select auth.uid()) = profile_id);


-- ================================================================
-- 8. likes  (content-targeted, recipient-visible -> "Likes You")
-- ================================================================

create table if not exists public.likes (
  liker_id        uuid        not null references public.profiles (id) on delete cascade,
  likee_id        uuid        not null references public.profiles (id) on delete cascade,
  liked_photo_id  uuid        references public.profile_photos (id)  on delete set null,
  liked_prompt_id uuid        references public.profile_prompts (id) on delete set null,
  comment         text,
  created_at      timestamptz not null default now(),
  primary key (liker_id, likee_id),
  constraint likes_no_self check (liker_id <> likee_id),
  constraint likes_one_target
    check (not (liked_photo_id is not null and liked_prompt_id is not null))
);

create index if not exists likes_likee_idx
  on public.likes (likee_id, liker_id);

alter table public.likes enable row level security;

-- SELECT: likes you SENT and likes you RECEIVED (the inbox).
drop policy if exists "Read sent and received likes" on public.likes;
create policy "Read sent and received likes"
  on public.likes for select
  using (
    (select auth.uid()) = liker_id
    or (select auth.uid()) = likee_id
  );

-- INSERT: only your own likes, only to a profile you can view.
drop policy if exists "Send own likes" on public.likes;
create policy "Send own likes"
  on public.likes for insert
  with check (
    (select auth.uid()) = liker_id
    and public.can_view_profile(likee_id)
  );

-- DELETE: retract a like you sent.
drop policy if exists "Retract own likes" on public.likes;
create policy "Retract own likes"
  on public.likes for delete
  using ((select auth.uid()) = liker_id);

-- reciprocated like -> match
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

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute function public.handle_like();


-- ================================================================
-- 9. passes  (private "not interested", so people don't resurface)
-- ================================================================

create table if not exists public.passes (
  passer_id  uuid        not null references public.profiles (id) on delete cascade,
  passee_id  uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (passer_id, passee_id),
  constraint passes_no_self check (passer_id <> passee_id)
);

alter table public.passes enable row level security;

drop policy if exists "Read own passes" on public.passes;
create policy "Read own passes"
  on public.passes for select
  using ((select auth.uid()) = passer_id);

drop policy if exists "Insert own passes" on public.passes;
create policy "Insert own passes"
  on public.passes for insert
  with check (
    (select auth.uid()) = passer_id
    and public.can_view_profile(passee_id)
  );


-- ================================================================
-- 10. messages  (1:1 chat, only inside a match)
-- ================================================================

create table if not exists public.messages (
  id         uuid        primary key default gen_random_uuid(),
  match_id   uuid        not null references public.matches (id) on delete cascade,
  sender_id  uuid        not null references public.profiles (id) on delete cascade,
  body       text        not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  read_at    timestamptz                       -- null = unread
);

create index if not exists messages_match_idx
  on public.messages (match_id, created_at);

alter table public.messages enable row level security;

-- READ: any message in a match you belong to.
drop policy if exists "Read messages in own matches" on public.messages;
create policy "Read messages in own matches"
  on public.messages for select
  using (public.is_match_participant(match_id));

-- SEND: you must be the sender AND a participant in that match.
drop policy if exists "Send messages in own matches" on public.messages;
create policy "Send messages in own matches"
  on public.messages for insert
  with check (
    (select auth.uid()) = sender_id
    and public.is_match_participant(match_id)
  );

-- UPDATE: participants may update (only read_at survives -- see lock).
drop policy if exists "Update messages in own matches" on public.messages;
create policy "Update messages in own matches"
  on public.messages for update
  using  (public.is_match_participant(match_id))
  with check (public.is_match_participant(match_id));

-- Message immutability: only read_at may change. Everything else is
-- pinned to its old value, so messages can be marked read but not
-- edited or re-attributed. (No delete policy = messages persist;
-- they still cascade away on unmatch / account deletion.)
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

drop trigger if exists messages_lock_content on public.messages;
create trigger messages_lock_content
  before update on public.messages
  for each row execute function public.lock_message_content();


-- ================================================================
-- 11. Realtime: stream inbox + chat + matches to the client
-- ================================================================

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.likes;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null; end $$;