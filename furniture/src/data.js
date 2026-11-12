export const CATEGORIES = [
  { id: 'living', name: 'ห้องนั่งเล่น', emoji: '🛋️' },
  { id: 'bedroom', name: 'ห้องนอน', emoji: '🛏️' },
  { id: 'dining', name: 'ห้องทานอาหาร', emoji: '🍽️' },
  { id: 'office', name: 'ห้องทำงาน', emoji: '🖥️' },
  { id: 'outdoor', name: 'นอกบ้าน', emoji: '🌿' },
  { id: 'decor', name: 'ของตกแต่ง', emoji: '🪴' },
];
export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) || { id, name: id, emoji: '📦' };

export const ORDER_STATUS = {
  Pending: { label: 'รอตรวจสอบการชำระเงิน', short: 'รอตรวจสอบ', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  Confirmed: { label: 'ยืนยันแล้ว กำลังเตรียมสินค้า', short: 'ยืนยันแล้ว', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  Shipped: { label: 'จัดส่งแล้ว', short: 'จัดส่งแล้ว', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  Completed: { label: 'ได้รับสินค้าแล้ว', short: 'สำเร็จ', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Cancelled: { label: 'ยกเลิกแล้ว', short: 'ยกเลิก', cls: 'bg-stone-200 text-stone-600 border-stone-300' },
};
export const STATUS_FLOW = ['Pending', 'Confirmed', 'Shipped', 'Completed'];

export const DEFAULT_SETTINGS = {
  shopName: 'Furniture',
  tagline: 'เฟอร์นิเจอร์สำหรับทุกห้องในบ้าน ดีไซน์เรียบง่าย วัสดุคุณภาพ',
  phone: '',
  lineOaId: '',
  facebookUrl: '',
  address: '',
  openHours: '',
  promptPayId: '',
  accountName: '',
  shippingFee: 0,
  freeShippingMin: 0,
  shippingNote: '',
};

export const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH');
export const unitPrice = (p) => (p.salePrice != null ? p.salePrice : p.price);
export const shippingFor = (subtotal, s) =>
  subtotal <= 0 ? 0 : s.freeShippingMin > 0 && subtotal >= s.freeShippingMin ? 0 : Number(s.shippingFee) || 0;
