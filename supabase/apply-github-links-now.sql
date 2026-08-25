-- Pegar en Supabase → SQL Editor → Run.
-- 1) Cierra la edición de links desde el cliente.
-- 2) Evita un redeploy por cada fila si no cambió nada visible.
-- 3) Backfill desde GitHub (25 ago 2026). Quien no tiene redes en GitHub
--    se deja como está (p. ej. MatiasBoldrini).

begin;

revoke update on public.member_profiles from authenticated;
drop policy if exists "member_profiles_update_own" on public.member_profiles;

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

-- NaEspinoza
update public.member_profiles
set website_url = 'https://ainsophic.com',
    linkedin_url = 'https://www.linkedin.com/in/nazarenoespinoza/',
    instagram_url = 'https://www.instagram.com/nz.espinoza/',
    x_url = null
where github_login = 'NaEspinoza';

-- Tobiinsaurralde
update public.member_profiles
set website_url = 'https://tobiasdev.com/',
    linkedin_url = 'https://www.linkedin.com/in/tobias-insaurralde-229168297/',
    instagram_url = null,
    x_url = 'https://x.com/0xTobiasDev'
where github_login = 'Tobiinsaurralde';

-- valentinocampos
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/valentino-campos-4724682a3',
    instagram_url = null,
    x_url = null
where github_login = 'valentinocampos';

-- facusteckler86
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/facundomsteckler/',
    instagram_url = 'https://instagram.com/facundosteckler',
    x_url = 'https://twitter.com/facusteckler'
where github_login = 'facusteckler86';

-- Nicobustelo
update public.member_profiles
set website_url = 'https://cuyoconnect.com',
    linkedin_url = 'https://www.linkedin.com/in/nicolas-bustelo',
    instagram_url = 'https://instagram.com/nico_bustelo',
    x_url = 'https://x.com/nicobustelo__'
where github_login = 'Nicobustelo';

-- juliocesarmarquez
update public.member_profiles
set website_url = null,
    linkedin_url = null,
    instagram_url = null,
    x_url = 'https://twitter.com/juliomarquez88'
where github_login = 'juliocesarmarquez';

-- Tthenix
update public.member_profiles
set website_url = 'https://nahuelquiroga.vercel.app/',
    linkedin_url = 'https://www.linkedin.com/in/nahuel-quiroga/',
    instagram_url = 'https://www.instagram.com/nahuelfacundox/',
    x_url = null
where github_login = 'Tthenix';

-- josemartinrodriguezmortaloni
update public.member_profiles
set website_url = 'https://josemartin.vercel.app/',
    linkedin_url = 'https://www.linkedin.com/in/josé-martín-rodriguez-mortaloni-2723a5204/',
    instagram_url = null,
    x_url = null
where github_login = 'josemartinrodriguezmortaloni';

-- N4ch0VS (GitHub no tiene Instagram; pisa el que estaba cargado a mano)
update public.member_profiles
set website_url = 'https://juanignacio.vercel.app/',
    linkedin_url = 'https://www.linkedin.com/in/juanignaciocalderondev',
    instagram_url = null,
    x_url = 'https://x.com/JuanIgnaciodev'
where github_login = 'N4ch0VS';

-- henrytongv
update public.member_profiles
set website_url = 'https://henrytongv.github.io',
    linkedin_url = 'http://www.linkedin.com/in/henry-tong-info',
    instagram_url = null,
    x_url = null
where github_login = 'henrytongv';

-- mauroradino
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/mauro-radino/',
    instagram_url = null,
    x_url = null
where github_login = 'mauroradino';

-- Facundo-Perello-04
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/facundo-perelló-a13312249',
    instagram_url = null,
    x_url = null
where github_login = 'Facundo-Perello-04';

-- MatiasSantaolaya
update public.member_profiles
set website_url = 'https://linktr.ee/mattsanto_',
    linkedin_url = null,
    instagram_url = null,
    x_url = 'https://twitter.com/mattsanto_'
where github_login = 'MatiasSantaolaya';

-- liobarrozo
update public.member_profiles
set website_url = 'https://turisuite.com',
    linkedin_url = 'https://www.linkedin.com/in/alejo-leonel-barrozo-56b05527a/',
    instagram_url = 'https://instagram.com/liobarrozo',
    x_url = null
where github_login = 'liobarrozo';

-- gipsy-yuilet-dev
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/julieta-eyzaguirre-arenas-171721167/',
    instagram_url = null,
    x_url = null
where github_login = 'gipsy-yuilet-dev';

-- artumarinn
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/arturo-marin-bosquet',
    instagram_url = 'https://www.instagram.com/artumarin/',
    x_url = 'https://x.com/marinartu'
where github_login = 'artumarinn';

-- JoaquinCortezHub
update public.member_profiles
set website_url = 'https://cuyoconnect.com',
    linkedin_url = 'https://www.linkedin.com/in/joaquín-cortez/',
    instagram_url = 'https://www.instagram.com/joacolcortez/',
    x_url = 'https://x.com/JoacoLCortez'
where github_login = 'JoaquinCortezHub';

-- ticiAngelucci (GENERIC de GitHub = Spotify)
update public.member_profiles
set website_url = 'https://open.spotify.com/user/213o76plqr2xdfjllqwcu42dy',
    linkedin_url = null,
    instagram_url = null,
    x_url = null
where github_login = 'ticiAngelucci';

-- Stefano-Cintioli
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/stefanocintioli/',
    instagram_url = null,
    x_url = 'https://x.com/s_cintioli_'
where github_login = 'Stefano-Cintioli';

-- mauricioMedinaHM (GitHub no tiene Instagram; pisa el que estaba cargado a mano)
update public.member_profiles
set website_url = null,
    linkedin_url = 'https://www.linkedin.com/in/mauricio-medina-dev/',
    instagram_url = null,
    x_url = 'https://x.com/mauriHm_'
where github_login = 'mauricioMedinaHM';

commit;
