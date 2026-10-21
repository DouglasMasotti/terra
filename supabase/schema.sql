-- Shared storage for the Terrenos D / W dashboard.
-- Run this in Supabase Dashboard → SQL Editor after creating the project.

create table if not exists public.terra_allowed_users (
  email text primary key check (email = lower(email))
);

create table if not exists public.land_receipts (
  id text primary key,
  date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('D', 'W')),
  year integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.incc_rates (
  year_month text primary key check (year_month ~ '^20[2-3][0-9]-(0[1-9]|1[0-2])$'),
  rate numeric(8, 5) not null check (rate >= 0),
  source text,
  updated_at timestamptz not null default now()
);

insert into public.incc_rates (year_month, rate, source) values
  ('2026-01', 0.63, 'auto'), ('2026-02', 0.34, 'auto'),
  ('2026-03', 0.36, 'auto'), ('2026-04', 1.04, 'auto'),
  ('2026-05', 0.77, 'auto'), ('2026-06', 0.85, 'auto'),
  ('2026-07', 0.62, 'auto'), ('2026-08', 0.85, 'auto'),
  ('2026-09', 0.25, 'auto')
on conflict (year_month) do nothing;

alter table public.terra_allowed_users enable row level security;
alter table public.land_receipts enable row level security;
alter table public.incc_rates enable row level security;

-- The allowlist is only queried inside this function; client roles cannot read it.
create or replace function public.terra_user_is_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.terra_allowed_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.terra_user_is_allowed() from public;
grant execute on function public.terra_user_is_allowed() to authenticated;
revoke all on public.terra_allowed_users from anon, authenticated;
grant select, insert, update, delete on public.land_receipts, public.incc_rates to authenticated;

drop policy if exists "allowed users access receipts" on public.land_receipts;
create policy "allowed users access receipts" on public.land_receipts
  for all to authenticated
  using (public.terra_user_is_allowed())
  with check (public.terra_user_is_allowed());

drop policy if exists "allowed users access INCC rates" on public.incc_rates;
create policy "allowed users access INCC rates" on public.incc_rates
  for all to authenticated
  using (public.terra_user_is_allowed())
  with check (public.terra_user_is_allowed());

-- Enables immediate updates on the other signed-in device.
do $$ begin
  alter publication supabase_realtime add table public.land_receipts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.incc_rates;
exception when duplicate_object then null;
end $$;

-- Add the two account emails after running the schema:
-- insert into public.terra_allowed_users (email)
-- values (lower('first@example.com')), (lower('second@example.com'));
