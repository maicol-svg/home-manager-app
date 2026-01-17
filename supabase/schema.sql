-- ============================================
-- HOME MANAGER - Schema Database Supabase
-- ============================================
-- ESEGUI QUESTO SCRIPT IN UN'UNICA VOLTA
-- ============================================

-- Abilita UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- STEP 1: CREA TUTTE LE TABELLE (senza RLS)
-- ============================================

-- TABELLA: users (profilo utente esteso)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  telegram_user_id text unique,
  telegram_username text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABELLA: households (gruppi domestici)
create table public.households (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default upper(substring(md5(random()::text) from 1 for 6)),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABELLA: household_members
create table public.household_members (
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (household_id, user_id)
);

-- TABELLA: expense_categories
create table public.expense_categories (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  icon text,
  color text
);

-- TABELLA: expenses
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete set null,
  category_id uuid references public.expense_categories(id) on delete set null,
  amount decimal(10, 2) not null,
  description text,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABELLA: waste_schedules
create table public.waste_schedules (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  waste_type text not null,
  day_of_week integer check (day_of_week between 0 and 6) not null,
  reminder_time time not null,
  deadline_time time,
  is_active boolean default true
);

-- TABELLA: recurring_bills
create table public.recurring_bills (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  amount decimal(10, 2),
  due_day integer check (due_day between 1 and 31) not null,
  reminder_days_before integer default 3,
  category text,
  is_active boolean default true,
  last_paid_date date,
  source text check (source in ('manual', 'gmail')) default 'manual'
);

-- TABELLA: chores
create table public.chores (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  frequency text check (frequency in ('daily', 'weekly', 'monthly')) not null,
  current_assignee uuid references public.users(id) on delete set null,
  rotation_order uuid[] default '{}',
  last_completed timestamp with time zone,
  next_due timestamp with time zone
);

-- TABELLA: telegram_groups
create table public.telegram_groups (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  chat_id text not null unique,
  chat_title text,
  is_active boolean default true
);

-- TABELLA: telegram_link_codes
create table public.telegram_link_codes (
  code text primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '10 minutes') not null
);

-- ============================================
-- STEP 2: ABILITA RLS SU TUTTE LE TABELLE
-- ============================================

alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.waste_schedules enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.chores enable row level security;
alter table public.telegram_groups enable row level security;
alter table public.telegram_link_codes enable row level security;

-- ============================================
-- STEP 3: CREA TUTTE LE POLICY
-- ============================================

-- Policy per users
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Policy per households
create policy "Members can view their households"
  on public.households for select
  using (
    id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can update their households"
  on public.households for update
  using (
    id in (
      select household_id from public.household_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can create households"
  on public.households for insert
  with check (auth.uid() = created_by);

-- Policy per household_members
create policy "Members can view household members"
  on public.household_members for select
  using (
    household_id in (
      select hm.household_id from public.household_members hm
      where hm.user_id = auth.uid()
    )
  );

create policy "Admins can manage members"
  on public.household_members for all
  using (
    household_id in (
      select hm.household_id from public.household_members hm
      where hm.user_id = auth.uid() and hm.role = 'admin'
    )
  );

create policy "Users can join households"
  on public.household_members for insert
  with check (auth.uid() = user_id);

-- Policy per expense_categories
create policy "Members can view categories"
  on public.expense_categories for select
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can manage categories"
  on public.expense_categories for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Policy per expenses
create policy "Members can view expenses"
  on public.expenses for select
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Members can add expenses"
  on public.expenses for insert
  with check (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Policy per waste_schedules
create policy "Members can view waste schedules"
  on public.waste_schedules for select
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can manage waste schedules"
  on public.waste_schedules for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Policy per recurring_bills
create policy "Members can view bills"
  on public.recurring_bills for select
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can manage bills"
  on public.recurring_bills for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Policy per chores
create policy "Members can view chores"
  on public.chores for select
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can manage chores"
  on public.chores for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Assignees can update chores"
  on public.chores for update
  using (auth.uid() = current_assignee);

-- Policy per telegram_groups
create policy "Members can view telegram groups"
  on public.telegram_groups for select
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "Admins can manage telegram groups"
  on public.telegram_groups for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Policy per telegram_link_codes
create policy "Users can manage own link codes"
  on public.telegram_link_codes for all
  using (auth.uid() = user_id);

-- ============================================
-- STEP 4: TRIGGER E FUNZIONI
-- ============================================

-- Trigger per creare profilo utente alla registrazione
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Funzione: Genera codice invito
create or replace function public.generate_invite_code()
returns text as $$
begin
  return upper(substring(md5(random()::text) from 1 for 6));
end;
$$ language plpgsql;

-- Funzione: Unisciti a household con codice
create or replace function public.join_household_by_code(invite_code_input text)
returns uuid as $$
declare
  household_uuid uuid;
begin
  select id into household_uuid
  from public.households
  where invite_code = upper(invite_code_input);

  if household_uuid is null then
    raise exception 'Codice invito non valido';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (household_uuid, auth.uid(), 'member')
  on conflict do nothing;

  return household_uuid;
end;
$$ language plpgsql security definer;

-- ============================================
-- STEP 5: INDICI PER PERFORMANCE
-- ============================================

create index idx_expenses_household on public.expenses(household_id);
create index idx_expenses_date on public.expenses(date);
create index idx_expenses_user on public.expenses(user_id);
create index idx_waste_schedules_household on public.waste_schedules(household_id);
create index idx_recurring_bills_household on public.recurring_bills(household_id);
create index idx_chores_household on public.chores(household_id);
create index idx_household_members_user on public.household_members(user_id);
