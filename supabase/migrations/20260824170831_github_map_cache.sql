-- Snapshot del mapa de GitHub (caché, no fuente de verdad).
-- SELECT público para leerlo; escritura solo con service_role (bypassa RLS).

create table if not exists public.github_map_cache (
  scope text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

comment on table public.github_map_cache is
  'Caché del visor de proyectos. Se regenera desde GitHub; evita gastar el rate limit del token.';

alter table public.github_map_cache enable row level security;

grant select on public.github_map_cache to anon, authenticated;
grant all on public.github_map_cache to service_role;

drop policy if exists "github_map_cache_select_public" on public.github_map_cache;
create policy "github_map_cache_select_public"
  on public.github_map_cache
  for select
  to anon, authenticated
  using (true);
