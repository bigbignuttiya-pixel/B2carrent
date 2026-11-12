-- =====================================================================
-- Furniture shop — Supabase schema
-- Lives in the same Supabase project as B2 Rental, in its own furniture_* tables
-- and storage buckets, so the two sites never see each other's data.
-- Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE.
--
-- Security model
--   * Public (anon) can READ active products + shop settings, and can only touch
--     orders through the RPC functions below (prices and stock are handled on
--     the server, so a customer cannot change the amount).
--   * Admins (users listed in public.furniture_admins) can read/write everything.
-- =====================================================================

-- ---------- Tables ----------
create table if not exists public.furniture_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.furniture_products (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{2,40}$'),
  name text not null check (length(name) between 1 and 160),
  category text not null default 'living',
  price int not null check (price >= 0),
  sale_price int check (sale_price is null or sale_price >= 0),
  stock int not null default 0 check (stock >= 0),
  description text not null default '',
  material text not null default '',
  dimensions text not null default '',
  color text not null default '',
  images text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.furniture_settings (
  id int primary key default 1 check (id = 1), -- single row
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create sequence if not exists public.furniture_order_seq start 1001;

create table if not exists public.furniture_orders (
  id text primary key,
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Shipped', 'Completed', 'Cancelled')),
  phone text not null,
  customer jsonb not null,                   -- name, lineId, address, note
  items jsonb not null,                      -- [{id, name, price, qty, image}]
  subtotal int not null,
  shipping int not null default 0,
  total int not null,
  slip_path text,
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists furniture_orders_phone on public.furniture_orders (phone);
create index if not exists furniture_orders_created on public.furniture_orders (created_at desc);

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

drop trigger if exists furniture_products_touch on public.furniture_products;
create trigger furniture_products_touch before update on public.furniture_products for each row execute function public.furniture_touch();
drop trigger if exists furniture_orders_touch on public.furniture_orders;
create trigger furniture_orders_touch before update on public.furniture_orders for each row execute function public.furniture_touch();
drop trigger if exists furniture_settings_touch on public.furniture_settings;
create trigger furniture_settings_touch before update on public.furniture_settings for each row execute function public.furniture_touch();

-- Order row → object shape used by the web app (customer-facing: no slip path, no admin note)
create or replace function public.furniture_order_json(o public.furniture_orders) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'id', o.id, 'status', o.status, 'phone', o.phone,
    'customerName', o.customer->>'name', 'lineId', o.customer->>'lineId',
    'address', o.customer->>'address', 'note', o.customer->>'note',
    'items', o.items, 'subtotal', o.subtotal, 'shipping', o.shipping, 'total', o.total,
    'createdAt', to_char(o.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI'),
    'hasSlip', coalesce(o.slip_path, '') <> ''
  );
$$;

-- Stock follows the order: cancelling returns the items, un-cancelling takes them again
create or replace function public.furniture_order_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'Cancelled' then
    for it in select * from jsonb_array_elements(new.items) loop
      update public.furniture_products set stock = stock + (it->>'qty')::int where id = it->>'id';
    end loop;
  elsif old.status = 'Cancelled' then
    for it in select * from jsonb_array_elements(new.items) loop
      update public.furniture_products set stock = greatest(0, stock - (it->>'qty')::int) where id = it->>'id';
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists furniture_orders_stock on public.furniture_orders;
create trigger furniture_orders_stock after update of status on public.furniture_orders
  for each row execute function public.furniture_order_stock();

-- ---------- Row Level Security ----------
alter table public.furniture_admins enable row level security;
alter table public.furniture_products enable row level security;
alter table public.furniture_settings enable row level security;
alter table public.furniture_orders enable row level security;

drop policy if exists furniture_admins_self on public.furniture_admins;
create policy furniture_admins_self on public.furniture_admins for select to authenticated using (user_id = auth.uid());

drop policy if exists furniture_products_read on public.furniture_products;
create policy furniture_products_read on public.furniture_products for select to anon, authenticated
  using (active or public.furniture_is_admin());
drop policy if exists furniture_products_admin on public.furniture_products;
create policy furniture_products_admin on public.furniture_products for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

drop policy if exists furniture_settings_read on public.furniture_settings;
create policy furniture_settings_read on public.furniture_settings for select to anon, authenticated using (true);
drop policy if exists furniture_settings_admin on public.furniture_settings;
create policy furniture_settings_admin on public.furniture_settings for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

drop policy if exists furniture_orders_admin on public.furniture_orders;
create policy furniture_orders_admin on public.furniture_orders for all to authenticated
  using (public.furniture_is_admin()) with check (public.furniture_is_admin());

-- ---------- Public RPCs ----------
-- Place an order: prices come from the products table, stock is checked and reserved atomically
create or replace function public.furniture_place_order(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  phone text := regexp_replace(coalesce(p->>'phone', ''), '[^0-9]', '', 'g');
  name text := trim(coalesce(p->>'name', ''));
  address text := trim(coalesce(p->>'address', ''));
  slip text := nullif(p->>'slipPath', '');
  s jsonb; it jsonb; prod public.furniture_products; qty int; unit int;
  lines jsonb := '[]'::jsonb; subtotal int := 0; ship int := 0; ship_fee int; free_min int;
  today date := (now() at time zone 'Asia/Bangkok')::date;
  new_id text; row public.furniture_orders;
begin
  if length(name) < 3 or length(name) > 120 then raise exception 'invalid_name'; end if;
  if phone !~ '^0[0-9]{8,9}$' then raise exception 'invalid_phone'; end if;
  if length(address) < 10 or length(address) > 600 then raise exception 'invalid_address'; end if;
  if slip is not null and slip !~ '^pending/[A-Za-z0-9_-]+\.jpg$' then raise exception 'invalid_slip'; end if;
  if jsonb_typeof(p->'items') is distinct from 'array' or jsonb_array_length(p->'items') = 0
     or jsonb_array_length(p->'items') > 50 then raise exception 'empty_cart'; end if;

  for it in select * from jsonb_array_elements(p->'items') order by value->>'id' loop
    begin
      qty := (it->>'qty')::int;
    exception when others then raise exception 'invalid_qty';
    end;
    if qty is null or qty < 1 or qty > 99 then raise exception 'invalid_qty'; end if;
    -- lock the product row so two customers cannot buy the last piece at the same time
    prod := null;
    select * into prod from public.furniture_products where id = it->>'id' and active for update;
    if prod.id is null then raise exception 'product_not_found'; end if;
    if prod.stock < qty then raise exception 'out_of_stock:%', prod.name; end if;
    unit := coalesce(prod.sale_price, prod.price);
    update public.furniture_products set stock = stock - qty where id = prod.id;
    subtotal := subtotal + unit * qty;
    lines := lines || jsonb_build_object('id', prod.id, 'name', prod.name, 'price', unit, 'qty', qty,
                                         'image', coalesce(prod.images[1], ''));
  end loop;

  select data into s from public.furniture_settings where id = 1;
  ship_fee := coalesce(nullif(s->>'shippingFee', '')::int, 0);
  free_min := coalesce(nullif(s->>'freeShippingMin', '')::int, 0);
  ship := case when free_min > 0 and subtotal >= free_min then 0 else ship_fee end;

  new_id := 'FN-' || to_char(today, 'YYYY') || '-' || lpad(nextval('public.furniture_order_seq')::text, 4, '0');
  insert into public.furniture_orders (id, status, phone, customer, items, subtotal, shipping, total, slip_path)
  values (new_id, 'Pending', phone,
    jsonb_strip_nulls(jsonb_build_object(
      'name', name, 'address', address,
      'lineId', nullif(left(regexp_replace(coalesce(p->>'lineId', ''), '[^A-Za-z0-9._@-]', '', 'g'), 40), ''),
      'note', nullif(left(trim(coalesce(p->>'note', '')), 500), '')
    )),
    lines, subtotal, ship, subtotal + ship, slip)
  returning * into row;
  return public.furniture_order_json(row);
end $$;

-- Customer lookup: phone number is required (order id alone is not enough)
create or replace function public.furniture_find_orders(p_phone text, p_id text default null)
returns setof jsonb language sql stable security definer set search_path = public as $$
  select public.furniture_order_json(o) from public.furniture_orders o
   where o.phone = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
     and length(o.phone) >= 9
     and (p_id is null or p_id = '' or o.id = upper(trim(p_id)))
   order by o.created_at desc
   limit 50;
$$;

create or replace function public.furniture_cancel_order(p_id text, p_phone text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare row public.furniture_orders;
begin
  update public.furniture_orders set status = 'Cancelled'
   where id = upper(trim(p_id)) and phone = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
     and status = 'Pending'
  returning * into row;
  if row.id is null then raise exception 'not_allowed'; end if;
  return public.furniture_order_json(row);
end $$;

create or replace function public.furniture_attach_slip(p_id text, p_phone text, p_path text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare row public.furniture_orders;
begin
  if p_path !~ '^pending/[A-Za-z0-9_-]+\.jpg$' then raise exception 'invalid_slip'; end if;
  update public.furniture_orders set slip_path = p_path
   where id = upper(trim(p_id)) and phone = regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') and status = 'Pending'
  returning * into row;
  if row.id is null then raise exception 'not_allowed'; end if;
  return public.furniture_order_json(row);
end $$;

-- Function permissions: only what the website needs
revoke all on function public.furniture_place_order(jsonb) from public;
revoke all on function public.furniture_find_orders(text, text) from public;
revoke all on function public.furniture_cancel_order(text, text) from public;
revoke all on function public.furniture_attach_slip(text, text, text) from public;
revoke all on function public.furniture_is_admin() from public;
grant execute on function public.furniture_place_order(jsonb) to anon, authenticated;
grant execute on function public.furniture_find_orders(text, text) to anon, authenticated;
grant execute on function public.furniture_cancel_order(text, text) to anon, authenticated;
grant execute on function public.furniture_attach_slip(text, text, text) to anon, authenticated;
grant execute on function public.furniture_is_admin() to anon, authenticated;
-- Supabase grants EXECUTE to anon/authenticated directly, so internal helpers are revoked explicitly
revoke execute on function public.furniture_touch() from public, anon, authenticated;
revoke execute on function public.furniture_order_stock() from public, anon, authenticated;
revoke execute on function public.furniture_order_json(public.furniture_orders) from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.furniture_products, public.furniture_settings to anon;
grant select, insert, update, delete on public.furniture_products, public.furniture_settings,
  public.furniture_orders, public.furniture_admins to authenticated;

-- ---------- Storage (product photos & payment slips) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('furniture-photos', 'furniture-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('furniture-slips', 'furniture-slips', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "furniture photos admin write" on storage.objects;
create policy "furniture photos admin write" on storage.objects for all to authenticated
  using (bucket_id = 'furniture-photos' and public.furniture_is_admin())
  with check (bucket_id = 'furniture-photos' and public.furniture_is_admin());

drop policy if exists "furniture slips customer upload" on storage.objects;
create policy "furniture slips customer upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'furniture-slips' and name ~ '^pending/[A-Za-z0-9_-]+\.jpg$');
drop policy if exists "furniture slips admin read" on storage.objects;
create policy "furniture slips admin read" on storage.objects for select to authenticated
  using (bucket_id = 'furniture-slips' and public.furniture_is_admin());
drop policy if exists "furniture slips admin delete" on storage.objects;
create policy "furniture slips admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'furniture-slips' and public.furniture_is_admin());

-- ---------- Realtime: admin screens update instantly on new orders ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'furniture_orders') then
    alter publication supabase_realtime add table public.furniture_orders;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'furniture_products') then
    alter publication supabase_realtime add table public.furniture_products;
  end if;
end $$;
