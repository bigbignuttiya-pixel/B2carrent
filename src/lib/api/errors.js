// Map server error codes (raised in supabase/schema.sql) to Thai messages
const MESSAGES = {
  vehicle_unavailable: 'ขออภัย รถคันนี้ไม่ว่างในช่วงวันที่เลือกแล้ว กรุณาเลือกวันหรือคันอื่น',
  vehicle_not_found: 'ไม่พบรถคันนี้ในระบบ',
  invalid_phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
  invalid_name: 'กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง',
  invalid_dates: 'วันรับ-คืนรถไม่ถูกต้อง (ต้องไม่ใช่วันที่ผ่านมาแล้ว และเช่าได้ไม่เกิน 60 วัน)',
  invalid_coupon: 'โค้ดส่วนลดไม่ถูกต้อง หมดอายุ หรือใช้กับรถคันนี้ไม่ได้',
  invalid_slip: 'ไฟล์สลิปไม่ถูกต้อง',
  not_allowed: 'ไม่สามารถทำรายการนี้ได้ (สถานะการจองเปลี่ยนไปแล้ว หรือเบอร์โทรไม่ตรง)',
  'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
};

export class ApiError extends Error {
  constructor(code, fallback) {
    super(MESSAGES[code] || fallback || code);
    this.code = code;
  }
}

export function toApiError(err) {
  if (err instanceof ApiError) return err;
  const raw = err?.message || String(err);
  if (/foreign key constraint/i.test(raw)) return new ApiError('has_history', 'รถคันนี้มีประวัติการจองอยู่ จึงลบไม่ได้ — ให้เปลี่ยนสถานะเป็น "ซ่อมบำรุง" แทน');
  if (/row-level security|permission denied/i.test(raw)) return new ApiError('forbidden', 'ไม่มีสิทธิ์ทำรายการนี้ — กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน');
  const code = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (code) return new ApiError(code);
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return new ApiError('network', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
  return new ApiError('unknown', `เกิดข้อผิดพลาด: ${raw}`);
}

export const errorMessage = (err) => toApiError(err).message;
