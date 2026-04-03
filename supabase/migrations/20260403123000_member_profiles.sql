create table if not exists public.member_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  github_login text not null,
  display_name text not null,
  avatar_url text not null,
  github_url text not null,
  joined_at timestamptz not null default timezone('utc', now()),
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint member_profiles_github_login_not_blank check (btrim(github_login) <> ''),
  constraint member_profiles_display_name_not_blank check (btrim(display_name) <> ''),
  constraint member_profiles_avatar_url_not_blank check (btrim(avatar_url) <> ''),
  constraint member_profiles_github_url_not_blank check (btrim(github_url) <> '')
);

create unique index if not exists member_profiles_github_login_key
  on public.member_profiles (lower(github_login));

create index if not exists member_profiles_visible_joined_at_idx
  on public.member_profiles (joined_at desc)
  where is_visible = true;

create or replace function public.set_member_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_member_profile_updated_at on public.member_profiles;

create trigger set_member_profile_updated_at
before update on public.member_profiles
for each row
execute function public.set_member_profile_updated_at();

create or replace function public.sync_member_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_provider text;
  github_login text;
  display_name text;
  avatar_url text;
  github_url text;
begin
  auth_provider := coalesce(new.raw_app_meta_data ->> 'provider', '');

  if auth_provider <> 'github' then
    return new;
  end if;

  github_login := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'login'
    ),
    ''
  );

  if github_login is null then
    return new;
  end if;

  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    github_login
  );

  avatar_url := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    format('https://github.com/%s.png', github_login)
  );

  github_url := coalesce(
    nullif(new.raw_user_meta_data ->> 'profile', ''),
    nullif(new.raw_user_meta_data ->> 'html_url', ''),
    format('https://github.com/%s', github_login)
  );

  insert into public.member_profiles as member_profile (
    id,
    github_login,
    display_name,
    avatar_url,
    github_url,
    joined_at
  )
  values (
    new.id,
    github_login,
    display_name,
    avatar_url,
    github_url,
    coalesce(new.created_at, timezone('utc', now()))
  )
  on conflict (id) do update
  set
    github_login = excluded.github_login,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    github_url = excluded.github_url,
    updated_at = timezone('utc', now())
  where member_profile.id = excluded.id;

  return new;
end;
$$;

drop trigger if exists sync_member_profile_from_auth_user on auth.users;

create trigger sync_member_profile_from_auth_user
after insert or update of raw_user_meta_data, raw_app_meta_data on auth.users
for each row
execute function public.sync_member_profile_from_auth_user();

alter table public.member_profiles enable row level security;

drop policy if exists "Public read visible member profiles" on public.member_profiles;
create policy "Public read visible member profiles"
on public.member_profiles
for select
using (is_visible = true);

revoke all on public.member_profiles from anon, authenticated;
grant select on public.member_profiles to anon, authenticated;
