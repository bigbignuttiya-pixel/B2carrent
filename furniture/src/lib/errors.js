// Map server error codes (raised in supabase/schema.sql) to Thai messages
const MESSAGES = {
  invalid_phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)',
  invalid_name: 'กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง',
  invalid_address: 'กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน',
  invalid_slip: 'ไฟล์สลิปไม่ถูกต้อง',
  invalid_qty: 'จำนวนสินค้าไม่ถูกต้อง',
  empty_cart: 'ยังไม่มีสินค้าในตะกร้า',
  product_not_found: 'มีสินค้าในตะกร้าที่ไม่มีจำหน่ายแล้ว กรุณานำออกจากตะกร้า',
  not_allowed: 'ไม่สามารถทำรายการนี้ได้ (สถานะคำสั่งซื้อเปลี่ยนไปแล้ว หรือเบอร์โทรไม่ตรง)',
  'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
};

export class ApiError extends Error {
  constructor(code, message) {
    super(message || MESSAGES[code] || code);
    this.code = code;
  }
}

export function toApiError(err) {
  if (err instanceof ApiError) return err;
  const raw = err?.message || String(err);
  const stock = raw.match(/out_of_stock:(.+)$/);
  if (stock) return new ApiError('out_of_stock', `ขออภัย "${stock[1].trim()}" มีสต็อกไม่พอแล้ว กรุณาลดจำนวนหรือนำออกจากตะกร้า`);
  if (/duplicate key/i.test(raw)) return new ApiError('duplicate', 'รหัสสินค้านี้มีอยู่แล้ว');
  if (/row-level security|permission denied/i.test(raw)) return new ApiError('forbidden', 'ไม่มีสิทธิ์ทำรายการนี้ — กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน');
  const code = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (code) return new ApiError(code);
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return new ApiError('network', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
  return new ApiError('unknown', `เกิดข้อผิดพลาด: ${raw}`);
}

export const errorMessage = (err) => toApiError(err).message;
