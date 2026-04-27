-- Webhook: tras cambios en member_profiles, POST a CuyoConnect /api/trigger-redeploy (Vercel Deploy Hook vía proxy).
-- Requiere extensión pg_net (suele existir en Supabase; si el push falla, habilitala en Dashboard → Database → Extensions).
-- El token lo completa: npm run db:redeploy-webhook (no lo pongas a mano en SQL).

create extension if not exists pg_net;

create schema if not exists cuyo_internal;

-- Una sola fila: token + URL; la API (scripts) hace el UPDATE acorde a env.
create table if not exists cuyo_internal.redeploy_trigger (
  id smallint primary key check (id = 1),
  bearer_token text not null default '',
  endpoint_url text not null default 'https://cuyoconnect.com/api/trigger-redeploy'
);

insert into cuyo_internal.redeploy_trigger (id, bearer_token, endpoint_url)
values (1, '', 'https://cuyoconnect.com/api/trigger-redeploy')
on conflict (id) do nothing;

revoke all on table cuyo_internal.redeploy_trigger from anon, authenticated;
grant all on table cuyo_internal.redeploy_trigger to postgres, service_role;

create or replace function cuyo_internal.notify_cuyo_redeploy()
returns trigger
language plpgsql
security definer
set search_path = public, cuyo_internal
as $$
declare
  tok text;
  ep text;
  body_json jsonb;
begin
  select nullif(trim(bearer_token), ''), nullif(trim(endpoint_url), '') into tok, ep
  from cuyo_internal.redeploy_trigger
  where id = 1;

  if tok is null or ep is null then
    return coalesce(new, old);
  end if;

  -- Payload mínimo: tu endpoint solo valida el header; el cuerpo puede ser genérico.
  body_json := jsonb_build_object(
    'type', tg_op,
    'table', tg_table_name
  );

  perform net.http_post(
    url := ep,
    body := body_json,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || tok
    ),
    timeout_milliseconds := 15000
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_member_profiles_cuyo_redeploy on public.member_profiles;

create trigger trg_member_profiles_cuyo_redeploy
  after insert or update or delete on public.member_profiles
  for each row
  execute function cuyo_internal.notify_cuyo_redeploy();

comment on function cuyo_internal.notify_cuyo_redeploy() is
  'Notifica a CuyoConnect para redeploy; token en cuyo_internal.redeploy_trigger (npm run db:redeploy-webhook).';
