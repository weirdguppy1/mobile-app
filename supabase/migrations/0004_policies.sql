-- ================================================================
-- 0004 · RLS POLICIES — row visibility for the public tables
--
-- RLS decides WHICH ROWS a role may touch; the table GRANTs in 0005
-- decide whether the role may touch the table at all. Storage.objects
-- policies live in 0006.
-- ================================================================


-- ----------------------------------------------------------------
-- profiles — see yourself or same-school visible profiles; edit/delete
-- only your own row. INSERT is the signup trigger's job (no policy).
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "View visible profiles" on public.profiles;
create policy "View visible profiles"
  on public.profiles for select
  using (public.can_view_profile(id));

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
  on public.profiles for update
  using  ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Delete own profile" on public.profiles;
create policy "Delete own profile"
  on public.profiles for delete
  using ((select auth.uid()) = id);


-- ----------------------------------------------------------------
-- matches — read / unmatch your own. INSERT is handle_like()'s job.
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- private_contacts — read self or matched; manage only your own.
-- ----------------------------------------------------------------
alter table public.private_contacts enable row level security;

drop policy if exists "Read contacts when matched" on public.private_contacts;
create policy "Read contacts when matched"
  on public.private_contacts for select
  using (
    (select auth.uid()) = profile_id
    or public.is_matched_with(profile_id)
  );

drop policy if exists "Insert own contacts" on public.private_contacts;
create policy "Insert own contacts"
  on public.private_contacts for insert
  with check ((select auth.uid()) = profile_id);

drop policy if exists "Update own contacts" on public.private_contacts;
create policy "Update own contacts"
  on public.private_contacts for update
  using  ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);


-- ----------------------------------------------------------------
-- profile_photos — view visible; full CRUD on your own.
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- profile_prompts — view visible. Writes go ONLY through
-- replace_prompts() (SECURITY DEFINER), so there is deliberately no
-- insert/update/delete policy and no write grant (see 0005).
-- ----------------------------------------------------------------
alter table public.profile_prompts enable row level security;

drop policy if exists "View prompts of visible profiles" on public.profile_prompts;
create policy "View prompts of visible profiles"
  on public.profile_prompts for select
  using (public.can_view_profile(profile_id));

-- Remove legacy direct-write policies if an older schema created them.
drop policy if exists "Insert own prompts" on public.profile_prompts;
drop policy if exists "Update own prompts" on public.profile_prompts;
drop policy if exists "Delete own prompts" on public.profile_prompts;


-- ----------------------------------------------------------------
-- likes — read sent + received; send your own; retract your own.
-- ----------------------------------------------------------------
alter table public.likes enable row level security;

drop policy if exists "Read sent and received likes" on public.likes;
create policy "Read sent and received likes"
  on public.likes for select
  using (
    (select auth.uid()) = liker_id
    or (select auth.uid()) = likee_id
  );

drop policy if exists "Send own likes" on public.likes;
create policy "Send own likes"
  on public.likes for insert
  with check (
    (select auth.uid()) = liker_id
    and public.can_view_profile(likee_id)
  );

drop policy if exists "Retract own likes" on public.likes;
create policy "Retract own likes"
  on public.likes for delete
  using ((select auth.uid()) = liker_id);


-- ----------------------------------------------------------------
-- passes — read your own; pass on a viewable profile.
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- messages — read/send inside your matches; update marks read only
-- (content pinned by lock_message_content). No delete policy.
-- ----------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "Read messages in own matches" on public.messages;
create policy "Read messages in own matches"
  on public.messages for select
  using (public.is_match_participant(match_id));

drop policy if exists "Send messages in own matches" on public.messages;
create policy "Send messages in own matches"
  on public.messages for insert
  with check (
    (select auth.uid()) = sender_id
    and public.is_match_participant(match_id)
  );

drop policy if exists "Update messages in own matches" on public.messages;
create policy "Update messages in own matches"
  on public.messages for update
  using  (public.is_match_participant(match_id))
  with check (public.is_match_participant(match_id));


-- ----------------------------------------------------------------
-- message_reactions — read any reaction in your matches; add/change/
-- remove only your own. match_id gates participation (denormalized).
-- ----------------------------------------------------------------
alter table public.message_reactions enable row level security;

drop policy if exists "Read reactions in own matches" on public.message_reactions;
create policy "Read reactions in own matches"
  on public.message_reactions for select
  using (public.is_match_participant(match_id));

drop policy if exists "Add own reactions in own matches" on public.message_reactions;
create policy "Add own reactions in own matches"
  on public.message_reactions for insert
  with check (
    (select auth.uid()) = user_id
    and public.is_match_participant(match_id)
  );

drop policy if exists "Update own reactions" on public.message_reactions;
create policy "Update own reactions"
  on public.message_reactions for update
  using  ((select auth.uid()) = user_id and public.is_match_participant(match_id))
  with check ((select auth.uid()) = user_id and public.is_match_participant(match_id));

drop policy if exists "Remove own reactions" on public.message_reactions;
create policy "Remove own reactions"
  on public.message_reactions for delete
  using ((select auth.uid()) = user_id);


-- ----------------------------------------------------------------
-- notifications — read/update/delete your own. No INSERT policy:
-- rows are written only by the SECURITY DEFINER notify_* triggers.
-- ----------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "Read own notifications" on public.notifications;
create policy "Read own notifications"
  on public.notifications for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Update own notifications" on public.notifications;
create policy "Update own notifications"
  on public.notifications for update
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own notifications" on public.notifications;
create policy "Delete own notifications"
  on public.notifications for delete
  using ((select auth.uid()) = user_id);
