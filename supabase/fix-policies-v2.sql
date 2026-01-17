-- ============================================
-- FIX V2: Funzione SECURITY DEFINER per creazione household
-- ============================================

-- Assicurati che l'utente esista nella tabella users
create or replace function public.ensure_user_exists()
returns void as $$
declare
  current_user_id uuid := auth.uid();
  user_email text;
  user_name text;
begin
  -- Ottieni info dall'auth
  select email, raw_user_meta_data->>'full_name'
  into user_email, user_name
  from auth.users
  where id = current_user_id;

  -- Inserisci se non esiste
  insert into public.users (id, email, full_name)
  values (current_user_id, user_email, user_name)
  on conflict (id) do nothing;
end;
$$ language plpgsql security definer;

-- Funzione per creare household + membership in modo atomico
create or replace function public.create_household_with_admin(household_name text)
returns json as $$
declare
  new_household_id uuid;
  new_invite_code text;
  current_user_id uuid := auth.uid();
  result json;
begin
  -- Assicurati che l'utente esista
  perform public.ensure_user_exists();

  -- Verifica che l'utente non sia già in un household
  if exists (select 1 from public.household_members where user_id = current_user_id) then
    return json_build_object('success', false, 'error', 'Sei già membro di una casa');
  end if;

  -- Genera codice invito
  new_invite_code := upper(substring(md5(random()::text) from 1 for 6));

  -- Crea l'household
  insert into public.households (name, invite_code, created_by)
  values (household_name, new_invite_code, current_user_id)
  returning id into new_household_id;

  -- Aggiungi l'utente come admin
  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, current_user_id, 'admin');

  -- Crea categorie di default
  insert into public.expense_categories (household_id, name, icon, color) values
    (new_household_id, 'Spesa alimentare', 'shopping-cart', '#22c55e'),
    (new_household_id, 'Bollette', 'file-text', '#f59e0b'),
    (new_household_id, 'Trasporti', 'car', '#3b82f6'),
    (new_household_id, 'Casa', 'home', '#8b5cf6'),
    (new_household_id, 'Svago', 'smile', '#ec4899'),
    (new_household_id, 'Altro', 'more-horizontal', '#6b7280');

  -- Restituisci il risultato
  select json_build_object(
    'success', true,
    'household', json_build_object(
      'id', new_household_id,
      'name', household_name,
      'invite_code', new_invite_code,
      'created_by', current_user_id
    )
  ) into result;

  return result;

exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;

-- Funzione per unirsi a un household
create or replace function public.join_household_with_code(invite_code_param text)
returns json as $$
declare
  found_household_id uuid;
  found_household_name text;
  found_invite_code text;
  current_user_id uuid := auth.uid();
  result json;
begin
  -- Assicurati che l'utente esista
  perform public.ensure_user_exists();

  -- Verifica che l'utente non sia già in un household
  if exists (select 1 from public.household_members where user_id = current_user_id) then
    return json_build_object('success', false, 'error', 'Sei già membro di una casa');
  end if;

  -- Cerca l'household con il codice
  select id, name, invite_code
  into found_household_id, found_household_name, found_invite_code
  from public.households
  where invite_code = upper(trim(invite_code_param));

  if found_household_id is null then
    return json_build_object('success', false, 'error', 'Codice invito non valido');
  end if;

  -- Aggiungi l'utente come membro
  insert into public.household_members (household_id, user_id, role)
  values (found_household_id, current_user_id, 'member');

  -- Restituisci il risultato
  return json_build_object(
    'success', true,
    'household', json_build_object(
      'id', found_household_id,
      'name', found_household_name,
      'invite_code', found_invite_code
    )
  );

exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;

-- Aggiorna policy households per permettere SELECT anche senza membership (per join)
drop policy if exists "Anyone can view households by invite code" on public.households;
create policy "Anyone can view households by invite code"
  on public.households for select
  using (true);  -- Permettiamo SELECT, tanto non mostra dati sensibili
