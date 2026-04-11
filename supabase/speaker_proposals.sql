-- Ejecutar en Supabase: SQL Editor → New query → Run.
-- Crea la tabla de propuestas de speaker y políticas RLS para usuarios autenticados.

create table if not exists public.speaker_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topics text not null,
  duration_minutes smallint not null check (duration_minutes in (30, 45, 60)),
  contact_email text,
  github_login text,
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists speaker_proposals_user_id_idx
  on public.speaker_proposals (user_id);

create index if not exists speaker_proposals_created_at_idx
  on public.speaker_proposals (created_at desc);

alter table public.speaker_proposals enable row level security;

drop policy if exists "speaker_proposals_insert_own" on public.speaker_proposals;
create policy "speaker_proposals_insert_own"
  on public.speaker_proposals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "speaker_proposals_select_own" on public.speaker_proposals;
create policy "speaker_proposals_select_own"
  on public.speaker_proposals
  for select
  to authenticated
  using (auth.uid() = user_id);
