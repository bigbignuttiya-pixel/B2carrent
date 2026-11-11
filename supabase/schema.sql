-- =====================================================================
-- B2 Rental — Supabase schema
-- Run once in Supabase Dashboard → SQL Editor (then run seed.sql).
-- Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE.
--
-- Security model
--   * Public (anon) can READ vehicles + settings, and can only touch
--     bookings through the RPC functions below (prices are computed on
--     the server, so a customer cannot change the amount).
--   * Admins (users listed in public.admins) can read/write everything.
-- =====================================================================

-- ---------- Tables ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id text primary key,
  data jsonb not null,                       -- full vehicle object (name, pricePerDay, status, image, gallery…)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1), -- single row
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key check (code = upper(code) and length(code) between 3 and 30),
  percent int not null check (percent between 1 and 90),
  active boolean not null default true,
  label text not null default '',
  only_category text
);

create table if not exists public.addon_prices (
  id text primary key,
  price int not null check (price >= 0),
  unit text not null check (unit in ('free', 'day', 'trip')),
  trips int not null default 1,
  only_for text check (only_for in ('Motorcycle', 'Car'))
);

create sequence if not exists public.booking_seq start 1001;

create table if not exists public.bookings (
  id text primary key,
  vehicle_id text not null references public.vehicles (id) on update cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Picked Up', 'Completed', 'Cancelled')),
  phone text not null,
  total_price int not null,
  data jsonb not null,                       -- remaining booking fields (customer, addons, price breakdown, slipPath…)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists bookings_vehicle_dates on public.bookings (vehicle_id, start_date, end_date);
create index if not exists bookings_phone on public.bookings (phone);

-- ---------- Helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists vehicles_touch on public.vehicles;
create trigger vehicles_touch before update on public.vehicles for each row execute function public.touch_updated_at();
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- Booking row → object shape used by the web app
create or replace function public.booking_json(b public.bookings) returns jsonb
language sql stable set search_path = public as $$
  select (b.data - 'slipPath')
    || jsonb_build_object(
      'id', b.id, 'vehicleId', b.vehicle_id, 'startDate', b.start_date, 'endDate', b.end_date,
      'status', b.status, 'phone', b.phone, 'totalPrice', b.total_price,
      'createdAt', to_char(b.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI'),
      'hasSlip', (b.data ? 'slipPath' and b.data->>'slipPath' <> '')
    );
$$;

-- Keep vehicle status in sync with physical handover / return
create or replace function public.sync_vehicle_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = old.status then return new; end if;
  if new.status = 'Picked Up' then
    update public.vehicles set data = jsonb_set(data, '{status}', '"Rented"') where id = new.vehicle_id;
  elsif new.status = 'Completed' and not exists (
    select 1 from public.bookings where vehicle_id = new.vehicle_id and status = 'Picked Up' and id <> new.id
  ) then
    update public.vehicles set data = jsonb_set(data, '{status}', '"Available"')
     where id = new.vehicle_id and data->>'status' = 'Rented';
  end if;
  return new;
end $$;
drop trigger if exists bookings_sync_vehicle on public.bookings;
create trigger bookings_sync_vehicle after update of status on public.bookings
  for each row execute function public.sync_vehicle_status();

-- ---------- Row Level Security ----------
alter table public.admins enable row level security;
alter table public.vehicles enable row level security;
alter table public.settings enable row level security;
alter table public.coupons enable row level security;
alter table public.addon_prices enable row level security;
alter table public.bookings enable row level security;

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select to authenticated using (user_id = auth.uid());

drop policy if exists vehicles_read on public.vehicles;
create policy vehicles_read on public.vehicles for select to anon, authenticated using (true);
drop policy if exists vehicles_admin on public.vehicles;
create policy vehicles_admin on public.vehicles for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to anon, authenticated using (true);
drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists addons_read on public.addon_prices;
create policy addons_read on public.addon_prices for select to anon, authenticated using (true);
drop policy if exists addons_admin on public.addon_prices;
create policy addons_admin on public.addon_prices for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Coupons and bookings: admins only (customers use the RPCs below)
drop policy if exists coupons_admin on public.coupons;
create policy coupons_admin on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists bookings_admin on public.bookings;
create policy bookings_admin on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Public RPCs ----------
-- Occupied date ranges (no personal data) so the site can show which vehicles are free
create or replace function public.booked_ranges()
returns table (vehicle_id text, start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select vehicle_id, start_date, end_date from public.bookings
   where status in ('Pending', 'Confirmed', 'Picked Up')
     and end_date >= (now() at time zone 'Asia/Bangkok')::date - 1;
$$;

create or replace function public.check_coupon(p_code text, p_vehicle_id text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', c.code, 'percent', c.percent, 'label', c.label, 'active', true, 'onlyCategory', c.only_category)
    from public.coupons c
    left join public.vehicles v on v.id = p_vehicle_id
   where c.code = upper(trim(p_code)) and c.active
     and (c.only_category is null or c.only_category = v.data->>'category');
$$;

-- Server-side price calculation (mirrors src/lib/pricing.js priceQuote)
create or replace function public.price_quote(p_vehicle_id text, p_days int, p_addons text[], p_coupon text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v jsonb; base int; addons_total int := 0; tier_pct int := 0; tier_disc int := 0;
  coupon jsonb; coupon_disc int := 0; lines jsonb := '[]'::jsonb; a record; qty int;
begin
  select data into v from public.vehicles where id = p_vehicle_id;
  if v is null then raise exception 'vehicle_not_found'; end if;
  base := (v->>'pricePerDay')::int * p_days;
  for a in select * from public.addon_prices where id = any (coalesce(p_addons, '{}'))
           and (only_for is null or only_for = v->>'type') loop
    qty := case a.unit when 'day' then p_days when 'trip' then a.trips else 1 end;
    addons_total := addons_total + a.price * qty;
    lines := lines || jsonb_build_object('id', a.id, 'qty', qty, 'unit', a.unit, 'amount', a.price * qty);
  end loop;
  tier_pct := case when p_days >= 7 then 15 when p_days >= 3 then 5 else 0 end;
  tier_disc := round(base * tier_pct / 100.0);
  if coalesce(p_coupon, '') <> '' then
    coupon := public.check_coupon(p_coupon, p_vehicle_id);
    if coupon is null then raise exception 'invalid_coupon'; end if;
    coupon_disc := round((base - tier_disc) * (coupon->>'percent')::int / 100.0);
  end if;
  return jsonb_build_object(
    'base', base, 'addonLines', lines, 'addonsTotal', addons_total,
    'tierPercent', tier_pct, 'tierDiscount', tier_disc, 'couponDiscount', coupon_disc,
    'discount', tier_disc + coupon_disc, 'subtotal', base + addons_total,
    'total', base + addons_total - tier_disc - coupon_disc, 'couponCode', coalesce(coupon->>'code', '')
  );
end $$;

create or replace function public.create_booking(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v jsonb; s date; e date; st time; et time; days int; q jsonb; new_id text;
  phone text := regexp_replace(coalesce(p->>'phone', ''), '[^0-9]', '', 'g');
  name text := trim(coalesce(p->>'name', ''));
  today date := (now() at time zone 'Asia/Bangkok')::date;
  slip text := nullif(p->>'slipPath', '');
  addons text[];
  row public.bookings;
begin
  if length(name) < 3 or length(name) > 120 then raise exception 'invalid_name'; end if;
  if phone !~ '^0[0-9]{8,9}$' then raise exception 'invalid_phone'; end if;
  if slip is not null and slip !~ '^pending/[A-Za-z0-9_-]+\.jpg$' then raise exception 'invalid_slip'; end if;
  begin
    s := (p->>'startDate')::date; e := (p->>'endDate')::date;
    st := coalesce(p->>'pickupTime', '09:00')::time; et := coalesce(p->>'returnTime', '09:00')::time;
  exception when others then raise exception 'invalid_dates';
  end;
  if s < today or e - s > 60 or (e + et) <= (s + st) then raise exception 'invalid_dates'; end if;
  days := greatest(1, ceil(extract(epoch from ((e + et) - (s + st))) / 86400.0)::int);

  -- Serialize bookings per vehicle so two customers cannot grab the same dates
  perform pg_advisory_xact_lock(hashtext('b2-vehicle:' || (p->>'vehicleId')));
  select data into v from public.vehicles where id = p->>'vehicleId';
  if v is null then raise exception 'vehicle_not_found'; end if;
  if v->>'status' <> 'Available' then raise exception 'vehicle_unavailable'; end if;
  if exists (select 1 from public.bookings b where b.vehicle_id = p->>'vehicleId'
              and b.status in ('Pending', 'Confirmed', 'Picked Up') and b.start_date < e and s < b.end_date) then
    raise exception 'vehicle_unavailable';
  end if;

  select array_agg(x) into addons from jsonb_array_elements_text(coalesce(p->'addons', '[]')) x;
  q := public.price_quote(p->>'vehicleId', days, addons, p->>'couponCode');
  new_id := 'B2-' || to_char(today, 'YYYY') || '-' || lpad(nextval('public.booking_seq')::text, 4, '0');

  insert into public.bookings (id, vehicle_id, start_date, end_date, status, phone, total_price, data)
  values (new_id, p->>'vehicleId', s, e, 'Pending', phone, (q->>'total')::int,
    jsonb_strip_nulls(jsonb_build_object(
      'vehicleName', v->>'name', 'vehicleType', v->>'type',
      'customerName', name, 'email', left(p->>'email', 200), 'idCard', coalesce(nullif(left(p->>'idCard', 40), ''), '-'),
      'license', left(p->>'license', 40), 'note', left(p->>'note', 500),
      'pickupLocation', left(p->>'location', 200), 'returnLocation', left(p->>'location', 200),
      'pickupTime', to_char(st, 'HH24:MI'), 'returnTime', to_char(et, 'HH24:MI'), 'totalDays', days,
      'addons', to_jsonb(coalesce(addons, '{}')), 'subtotal', q->'subtotal', 'discount', q->'discount',
      'couponCode', q->>'couponCode', 'paymentMethod', 'PromptPay QR', 'slipPath', slip
    )))
  returning * into row;
  return public.booking_json(row);
end $$;

-- Customer lookup: phone number is required (booking id alone is not enough)
create or replace function public.find_bookings(p_phone text, p_id text default null)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select public.booking_json(b) from public.bookings b
   where b.phone = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
     and length(b.phone) >= 9
     and (p_id is null or p_id = '' or b.id = upper(trim(p_id)))
   order by b.created_at desc
   limit 50;
$$;

create or replace function public.cancel_booking(p_id text, p_phone text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare row public.bookings;
begin
  update public.bookings set status = 'Cancelled'
   where id = p_id and phone = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
     and status in ('Pending', 'Confirmed')
  returning * into row;
  if row.id is null then raise exception 'not_allowed'; end if;
  return public.booking_json(row);
end $$;

create or replace function public.attach_slip(p_id text, p_phone text, p_path text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare row public.bookings;
begin
  if p_path !~ '^pending/[A-Za-z0-9_-]+\.jpg$' then raise exception 'invalid_slip'; end if;
  update public.bookings set data = data || jsonb_build_object('slipPath', p_path)
   where id = p_id and phone = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') and status = 'Pending'
  returning * into row;
  if row.id is null then raise exception 'not_allowed'; end if;
  return public.booking_json(row);
end $$;

-- Admin: record a booking made on another channel (DriveHub, phone, LINE, walk-in).
-- It blocks the vehicle's dates like a website booking, so the site cannot double-book it.
create or replace function public.admin_add_booking(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v jsonb; s date; e date; st time; et time; days int; new_id text;
  phone text := regexp_replace(coalesce(p->>'phone', ''), '[^0-9]', '', 'g');
  name text := trim(coalesce(p->>'name', ''));
  src text := coalesce(nullif(trim(p->>'source'), ''), 'DriveHub');
  price int;
  today date := (now() at time zone 'Asia/Bangkok')::date;
  row public.bookings;
begin
  if not public.is_admin() then raise exception 'not_allowed'; end if;
  if src not in ('DriveHub', 'โทรศัพท์', 'LINE', 'Facebook', 'Walk-in', 'อื่น ๆ') then raise exception 'invalid_source'; end if;
  if name = '' then name := 'ลูกค้า ' || src; end if;
  if length(name) > 120 then raise exception 'invalid_name'; end if;
  if phone <> '' and phone !~ '^[0-9]{6,15}$' then raise exception 'invalid_phone'; end if;
  begin
    s := (p->>'startDate')::date; e := (p->>'endDate')::date;
    st := coalesce(nullif(p->>'pickupTime', ''), '09:00')::time; et := coalesce(nullif(p->>'returnTime', ''), '09:00')::time;
    price := coalesce(nullif(p->>'totalPrice', '')::numeric, 0)::int;
  exception when others then raise exception 'invalid_dates';
  end;
  if price < 0 or price > 10000000 then raise exception 'invalid_price'; end if;
  if s < today - 60 or e - s > 120 or (e + et) <= (s + st) then raise exception 'invalid_dates'; end if;
  days := greatest(1, ceil(extract(epoch from ((e + et) - (s + st))) / 86400.0)::int);

  perform pg_advisory_xact_lock(hashtext('b2-vehicle:' || (p->>'vehicleId')));
  select data into v from public.vehicles where id = p->>'vehicleId';
  if v is null then raise exception 'vehicle_not_found'; end if;
  if exists (select 1 from public.bookings b where b.vehicle_id = p->>'vehicleId'
              and b.status in ('Pending', 'Confirmed', 'Picked Up') and b.start_date < e and s < b.end_date) then
    raise exception 'vehicle_unavailable';
  end if;

  new_id := 'B2-' || to_char(today, 'YYYY') || '-' || lpad(nextval('public.booking_seq')::text, 4, '0');
  insert into public.bookings (id, vehicle_id, start_date, end_date, status, phone, total_price, data)
  values (new_id, p->>'vehicleId', s, e, 'Confirmed', phone, price,
    jsonb_strip_nulls(jsonb_build_object(
      'vehicleName', v->>'name', 'vehicleType', v->>'type', 'customerName', name,
      'source', src, 'externalRef', nullif(left(trim(p->>'externalRef'), 60), ''),
      'note', nullif(left(p->>'note', 500), ''),
      'pickupLocation', coalesce(nullif(left(p->>'location', 200), ''), 'ร้านบีทูรถเช่า'),
      'returnLocation', coalesce(nullif(left(p->>'location', 200), ''), 'ร้านบีทูรถเช่า'),
      'pickupTime', to_char(st, 'HH24:MI'), 'returnTime', to_char(et, 'HH24:MI'), 'totalDays', days,
      'addons', '[]'::jsonb, 'subtotal', price, 'discount', 0,
      'paymentMethod', 'ชำระผ่าน ' || src, 'idCard', '-'
    )))
  returning * into row;
  return public.booking_json(row);
end $$;
revoke all on function public.admin_add_booking(jsonb) from public, anon;
grant execute on function public.admin_add_booking(jsonb) to authenticated;

-- Function permissions: only what the website needs
revoke all on function public.booked_ranges() from public;
revoke all on function public.check_coupon(text, text) from public;
revoke all on function public.price_quote(text, int, text[], text) from public;
revoke all on function public.create_booking(jsonb) from public;
revoke all on function public.find_bookings(text, text) from public;
revoke all on function public.cancel_booking(text, text) from public;
revoke all on function public.attach_slip(text, text, text) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.booked_ranges() to anon, authenticated;
grant execute on function public.check_coupon(text, text) to anon, authenticated;
grant execute on function public.create_booking(jsonb) to anon, authenticated;
grant execute on function public.find_bookings(text, text) to anon, authenticated;
grant execute on function public.cancel_booking(text, text) to anon, authenticated;
grant execute on function public.attach_slip(text, text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant usage on sequence public.booking_seq to authenticated;
-- Supabase grants EXECUTE to anon/authenticated directly (not only via PUBLIC),
-- so internal helpers are revoked from those roles explicitly
revoke execute on function public.price_quote(text, int, text[], text) from anon, authenticated;
revoke execute on function public.sync_vehicle_status() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.booking_json(public.bookings) from public, anon, authenticated;

-- Table privileges (explicit, in case the project does not grant them by default).
-- Row level security above still decides which rows each role can see or change.
grant usage on schema public to anon, authenticated;
grant select on public.vehicles, public.settings, public.addon_prices to anon;
grant select, insert, update, delete on public.vehicles, public.settings, public.addon_prices,
  public.coupons, public.bookings, public.admins to authenticated;

-- ---------- Storage (photos & payment slips) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slips', 'slips', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos admin write" on storage.objects;
create policy "photos admin write" on storage.objects for all to authenticated
  using (bucket_id = 'vehicle-photos' and public.is_admin())
  with check (bucket_id = 'vehicle-photos' and public.is_admin());

drop policy if exists "slips customer upload" on storage.objects;
create policy "slips customer upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'slips' and name ~ '^pending/[A-Za-z0-9_-]+\.jpg$');
drop policy if exists "slips admin read" on storage.objects;
create policy "slips admin read" on storage.objects for select to authenticated
  using (bucket_id = 'slips' and public.is_admin());
drop policy if exists "slips admin delete" on storage.objects;
create policy "slips admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'slips' and public.is_admin());

-- ---------- Realtime: admin screens update instantly on new bookings ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bookings') then
    alter publication supabase_realtime add table public.bookings;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'vehicles') then
    alter publication supabase_realtime add table public.vehicles;
  end if;
end $$;
