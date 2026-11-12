import { PencilRuler, Save, Download, Smartphone, Ruler, Sofa, Phone, MessageCircle, Facebook, Clock } from 'lucide-react';
import { PlanContent } from '../designer/shapes';
import { lineChatUrl } from '../lib/line';
import { btnPrimary, btnGhost } from '../components/ui';
import { PlanCard } from './BuyModal';

// A small sample living room shown on the landing page
const SAMPLE = {
  room: { w: 480, d: 380, floor: '#ead9bf', wall: '#44403c' },
  items: [
    { id: '1', type: 'rug', x: 220, y: 215, w: 220, d: 160, rot: 0, color: '#e7c9a9' },
    { id: '2', type: 'sofa3', x: 220, y: 320, w: 210, d: 90, rot: 180, color: '#9ca3af' },
    { id: '3', type: 'armchair', x: 70, y: 215, w: 85, d: 85, rot: 90, color: '#d6a77a' },
    { id: '4', type: 'coffee', x: 220, y: 215, w: 110, d: 60, rot: 0, color: '#c19a6b' },
    { id: '5', type: 'tvstand', x: 220, y: 22, w: 180, d: 40, rot: 0, color: '#8b6b4a' },
    { id: '6', type: 'plant', x: 420, y: 340, w: 50, d: 50, rot: 0, color: '#6b8f5e' },
    { id: '7', type: 'bookshelf', x: 463, y: 180, w: 100, d: 30, rot: 90, color: '#a47551' },
    { id: '8', type: 'door', x: 410, y: 40, w: 80, d: 80, rot: 0, color: '#ffffff' },
    { id: '9', type: 'lamp', x: 70, y: 330, w: 40, d: 40, rot: 0, color: '#fde68a' },
    { id: '10', type: 'window', x: 0, y: 100, w: 120, d: 12, rot: 90, color: '#dbeafe' },
  ],
};

const STEPS = [
  ['เลือกจำนวนวัน', 'คิดค่าบริการรายวัน จ่ายเฉพาะวันที่ใช้'],
  ['ชำระผ่าน PromptPay', 'สแกน QR จ่ายเงิน แล้วแนบสลิปในเว็บ'],
  ['รับรหัส + QR เข้าใช้งาน', 'เมื่อร้านยืนยันการชำระ รหัสและ QR จะแสดงให้ทันที'],
  ['สแกนแล้วเริ่มออกแบบ', 'สแกน QR หรือใส่รหัส ใช้ได้ทุกเครื่องจนครบกำหนด'],
];

const FEATURES = [
  [Ruler, 'ขนาดจริงเป็นเซนติเมตร', 'กำหนดขนาดห้องและเฟอร์นิเจอร์ตามจริง เห็นระยะทุกชิ้น'],
  [Sofa, 'เฟอร์นิเจอร์กว่า 35 แบบ', 'ห้องนั่งเล่น ห้องนอน ครัว ห้องทำงาน ห้องน้ำ ประตู หน้าต่าง'],
  [PencilRuler, 'ลาก หมุน ปรับขนาด', 'เปลี่ยนสี ใส่ชื่อ ทำซ้ำ ย้อนกลับได้ไม่จำกัด'],
  [Save, 'บันทึกบนคลาวด์', 'เปิดแบบเดิมได้จากทุกเครื่องด้วยรหัสเดียว'],
  [Download, 'ส่งออกเป็นรูปภาพ', 'ไฟล์ PNG ความละเอียดสูง ส่งให้ช่างหรือร้านเฟอร์นิเจอร์ได้เลย'],
  [Smartphone, 'ใช้ได้ทั้งมือถือและคอม', 'ซูมด้วยสองนิ้ว ลากด้วยนิ้วได้สะดวก'],
];

export default function Landing({ settings, plans, onBuy }) {
  const line = lineChatUrl(settings.lineOaId);
  return (
    <>
      <section className="bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-semibold leading-tight">{settings.tagline}</h1>
            <p className="mt-4 text-stone-600">วางแผนจัดห้องก่อนซื้อเฟอร์นิเจอร์จริง ไม่ต้องลงโปรแกรม เปิดเว็บแล้วเริ่มได้ทันที</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#design" className={`${btnPrimary} px-6 py-3`}>
                <PencilRuler className="w-4 h-4" /> ลองออกแบบฟรี
              </a>
              <a href="#plans" className={`${btnGhost} px-6 py-3`}>
                ดูแพ็กเกจ
              </a>
            </div>
            <p className="mt-3 text-xs text-stone-500">โหมดทดลองใช้ได้ทุกฟีเจอร์ บันทึกและส่งออกรูปเมื่อซื้อแพ็กเกจ</p>
          </div>
          <div className="rounded-3xl bg-white border border-stone-200 shadow-lg p-4">
            <svg viewBox={`-30 -30 ${SAMPLE.room.w + 60} ${SAMPLE.room.d + 60}`} className="w-full h-auto">
              <PlanContent design={SAMPLE} showLabels={false} />
            </svg>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold text-center">ใช้งานง่ายใน 4 ขั้นตอน</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-white border border-stone-200 p-5">
              <span className="w-8 h-8 rounded-full bg-amber-600 text-white grid place-items-center font-semibold">{i + 1}</span>
              <p className="font-medium mt-3">{t}</p>
              <p className="text-sm text-stone-500 mt-1">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white border-y border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, t, d]) => (
            <div key={t} className="flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-amber-100 text-amber-800 grid place-items-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">{t}</p>
                <p className="text-sm text-stone-500 mt-0.5">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-5xl px-4 py-14 scroll-mt-16">
        <h2 className="text-2xl font-semibold text-center">แพ็กเกจค่าบริการ</h2>
        <p className="text-center text-stone-500 mt-1">คิดเป็นรายวัน จ่ายเฉพาะวันที่ใช้ ไม่มีสมาชิกรายเดือนผูกมัด</p>
        <div className={`mt-8 grid gap-4 sm:grid-cols-2 ${plans.length > 2 ? 'lg:grid-cols-3' : 'max-w-2xl mx-auto'}`}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onClick={() => onBuy(p.id)} cta="เลือกแพ็กเกจนี้" />
          ))}
        </div>
        {plans.length === 0 && <p className="text-center text-stone-500 mt-8">กำลังโหลดแพ็กเกจ…</p>}
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm text-stone-600">
          <div>
            <p className="font-semibold text-stone-900 text-base">{settings.shopName}</p>
            <p className="mt-2">บริการเว็บออกแบบจัดวางเฟอร์นิเจอร์ภายในห้อง</p>
            {settings.openHours && (
              <p className="mt-2 flex gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" /> {settings.openHours}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-stone-900">ติดต่อเรา</p>
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="flex gap-2 hover:text-stone-900">
                <Phone className="w-4 h-4" /> {settings.phone}
              </a>
            )}
            {line && (
              <a href={line} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-stone-900">
                <MessageCircle className="w-4 h-4" /> LINE
              </a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-stone-900">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-stone-900">บัญชี</p>
            <a href="#account" className="block hover:text-stone-900">เข้าใช้งานด้วยรหัส / ดูสถานะ</a>
            <a href="#design" className="block hover:text-stone-900">หน้าออกแบบ</a>
          </div>
        </div>
        <p className="text-center text-xs text-stone-400 pb-6">© {new Date().getFullYear()} {settings.shopName}</p>
      </footer>
    </>
  );
}
