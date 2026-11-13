export const PAYMENT_STATUS = {
  Pending: { label: 'รอตรวจสอบการชำระเงิน', short: 'รอตรวจสอบ', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  Approved: { label: 'ชำระเงินแล้ว', short: 'อนุมัติแล้ว', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Rejected: { label: 'ไม่อนุมัติ', short: 'ไม่อนุมัติ', cls: 'bg-stone-200 text-stone-600 border-stone-300' },
};

export const DEFAULT_SETTINGS = {
  shopName: 'Furniture Design',
  tagline: 'ออกแบบจัดวางเฟอร์นิเจอร์ในห้องของคุณ ง่าย ๆ ผ่านเว็บ',
  phone: '',
  lineOaId: '',
  facebookUrl: '',
  openHours: '',
  promptPayId: '',
  accountName: '',
  allowTrial: true,
  autoApproveSlip: false, // approve automatically when the slip check passes (needs EASYSLIP_API_KEY)
};

export const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH');
export const formatCode = (c) => (c ? `${c.slice(0, 5)}-${c.slice(5)}` : '');
export const daysLabel = (d) => (d % 30 === 0 && d >= 30 ? `${d / 30} เดือน` : d % 7 === 0 && d >= 7 ? `${d / 7} สัปดาห์` : `${d} วัน`);
