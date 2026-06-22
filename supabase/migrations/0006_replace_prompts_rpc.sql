-- ================================================================
-- Atomic prompt replacement.
--
-- Clients replace the full prompt set through replace_prompts() so stale
-- rows and duplicate positions cannot survive a partial client-side save.
-- The profile row lock serializes competing saves for the same profile.
-- ================================================================

with ranked_prompts as (
  select
    id,
    row_number() over (
      partition by profile_id, position
      order by created_at desc, id desc
    ) as duplicate_rank
  from public.profile_prompts
)
delete from public.profile_prompts pp
using ranked_prompts rp
where pp.id = rp.id
  and rp.duplicate_rank > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profile_prompts_profile_id_position_key'
      and conrelid = 'public.profile_prompts'::regclass
  ) then
    alter table public.profile_prompts
      add constraint profile_prompts_profile_id_position_key unique (profile_id, position);
  end if;
end;
$$;

create or replace function public.replace_prompts(p_profile_id uuid, p_prompts jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_profile_id is distinct from (select auth.uid()) then
    raise exception 'cannot replace prompts for another profile';
  end if;

  if p_prompts is null or jsonb_typeof(p_prompts) <> 'array' then
    raise exception 'prompts must be a json array';
  end if;

  perform 1
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  delete from public.profile_prompts
  where profile_id = p_profile_id;

  insert into public.profile_prompts (profile_id, prompt, answer, position)
  select
    p_profile_id,
    item.value ->> 'prompt',
    btrim(item.value ->> 'answer'),
    item.ordinality - 1
  from jsonb_array_elements(p_prompts) with ordinality as item(value, ordinality);
end;
$$;

revoke all on function public.replace_prompts(uuid, jsonb) from public;
grant execute on function public.replace_prompts(uuid, jsonb) to authenticated;
