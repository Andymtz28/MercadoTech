-- Corrige protect_profile_role(): la versión original bloqueaba CUALQUIER
-- cambio de role, incluso desde conexiones administrativas/scripts (seed,
-- migraciones) sin sesión de usuario, porque auth.uid() es NULL ahí y
-- is_admin() siempre da falso en ese contexto. Se detectó al correr
-- supabase/seed.sql contra un proyecto real (Fase 2.5): el UPDATE que
-- corrige el role de sellers/admin fallaba con "No tienes permiso para
-- cambiar tu rol".
--
-- La regla de negocio real es: un usuario AUTENTICADO no puede cambiar su
-- propio role salvo que sea admin. Fuera de una sesión autenticada
-- (auth.uid() is null) no aplica RLS de todos modos, así que tampoco debe
-- aplicar esta restricción.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.role <> old.role and not public.is_admin() then
    raise exception 'No tienes permiso para cambiar tu rol';
  end if;
  return new;
end;
$$;
