# PUNSO Car Rental — working rules / กฎการทำงาน

> English is the instruction Claude follows; the Thai under each section is the same rule for the
> shop owner to read. If they ever differ, fix them so they say the same thing.
>
> ภาษาอังกฤษคือคำสั่งที่ Claude ใช้ทำงาน ส่วนภาษาไทยใต้แต่ละหัวข้อคือกฎเดียวกันสำหรับเจ้าของร้านอ่าน
> ถ้าสองภาษาเขียนไม่ตรงกัน ให้แก้ให้ตรงกัน

## 1. B2 is the source of truth / B2 คือต้นฉบับ

**All prices and vehicle data follow B2 Rental (the B2carrent project in the repo root). B2 is the
source of truth; PUNSO copies it.**

- Fleet: the same cars as B2 — same count, models, plate numbers, prices per day, deposits, specs,
  features, photos and display order. Only the id prefix differs (`B2-…` → `PS-…`).
- Add-on prices (`punso_addon_prices`) match B2's `addon_prices`. Coupons match B2's coupons
  (B2's `B2DRIVE2026` is `PUNSO2026` here).
- A car "Rented" on B2 is "Available" in PUNSO (that rental belongs to B2's customer).
- Never set a PUNSO price or vehicle detail by hand that differs from B2.

**ราคาทุกอย่างและข้อมูลรถทุกคันของ PUNSO อ้างอิงจาก B2 Rental (โปรเจกต์ B2carrent ในโฟลเดอร์หลัก)
B2 คือต้นฉบับ PUNSO คัดลอกตาม**

- รถ: เหมือน B2 ทุกคัน — จำนวน รุ่น ป้ายทะเบียน ราคาต่อวัน เงินมัดจำ สเปก อุปกรณ์ รูป และลำดับการแสดง
  ต่างกันแค่รหัสรถขึ้นต้น (`B2-…` → `PS-…`)
- ราคาบริการเสริม (`punso_addon_prices`) เท่ากับ `addon_prices` ของ B2 และโค้ดส่วนลดเหมือน B2
  (`B2DRIVE2026` ของ B2 คือ `PUNSO2026` ของ PUNSO)
- รถที่ B2 ติดสถานะ "กำลังเช่า" ให้เป็น "ว่าง" ใน PUNSO (เพราะเป็นการเช่าของลูกค้า B2)
- ห้ามตั้งราคาหรือแก้ข้อมูลรถใน PUNSO เองให้ต่างจาก B2

## 2. When B2 changes / เมื่อ B2 มีการเปลี่ยนแปลง

When B2 changes (new car, removed car, new price, new photo), bring PUNSO back in line:

1. Live database: run `supabase/sync-fleet-from-b2.sql` in the shared Supabase project
   (fxnvwjugcapmyybvgymv). It upserts every B2 car and removes cars B2 dropped (unless a PUNSO
   booking still uses them).
2. Photos: copy any new file from `public/vehicles/` into `punso/public/vehicles/`. If the photo
   shows a "B2 RENTAL" plate, replace it with the black/yellow "PUNSO RENTAL" plate first.
3. Code: refresh `INITIAL_VEHICLES` in `src/data.js` from B2's live `vehicles` table, then
   `node scripts/make-seed.mjs` and rebuild `supabase/setup.sql`.
4. Check: B2 and PUNSO car counts are equal and every car's details/price compare equal.

เมื่อ B2 เพิ่มรถ เลิกใช้รถ เปลี่ยนราคา หรือเปลี่ยนรูป ให้ทำให้ PUNSO ตรงกับ B2 อีกครั้ง:

1. ฐานข้อมูลจริง: รันไฟล์ `supabase/sync-fleet-from-b2.sql` ใน SQL Editor ของ Supabase
   (โปรเจกต์ fxnvwjugcapmyybvgymv ที่ใช้ร่วมกัน) คำสั่งนี้จะเพิ่ม/อัปเดตรถทุกคันตาม B2
   และลบรถที่ B2 เลิกใช้แล้ว (ยกเว้นรถที่ยังมีการจองของ PUNSO อยู่)
2. รูปรถ: คัดลอกรูปใหม่จาก `public/vehicles/` มาไว้ที่ `punso/public/vehicles/`
   ถ้ารูปมีป้ายทะเบียน "B2 RENTAL" ให้เปลี่ยนเป็นป้าย "PUNSO RENTAL" สีดำ-เหลืองก่อน
3. โค้ด: อัปเดต `INITIAL_VEHICLES` ใน `src/data.js` จากตาราง `vehicles` ของ B2 แล้วรัน
   `node scripts/make-seed.mjs` และสร้างไฟล์ `supabase/setup.sql` ใหม่
4. ตรวจสอบ: จำนวนรถของ B2 กับ PUNSO ต้องเท่ากัน และราคา/รายละเอียดทุกคันต้องตรงกัน

## 3. Separation from B2 / แยกจาก B2 ให้ขาด

- PUNSO's database objects are all prefixed `punso_` (tables, functions, buckets `punso-…`,
  policies "punso …"). Never write to B2's tables (`vehicles`, `bookings`, …) from PUNSO work.
- Work only inside `punso/` for PUNSO changes; B2's site in the repo root must not change.
- Live site: https://b2carrent-i2ow.vercel.app (Vercel project with Root Directory `punso`).

- ข้อมูลของ PUNSO ในฐานข้อมูลขึ้นต้นด้วย `punso_` ทั้งหมด (ตาราง ฟังก์ชัน ที่เก็บรูป `punso-…`
  และสิทธิ์การเข้าถึง "punso …") ห้ามเขียนหรือแก้ตารางของ B2 (`vehicles`, `bookings` ฯลฯ)
  ระหว่างทำงานกับ PUNSO — อ่านจากตาราง B2 ได้อย่างเดียว
- แก้ไข PUNSO เฉพาะไฟล์ในโฟลเดอร์ `punso/` เท่านั้น ห้ามให้เว็บ B2 ในโฟลเดอร์หลักเปลี่ยน
- เว็บจริง: https://b2carrent-i2ow.vercel.app (โปรเจกต์ Vercel ที่ตั้ง Root Directory เป็น `punso`)
