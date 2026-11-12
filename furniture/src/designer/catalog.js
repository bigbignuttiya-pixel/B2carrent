// Furniture & room elements for the planner. Sizes are in centimetres (w = width, d = depth).
export const GROUPS = [
  { id: 'living', name: 'ห้องนั่งเล่น' },
  { id: 'bedroom', name: 'ห้องนอน' },
  { id: 'dining', name: 'ห้องครัว / ทานอาหาร' },
  { id: 'office', name: 'ห้องทำงาน' },
  { id: 'bath', name: 'ห้องน้ำ' },
  { id: 'structure', name: 'โครงสร้าง / อื่น ๆ' },
];

export const CATALOG = [
  { type: 'sofa3', group: 'living', name: 'โซฟา 3 ที่นั่ง', w: 210, d: 90, color: '#9ca3af' },
  { type: 'sofa2', group: 'living', name: 'โซฟา 2 ที่นั่ง', w: 160, d: 85, color: '#9ca3af' },
  { type: 'lsofa', group: 'living', name: 'โซฟาตัว L', w: 250, d: 170, color: '#a8a29e' },
  { type: 'armchair', group: 'living', name: 'อาร์มแชร์', w: 85, d: 85, color: '#d6a77a' },
  { type: 'coffee', group: 'living', name: 'โต๊ะกลาง', w: 110, d: 60, color: '#c19a6b' },
  { type: 'sideTable', group: 'living', name: 'โต๊ะข้าง', w: 45, d: 45, color: '#c19a6b' },
  { type: 'tvstand', group: 'living', name: 'ชั้นวางทีวี', w: 160, d: 40, color: '#8b6b4a' },
  { type: 'bookshelf', group: 'living', name: 'ชั้นหนังสือ', w: 80, d: 30, color: '#a47551' },
  { type: 'rug', group: 'living', name: 'พรม', w: 200, d: 140, color: '#e7c9a9' },
  { type: 'plant', group: 'living', name: 'ต้นไม้', w: 45, d: 45, color: '#6b8f5e' },
  { type: 'lamp', group: 'living', name: 'โคมไฟตั้งพื้น', w: 40, d: 40, color: '#fde68a' },

  { type: 'bedK', group: 'bedroom', name: 'เตียง 6 ฟุต', w: 180, d: 200, color: '#cbd5e1' },
  { type: 'bedQ', group: 'bedroom', name: 'เตียง 5 ฟุต', w: 150, d: 200, color: '#cbd5e1' },
  { type: 'bedS', group: 'bedroom', name: 'เตียง 3.5 ฟุต', w: 105, d: 200, color: '#cbd5e1' },
  { type: 'wardrobe', group: 'bedroom', name: 'ตู้เสื้อผ้า', w: 120, d: 60, color: '#d4b896' },
  { type: 'nightstand', group: 'bedroom', name: 'โต๊ะข้างเตียง', w: 45, d: 40, color: '#d4b896' },
  { type: 'dresser', group: 'bedroom', name: 'โต๊ะเครื่องแป้ง', w: 100, d: 45, color: '#e5d3b3' },

  { type: 'diningRect', group: 'dining', name: 'โต๊ะอาหาร 4 ที่นั่ง', w: 120, d: 75, color: '#b08968' },
  { type: 'diningLong', group: 'dining', name: 'โต๊ะอาหาร 6 ที่นั่ง', w: 180, d: 90, color: '#b08968' },
  { type: 'diningRound', group: 'dining', name: 'โต๊ะกลม', w: 100, d: 100, color: '#b08968' },
  { type: 'chair', group: 'dining', name: 'เก้าอี้', w: 45, d: 50, color: '#8d6e63' },
  { type: 'counter', group: 'dining', name: 'เคาน์เตอร์ครัว', w: 180, d: 60, color: '#e7e5e4' },
  { type: 'stove', group: 'dining', name: 'เตา', w: 60, d: 60, color: '#e7e5e4' },
  { type: 'sinkK', group: 'dining', name: 'ซิงก์ล้างจาน', w: 80, d: 60, color: '#e7e5e4' },
  { type: 'fridge', group: 'dining', name: 'ตู้เย็น', w: 70, d: 70, color: '#f5f5f4' },

  { type: 'desk', group: 'office', name: 'โต๊ะทำงาน', w: 140, d: 70, color: '#c8a27a' },
  { type: 'officeChair', group: 'office', name: 'เก้าอี้สำนักงาน', w: 60, d: 60, color: '#57534e' },
  { type: 'cabinet', group: 'office', name: 'ตู้เอกสาร', w: 80, d: 45, color: '#a8a29e' },

  { type: 'toilet', group: 'bath', name: 'ชักโครก', w: 40, d: 70, color: '#ffffff' },
  { type: 'basin', group: 'bath', name: 'อ่างล้างหน้า', w: 60, d: 45, color: '#ffffff' },
  { type: 'bathtub', group: 'bath', name: 'อ่างอาบน้ำ', w: 170, d: 75, color: '#ffffff' },
  { type: 'shower', group: 'bath', name: 'พื้นที่ฝักบัว', w: 90, d: 90, color: '#e0f2fe' },

  { type: 'door', group: 'structure', name: 'ประตู', w: 80, d: 80, color: '#ffffff' },
  { type: 'window', group: 'structure', name: 'หน้าต่าง', w: 120, d: 12, color: '#dbeafe' },
  { type: 'wall', group: 'structure', name: 'ผนังกั้นห้อง', w: 200, d: 10, color: '#57534e' },
  { type: 'column', group: 'structure', name: 'เสา', w: 30, d: 30, color: '#78716c' },
  { type: 'label', group: 'structure', name: 'ข้อความ', w: 120, d: 30, color: '#292524' },
];

export const catalogItem = (type) => CATALOG.find((c) => c.type === type) || { type, name: type, w: 50, d: 50, color: '#d6d3d1' };

export const FLOORS = [
  { name: 'ไม้สีอ่อน', color: '#ead9bf' },
  { name: 'ไม้สีเข้ม', color: '#b89574' },
  { name: 'กระเบื้องขาว', color: '#f3f2ee' },
  { name: 'ปูนเปลือย', color: '#d6d3d1' },
  { name: 'หินอ่อน', color: '#ece9e4' },
];

export const SWATCHES = ['#ffffff', '#e7e5e4', '#9ca3af', '#57534e', '#292524', '#e7c9a9', '#d4b896', '#c19a6b', '#8b6b4a', '#cbd5e1', '#93c5fd', '#86efac', '#6b8f5e', '#fca5a5', '#fde68a', '#c4b5fd'];

export const newDesign = () => ({
  version: 1,
  room: { w: 400, d: 350, floor: FLOORS[0].color, wall: '#44403c' },
  items: [],
});
