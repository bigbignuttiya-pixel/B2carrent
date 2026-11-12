-- Starter data for the furniture shop — run after schema.sql (safe to re-run; existing rows are kept)

-- Shop owners: everyone who is already a B2 Rental admin can manage the furniture shop too
insert into public.furniture_admins (user_id) select user_id from public.admins on conflict do nothing;

insert into public.furniture_settings (id, data) values (1, '{
  "shopName": "Furniture",
  "tagline": "เฟอร์นิเจอร์สำหรับทุกห้องในบ้าน ดีไซน์เรียบง่าย วัสดุคุณภาพ",
  "phone": "",
  "lineOaId": "",
  "facebookUrl": "",
  "address": "",
  "openHours": "ทุกวัน 09:00 – 18:00",
  "promptPayId": "",
  "accountName": "",
  "shippingFee": 300,
  "freeShippingMin": 10000,
  "shippingNote": "จัดส่งภายใน 3–7 วันทำการ"
}') on conflict (id) do nothing;

insert into public.furniture_products (id, name, category, price, sale_price, stock, description, material, dimensions, color, featured, sort_order) values
  ('SOFA-001', 'โซฟา 3 ที่นั่ง', 'living', 15900, 13900, 5, 'โซฟาผ้านุ่ม เบาะหนา นั่งสบาย ถอดซักปลอกได้', 'โครงไม้ยาง + ผ้าลินิน', '210 × 85 × 80 ซม.', 'เทาอ่อน', true, 1),
  ('TBL-001', 'โต๊ะกลางไม้โอ๊ค', 'living', 4590, null, 8, 'โต๊ะกลางทรงเรียบ มีชั้นวางด้านล่าง', 'ไม้โอ๊ค', '110 × 60 × 45 ซม.', 'ไม้ธรรมชาติ', false, 2),
  ('BED-001', 'เตียงนอน 6 ฟุต', 'bedroom', 12900, null, 3, 'เตียงไม้ หัวเตียงบุนวม รับน้ำหนักได้ดี (ไม่รวมที่นอน)', 'ไม้จริง + ผ้ากำมะหยี่', '190 × 210 × 110 ซม.', 'ครีม', true, 3),
  ('WRD-001', 'ตู้เสื้อผ้า 2 บาน', 'bedroom', 8990, 7990, 4, 'ตู้เสื้อผ้าบานเปิด มีราวแขวนและชั้นวาง', 'ไม้ปาร์ติเคิลบอร์ด', '100 × 55 × 200 ซม.', 'ขาว', false, 4),
  ('DIN-001', 'ชุดโต๊ะอาหาร 4 ที่นั่ง', 'dining', 10500, null, 2, 'โต๊ะพร้อมเก้าอี้ 4 ตัว', 'ไม้ยางพารา', 'โต๊ะ 120 × 75 × 75 ซม.', 'วอลนัท', true, 5),
  ('CHR-001', 'เก้าอี้ทานอาหาร', 'dining', 1290, null, 20, 'เก้าอี้ไม้พนักพิงโค้ง', 'ไม้ยางพารา', '45 × 50 × 82 ซม.', 'วอลนัท', false, 6),
  ('DSK-001', 'โต๊ะทำงานปรับระดับไฟฟ้า', 'office', 9900, 8900, 6, 'ปรับความสูงด้วยมอเตอร์ จำค่าได้ 3 ระดับ', 'เหล็ก + ท็อปไม้', '140 × 70 × 72–120 ซม.', 'ดำ/ไม้', true, 7),
  ('OCH-001', 'เก้าอี้สำนักงาน', 'office', 3490, null, 10, 'พนักพิงตาข่าย มีที่รองหลัง ปรับความสูงได้', 'ตาข่าย + ไนลอน', '65 × 65 × 110–120 ซม.', 'ดำ', false, 8)
on conflict (id) do nothing;
