import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Sparkles, Save, Smartphone, Ruler, Sofa, Phone, MessageCircle, Facebook, Clock, Box, Scissors, FileText, Camera, Layers,
  Calculator, Check, QrCode, CreditCard, KeyRound, Wand2, DoorOpen,
} from 'lucide-react';
import { PlanContent } from '../designer/shapes';
import { FrontDrawing, frontViewBox } from '../studio/FrontView';
import SheetLayout from '../studio/SheetLayout';
import { newPiece, newStudioDesign, DEFAULT_MATERIALS } from '../studio/model';
import { analyzeProject, money } from '../studio/costing';
import { lineChatUrl } from '../lib/line';
import { HeroBanner, Products, Portfolio } from './LandingShowcase';
import { baht, daysLabel } from '../data';

// A small sample living room shown on the landing page
const SAMPLE = {
  room: { w: 480, d: 380, floor: '#ead9bf', wall: '#292524' },
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

// A real sample project: the numbers on this page come from the same engine the studio uses
const Viewer3D = lazy(() => import('../studio/Viewer3D'));
const HERO_PIECE = newPiece('wardrobe3', { color: '#efe3cf', frontColor: '#c8a27a' });
// The piece shown in 3D on the hero: navy doors, oak interior, like a showroom closet
const HERO_3D = [newPiece('wardrobe3', { id: 'hero3d', finish: 'white', color: '#f3f1ec', frontFinish: 'navy', frontColor: '#34507f', shelfFinish: 'oak' })];

// Live 3D wardrobe that turns slowly and opens / closes its doors; the 2D drawing shows while it loads
function Hero3D() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setOpen((v) => !v), 3200);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '200px' }) : null;
    if (io && ref.current) io.observe(ref.current);
    else setVisible(true);
    return () => (clearInterval(t), io?.disconnect());
  }, []);
  const fallback = (
    <div className="absolute inset-0 p-6 grid place-items-center">
      <svg viewBox={HERO_VB.vb} className="h-full w-auto">
        <FrontDrawing piece={HERO_PIECE} materials={DEFAULT_MATERIALS} showDoors={false} built={HERO_VB.built} />
      </svg>
    </div>
  );
  return (
    <div ref={ref} className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-[#f4efe8] to-[#e6dfd6]">
      {visible ? (
        <Suspense fallback={fallback}>
          <Viewer3D pieces={HERO_3D} materials={DEFAULT_MATERIALS} selectedId="hero3d" allOpen={open} showRoom showDecor wallColor="#ece7df" autoRotate={9} interactive={false} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
const HERO_VB = frontViewBox(HERO_PIECE, DEFAULT_MATERIALS, 0.08);
const KITCHEN = newPiece('kitchenDrawer', { frontColor: '#5b4636' });
const KITCHEN_VB = frontViewBox(KITCHEN, DEFAULT_MATERIALS, 0.08);
const DEMO = (() => {
  const d = newStudioDesign();
  d.items = [HERO_PIECE, newPiece('kitchenBase'), KITCHEN];
  return { design: d, a: analyzeProject(d) };
})();
const DEMO_MAT = DEMO.a.mats[0];

const STEPS = [
  [CreditCard, 'เลือกจำนวนวัน', 'คิดค่าบริการรายวัน จ่ายเฉพาะวันที่ใช้'],
  [QrCode, 'สแกน QR PromptPay', 'โอนเงินแล้วแนบสลิปในเว็บได้ทันที'],
  [KeyRound, 'รับรหัส + QR เข้าใช้งาน', 'ร้านยืนยันการชำระ ระบบออกรหัสและ QR ให้ทันที'],
  [Wand2, 'สแกนแล้วเริ่มออกแบบ', 'ใช้ได้ทุกเครื่องจนครบกำหนด แบบที่บันทึกอยู่ครบ'],
];

const FEATURES = [
  { icon: Layers, t: 'ลากวางชั้นภายในตู้', d: 'แบ่งช่อง ลากชั้นวาง ลิ้นชัก ราวแขวน ไปวางตรงไหนก็ได้ เห็นระยะทุกช่องทันที', big: true },
  { icon: DoorOpen, t: '3D เปิด-ปิดประตูได้', d: 'หมุนดูรอบทิศ แตะบานหรือลิ้นชักเพื่อเปิดดูภายใน', big: true },
  { icon: Sofa, t: 'ตู้ครัว โต๊ะ เตียง', d: 'ตู้ครัวล่าง/แขวน ตู้เสื้อผ้า ชั้นหนังสือ ตู้ทีวี ตู้รองเท้า และกำหนดเอง' },
  { icon: Scissors, t: 'คำนวณแผ่น 120 × 240', d: 'จัดเรียงชิ้นงานบนแผ่นไม้มาตรฐาน บอกจำนวนแผ่นและ % การใช้ไม้' },
  { icon: FileText, t: 'ใบเสนอราคา + ใบตัดไม้ PDF', d: 'ส่งให้ลูกค้าและช่างได้ทันที' },
  { icon: Camera, t: 'วัดขนาดจากรูปถ่าย', d: 'ตั้งสเกลจากระยะอ้างอิง ลากกรอบวัดกว้าง × สูง' },
  { icon: Calculator, t: 'พื้นที่วัสดุและต้นทุน', d: 'ต้นทุนวัสดุ ปิดขอบ อุปกรณ์ ค่าแรง กำไร แยกต่อชิ้น' },
  { icon: Save, t: 'เก็บหลายโปรเจกต์', d: 'บันทึกบนคลาวด์ เปิดได้ทุกเครื่องด้วยรหัสเดียว' },
  { icon: Ruler, t: 'จัดผังห้องตามจริง', d: 'วางเฟอร์นิเจอร์กว่า 35 แบบในห้องตามขนาดจริง' },
  { icon: Smartphone, t: 'มือถือ แท็บเล็ต คอม', d: 'ลากด้วยนิ้ว ซูมสองนิ้ว ไม่ต้องลงโปรแกรม' },
];

const MARQUEE = ['ตู้เสื้อผ้า', 'ตู้ครัวล่าง', 'ตู้ครัวแขวน', 'ชั้นหนังสือ', 'ตู้วางทีวี', 'ตู้รองเท้า', 'โต๊ะทำงาน', 'โต๊ะอาหาร', 'เตียง 5 ฟุต', 'เตียง 6 ฟุต', 'ตู้บิวท์อิน', 'ผังห้อง'];

// Fade sections in as they scroll into view
function useReveal(dep) {
  const ref = useRef(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.reveal') || [];
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: 0.12 });
    els.forEach((e) => !e.classList.contains('in') && io.observe(e));
    return () => io.disconnect();
  }, [dep]);
  return ref;
}

// Card that tilts toward the pointer
function Tilt({ children, className = '' }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  };
  const leave = () => ref.current && (ref.current.style.transform = 'perspective(1000px) rotateY(-8deg) rotateX(4deg)');
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`transition-transform duration-300 ease-out ${className}`} style={{ transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg)' }}>
      {children}
    </div>
  );
}

