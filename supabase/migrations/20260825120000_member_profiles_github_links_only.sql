-- Los links del perfil salen de GitHub (cron semanal / refresh).
-- Los miembros ya no pueden editar su fila desde el cliente.
revoke update on public.member_profiles from authenticated;

drop policy if exists "member_profiles_update_own" on public.member_profiles;

-- Evita un redeploy por cada fila del sync semanal si no cambió nada visible.
-- Si el webhook de redeploy nunca se aplicó, se saltea el trigger.
drop trigger if exists trg_member_profiles_cuyo_redeploy on public.member_profiles;

do $$
begin
  if to_regprocedure('cuyo_internal.notify_cuyo_redeploy()') is null then
    return;
  end if;

  execute $trig$
    create trigger trg_member_profiles_cuyo_redeploy
      after insert or update or delete on public.member_profiles
      for each row
      when (
        tg_op <> 'UPDATE'
        or new.website_url is distinct from old.website_url
        or new.linkedin_url is distinct from old.linkedin_url
        or new.instagram_url is distinct from old.instagram_url
        or new.x_url is distinct from old.x_url
        or new.display_name is distinct from old.display_name
        or new.avatar_url is distinct from old.avatar_url
        or new.github_url is distinct from old.github_url
        or new.slug is distinct from old.slug
        or new.location is distinct from old.location
        or new.bio is distinct from old.bio
        or new.is_visible is distinct from old.is_visible
        or new.is_public is distinct from old.is_public
      )
      execute function cuyo_internal.notify_cuyo_redeploy()
  $trig$;
end
$$;

