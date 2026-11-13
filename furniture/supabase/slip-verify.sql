-- Automatic slip check (run once in the SQL Editor; also included in schema.sql / setup.sql)
-- Result of the last automatic check, shown in the back office
alter table public.furniture_payments add column if not exists slip_check jsonb;

-- Every bank reference number accepted once, so the same slip can't pay twice
create table if not exists public.furniture_slip_refs (
  trans_ref text primary key,
  payment_id text not null references public.furniture_payments (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.furniture_slip_refs enable row level security;
drop policy if exists furniture_slip_refs_admin_read on public.furniture_slip_refs;
create policy furniture_slip_refs_admin_read on public.furniture_slip_refs for select to authenticated using (public.furniture_is_admin());
grant select on public.furniture_slip_refs to authenticated;
