-- ================================================================
-- 0001 · SCHEMA — tables, constraints, indexes
--
-- Roommate-finder MVP: Hinge-style, same-school (.edu) matching.
-- This file is pure DDL. Functions live in 0002, triggers in 0003,
-- RLS policies in 0004, grants in 0005, storage + realtime in 0006.
--
-- Tables are declared in foreign-key dependency order:
--   profiles → matches → private_contacts → profile_photos
--   → profile_prompts → likes → passes → messages
-- ================================================================


-- ----------------------------------------------------------------
-- profiles  (one row per user; created at signup, filled during
--            onboarding). Identity columns are pinned after signup
--            by lock_profile_identity() (0002/0003).
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid        primary key references auth.users (id) on delete cascade,

  -- identity (locked after signup)
  email                text        not null,
  school_domain        text,                           -- derived, matched on

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
  about_me             text        check (about_me is null or char_length(about_me) <= 600),
                                                        -- short bio; 50-word cap enforced in app
  hidden_fields        text[]      not null default '{}',
                                                        -- profile field ids the user hides from others (Edit/View)
  -- NOTE: phone lives in private_contacts (match-gated), NOT here.

  -- onboarding gate: false until the user finishes setup (flipped only
  -- by complete_onboarding(); guarded by triggers in 0003)
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


-- ----------------------------------------------------------------
-- matches  (one canonical row per pair; surrogate id for FKs).
-- Rows are created by handle_like() (0002), never the client.
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- private_contacts  (phone — hidden until matched)
-- ----------------------------------------------------------------
create table if not exists public.private_contacts (
  profile_id uuid        primary key references public.profiles (id) on delete cascade,
  phone      text,
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------
-- profile_photos  (scrollable gallery; primary photo = position 0).
-- url is the storage path "<profile_id>/<filename>"; validated at
-- write time by validate_profile_photo_object() (0002/0003).
-- ----------------------------------------------------------------
create table if not exists public.profile_photos (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  url        text        not null,           -- storage path of the image
  position   int         not null default 0, -- display order (0 = primary)
  created_at timestamptz not null default now()
);

create index if not exists profile_photos_profile_idx
  on public.profile_photos (profile_id, position);


-- ----------------------------------------------------------------
-- profile_prompts  (Hinge-style prompt answers). Writes go only
-- through replace_prompts() (0002); unique (profile_id, position)
-- keeps positions stable and dup-free.
-- ----------------------------------------------------------------
create table if not exists public.profile_prompts (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  prompt     text        not null,
  answer     text        not null check (length(trim(answer)) > 0),
  position   int         not null default 0,
  created_at timestamptz not null default now(),
  constraint profile_prompts_profile_id_position_key unique (profile_id, position)
);

create index if not exists profile_prompts_profile_idx
  on public.profile_prompts (profile_id, position);


-- ----------------------------------------------------------------
-- likes  (content-targeted, recipient-visible → "Likes You").
-- A reciprocated like becomes a match via handle_like() (0002).
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- passes  (private "not interested", so people don't resurface)
-- ----------------------------------------------------------------
create table if not exists public.passes (
  passer_id  uuid        not null references public.profiles (id) on delete cascade,
  passee_id  uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (passer_id, passee_id),
  constraint passes_no_self check (passer_id <> passee_id)
);


-- ----------------------------------------------------------------
-- messages  (1:1 chat, only inside a match). Content is immutable
-- once sent (only read_at changes) via lock_message_content (0003).
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- message_reactions  (one emoji per user per message; change by
-- upsert, clear by delete). match_id is denormalized so RLS and
-- realtime can filter by match without joining through messages.
-- ----------------------------------------------------------------
create table if not exists public.message_reactions (
  message_id uuid        not null references public.messages (id) on delete cascade,
  match_id   uuid        not null references public.matches (id)  on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  emoji      text        not null check (length(trim(emoji)) > 0),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists message_reactions_match_idx
  on public.message_reactions (match_id);

-- Realtime DELETE events only carry the replica identity. Default is the PK
-- (message_id, user_id), which omits match_id — so a match_id-filtered/RLS'd
-- DELETE subscription couldn't see cleared reactions. FULL includes every column.
alter table public.message_reactions replica identity full;
