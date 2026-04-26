-- Ejecutar en Supabase: SQL Editor -> New query -> Run.
-- Extiende member_profiles para paginas publicas tipo Linktree y edicion propia.

create table if not exists public.member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  github_login text not null,
  display_name text not null default '',
  avatar_url text not null default '',
  github_url text not null default '',
  joined_at timestamptz not null default now(),
  is_visible boolean not null default true
);

alter table public.member_profiles
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists slug text,
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists website_url text,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text,
  add column if not exists x_url text,
  add column if not exists is_public boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.member_profiles
set slug = lower(
  regexp_replace(
    regexp_replace(
      coalesce(nullif(github_login, ''), split_part(id::text, '-', 1)),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    ),
    '(^-+|-+$)',
    '',
    'g'
  )
)
where slug is null or slug = '';

create unique index if not exists member_profiles_user_id_key
  on public.member_profiles (user_id)
  where user_id is not null;

create unique index if not exists member_profiles_slug_key
  on public.member_profiles (slug)
  where slug is not null;

create index if not exists member_profiles_public_slug_idx
  on public.member_profiles (slug)
  where is_visible = true and is_public = true;

alter table public.member_profiles
  drop constraint if exists member_profiles_slug_format_check;

alter table public.member_profiles
  add constraint member_profiles_slug_format_check
  check (
    slug is null
    or slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$'
  );

alter table public.member_profiles
  drop constraint if exists member_profiles_bio_length_check;

alter table public.member_profiles
  add constraint member_profiles_bio_length_check
  check (bio is null or char_length(bio) <= 280);

alter table public.member_profiles
  drop constraint if exists member_profiles_location_length_check;

alter table public.member_profiles
  add constraint member_profiles_location_length_check
  check (location is null or char_length(location) <= 80);

alter table public.member_profiles
  drop constraint if exists member_profiles_urls_http_check;

alter table public.member_profiles
  add constraint member_profiles_urls_http_check
  check (
    (website_url is null or website_url ~* '^https?://')
    and (github_url is null or github_url ~* '^https?://')
    and (linkedin_url is null or linkedin_url ~* '^https?://')
    and (instagram_url is null or instagram_url ~* '^https?://')
    and (x_url is null or x_url ~* '^https?://')
  );

create or replace function public.member_profiles_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists member_profiles_set_updated_at on public.member_profiles;
create trigger member_profiles_set_updated_at
  before update on public.member_profiles
  for each row
  execute function public.member_profiles_set_updated_at();

alter table public.member_profiles enable row level security;

drop policy if exists "member_profiles_select_public" on public.member_profiles;
create policy "member_profiles_select_public"
  on public.member_profiles
  for select
  to anon, authenticated
  using (is_visible = true and is_public = true);

drop policy if exists "member_profiles_select_own" on public.member_profiles;
create policy "member_profiles_select_own"
  on public.member_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "member_profiles_insert_own" on public.member_profiles;
create policy "member_profiles_insert_own"
  on public.member_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "member_profiles_update_own" on public.member_profiles;
create policy "member_profiles_update_own"
  on public.member_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
