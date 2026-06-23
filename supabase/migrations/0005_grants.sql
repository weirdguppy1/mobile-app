-- ================================================================
-- 0005 · GRANTS — role privileges for `authenticated`
--
-- Postgres checks table GRANTs *before* it evaluates RLS, so a table
-- with perfect policies still rejects every query with
--     42501  permission denied for table <name>
-- unless the role was granted the operation. Recent Supabase Postgres
-- no longer grants public-schema DML to anon/authenticated by default,
-- so every privilege the app needs must be listed here.
--
-- Scope: `authenticated` only — every flow requires a signed-in (.edu)
-- user, so `anon` intentionally gets nothing. Each grant mirrors the
-- RLS policy that exists for that table (least privilege): we never
-- grant an operation a table has no policy for. PK columns use
-- gen_random_uuid(), so there are no sequences to grant. GRANT is
-- idempotent — safe to replay.
-- ================================================================

grant usage on schema public to authenticated;


-- ----------------------------------------------------------------
-- profiles — SELECT (view visible), DELETE own. UPDATE is COLUMN-SCOPED:
-- the client may edit profile fields but NOT identity columns (email,
-- school_domain — also pinned by lock_profile_identity; university — set
-- once at signup) or onboarding_complete (flipped only by
-- complete_onboarding()). INSERT is the signup trigger's job (no grant).
--
-- This column allowlist is the single source of truth for client-editable
-- profile fields. Every new editable column MUST be added here, or writes
-- to it fail with 42501. (about_me is included — earlier it was missing,
-- which broke its save.)
-- ----------------------------------------------------------------
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
  linkedin,
  about_me
) on public.profiles to authenticated;

-- profile_photos — full CRUD on your own (write-time validation in 0002/0003).
grant select, insert, update, delete on public.profile_photos to authenticated;

-- profile_prompts — SELECT only. All writes go through replace_prompts()
-- (SECURITY DEFINER), so the client gets no insert/update/delete.
grant select on public.profile_prompts to authenticated;

-- private_contacts — SELECT (self or matched), INSERT/UPDATE own.
grant select, insert, update on public.private_contacts to authenticated;

-- matches — SELECT own, DELETE (unmatch). INSERT is handle_like()'s job.
grant select, delete on public.matches to authenticated;

-- likes — SELECT (sent + received), INSERT (send), DELETE (retract).
grant select, insert, delete on public.likes to authenticated;

-- passes — SELECT own, INSERT (pass).
grant select, insert on public.passes to authenticated;

-- messages — SELECT/INSERT in own matches, UPDATE (mark read; content
-- pinned by lock_message_content).
grant select, insert, update on public.messages to authenticated;


-- ----------------------------------------------------------------
-- RPC execute grants — lock the privileged write paths to authenticated.
-- (Helper functions keep their default PUBLIC execute; they all gate on
-- auth.uid(), which is null for anon.)
-- ----------------------------------------------------------------
revoke all on function public.complete_onboarding(uuid) from public;
grant execute on function public.complete_onboarding(uuid) to authenticated;

revoke all on function public.replace_prompts(uuid, jsonb) from public;
grant execute on function public.replace_prompts(uuid, jsonb) to authenticated;
