-- ============================================
-- FIX: Rimuovi policy con ricorsione infinita
-- ============================================

-- Elimina le policy problematiche su household_members
drop policy if exists "Members can view household members" on public.household_members;
drop policy if exists "Admins can manage members" on public.household_members;
drop policy if exists "Users can join households" on public.household_members;

-- Elimina le policy problematiche su households
drop policy if exists "Members can view their households" on public.households;
drop policy if exists "Admins can update their households" on public.households;
drop policy if exists "Users can create households" on public.households;

-- ============================================
-- Ricrea policy SENZA ricorsione
-- ============================================

-- Policy per household_members (NON può riferire a se stessa)
-- Gli utenti possono vedere i membri del proprio household
create policy "Users can view own membership"
  on public.household_members for select
  using (user_id = auth.uid());

-- Gli utenti possono vedere gli altri membri dello stesso household
-- Usando una funzione security definer per evitare ricorsione
create or replace function public.get_user_household_ids()
returns setof uuid as $$
  select household_id from public.household_members where user_id = auth.uid();
$$ language sql security definer stable;

create policy "Users can view household co-members"
  on public.household_members for select
  using (household_id in (select public.get_user_household_ids()));

-- Gli utenti possono unirsi a un household (insert)
create policy "Users can join households"
  on public.household_members for insert
  with check (user_id = auth.uid());

-- Funzione per verificare se l'utente è admin
create or replace function public.is_household_admin(hh_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.household_members
    where household_id = hh_id
    and user_id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer stable;

-- Admin possono aggiornare i membri
create policy "Admins can update members"
  on public.household_members for update
  using (public.is_household_admin(household_id));

-- Admin possono rimuovere membri (ma non se stessi per sicurezza)
create policy "Admins can delete members"
  on public.household_members for delete
  using (public.is_household_admin(household_id) and user_id != auth.uid());

-- ============================================
-- Policy per households
-- ============================================

-- Gli utenti possono vedere i propri household
create policy "Members can view their households"
  on public.households for select
  using (id in (select public.get_user_household_ids()));

-- Gli utenti possono creare household
create policy "Users can create households"
  on public.households for insert
  with check (auth.uid() = created_by);

-- Admin possono aggiornare il proprio household
create policy "Admins can update their households"
  on public.households for update
  using (public.is_household_admin(id));

-- ============================================
-- Policy per altre tabelle (usa la funzione)
-- ============================================

-- Aggiorna policy expense_categories
drop policy if exists "Members can view categories" on public.expense_categories;
drop policy if exists "Admins can manage categories" on public.expense_categories;

create policy "Members can view categories"
  on public.expense_categories for select
  using (household_id in (select public.get_user_household_ids()));

create policy "Members can insert categories"
  on public.expense_categories for insert
  with check (household_id in (select public.get_user_household_ids()));

create policy "Admins can update categories"
  on public.expense_categories for update
  using (public.is_household_admin(household_id));

create policy "Admins can delete categories"
  on public.expense_categories for delete
  using (public.is_household_admin(household_id));

-- Aggiorna policy expenses
drop policy if exists "Members can view expenses" on public.expenses;
drop policy if exists "Members can add expenses" on public.expenses;

create policy "Members can view expenses"
  on public.expenses for select
  using (household_id in (select public.get_user_household_ids()));

create policy "Members can add expenses"
  on public.expenses for insert
  with check (household_id in (select public.get_user_household_ids()));

-- Aggiorna policy waste_schedules
drop policy if exists "Members can view waste schedules" on public.waste_schedules;
drop policy if exists "Admins can manage waste schedules" on public.waste_schedules;

create policy "Members can view waste schedules"
  on public.waste_schedules for select
  using (household_id in (select public.get_user_household_ids()));

create policy "Admins can manage waste schedules"
  on public.waste_schedules for all
  using (public.is_household_admin(household_id));

-- Aggiorna policy recurring_bills
drop policy if exists "Members can view bills" on public.recurring_bills;
drop policy if exists "Admins can manage bills" on public.recurring_bills;

create policy "Members can view bills"
  on public.recurring_bills for select
  using (household_id in (select public.get_user_household_ids()));

create policy "Admins can manage bills"
  on public.recurring_bills for all
  using (public.is_household_admin(household_id));

-- Aggiorna policy chores
drop policy if exists "Members can view chores" on public.chores;
drop policy if exists "Admins can manage chores" on public.chores;

create policy "Members can view chores"
  on public.chores for select
  using (household_id in (select public.get_user_household_ids()));

create policy "Admins can manage chores"
  on public.chores for all
  using (public.is_household_admin(household_id));

-- Aggiorna policy telegram_groups
drop policy if exists "Members can view telegram groups" on public.telegram_groups;
drop policy if exists "Admins can manage telegram groups" on public.telegram_groups;

create policy "Members can view telegram groups"
  on public.telegram_groups for select
  using (household_id in (select public.get_user_household_ids()));

create policy "Admins can manage telegram groups"
  on public.telegram_groups for all
  using (public.is_household_admin(household_id));
