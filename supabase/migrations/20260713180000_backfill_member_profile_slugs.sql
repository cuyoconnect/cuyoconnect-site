-- Backfill slug desde github_login para member_profiles sin slug.
-- Evita 404 en /u/{slug} cuando el registro existe pero slug quedó null.

create or replace function public.member_profiles_normalize_slug(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(
      regexp_replace(
        regexp_replace(coalesce(raw, ''), '[^a-zA-Z0-9]+', '-', 'g'),
        '(^-+|-+$)',
        '',
        'g'
      )
    ),
    ''
  );
$$;

create or replace function public.member_profiles_ensure_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  candidate text;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    new.slug := public.member_profiles_normalize_slug(new.slug);
    return new;
  end if;

  candidate := public.member_profiles_normalize_slug(new.github_login);
  if candidate is null then
    candidate := 'miembro-' || substr(replace(coalesce(new.id::text, gen_random_uuid()::text), '-', ''), 1, 8);
  end if;

  new.slug := left(candidate, 32);
  return new;
end;
$$;

drop trigger if exists member_profiles_ensure_slug on public.member_profiles;
create trigger member_profiles_ensure_slug
  before insert or update on public.member_profiles
  for each row
  execute function public.member_profiles_ensure_slug();

update public.member_profiles
set slug = coalesce(
  public.member_profiles_normalize_slug(github_login),
  'miembro-' || substr(replace(id::text, '-', ''), 1, 8)
)
where slug is null or btrim(slug) = '';
