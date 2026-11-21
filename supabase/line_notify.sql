-- B2 Rental — booking notifications to LINE (Messaging API). Applied to the live project already.
-- The Edge Function lives in supabase/functions/line-notify (shared with PUNSO via ?shop=).
create extension if not exists pg_net;

create table if not exists public.line_config (
  id int primary key default 1 check (id = 1),
  channel_token text, channel_secret text,
  targets jsonb not null default '[]',
  notify_new boolean not null default true,
  notify_slip boolean not null default true,
  notify_confirmed boolean not null default true,
  notify_cancelled boolean not null default false,
  hook_secret text not null default encode(gen_random_bytes(24), 'hex'),  -- first 6 chars = pairing code
  last_error text, last_sent_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.line_config (id) values (1) on conflict do nothing;
alter table public.line_config enable row level security;
drop policy if exists line_config_admin on public.line_config;
create policy line_config_admin on public.line_config for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.line_config from anon;

create or replace function public.line_notify_booking() returns trigger
language plpgsql security definer set search_path = public as $$
declare ev text; c public.line_config;
begin
  if tg_op = 'INSERT' then ev := 'new';
  elsif coalesce(new.data->>'slipPath','') <> '' and coalesce(old.data->>'slipPath','') = '' then ev := 'slip';
  elsif new.status is distinct from old.status and new.status = 'Confirmed' then ev := 'confirmed';
  elsif new.status is distinct from old.status and new.status = 'Cancelled' then ev := 'cancelled';
  else return new; end if;
  select * into c from public.line_config where id = 1;
  if c.channel_token is null or jsonb_array_length(c.targets) = 0 then return new; end if;
  perform net.http_post(
    url := 'https://fxnvwjugcapmyybvgymv.supabase.co/functions/v1/line-notify?shop=b2',
    headers := jsonb_build_object('Content-Type','application/json','x-hook-secret', c.hook_secret),
    body := jsonb_build_object('event', ev, 'booking_id', new.id));
  return new;
exception when others then return new;
end $$;
drop trigger if exists bookings_line_notify on public.bookings;
create trigger bookings_line_notify after insert or update on public.bookings
  for each row execute function public.line_notify_booking();
revoke execute on function public.line_notify_booking() from public, anon, authenticated;
