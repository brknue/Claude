-- Simple Chess add-on: ratings are visible to everyone by default; each player can limit them to friends or to nobody.
-- Run once in Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.
-- Needs schema.sql first.

alter table public.profiles add column if not exists rating_visibility text not null default 'everyone';
do $$ begin
  alter table public.profiles add constraint profiles_rating_visibility_check check (rating_visibility in ('everyone', 'friends', 'nobody'));
exception when duplicate_object then null; end $$;

-- may the signed-in player see this player's ratings?
create or replace function public.can_see_ratings(p_owner uuid, p_vis text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (p_owner = auth.uid() or p_vis = 'everyone' or (p_vis = 'friends' and public.are_friends(auth.uid(), p_owner)));
$$;

create or replace function public.set_rating_visibility(p_vis text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.me();
  if p_vis not in ('everyone', 'friends', 'nobody') then raise exception 'bad visibility'; end if;
  update public.profiles set rating_visibility = p_vis where id = auth.uid();
end $$;

create or replace function public.my_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'ratings', public.ratings_json(p.id), 'rating_visibility', p.rating_visibility)
  from public.profiles p where p.id = auth.uid();
$$;

-- Public card for any player. Ratings follow the player's choice; last seen and games stay friends-only.
create or replace function public.get_profile(p_username text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare p public.profiles; rel text := 'none'; full_access boolean;
begin
  perform public.me();
  select * into p from public.profiles where username = p_username::extensions.citext;
  if not found then return null; end if;
  if p.id = auth.uid() then rel := 'self';
  elsif public.are_friends(auth.uid(), p.id) then rel := 'friend';
  elsif exists (select 1 from public.friendships where requester = auth.uid() and addressee = p.id) then rel := 'outgoing';
  elsif exists (select 1 from public.friendships where requester = p.id and addressee = auth.uid()) then rel := 'incoming';
  end if;
  full_access := rel in ('self', 'friend');
  return jsonb_build_object('id', p.id, 'username', p.username, 'created_at', p.created_at, 'relation', rel,
    'ratings', case when public.can_see_ratings(p.id, p.rating_visibility) then public.ratings_json(p.id) end,
    'rating_visibility', case when rel = 'self' then p.rating_visibility end,
    'last_seen', case when full_access then p.last_seen end,
    'games', case when full_access then (select count(*) from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status in ('finished', 'disputed')) end,
    'live', case when full_access then (select g.id from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status = 'live' and g.kind <> 'daily' and g.updated_at > now() - interval '3 minutes' order by g.updated_at desc limit 1) end);
end $$;

create or replace function public.list_friends() returns table (id uuid, username text, relation text, last_seen timestamptz, live uuid, ratings jsonb)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username::text,
    case when f.status = 'accepted' then 'friend' when f.requester = auth.uid() then 'outgoing' else 'incoming' end,
    case when f.status = 'accepted' then p.last_seen end,
    case when f.status = 'accepted' then (select g.id from public.games g where (g.white_id = p.id or g.black_id = p.id) and g.status = 'live' and g.kind <> 'daily' and g.updated_at > now() - interval '3 minutes' order by g.updated_at desc limit 1) end,
    case when public.can_see_ratings(p.id, p.rating_visibility) then public.ratings_json(p.id) end
  from public.friendships f join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() is not null and (f.requester = auth.uid() or f.addressee = auth.uid())
  order by f.status, p.last_seen desc;
$$;

revoke execute on function public.can_see_ratings(uuid, text), public.set_rating_visibility(text), public.my_profile(), public.get_profile(text), public.list_friends() from public, anon, authenticated;
grant execute on function public.set_rating_visibility(text), public.my_profile(), public.get_profile(text), public.list_friends() to authenticated;