const btnGlow =
  'group relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 shadow-[0_10px_40px_-10px_rgba(251,146,60,.8)] hover:shadow-[0_14px_50px_-8px_rgba(251,146,60,1)] hover:-translate-y-0.5 transition';
const btnGlass = 'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-medium text-white bg-white/5 border border-white/15 backdrop-blur hover:bg-white/10 transition';
const glass = 'rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl';
const chip = 'rounded-2xl bg-stone-900/90 border border-white/15 backdrop-blur-xl';

export default function Landing({ settings, plans, onBuy }) {
  const line = lineChatUrl(settings.lineOaId);
  const root = useReveal(plans.length);
  const best = plans.length > 1 ? plans.reduce((a, p) => (p.price / p.days < a.price / a.days ? p : a), plans[0]) : null;

  return (
    <div ref={root} className="bg-[#0c0a09] text-stone-200 overflow-hidden">
      <HeroBanner settings={settings} />

      <section>
        {/* marquee */}
        <div className="border-y border-white/10 bg-white/[0.02] py-4 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 text-stone-500 text-sm">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {m} <span className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- features bento ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="reveal text-center max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-orange-300">FEATURES</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">เครื่องมือครบ ตั้งแต่ไอเดียจนถึงใบตัดไม้</h2>
          <p className="mt-3 text-stone-400">ทุกตัวเลขคำนวณจากแบบจริง — แก้แบบเมื่อไร ราคาและแผ่นไม้อัปเดตทันที</p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, t, d, big }, i) => (
            <div
              key={t}
              className={`reveal glow-border group ${glass} p-6 hover:bg-white/[0.07] hover:-translate-y-1 transition duration-300 ${big ? 'lg:col-span-2' : ''}`}
              style={{ transitionDelay: `${(i % 4) * 70}ms` }}
            >
              <div className="w-11 h-11 rounded-2xl grid place-items-center bg-gradient-to-br from-amber-300/20 to-rose-400/20 border border-white/10 text-orange-200 group-hover:scale-110 transition">
                <Icon className="w-5 h-5" />
              </div>
              <p className={`mt-5 font-medium text-white ${big ? 'text-xl' : ''}`}>{t}</p>
              <p className="mt-1.5 text-sm text-stone-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <Products />
      <Portfolio />

      {/* ---------- showcase ---------- */}
      <section className="relative">
        <div className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-orange-500/[0.06] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <div className="reveal max-w-2xl">
            <p className="text-xs tracking-[0.3em] text-orange-300">WORKFLOW</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">ออกแบบ → ตัดไม้ → เสนอราคา</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <div className={`reveal ${glass} p-5`}>
              <p className="text-sm text-stone-400">
                <span className="text-orange-300 font-semibold mr-2">01</span>ห้องโชว์ 3D หมุนดู เปิดบานได้
              </p>
              <div className="mt-4">
                <Hero3D />
              </div>
            </div>
            <div className={`reveal ${glass} p-5`} style={{ transitionDelay: '120ms' }}>
              <p className="text-sm text-stone-400">
                <span className="text-orange-300 font-semibold mr-2">02</span>จัดเรียงบนแผ่น {DEMO.design.pricing.sheetW}×{DEMO.design.pricing.sheetH}
              </p>
              <div className="mt-4 rounded-2xl bg-stone-100 p-4 h-64 flex gap-3 justify-center">
                {DEMO_MAT.layout.sheets.slice(0, 3).map((s, i) => (
                  <SheetLayout key={i} sheet={s} W={DEMO.design.pricing.sheetW} H={DEMO.design.pricing.sheetH} className="h-full w-auto" />
                ))}
              </div>
            </div>
            <div className={`reveal ${glass} p-5`} style={{ transitionDelay: '240ms' }}>
              <p className="text-sm text-stone-400">
                <span className="text-orange-300 font-semibold mr-2">03</span>ใบเสนอราคาพร้อมส่ง
              </p>
              <div className="mt-4 rounded-2xl bg-white text-stone-800 p-5 h-64 flex flex-col text-sm">
                <div className="flex justify-between items-baseline border-b-2 border-stone-900 pb-2">
                  <b className="text-base">ใบเสนอราคา</b>
                  <span className="text-[11px] text-stone-500">QT-0001</span>
                </div>
                <div className="flex-1 divide-y divide-stone-100 mt-1">
                  {DEMO.design.items.map((p) => (
                    <div key={p.id} className="flex justify-between py-2">
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="font-medium">{money(DEMO.a.piecePrices.find((x) => x.id === p.id)?.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center rounded-xl bg-stone-900 text-white px-3 py-2">
                  <span>ยอดรวม</span>
                  <b>฿{money(DEMO.a.total)}</b>
                </div>
              </div>
            </div>
          </div>
          <div className="reveal mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr] items-center">
            <div className={`${glass} p-5`}>
              <p className="text-sm text-stone-400">
                <span className="text-orange-300 font-semibold mr-2">+</span>จัดผังห้องตามขนาดจริง
              </p>
              <svg viewBox={`-30 -30 ${SAMPLE.room.w + 60} ${SAMPLE.room.d + 60}`} className="mt-4 w-full h-auto rounded-2xl">
                <PlanContent design={SAMPLE} showLabels={false} />
              </svg>
            </div>
            <div className="lg:pl-8">
              <h3 className="text-2xl font-semibold text-white">วัดจากรูป แล้วสร้างเป็นตู้ได้เลย</h3>
              <p className="mt-3 text-stone-400 leading-relaxed">อัปโหลดรูปหน้างาน ใส่ระยะอ้างอิง แตะสองจุดเพื่อตั้งสเกล ลากกรอบครอบชิ้นงาน — ได้ขนาด พื้นที่ และต้นทุนทันที</p>
              <ul className="mt-5 space-y-2 text-sm">
                {['ตั้งสเกลจากระยะที่รู้ เช่น 100 ซม.', 'ลากกรอบวัดได้หลายชิ้น', 'กดสร้างเป็นตู้เพื่อออกแบบต่อ'].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-400/15 text-orange-300 grid place-items-center">
                      <Check className="w-3 h-3" />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- steps ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="reveal text-3xl sm:text-4xl font-semibold text-white text-center">เริ่มใช้งานใน 4 ขั้นตอน</h2>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative">
          <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
          {STEPS.map(([Icon, t, d], i) => (
            <li key={t} className="reveal relative text-center px-4" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="relative mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-[#0c0a09] border border-white/15 shadow-[0_0_40px_-10px_rgba(251,146,60,.6)]">
                <Icon className="w-6 h-6 text-orange-300" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 text-stone-950 text-xs font-bold grid place-items-center">{i + 1}</span>
              </span>
              <p className="font-medium text-white mt-5">{t}</p>
              <p className="text-sm text-stone-400 mt-1">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- plans ---------- */}
      <section id="plans" className="relative mx-auto max-w-5xl px-4 py-20 scroll-mt-16">
        <div className="absolute -z-0 left-1/2 -translate-x-1/2 top-32 w-[40rem] h-72 rounded-full bg-orange-500/15 blur-[110px]" />
        <div className="reveal relative text-center">
          <p className="text-xs tracking-[0.3em] text-orange-300">PRICING</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">แพ็กเกจค่าบริการ</h2>
          <p className="mt-2 text-stone-400">คิดเป็นรายวัน จ่ายเฉพาะวันที่ใช้ ไม่ผูกมัดรายเดือน</p>
        </div>
        <div className={`relative mt-12 grid gap-5 sm:grid-cols-2 ${plans.length > 2 ? 'lg:grid-cols-3' : 'max-w-3xl mx-auto'}`}>
          {plans.map((p, i) => {
            const hot = best && p.id === best.id;
            return (
              <button
                key={p.id}
                onClick={() => onBuy(p.id)}
                className={`reveal text-left relative rounded-3xl p-7 transition duration-300 hover:-translate-y-1.5 ${hot ? 'bg-gradient-to-b from-orange-400/20 to-white/[0.03] border border-orange-300/50 shadow-[0_30px_80px_-30px_rgba(251,146,60,.7)]' : `${glass} glow-border hover:bg-white/[0.07]`}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {hot && <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-amber-300 to-rose-400 text-stone-950 text-[11px] font-semibold px-3 py-1">คุ้มที่สุด</span>}
                <p className="font-medium text-stone-300">{p.name}</p>
                <p className="mt-3 text-5xl font-semibold text-white tracking-tight">{baht(p.price)}</p>
                <p className="mt-2 text-sm text-stone-400">
                  ใช้งานได้ {daysLabel(p.days)}
                  {p.days > 1 ? ` · เฉลี่ยวันละ ${baht(Math.round(p.price / p.days))}` : ''}
                </p>
                {p.description && <p className="mt-3 text-sm text-stone-400">{p.description}</p>}
                <ul className="mt-6 space-y-2 text-sm text-stone-300">
                  {['ทุกฟีเจอร์ 2D / 3D', 'บันทึกหลายโปรเจกต์', 'ใบเสนอราคา + ใบตัดไม้ PDF'].map((x) => (
                    <li key={x} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-orange-300" /> {x}
                    </li>
                  ))}
                </ul>
                <span className={`mt-7 w-full ${hot ? btnGlow : btnGlass}`}>เลือกแพ็กเกจนี้</span>
              </button>
            );
          })}
        </div>
        {plans.length === 0 && <p className="text-center text-stone-500 mt-8">กำลังโหลดแพ็กเกจ…</p>}
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="reveal relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-500/25 via-rose-500/10 to-transparent p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-blueprint opacity-60 [mask-image:radial-gradient(ellipse,black,transparent_70%)]" />
          <h2 className="relative text-3xl sm:text-4xl font-semibold text-white">ลองออกแบบชิ้นแรกของคุณวันนี้</h2>
          <p className="relative mt-3 text-stone-300">ไม่ต้องสมัคร ไม่ต้องลงโปรแกรม เปิดแล้วเริ่มได้เลย</p>
          <a href="#studio" className={`relative mt-8 ${btnGlow}`}>
            เปิด FORMA STUDIO <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </a>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-3 text-sm text-stone-400">
          <div>
            <p className="font-semibold text-white text-base">{settings.shopName}</p>
            <p className="text-[11px] tracking-[0.25em] text-orange-300 mt-1">FORMA STUDIO</p>
            <p className="mt-3">บริการเว็บออกแบบเฟอร์นิเจอร์และจัดวางห้อง (เก็บค่าบริการรายวัน ไม่ได้ขายสินค้า)</p>
            {settings.openHours && (
              <p className="mt-2 flex gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" /> {settings.openHours}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-white">ติดต่อเรา</p>
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="flex gap-2 hover:text-white">
                <Phone className="w-4 h-4" /> {settings.phone}
              </a>
            )}
            {line && (
              <a href={line} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-white">
                <MessageCircle className="w-4 h-4" /> LINE
              </a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-white">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-white">บัญชี</p>
            <a href="#account" className="block hover:text-white">เข้าใช้งานด้วยรหัส / ดูสถานะ</a>
            <a href="#studio" className="block hover:text-white">ออกแบบเฟอร์นิเจอร์ (FORMA STUDIO)</a>
            <a href="#design" className="block hover:text-white">จัดผังห้อง</a>
            <a href="#admin" className="block text-stone-600 hover:text-white pt-2">สำหรับร้าน (หลังบ้าน)</a>
          </div>
        </div>
        <p className="text-center text-xs text-stone-600 pb-8">© {new Date().getFullYear()} {settings.shopName}</p>
      </footer>
    </div>
  );
}
