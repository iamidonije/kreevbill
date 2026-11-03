
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  country text default 'NG',
  currency text not null default 'NGN',
  plan text not null default 'free' check (plan in ('free','premium','family')),
  notification_prefs jsonb not null default '{"email":true,"push":false,"days_before":3}'::jsonb,
  fx_rates jsonb not null default '{"NGN":1,"USD":1550,"GBP":1950,"CAD":1130,"GHS":105,"KES":12,"ZAR":85}'::jsonb,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  type text not null default 'subscription' check (type in ('subscription','bill','rent','school_fees','insurance','loan','other')),
  category text not null default 'other' check (category in ('streaming','utilities','internet','housing','education','insurance','fitness','cloud','other')),
  amount numeric(14,2) not null default 0,
  currency text not null default 'NGN',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('weekly','monthly','quarterly','yearly','one_time')),
  next_due_date date,
  is_variable boolean not null default false,
  topup_every_days int,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  is_usd_billed boolean not null default false,
  payment_method_note text,
  notes text,
  is_demo boolean not null default false,
  last_reviewed_at timestamptz,
  last_paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.items to authenticated;
grant all on public.items to service_role;
alter table public.items enable row level security;
create policy "own items" on public.items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  old_amount numeric(14,2) not null,
  new_amount numeric(14,2) not null,
  changed_at timestamptz not null default now()
);
grant select, insert, update, delete on public.price_history to authenticated;
grant all on public.price_history to service_role;
alter table public.price_history enable row level security;
create policy "own price history" on public.price_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.track_price_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.amount is distinct from old.amount then
    insert into public.price_history(item_id, user_id, old_amount, new_amount) values (new.id, new.user_id, old.amount, new.amount);
  end if;
  return new;
end; $$;
create trigger items_price_change after update on public.items for each row execute function public.track_price_change();

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  target_amount numeric(14,2) not null default 0,
  saved_amount numeric(14,2) not null default 0,
  target_date date,
  type text not null default 'other' check (type in ('rent','school_fees','emergency','travel','other')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.savings_goals to authenticated;
grant all on public.savings_goals to service_role;
alter table public.savings_goals enable row level security;
create policy "own goals" on public.savings_goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.savings_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  item_id uuid references public.items(id) on delete set null,
  action_type text not null check (action_type in ('cancel','downgrade','switch','negotiate')),
  estimated_monthly_saving numeric(14,2) not null default 0,
  confirmed boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.savings_actions to authenticated;
grant all on public.savings_actions to service_role;
alter table public.savings_actions enable row level security;
create policy "own actions" on public.savings_actions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  item_id uuid references public.items(id) on delete cascade,
  channel text not null default 'in_app',
  message text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  month date not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "own reports" on public.reports for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
