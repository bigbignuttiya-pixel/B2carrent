// Showcase content for the landing page. Every image in /public/showcase was rendered from these exact pieces
// with the studio's own 3D engine (scripts/render-showcase.cjs), and prices are computed live from them.

const navy = { finish: 'white', color: '#f3f1ec', frontFinish: 'navy', frontColor: '#34507f', shelfFinish: 'oak' };
const oakWhite = { finish: 'white', color: '#f3f1ec', frontFinish: 'oak', frontColor: '#d4b48a' };
const walnut = { finish: 'walnut', color: '#6b4a33', frontFinish: 'walnut', frontColor: '#6b4a33' };
const walnutCream = { finish: 'cream', color: '#e9e0cf', frontFinish: 'walnut', frontColor: '#6b4a33', shelfFinish: 'walnut' };
const sage = { finish: 'white', color: '#f3f1ec', frontFinish: 'sage', frontColor: '#8c9a7e', shelfFinish: 'ash' };
const black = { finish: 'black', color: '#2b2a29', frontFinish: 'black', frontColor: '#2b2a29', shelfFinish: 'oak' };
const ashWhite = { finish: 'ash', color: '#e9ddc7', frontFinish: 'white', frontColor: '#f3f1ec' };

const kitchen = (f, wallF = f) => [
  { template: 'kitchenDrawer', ...f, gap: 0 },
  { template: 'kitchenBase', ...f, gap: 0 },
  { template: 'kitchenBase', ...f, W: 90, gap: 0 },
  { template: 'kitchenDrawer', ...f, gap: 0 },
  { template: 'kitchenWall', ...wallF, posX: 0, W: 60 },
  { template: 'kitchenWall', ...wallF, posX: 60, W: 80 },
  { template: 'kitchenWall', ...wallF, posX: 140, W: 90 },
  { template: 'kitchenWall', ...wallF, posX: 230, W: 60 },
];

// Hero slideshow (large, full width)
export const HERO_SHOTS = [
  { id: 'hero-closet', title: 'ตู้เสื้อผ้า Walk-in โทนน้ำเงิน ชั้นไม้โอ๊ค', open: true, azimuth: 24, zoom: 0.82, pieces: [{ template: 'wardrobe2', ...navy, gap: 0 }, { template: 'wardrobe3', ...navy, gap: 0 }, { template: 'wardrobe2', ...navy }] },
  { id: 'hero-kitchen', title: 'ชุดครัวขาว หน้าบานไม้โอ๊ค', azimuth: 18, zoom: 0.85, pieces: kitchen(oakWhite) },
  { id: 'hero-bedroom', title: 'ห้องนอนวอลนัท เตียง 6 ฟุต + ตู้บานเลื่อน', azimuth: -26, zoom: 0.9, pieces: [{ template: 'wardrobe3', ...walnutCream, doorStyle: 'sliding', slideCount: 3 }, { template: 'bed6', ...walnut, frontFinish: 'cream', frontColor: '#e9e0cf' }] },
];

// Products & services: what customers can design (price = estimate from the default material prices)
export const PRODUCTS = [
  { id: 'wardrobe2', template: 'wardrobe2', name: 'ตู้เสื้อผ้า 2 บาน', size: '120 × 60 × 220 ซม.', detail: 'ราวแขวน ชั้นวาง 5 ชั้น บานเปิดพร้อมบานพับ', pieces: [{ template: 'wardrobe2', ...navy }], open: true },
  { id: 'wardrobe3', template: 'wardrobe3', name: 'ตู้เสื้อผ้า 3 บานเลื่อน', size: '180 × 60 × 220 ซม.', detail: 'ราวแขวน 2 ช่อง ลิ้นชักใน 2 ชุด บานเลื่อนกรอบอลูมิเนียม', pieces: [{ template: 'wardrobe3', ...walnutCream, doorStyle: 'sliding', slideCount: 3 }], open: true },
  { id: 'kitchen', template: 'kitchenBase', name: 'ชุดตู้ครัว 3.3 ม.', size: 'ตู้ล่าง 4 + ตู้แขวน 4', detail: 'ไม้ HMR กันชื้น ท็อปเคาน์เตอร์ ลิ้นชักรางลูกปืน', pieces: kitchen(oakWhite) },
  { id: 'kitchenWall', template: 'kitchenWall', name: 'ตู้ครัวแขวน', size: '80 × 33 × 70 ซม.', detail: 'บานคู่ ชั้นปรับระดับ ติดผนังสูง 145 ซม.', pieces: [{ template: 'kitchenWall', ...sage, elev: 0 }], open: true },
  { id: 'tvCabinet', template: 'tvCabinet', name: 'ตู้วางทีวี', size: '180 × 42 × 50 ซม.', detail: 'ลิ้นชัก 2 ชั้น ช่องโล่ง บานยก', pieces: [{ template: 'tvCabinet', ...walnut }] },
  { id: 'bookshelf', template: 'bookshelf', name: 'ชั้นหนังสือ', size: '80 × 30 × 180 ซม.', detail: 'ชั้นวาง 4 ชั้น ปรับระยะได้', pieces: [{ template: 'bookshelf', ...black }] },
  { id: 'bed6', template: 'bed6', name: 'เตียง 6 ฟุต', size: 'ที่นอน 180 × 200 ซม.', detail: 'หัวเตียงสูง 110 ซม. พื้นรองที่นอนเต็มแผ่น', pieces: [{ template: 'bed6', ...walnut, frontFinish: 'cream', frontColor: '#e9e0cf' }] },
  { id: 'desk', template: 'desk', name: 'โต๊ะทำงาน', size: '120 × 60 × 75 ซม.', detail: 'ขาแผ่นไม้ บังตาด้านหน้า', pieces: [{ template: 'desk', ...ashWhite, frontFinish: 'oak', frontColor: '#d4b48a' }] },
];

