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
// list come from the live punso_ tables at build time (they follow B2 — see CLAUDE.md).
const fromPrice = (list, type) => {
  const p = list.filter((m) => m.type === type).map((m) => m.price);
  return p.length ? `฿${Math.min(...p).toLocaleString('en-US')}` : null;
};
const seo = seoPlugin({
  siteUrl: (process.env.SITE_URL || 'https://b2carrent-i2ow.vercel.app').replace(/\/$/, ''),
  brand: 'PUNSO Car Rental',
  brandTh: 'ปันโซ คาร์เร้นท์ รถเช่านครศรีธรรมราช',
  vehiclesTable: 'punso_vehicles',
  settingsTable: 'punso_settings',
  ogImage: '/destinations/khanom.jpg',
  title: 'รถเช่านครศรีธรรมราช เช่ารถยนต์ & มอเตอร์ไซค์ พร้อมคนขับ รับ-ส่งสนามบิน | PUNSO Car Rental',
  h1: 'PUNSO Car Rental ปันโซ — รถเช่านครศรีธรรมราช เช่ารถยนต์และมอเตอร์ไซค์',
  intro: 'PUNSO Car Rental บริการรถเช่านครศรีธรรมราช เช่ารถยนต์และรถมอเตอร์ไซค์ ขับเองหรือพร้อมคนขับมืออาชีพ รับ-ส่งฟรีสนามบินนครศรีธรรมราช สถานีรถไฟ บขส. และโรงแรมในตัวเมือง พาเที่ยวขนอม คีรีวง น้ำตกกรุงชิง วัดพระมหาธาตุ จองออนไลน์ ชำระผ่านพร้อมเพย์ ไม่ต้องใช้บัตรเครดิต',
  description: (list) =>
    `รถเช่านครศรีธรรมราช PUNSO เช่ารถยนต์${fromPrice(list, 'Car') ? ` เริ่มต้น ${fromPrice(list, 'Car')}/วัน` : ''} มอเตอร์ไซค์${fromPrice(list, 'Motorcycle') ? ` เริ่มต้น ${fromPrice(list, 'Motorcycle')}/วัน` : ''} ขับเองหรือพร้อมคนขับ รับ-ส่งฟรีสนามบินนครศรีฯ จองออนไลน์ จ่ายพร้อมเพย์`,
  keywords: ['รถเช่านครศรีธรรมราช', 'เช่ารถนครศรีธรรมราช', 'เช่ารถยนต์นครศรีธรรมราช', 'เช่ามอเตอร์ไซค์นครศรีธรรมราช', 'รถเช่าพร้อมคนขับ นครศรีธรรมราช', 'รถเช่าสนามบินนครศรีธรรมราช', 'รถเช่า นครศรี', 'PUNSO Car Rental', 'ปันโซ รถเช่า'],
  services: ['เช่ารถยนต์ Honda City, Toyota Yaris, BYD Seal 5, BYD Atto 3, Toyota Fortuner, Mitsubishi Pajero Sport', 'เช่ารถมอเตอร์ไซค์ Honda PCX, Giorno+, Scoopy, Yamaha Grand Filano, Forza 350', 'รถเช่าพร้อมคนขับมืออาชีพ ชำนาญเส้นทางทั่วนครศรีธรรมราช', 'รับ-ส่งรถฟรีที่สนามบินนครศรีธรรมราช สถานีรถไฟ และโรงแรมในตัวเมือง', 'ประกันภัย ฟรีหมวกกันน็อก 2 ใบ (มอเตอร์ไซค์)', 'ส่วนลดเช่า 3 วันขึ้นไป และ 7 วันขึ้นไป', 'จองออนไลน์ ชำระผ่านพร้อมเพย์ ไม่ต้องใช้บัตรเครดิต'],
  theme: { bg: '#ffffff', fg: '#18181b' },
});

export default defineConfig({
  plugins: [react(), copyMediapipeWasm(), seo],
});
