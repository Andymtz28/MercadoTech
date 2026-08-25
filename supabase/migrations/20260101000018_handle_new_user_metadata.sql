-- Reemplaza handle_new_user(): ahora lee display_name y role desde
-- new.raw_user_meta_data (enviados por signUp(options.data) en el
-- registro). El role se valida contra una lista blanca ('buyer'|'seller') —
-- CUALQUIER otro valor, incluido 'admin' manipulado por el cliente, cae a
-- 'buyer'. Es la ÚNICA vía para fijar el role de un usuario nuevo: después
-- de este INSERT, protect_profile_role (Fase 2.3) bloquea que el propio
-- usuario se lo cambie.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' in ('buyer', 'seller') then new.raw_user_meta_data->>'role'
      else 'buyer'
    end
  );
  return new;
end;
$$;
