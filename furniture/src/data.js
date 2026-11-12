export const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'living', name: 'ห้องนั่งเล่น' },
  { id: 'bedroom', name: 'ห้องนอน' },
  { id: 'dining', name: 'ห้องทานอาหาร' },
  { id: 'office', name: 'ห้องทำงาน' },
];

export const PRODUCTS = [
  { id: 1, name: 'โซฟา 3 ที่นั่ง', category: 'living', price: 15900, color: 'bg-amber-200', emoji: '🛋️' },
  { id: 2, name: 'โต๊ะกลางไม้โอ๊ค', category: 'living', price: 4590, color: 'bg-orange-200', emoji: '🪵' },
  { id: 3, name: 'เตียงนอน 6 ฟุต', category: 'bedroom', price: 12900, color: 'bg-sky-200', emoji: '🛏️' },
  { id: 4, name: 'ตู้เสื้อผ้า 2 บาน', category: 'bedroom', price: 8990, color: 'bg-stone-300', emoji: '🚪' },
  { id: 5, name: 'ชุดโต๊ะอาหาร 4 ที่นั่ง', category: 'dining', price: 10500, color: 'bg-emerald-200', emoji: '🍽️' },
  { id: 6, name: 'เก้าอี้ทานอาหาร', category: 'dining', price: 1290, color: 'bg-lime-200', emoji: '🪑' },
  { id: 7, name: 'โต๊ะทำงานปรับระดับ', category: 'office', price: 9900, color: 'bg-indigo-200', emoji: '🖥️' },
  { id: 8, name: 'เก้าอี้สำนักงาน', category: 'office', price: 3490, color: 'bg-rose-200', emoji: '💺' },
];

export const baht = (n) => '฿' + n.toLocaleString('th-TH');
