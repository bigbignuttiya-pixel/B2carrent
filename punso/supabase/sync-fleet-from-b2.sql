-- Copy B2 Rental's whole fleet into PUNSO (same database project). Safe to re-run.
-- ids become PS-…; a car that is "Rented" on B2 is set to "Available" here, because that rental
-- belongs to B2, not PUNSO. Cars PUNSO already has are updated (prices included). A car B2 no
-- longer has is removed from PUNSO too, unless a PUNSO booking still refers to it.
-- คัดลอกรถทั้งหมดของ B2 Rental เข้า PUNSO (อยู่ในฐานข้อมูลเดียวกัน) รันซ้ำได้ไม่เสียหาย
-- รหัสรถเปลี่ยนเป็น PS-…; รถที่ B2 ติด "กำลังเช่า" จะเป็น "ว่าง" ใน PUNSO เพราะเป็นการเช่าของลูกค้า B2
-- รถที่ PUNSO มีอยู่แล้วจะถูกอัปเดต (รวมราคา) ส่วนรถที่ B2 เลิกใช้จะถูกลบออกจาก PUNSO ด้วย
-- ยกเว้นรถที่ยังมีการจองของ PUNSO อยู่
-- วิธีใช้: Supabase → SQL Editor → New query → วางทั้งไฟล์ → Run

insert into public.punso_vehicles (id, data, sort_order)
select 'PS-' || substr(v.id, 4),
       jsonb_set(
         jsonb_set(v.data, '{id}', to_jsonb('PS-' || substr(v.id, 4))),
         '{status}', case when v.data->>'status' = 'Rented' then '"Available"'::jsonb else coalesce(v.data->'status', '"Available"'::jsonb) end
       ),
       v.sort_order
  from public.vehicles v
 where v.id like 'B2-%'
on conflict (id) do update set data = excluded.data, sort_order = excluded.sort_order;  -- เพิ่ม/อัปเดตรถตาม B2

-- ลบรถที่ B2 ไม่มีแล้ว (ยกเว้นรถที่มีการจองของ PUNSO)
delete from public.punso_vehicles p
 where not exists (select 1 from public.vehicles v where v.id like 'B2-%' and p.id = 'PS-' || substr(v.id, 4))
   and not exists (select 1 from public.punso_bookings b where b.vehicle_id = p.id);

-- จำนวนรถของ PUNSO หลังอัปเดต (ควรเท่ากับจำนวนรถของ B2)
select count(*) as punso_cars from public.punso_vehicles;
