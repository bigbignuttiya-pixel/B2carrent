import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, mkdirSync } from 'node:fs';
import { seoPlugin } from './scripts/seo-plugin.mjs';

// Serve MediaPipe's WebAssembly runtime from the site itself (admin "remove background" tool).
// Runs on every dev/build, however the build is started (npm run build, vite build, Vercel, …).
function copyMediapipeWasm() {
  return {
    name: 'copy-mediapipe-wasm',
    configResolved() {
      const to = new URL('./public/mediapipe/wasm/', import.meta.url);
      mkdirSync(to, { recursive: true });
      cpSync(new URL('./node_modules/@mediapipe/tasks-vision/wasm/', import.meta.url), to, { recursive: true });
    },
  };
}

// What search engines and link previews show (see scripts/seo-plugin.mjs). Prices and the model
// list come from the live database at build time.
const fromPrice = (list, type) => {
  const p = list.filter((m) => m.type === type).map((m) => m.price);
  return p.length ? `฿${Math.min(...p).toLocaleString('en-US')}` : null;
};
const seo = seoPlugin({
  siteUrl: (process.env.SITE_URL || 'https://b2carrent-1lv1.vercel.app').replace(/\/$/, ''),
  brand: 'B2 Rental',
  brandTh: 'บีทูรถเช่า นครศรีธรรมราช',
  vehiclesTable: 'vehicles',
  settingsTable: 'settings',
  ogImage: '/destinations/khanom.jpg',
  title: 'รถเช่านครศรีธรรมราช เช่ามอเตอร์ไซค์ & รถยนต์ รับ-ส่งสนามบิน | B2 Rental บีทูรถเช่า',
  h1: 'B2 Rental บีทูรถเช่า — รถเช่านครศรีธรรมราช เช่ามอเตอร์ไซค์และรถยนต์',
  intro: 'บริการรถเช่านครศรีธรรมราช ทั้งรถมอเตอร์ไซค์และรถยนต์ เช่ารายวัน รายสัปดาห์ ขับเองหรือพร้อมคนขับ รับ-ส่งฟรีสนามบินนครศรีธรรมราช สถานีรถไฟ บขส. และโรงแรมในตัวเมือง จองออนไลน์ ชำระผ่านพร้อมเพย์ ไม่ต้องใช้บัตรเครดิต',
  description: (list) =>
    `รถเช่านครศรีธรรมราช B2 Rental เช่ามอเตอร์ไซค์${fromPrice(list, 'Motorcycle') ? ` เริ่มต้น ${fromPrice(list, 'Motorcycle')}/วัน` : ''} รถยนต์${fromPrice(list, 'Car') ? ` เริ่มต้น ${fromPrice(list, 'Car')}/วัน` : ''} รับ-ส่งฟรีสนามบินนครศรีฯ จองออนไลน์ จ่ายพร้อมเพย์ ไม่ต้องใช้บัตรเครดิต`,
  keywords: ['รถเช่านครศรีธรรมราช', 'เช่ารถนครศรีธรรมราช', 'เช่ามอเตอร์ไซค์นครศรีธรรมราช', 'รถมอเตอร์ไซค์เช่า นครศรี', 'รถเช่าสนามบินนครศรีธรรมราช', 'เช่ารถยนต์ นครศรีธรรมราช', 'รถเช่าพร้อมคนขับ นครศรีธรรมราช', 'B2 Rental', 'บีทูรถเช่า'],
  services: ['เช่ารถมอเตอร์ไซค์ Honda PCX, Giorno+, Scoopy, Yamaha Grand Filano และอื่น ๆ', 'เช่ารถยนต์ Honda City, Toyota Yaris, BYD, Fortuner, Pajero Sport', 'รถเช่าพร้อมคนขับ', 'รับ-ส่งรถฟรีที่สนามบินนครศรีธรรมราช สถานีรถไฟ และโรงแรมในตัวเมือง', 'ฟรีหมวกกันน็อก 2 ใบ (มอเตอร์ไซค์) และประกันภัย', 'ส่วนลดเช่า 3 วันขึ้นไป และ 7 วันขึ้นไป', 'จองออนไลน์ ชำระผ่านพร้อมเพย์ ไม่ต้องใช้บัตรเครดิต'],
  theme: { bg: '#020617', fg: '#e2e8f0' },
});

export default defineConfig({
  plugins: [react(), copyMediapipeWasm(), seo],
});
