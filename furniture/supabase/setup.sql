-- Furniture Design — one-step setup: paste ALL of this into Supabase → SQL Editor → New query → Run
-- (same as schema.sql followed by seed.sql; safe to run again)

-- =====================================================================
-- Furniture — online room / furniture layout designer (paid access)
-- Lives in the same Supabase project as B2 Rental, in its own furniture_* tables
-- and storage bucket, so the two sites never see each other's data.
-- Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE.
--
-- Business model: nothing is sold except access to the designer.
--   * A customer picks a plan (e.g. 1 day / 7 days / 30 days) and pays by PromptPay.
--   * After paying they get a claim token for that payment (kept in their browser) to watch its status.
--   * When an admin approves the slip, the customer receives their secret access code (shown as text and
--     as a QR login link to scan); the code's access is extended by the plan's days.
--   * With an active code the customer can save designs to the cloud and export them.
--
-- Security model
--   * Public (anon) can READ active plans + shop settings. Everything else goes through the
--     RPC functions below, which require the customer's secret access code.
--   * Admins (users listed in public.furniture_admins) can read/write everything.
-- =====================================================================

-- ---------- Tables ----------
create table if not exists public.furniture_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.furniture_settings (
  id int primary key default 1 check (id = 1), -- single row
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.furniture_plans (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{2,40}$'),
  name text not null check (length(name) between 1 and 80),
  days int not null check (days between 1 and 3660),
  price int not null check (price between 0 and 1000000),
  description text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.furniture_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- secret access code the customer signs in with
  name text not null,
  phone text not null,
  line_id text,
  expires_at timestamptz,                    -- null = never paid yet
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists furniture_accounts_phone on public.furniture_accounts (phone);

create sequence if not exists public.furniture_payment_seq start 1001;

create table if not exists public.furniture_payments (
  id text primary key,
  account_id uuid not null references public.furniture_accounts (id) on delete cascade,
  plan_id text,
  plan_name text not null,
  days int not null,
  amount int not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  slip_path text,
  old_slips text[] not null default '{}',     -- earlier slips for this payment (kept as evidence, never deleted)
  claim_token text not null default '',      -- secret that lets the buyer follow this payment and receive the code
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists furniture_payments_account on public.furniture_payments (account_id, created_at desc);

create table if not exists public.furniture_projects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.furniture_accounts (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  data jsonb not null check (pg_column_size(data) < 400000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists furniture_projects_account on public.furniture_projects (account_id, updated_at desc);

-- ---------- Helpers ----------
create or replace function public.furniture_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.furniture_admins where user_id = auth.uid());
$$;

create or replace function public.furniture_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists furniture_accounts_touch on public.furniture_accounts;
create trigger furniture_accounts_touch before update on public.furniture_accounts for each row execute function public.furniture_touch();
drop trigger if exists furniture_projects_touch on public.furniture_projects;
create trigger furniture_projects_touch before update on public.furniture_projects for each row execute function public.furniture_touch();
drop trigger if exists furniture_settings_touch on public.furniture_settings;
create trigger furniture_settings_touch before update on public.furniture_settings for each row execute function public.furniture_touch();

-- 10-character code from an alphabet without look-alike characters (32^10 ≈ 10^15 combinations);
-- skips uuid bytes 6 and 8, which carry fixed version/variant bits
create or replace function public.furniture_new_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := uuid_send(gen_random_uuid());
  res text := '';
  i int;
begin
  for i in 0..9 loop
    res := res || substr(alphabet, (get_byte(bytes, case when i < 6 then i else i + 4 end) % 32) + 1, 1);
  end loop;
  return res;
end $$;

-- Customer-typed code → stored form (case-insensitive, dashes/spaces ignored)
create or replace function public.furniture_norm_code(p text) returns text
language sql immutable set search_path = public as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

create or replace function public.furniture_account_json(a public.furniture_accounts) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'code', a.code, 'name', a.name, 'phone', a.phone, 'lineId', a.line_id,
    'expiresAt', to_char(a.expires_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI'),
    'active', coalesce(a.expires_at > now(), false),
    'createdAt', to_char(a.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI')
  );
$$;

create or replace function public.furniture_payment_json(p public.furniture_payments) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'planName', p.plan_name, 'days', p.days, 'amount', p.amount, 'status', p.status,
    'hasSlip', coalesce(p.slip_path, '') <> '',
    'createdAt', to_char(p.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI'),
    'decidedAt', to_char(p.decided_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI')
  );
$$;

-- Approving a payment extends the account's access; un-approving takes the days back
create or replace function public.furniture_payment_decide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = old.status then return new; end if;
  new.decided_at := case when new.status = 'Pending' then null else now() end;
  if new.status = 'Approved' then
    update public.furniture_accounts
       set expires_at = greatest(coalesce(expires_at, now()), now()) + make_interval(days => new.days)
     where id = new.account_id;
  elsif old.status = 'Approved' then
    update public.furniture_accounts
       set expires_at = expires_at - make_interval(days => old.days)
     where id = new.account_id;
  end if;
  return new;
end $$;
drop trigger if exists furniture_payments_decide on public.furniture_payments;
create trigger furniture_payments_decide before update of status on public.furniture_payments
  for each row execute function public.furniture_payment_decide();

-- Look up an account by its secret code (raises when wrong)
create or replace function public.furniture_account_by_code(p_code text) returns public.furniture_accounts
language plpgsql stable security definer set search_path = public as $$
declare a public.furniture_accounts;
begin
  select * into a from public.furniture_accounts where code = public.furniture_norm_code(p_code);
  if a.id is null then raise exception 'invalid_code'; end if;
  return a;
end $$;

create or replace function public.furniture_new_payment(p_account uuid, p_plan_id text) returns public.furniture_payments
language plpgsql volatile security definer set search_path = public as $$
declare pl public.furniture_plans; row public.furniture_payments;
  today date := (now() at time zone 'Asia/Bangkok')::date;
begin
  select * into pl from public.furniture_plans where id = p_plan_id and active;
  if pl.id is null then raise exception 'invalid_plan'; end if;
  if (select count(*) from public.furniture_payments where account_id = p_account and status = 'Pending') >= 3 then
    raise exception 'too_many_pending';
  end if;
  insert into public.furniture_payments (id, account_id, plan_id, plan_name, days, amount, claim_token)
  values ('FD-' || to_char(today, 'YYYY') || '-' || lpad(nextval('public.furniture_payment_seq')::text, 4, '0'),
          p_account, pl.id, pl.name, pl.days, pl.price, public.furniture_new_code() || public.furniture_new_code())
  returning * into row;
  return row;
end $$;

-- ---------- Row Level Security ----------
alter table public.furniture_admins enable row level security;
alter table public.furniture_settings enable row level security;
alter table public.furniture_plans enable row level security;
alter table public.furniture_accounts enable row level security;
alter table public.furniture_payments enable row level security;
alter table public.furniture_projects enable row level security;

drop policy if exists furniture_admins_self on public.furniture_admins;
create policy furniture_admins_self on public.furniture_admins for select to authenticated using (user_id = auth.uid());

drop policy if exists furniture_settings_read on public.furniture_settings;
create policy furniture_settings_read on public.furniture_settings for select to anon, authenticated using (true);
drop policy if exists furniture_settings_admin on public.furniture_settings;
create policy furniture_settings_admin on public.furniture_settings for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

drop policy if exists furniture_plans_read on public.furniture_plans;
create policy furniture_plans_read on public.furniture_plans for select to anon, authenticated
  using (active or public.furniture_is_admin());
drop policy if exists furniture_plans_admin on public.furniture_plans;
create policy furniture_plans_admin on public.furniture_plans for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

drop policy if exists furniture_accounts_admin on public.furniture_accounts;
create policy furniture_accounts_admin on public.furniture_accounts for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());
drop policy if exists furniture_projects_admin on public.furniture_projects;
create policy furniture_projects_admin on public.furniture_projects for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

-- Customers who have paid can't be deleted (their payments are accounting records)
create or replace function public.furniture_keep_paid_accounts() returns trigger
language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.furniture_payments where account_id = old.id and status = 'Approved') then
    raise exception 'has_payments';
  end if;
  return old;
end $$;
drop trigger if exists furniture_accounts_keep on public.furniture_accounts;
create trigger furniture_accounts_keep before delete on public.furniture_accounts
  for each row execute function public.furniture_keep_paid_accounts();

-- ---------- Public RPCs (customers) ----------
-- New customer: create the account + the first payment. The access code is NOT returned here —
-- the buyer gets it from furniture_claim once the payment is approved.
create or replace function public.furniture_start(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_phone text := regexp_replace(coalesce(p->>'phone', ''), '[^0-9]', '', 'g');
  v_name text := trim(coalesce(p->>'name', ''));
  a public.furniture_accounts; pay public.furniture_payments; c text;
begin
  if length(v_name) < 2 or length(v_name) > 120 then raise exception 'invalid_name'; end if;
  if v_phone !~ '^0[0-9]{8,9}$' then raise exception 'invalid_phone'; end if;
  if (select count(*) from public.furniture_accounts where phone = v_phone and expires_at is null
        and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too_many_pending';
  end if;
  loop
    c := public.furniture_new_code();
    exit when not exists (select 1 from public.furniture_accounts where code = c);
  end loop;
  insert into public.furniture_accounts (code, name, phone, line_id)
  values (c, v_name, v_phone, nullif(left(regexp_replace(coalesce(p->>'lineId', ''), '[^A-Za-z0-9._@-]', '', 'g'), 40), ''))
  returning * into a;
  pay := public.furniture_new_payment(a.id, p->>'planId');
  return jsonb_build_object('payment', public.furniture_payment_json(pay), 'claimToken', pay.claim_token);
end $$;

-- Existing customer: buy / renew a plan with their code
create or replace function public.furniture_buy(p_code text, p_plan_id text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code); pay public.furniture_payments;
begin
  pay := public.furniture_new_payment(a.id, p_plan_id);
  return jsonb_build_object('payment', public.furniture_payment_json(pay), 'claimToken', pay.claim_token);
end $$;

-- Buyer follows a payment with its claim token; once approved the access code is handed over
create or replace function public.furniture_claim(p_id text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare pay public.furniture_payments; a public.furniture_accounts;
begin
  select * into pay from public.furniture_payments
   where id = upper(trim(p_id)) and claim_token = public.furniture_norm_code(p_token) and length(claim_token) = 20;
  if pay.id is null then raise exception 'not_found'; end if;
  select * into a from public.furniture_accounts where id = pay.account_id;
  return jsonb_build_object(
    'payment', public.furniture_payment_json(pay),
    'code', case when pay.status = 'Approved' then a.code end,
    'expiresAt', case when pay.status = 'Approved' then to_char(a.expires_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI') end
  );
end $$;

create or replace function public.furniture_claim_slip(p_id text, p_token text, p_path text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare row public.furniture_payments;
begin
  if p_path !~ '^pending/[A-Za-z0-9_-]+\.jpg$' then raise exception 'invalid_slip'; end if;
  update public.furniture_payments
     set old_slips = case when coalesce(slip_path, '') <> '' then old_slips || slip_path else old_slips end,
         slip_path = p_path
   where id = upper(trim(p_id)) and claim_token = public.furniture_norm_code(p_token) and length(claim_token) = 20
     and status = 'Pending'
  returning * into row;
  if row.id is null then raise exception 'not_allowed'; end if;
  return public.furniture_payment_json(row);
end $$;

-- Account status, payments and number of saved designs
create or replace function public.furniture_account(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code);
begin
  return jsonb_build_object(
    'account', public.furniture_account_json(a),
    'payments', coalesce((select jsonb_agg(public.furniture_payment_json(x) order by x.created_at desc)
                            from (select * from public.furniture_payments where account_id = a.id
                                   order by created_at desc limit 20) x), '[]'::jsonb),
    'projectCount', (select count(*) from public.furniture_projects where account_id = a.id)
  );
end $$;

create or replace function public.furniture_attach_slip(p_code text, p_payment_id text, p_path text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code); row public.furniture_payments;
begin
  if p_path !~ '^pending/[A-Za-z0-9_-]+\.jpg$' then raise exception 'invalid_slip'; end if;
  update public.furniture_payments
     set old_slips = case when coalesce(slip_path, '') <> '' then old_slips || slip_path else old_slips end,
         slip_path = p_path
   where id = upper(trim(p_payment_id)) and account_id = a.id and status = 'Pending'
  returning * into row;
  if row.id is null then raise exception 'not_allowed'; end if;
  return public.furniture_payment_json(row);
end $$;

create or replace function public.furniture_projects_list(p_code text)
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code);
begin
  return query
    select jsonb_build_object('id', pr.id, 'name', pr.name, 'kind', coalesce(pr.data->>'kind', 'room'),
             'room', pr.data->'room', 'itemCount', coalesce(jsonb_array_length(pr.data->'items'), 0),
             'updatedAt', to_char(pr.updated_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI'))
      from public.furniture_projects pr where pr.account_id = a.id order by pr.updated_at desc;
end $$;

create or replace function public.furniture_project_get(p_code text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code); pr public.furniture_projects;
begin
  select * into pr from public.furniture_projects where id = p_id and account_id = a.id;
  if pr.id is null then raise exception 'not_found'; end if;
  return jsonb_build_object('id', pr.id, 'name', pr.name, 'data', pr.data);
end $$;

-- Saving needs an active (paid) access code
create or replace function public.furniture_project_save(p_code text, p_id uuid, p_name text, p_data jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code); pr public.furniture_projects;
  nm text := left(coalesce(nullif(trim(p_name), ''), 'แบบไม่มีชื่อ'), 120);
begin
  if not coalesce(a.expires_at > now(), false) then raise exception 'access_expired'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' or jsonb_typeof(p_data->'items') is distinct from 'array'
     or jsonb_array_length(p_data->'items') > 500 then raise exception 'invalid_design'; end if;
  if pg_column_size(p_data) >= 400000 then raise exception 'invalid_design'; end if;
  if p_id is null then
    if (select count(*) from public.furniture_projects where account_id = a.id) >= 100 then raise exception 'too_many_projects'; end if;
    insert into public.furniture_projects (account_id, name, data) values (a.id, nm, p_data) returning * into pr;
  else
    update public.furniture_projects set name = nm, data = p_data where id = p_id and account_id = a.id returning * into pr;
    if pr.id is null then raise exception 'not_found'; end if;
  end if;
  return jsonb_build_object('id', pr.id, 'name', pr.name,
    'updatedAt', to_char(pr.updated_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI'));
end $$;

create or replace function public.furniture_project_delete(p_code text, p_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare a public.furniture_accounts := public.furniture_account_by_code(p_code);
begin
  delete from public.furniture_projects where id = p_id and account_id = a.id;
end $$;

-- ---------- Function permissions: only what the website needs ----------
do $$
declare f text;
begin
  foreach f in array array[
    'furniture_start(jsonb)', 'furniture_buy(text, text)', 'furniture_account(text)',
    'furniture_claim(text, text)', 'furniture_claim_slip(text, text, text)',
    'furniture_attach_slip(text, text, text)', 'furniture_projects_list(text)',
    'furniture_project_get(text, uuid)', 'furniture_project_save(text, uuid, text, jsonb)',
    'furniture_project_delete(text, uuid)', 'furniture_is_admin()'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  -- Supabase grants EXECUTE to anon/authenticated directly, so internal helpers are revoked explicitly
  foreach f in array array[
    'furniture_touch()', 'furniture_new_code()', 'furniture_payment_decide()', 'furniture_keep_paid_accounts()',
    'furniture_account_by_code(text)', 'furniture_new_payment(uuid, text)',
    'furniture_account_json(public.furniture_accounts)', 'furniture_payment_json(public.furniture_payments)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.furniture_plans, public.furniture_settings to anon;
grant select, insert, update, delete on public.furniture_plans, public.furniture_settings, public.furniture_accounts,
  public.furniture_projects, public.furniture_admins to authenticated;
grant select, update on public.furniture_payments to authenticated;

-- ---------- Storage (payment slips) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('furniture-slips', 'furniture-slips', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "furniture slips customer upload" on storage.objects;
create policy "furniture slips customer upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'furniture-slips' and name ~ '^pending/[A-Za-z0-9_-]+\.jpg$');
drop policy if exists "furniture slips admin read" on storage.objects;
create policy "furniture slips admin read" on storage.objects for select to authenticated
  using (bucket_id = 'furniture-slips' and public.furniture_is_admin());
-- No delete policy: payment slips are kept permanently as evidence for tax / accounting.
drop policy if exists "furniture slips admin delete" on storage.objects;

-- Payments are financial records: they can change status but never be deleted from the website
drop policy if exists furniture_payments_admin on public.furniture_payments;
drop policy if exists furniture_payments_admin_read on public.furniture_payments;
create policy furniture_payments_admin_read on public.furniture_payments for select to authenticated using (public.furniture_is_admin());
drop policy if exists furniture_payments_admin_update on public.furniture_payments;
create policy furniture_payments_admin_update on public.furniture_payments for update to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

-- ---------- Realtime: admin screens update instantly on new payments ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'furniture_payments') then
    alter publication supabase_realtime add table public.furniture_payments;
  end if;
end $$;

-- Starter data — run after schema.sql (safe to re-run; existing rows are kept)

-- Shop owners: everyone who is already a B2 Rental admin can manage this site too
insert into public.furniture_admins (user_id) select user_id from public.admins on conflict do nothing;

insert into public.furniture_settings (id, data) values (1, '{
  "shopName": "Furniture Design",
  "tagline": "ออกแบบจัดวางเฟอร์นิเจอร์ในห้องของคุณ ง่าย ๆ ผ่านเว็บ",
  "phone": "",
  "lineOaId": "",
  "facebookUrl": "",
  "openHours": "ทุกวัน 09:00 – 18:00",
  "promptPayId": "",
  "accountName": "",
  "allowTrial": true
}') on conflict (id) do nothing;

-- Daily pricing (edit in the back office → แพ็กเกจ)
insert into public.furniture_plans (id, name, days, price, description, sort_order) values
  ('day1', '1 วัน', 1, 50, 'ใช้งานได้ 24 ชั่วโมง', 1),
  ('day3', '3 วัน', 3, 100, 'ใช้งานได้ 72 ชั่วโมง คุ้มกว่า', 2)
on conflict (id) do nothing;

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
