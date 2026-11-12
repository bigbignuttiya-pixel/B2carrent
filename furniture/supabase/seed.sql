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
