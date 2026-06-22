-- ================================================================
-- Table privileges (role-level GRANTs) for the `authenticated` role.
--
-- WHY THIS EXISTS
--   RLS decides WHICH ROWS a role may touch. A table GRANT decides
--   whether the role may touch the table AT ALL. Postgres checks the
--   GRANT *before* it evaluates RLS, so a table can have perfect RLS
--   policies and still reject every query with
--       42501  permission denied for table <name>
--   if the role was never granted SELECT/INSERT/UPDATE/DELETE.
--
--   Recent Supabase Postgres no longer grants the public schema's DML
--   privileges to anon/authenticated by default (the role only gets
--   REFERENCES/TRIGGER/TRUNCATE). 0001/0002 created tables + policies
--   but never issued a GRANT, so authenticated clients hit 42501 on
--   profiles, profile_photos and profile_prompts during onboarding.
--
-- SCOPE
--   Grants are scoped to `authenticated` only — every flow in this app
--   requires a signed-in (.edu) user, so `anon` intentionally gets
--   nothing. Each grant mirrors the RLS policies already defined for
--   that table (least privilege): we never grant an operation the
--   table has no policy for.
--
--   PK columns use gen_random_uuid(), so there are no sequences to
--   grant.
--
--   GRANT is idempotent, so this migration is safe to re-run / replay.
-- ================================================================

grant usage on schema public to authenticated;

-- profiles: SELECT (view visible), DELETE own. UPDATE is column-scoped —
-- the client may edit profile fields but NOT identity columns (email,
-- school_domain — also pinned by the lock_profile_identity trigger) or
-- onboarding_complete (flipped only by the complete_onboarding() RPC in
-- 0005). INSERT is done by the handle_new_user() signup trigger (SECURITY
-- DEFINER), not the client, and has no RLS policy — so no INSERT grant.
grant select, delete on public.profiles to authenticated;
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

-- profile_photos: full CRUD (view / insert / update / delete own).
grant select, insert, update, delete on public.profile_photos to authenticated;

-- profile_prompts: full CRUD (view / insert / update / delete own).
grant select, insert, update, delete on public.profile_prompts to authenticated;

-- private_contacts: SELECT (self or matched), INSERT/UPDATE own.
grant select, insert, update on public.private_contacts to authenticated;

-- matches: SELECT own, DELETE (unmatch). INSERT is done by the
-- handle_like() trigger, not the client — no INSERT grant.
grant select, delete on public.matches to authenticated;

-- likes: SELECT (sent + received), INSERT (send), DELETE (retract).
grant select, insert, delete on public.likes to authenticated;

-- passes: SELECT own, INSERT (pass).
grant select, insert on public.passes to authenticated;

-- messages: SELECT/INSERT in own matches, UPDATE (mark read; content
-- pinned by the lock_message_content trigger).
grant select, insert, update on public.messages to authenticated;
