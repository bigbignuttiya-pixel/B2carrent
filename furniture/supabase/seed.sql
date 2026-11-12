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

insert into public.furniture_plans (id, name, days, price, description, sort_order) values
  ('day', 'รายวัน', 1, 59, 'ใช้งานได้ 24 ชั่วโมง เหมาะกับออกแบบห้องเดียว', 1),
  ('week', 'รายสัปดาห์', 7, 199, 'ใช้งานได้ 7 วัน ออกแบบได้หลายห้อง', 2),
  ('month', 'รายเดือน', 30, 490, 'ใช้งานได้ 30 วัน คุ้มที่สุดสำหรับรีโนเวตทั้งบ้าน', 3)
on conflict (id) do nothing;
