// Map server error codes (raised in supabase/schema.sql) to Thai messages
const MESSAGES = {
  invalid_code: 'รหัสเข้าใช้งานไม่ถูกต้อง',
  access_expired: 'สิทธิ์การใช้งานหมดอายุหรือยังไม่ได้รับการยืนยันการชำระเงิน',
  invalid_phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)',
  invalid_name: 'กรุณากรอกชื่อให้ถูกต้อง',
  invalid_plan: 'แพ็กเกจนี้ไม่มีให้บริการแล้ว',
  invalid_slip: 'ไฟล์สลิปไม่ถูกต้อง',
  invalid_design: 'ข้อมูลแบบไม่ถูกต้องหรือใหญ่เกินไป',
  too_many_pending: 'มีรายการรอชำระเงินค้างอยู่หลายรายการ กรุณาแนบสลิปหรือติดต่อร้าน',
  too_many_projects: 'บันทึกแบบได้สูงสุด 100 แบบ กรุณาลบแบบเก่าก่อน',
  not_found: 'ไม่พบแบบนี้',
  has_payments: 'ลูกค้ารายนี้มีประวัติการชำระเงิน ต้องเก็บไว้เป็นหลักฐาน จึงลบไม่ได้',
  not_allowed: 'ไม่สามารถทำรายการนี้ได้ (สถานะเปลี่ยนไปแล้ว)',
  'Invalid login credentials': 'รหัสผ่านไม่ถูกต้อง',
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
  if (/duplicate key/i.test(raw)) return new ApiError('duplicate', 'รหัสนี้มีอยู่แล้ว');
  if (/row-level security|permission denied/i.test(raw)) return new ApiError('forbidden', 'ไม่มีสิทธิ์ทำรายการนี้ — กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน');
  const code = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (code) return new ApiError(code);
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return new ApiError('network', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
  return new ApiError('unknown', `เกิดข้อผิดพลาด: ${raw}`);
}

export const errorMessage = (err) => toApiError(err).message;