export const PORTFOLIO_CATS = ['ทั้งหมด', 'ตู้เสื้อผ้า', 'ห้องครัว', 'ห้องนอน', 'ห้องนั่งเล่น', 'ห้องทำงาน'];

export const PORTFOLIO = [
  { id: 'pf-closet-navy', cat: 'ตู้เสื้อผ้า', title: 'Walk-in Closet น้ำเงิน-โอ๊ค', note: 'ตู้ 3 ตัวต่อกัน 4.2 ม. · บานเปิด', open: true, azimuth: -20, zoom: 0.85, pieces: HERO_SHOTS[0].pieces, big: true },
  { id: 'pf-closet-mirror', cat: 'ตู้เสื้อผ้า', title: 'ตู้บานเลื่อนกระจกเงา', note: '240 ซม. · 3 บาน · โครงขาว', azimuth: 25, pieces: [{ template: 'wardrobe3', W: 240, finish: 'white', color: '#f3f1ec', frontFinish: 'mirror', frontColor: '#c9d3dc', doorStyle: 'sliding', slideCount: 3 }] },
  { id: 'pf-closet-sage', cat: 'ตู้เสื้อผ้า', title: 'ตู้เสื้อผ้าเขียวเซจ', note: 'ลิ้นชัก + ราวแขวน · ชั้นเถ้าขาว', open: true, azimuth: 15, pieces: [{ template: 'wardrobe3', ...sage }] },
  { id: 'pf-kitchen-oak', cat: 'ห้องครัว', title: 'ครัวขาว-โอ๊ค', note: '3.3 ม. · ท็อปเคาน์เตอร์', azimuth: -18, zoom: 0.85, pieces: kitchen(oakWhite), big: true },
  { id: 'pf-kitchen-black', cat: 'ห้องครัว', title: 'ครัวดำด้าน มินิมอล', note: 'HMR กันชื้น · มือจับดำ', azimuth: 24, zoom: 0.85, wall: '#d9dfe3', pieces: kitchen(black, { finish: 'oak', color: '#d4b48a', frontFinish: 'oak', frontColor: '#d4b48a' }) },
  { id: 'pf-kitchen-sage', cat: 'ห้องครัว', title: 'ครัวเขียวเซจ', note: 'บานเขียว ตู้แขวนเปิดได้', open: true, azimuth: 12, zoom: 0.85, pieces: kitchen(sage) },
  { id: 'pf-bed-walnut', cat: 'ห้องนอน', title: 'ห้องนอนวอลนัท', note: 'เตียง 6 ฟุต + ตู้บานเลื่อน', azimuth: -30, zoom: 0.9, pieces: HERO_SHOTS[2].pieces, big: true },
  { id: 'pf-bed-oak', cat: 'ห้องนอน', title: 'เตียง 5 ฟุต โอ๊ค', note: 'หัวเตียงสีครีม', azimuth: 30, pieces: [{ template: 'bed5', ...oakWhite, finish: 'oak', color: '#d4b48a', frontFinish: 'cream', frontColor: '#e9e0cf' }] },
  { id: 'pf-living-tv', cat: 'ห้องนั่งเล่น', title: 'ตู้ทีวี + ชั้นหนังสือ', note: 'วอลนัท · ดำด้าน', azimuth: 20, pieces: [{ template: 'bookshelf', ...black, gap: 10 }, { template: 'tvCabinet', ...walnut, gap: 10 }, { template: 'bookshelf', ...black }], wall: '#e9dccf' },
  { id: 'pf-living-shoe', cat: 'ห้องนั่งเล่น', title: 'ตู้รองเท้าหน้าบ้าน', note: 'บานคู่ ชั้น 4 ระดับ', open: true, azimuth: 18, pieces: [{ template: 'shoe', ...ashWhite, frontFinish: 'ash', frontColor: '#e9ddc7' }, { template: 'shoe', ...ashWhite, frontFinish: 'ash', frontColor: '#e9ddc7' }] },
  { id: 'pf-office', cat: 'ห้องทำงาน', title: 'มุมทำงานโอ๊ค', note: 'โต๊ะ 120 ซม. + ชั้นหนังสือ 2 ตัว', azimuth: 22, pieces: [{ template: 'bookshelf', ...oakWhite, finish: 'oak', color: '#d4b48a', gap: 20 }, { template: 'desk', ...ashWhite, frontFinish: 'oak', frontColor: '#d4b48a', gap: 20 }, { template: 'bookshelf', ...oakWhite, finish: 'oak', color: '#d4b48a' }] },
  { id: 'pf-office-dining', cat: 'ห้องทำงาน', title: 'โต๊ะอาหาร / โต๊ะประชุมขาเหล็ก', note: '150 × 80 ซม.', azimuth: 30, pieces: [{ template: 'dining', ...walnut }] },
];
