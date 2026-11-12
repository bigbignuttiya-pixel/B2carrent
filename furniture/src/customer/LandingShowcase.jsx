// Landing page: full-width hero banner, products & services cards, portfolio gallery.
// Images in /public/showcase are rendered from the pieces in ./showcase.js by the studio's 3D engine.
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Phone, MessageCircle, ChevronLeft, ChevronRight, X, PencilRuler, Ruler, Maximize2, Box, Scissors, Calculator, Camera, LayoutGrid, Check, Layers } from 'lucide-react';
import SheetLayout from '../studio/SheetLayout';
import { PlanContent } from '../designer/shapes';
import { baht } from '../data';
import { HERO_SHOTS, PRODUCTS, PORTFOLIO, PORTFOLIO_CATS } from './showcase';
import { newPiece, newStudioDesign } from '../studio/model';
import { analyzeProject, money } from '../studio/costing';
import { lineChatUrl } from '../lib/line';

const img = (id) => `/showcase/${id}.jpg`;
// What the calculator reports for a sample: sheets used and cost (materials, edging, hardware, labour — no profit)
const calcOf = (pieces) => {
  const d = newStudioDesign();
  d.items = pieces.map((p) => newPiece(p.template, p));
  const a = analyzeProject(d);
  return { sheets: a.totalSheets, cost: a.cost, area: a.partArea, analysis: a, design: d };
};
export const designLink = (id) => `#studio?showcase=${id}`;

const btnGlow =
  'group relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 shadow-[0_10px_40px_-10px_rgba(251,146,60,.8)] hover:shadow-[0_14px_50px_-8px_rgba(251,146,60,1)] hover:-translate-y-0.5 transition';
const btnGlass = 'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-medium text-white bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition';

// ---------- 1. Hero banner ----------
export function HeroBanner({ settings }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % HERO_SHOTS.length), 6500);
    return () => clearInterval(t);
  }, []);
  const line = lineChatUrl(settings.lineOaId);
  const shot = HERO_SHOTS[i];
  return (
    <section className="relative isolate h-[92svh] min-h-[600px] max-h-[980px] overflow-hidden">
      {HERO_SHOTS.map((s, k) => (
        <img
          key={s.id}
          src={img(s.id)}
          alt={s.title}
          fetchpriority={k === 0 ? 'high' : 'low'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1600ms] ${k === i ? 'opacity-100 animate-kenburns' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/95 via-[#0c0a09]/60 to-[#0c0a09]/5" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0c0a09] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0c0a09]/70 to-transparent" />

      <div className="relative h-full mx-auto max-w-6xl px-4 flex flex-col justify-center pb-16">
        <div className="max-w-2xl reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/40 bg-black/30 backdrop-blur px-3.5 py-1.5 text-xs text-orange-200">
            {settings.shopName} · FORMA STUDIO
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-semibold leading-[1.12] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,.5)]">
            ออกแบบและคำนวณต้นทุน
            <br />
            <span className="text-gradient animate-shine">เฟอร์นิเจอร์ ก่อนลงมือทำ</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-stone-200/90 max-w-xl leading-relaxed">
            บริการเครื่องมือออกแบบออนไลน์ — วาดตู้เสื้อผ้า ตู้ครัว เตียง ชั้นวาง เป็นภาพ 3D ตามขนาดจริง แล้วให้ระบบคำนวณแผ่นไม้ ต้นทุนวัสดุ ค่าแรง และออกใบเสนอราคาสำหรับงานของคุณ
            <span className="block mt-2 text-sm text-stone-300/80">เก็บค่าบริการใช้งานรายวัน · ร้านไม่ได้ขายหรือรับผลิตเฟอร์นิเจอร์</span>
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#studio" className={btnGlow}>
              <PencilRuler className="w-4 h-4" /> เริ่มออกแบบฟรี <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </a>
            {line && (
              <a href={line} target="_blank" rel="noreferrer" className={`${btnGlass} !bg-[#06c755]/90 !border-[#06c755] hover:!bg-[#06c755]`}>
                <MessageCircle className="w-4 h-4" /> ติดต่อทาง LINE
              </a>
            )}
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className={btnGlass}>
                <Phone className="w-4 h-4" /> โทร {settings.phone}
              </a>
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-300">
            <a href="#services" className="hover:text-white underline-offset-4 hover:underline">บริการของเรา</a>
            <a href="#portfolio" className="hover:text-white underline-offset-4 hover:underline">ตัวอย่างงานออกแบบ</a>
            <a href="#plans" className="hover:text-white underline-offset-4 hover:underline">ค่าบริการ 1 วัน ฿50</a>
          </div>
        </div>
      </div>

      {/* caption + slide dots */}
      <div className="absolute bottom-8 right-4 sm:right-8 flex items-center gap-3">
        <span key={shot.id} className="hidden sm:block text-xs text-stone-200 bg-black/40 backdrop-blur rounded-full px-3 py-1.5 animate-fade-in">
          {shot.title}
        </span>
        {HERO_SHOTS.map((s, k) => (
          <button key={s.id} onClick={() => setI(k)} aria-label={s.title} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-8 bg-orange-400' : 'w-3 bg-white/40 hover:bg-white/70'}`} />
        ))}
      </div>
    </section>
  );
}

// ---------- 2. Services (what the shop sells: use of the design & costing tools) ----------
const DEMO = calcOf([{ template: 'wardrobe3' }, { template: 'kitchenBase' }, { template: 'kitchenDrawer' }]);

function QuoteMock() {
  return (
    <div className="absolute inset-0 p-5 bg-white text-stone-800 text-xs flex flex-col">
      <div className="flex justify-between border-b-2 border-stone-900 pb-1.5"><b className="text-sm">ใบเสนอราคา</b><span className="text-stone-400">QT-0001</span></div>
      {DEMO.design.items.map((p) => (
        <div key={p.id} className="flex justify-between py-1.5 border-b border-stone-100"><span className="truncate pr-2">{p.name}</span><span>{money(DEMO.analysis.piecePrices.find((x) => x.id === p.id)?.price)}</span></div>
      ))}
      <div className="mt-auto flex justify-between rounded-lg bg-stone-900 text-white px-3 py-1.5"><span>รวม</span><b>฿{money(DEMO.analysis.total)}</b></div>
    </div>
  );
}

const SERVICES = [
  {
    icon: Box, name: 'ออกแบบเฟอร์นิเจอร์ 2D / 3D', detail: ['ตู้เสื้อผ้า ตู้ครัว เตียง โต๊ะ ชั้นวาง', 'ลากวางชั้น ลิ้นชัก ราวแขวน', 'เปิด-ปิดประตูในโมเดล 3D'],
    media: () => <img src={img('hero-closet')} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700" />,
  },
  {
    icon: Scissors, name: 'คำนวณแผ่นไม้ + ใบตัดไม้', detail: ['จัดเรียงชิ้นงานบนแผ่น 120 × 240 ซม.', 'บอกจำนวนแผ่น % การใช้ไม้', 'ใบตัดไม้ PDF / CSV ส่งช่าง'],
    media: () => (
      <div className="absolute inset-0 bg-stone-100 p-4 flex gap-2 justify-center">
        {DEMO.analysis.mats[0].layout.sheets.slice(0, 3).map((sh, k) => <SheetLayout key={k} sheet={sh} W={120} H={240} className="h-full w-auto" />)}
      </div>
    ),
  },
  { icon: Calculator, name: 'คำนวณต้นทุน + ใบเสนอราคา', detail: ['ต้นทุนวัสดุ ปิดขอบ อุปกรณ์ ค่าแรง', 'ตั้งกำไร ส่วนลด VAT เอง', 'ใบเสนอราคา PDF สำหรับงานของคุณ'], media: QuoteMock },
  {
    icon: Camera, name: 'วัดขนาดจากรูปถ่าย', detail: ['ตั้งสเกลจากระยะอ้างอิง', 'ลากกรอบวัดกว้าง × สูง', 'ได้พื้นที่วัสดุและต้นทุน'],
    media: () => (
      <>
        <img src={img('pf-closet-mirror')} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <svg viewBox="0 0 100 70" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <rect x="28" y="12" width="44" height="46" fill="rgba(14,165,233,.15)" stroke="#0284c7" strokeWidth="0.6" />
          <line x1="28" y1="63" x2="72" y2="63" stroke="#e11d48" strokeWidth="0.8" />
          <circle cx="28" cy="63" r="1.2" fill="#fff" stroke="#e11d48" strokeWidth="0.5" /><circle cx="72" cy="63" r="1.2" fill="#fff" stroke="#e11d48" strokeWidth="0.5" />
        </svg>
        <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-sky-700 text-white text-[11px] px-2 py-0.5">240 × 220 ซม.</span>
      </>
    ),
  },
  {
    icon: LayoutGrid, name: 'จัดผังห้อง', detail: ['ห้องตามขนาดจริง', 'เฟอร์นิเจอร์กว่า 35 แบบ', 'ส่งออกรูปผังห้อง'],
    media: () => (
      <div className="absolute inset-0 bg-stone-100 p-3 grid place-items-center">
        <svg viewBox="-30 -30 540 440" className="h-full w-auto"><PlanContent design={ROOM} showLabels={false} /></svg>
      </div>
    ),
  },
];
const ROOM = {
  room: { w: 480, d: 380, floor: '#ead9bf', wall: '#292524' },
  items: [
    { id: '1', type: 'rug', x: 220, y: 215, w: 220, d: 160, rot: 0, color: '#e7c9a9' },
    { id: '2', type: 'sofa3', x: 220, y: 320, w: 210, d: 90, rot: 180, color: '#9ca3af' },
    { id: '4', type: 'coffee', x: 220, y: 215, w: 110, d: 60, rot: 0, color: '#c19a6b' },
    { id: '5', type: 'tvstand', x: 220, y: 22, w: 180, d: 40, rot: 0, color: '#8b6b4a' },
    { id: '7', type: 'bookshelf', x: 463, y: 180, w: 100, d: 30, rot: 90, color: '#a47551' },
    { id: '6', type: 'plant', x: 420, y: 340, w: 50, d: 50, rot: 0, color: '#6b8f5e' },
  ],
};

export function Services({ plans }) {
  const sorted = [...plans].sort((a, b) => a.price - b.price);
  const from = sorted[0];
  const best = plans.length ? plans.reduce((a, p) => (p.price / p.days < a.price / a.days ? p : a), plans[0]) : null;
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-24 scroll-mt-16">
      <div className="reveal max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-orange-300">OUR SERVICES</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">บริการของเรา</h2>
        <p className="mt-2 text-stone-400">เราให้บริการ <b className="text-stone-200">เครื่องมือออกแบบและคำนวณต้นทุนเฟอร์นิเจอร์</b> ผ่านเว็บ — จ่ายค่าบริการเป็นรายวัน ใช้ได้ทุกบริการ ไม่ได้ขายหรือผลิตเฟอร์นิเจอร์</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((sv, i) => (
          <article key={sv.name} className={`reveal group rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-orange-300/40 hover:-translate-y-1 transition duration-300 flex flex-col ${i === 0 ? 'lg:col-span-2' : ''}`} style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
            <div className={`relative overflow-hidden bg-stone-200 ${i === 0 ? 'aspect-[16/9] lg:aspect-[21/9]' : 'aspect-[16/10]'}`}>{sv.media()}</div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-medium text-white text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl grid place-items-center bg-orange-400/15 text-orange-300"><sv.icon className="w-4 h-4" /></span>
                {sv.name}
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm text-stone-400 flex-1">
                {sv.detail.map((d) => <li key={d} className="flex gap-2"><Check className="w-4 h-4 text-orange-300 shrink-0 mt-0.5" /> {d}</li>)}
              </ul>
              <div className="mt-5 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] text-stone-500">ค่าบริการ (รวมทุกบริการ)</p>
                  <p className="text-xl font-semibold text-gradient">{from ? `${baht(from.price)} / ${from.days} วัน` : '—'}</p>
                </div>
                <a href="#studio" className="rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-950 bg-gradient-to-r from-amber-300 to-orange-400 hover:shadow-[0_6px_24px_-6px_rgba(251,146,60,.9)] transition">ลองใช้ฟรี</a>
              </div>
            </div>
          </article>
        ))}
        <article className="reveal rounded-3xl p-6 bg-gradient-to-br from-orange-400/20 via-white/[0.03] to-transparent border border-orange-300/40 flex flex-col">
          <p className="text-xs tracking-[0.25em] text-orange-300">ค่าบริการ</p>
          <div className="mt-4 space-y-3 flex-1">
            {sorted.map((p) => (
              <div key={p.id} className="flex items-baseline justify-between border-b border-white/10 pb-3">
                <span className="text-white">{p.name}{best && p.id === best.id && <span className="ml-2 text-[10px] rounded-full bg-orange-400 text-stone-950 px-2 py-0.5">คุ้มที่สุด</span>}</span>
                <span className="text-2xl font-semibold text-white">{baht(p.price)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-stone-400">ทดลองใช้ได้ทุกบริการฟรี · บันทึกงานและส่งออก PDF / รูป / CSV เมื่อชำระค่าบริการ</p>
          <a href="#plans" className="mt-4 text-center rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">ดูแพ็กเกจและชำระค่าบริการ</a>
        </article>
      </div>
    </section>
  );
}

// ---------- Starting designs: templates to calculate from (examples of the calculator's output, not products) ----------
export function Templates() {
  const calc = useMemo(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, calcOf(p.pieces)])), []);
  return (
    <section id="templates" className="mx-auto max-w-6xl px-4 pb-24 scroll-mt-16">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-300">START FROM A TEMPLATE</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">แบบเริ่มต้นสำหรับออกแบบและคำนวณ</h2>
          <p className="mt-2 text-stone-400 max-w-xl">เลือกแบบใกล้เคียงงานของคุณ แล้วปรับขนาด วัสดุ การจัดภายใน — ระบบคำนวณแผ่นไม้และต้นทุนใหม่ทันที</p>
        </div>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p, i) => {
          const c = calc[p.id];
          return (
            <article key={p.id} className="reveal group rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-orange-300/40 hover:-translate-y-1 transition duration-300 flex flex-col" style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
              <div className="relative aspect-[9/7] overflow-hidden bg-stone-200">
                <img src={img(p.id)} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                <span className="absolute top-3 left-3 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[11px] text-white">แบบเริ่มต้น</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-medium text-white text-lg">{p.name}</h3>
                <p className="mt-1 text-xs text-stone-400 flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> {p.size}</p>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed flex-1">{p.detail}</p>
                <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-3">
                  <p className="text-[11px] text-stone-500">ตัวอย่างผลคำนวณของระบบ</p>
                  <p className="mt-1 text-xs text-stone-300 inline-flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> ไม้ {c.sheets} แผ่น · พื้นที่ {c.area.toFixed(1)} ตร.ม.</p>
                  <p className="text-lg font-semibold text-white">ต้นทุน ฿{money(c.cost)}</p>
                </div>
                <a href={designLink(p.id)} className="mt-3 text-center rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-950 bg-gradient-to-r from-amber-300 to-orange-400 hover:shadow-[0_6px_24px_-6px_rgba(251,146,60,.9)] transition">
                  เปิดแบบนี้แล้วคำนวณเอง
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-stone-500">* ต้นทุนตัวอย่างคิดจากราคาวัสดุ อุปกรณ์ และค่าแรงตั้งต้นของระบบ (แก้ให้ตรงกับร้านวัสดุของคุณได้ในแท็บราคา) — ร้านไม่ได้จำหน่ายหรือรับผลิตเฟอร์นิเจอร์</p>
    </section>
  );
}

// ---------- 3. Portfolio gallery ----------
export function Portfolio() {
  const [cat, setCat] = useState(PORTFOLIO_CATS[0]);
  const [open, setOpen] = useState(null); // index into `list`
  const list = PORTFOLIO.filter((p) => cat === PORTFOLIO_CATS[0] || p.cat === cat);
  useEffect(() => {
    if (open == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((k) => (k + 1) % list.length);
      if (e.key === 'ArrowLeft') setOpen((k) => (k - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, list.length]);
  const cur = open != null ? list[open] : null;

  return (
    <section id="portfolio" className="relative py-24 scroll-mt-16">
      <div className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-white/[0.025] to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="reveal text-center">
          <p className="text-xs tracking-[0.3em] text-orange-300">PORTFOLIO</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">ตัวอย่างงานออกแบบ</h2>
          <p className="mt-2 text-stone-400">ทุกภาพสร้างด้วยเครื่องมือ FORMA STUDIO (ไม่ใช่สินค้าที่ร้านจำหน่าย) — กดดูภาพใหญ่ หรือเปิดแบบไปแก้และคำนวณต่อได้ทันที</p>
        </div>
        <div className="reveal mt-8 flex flex-wrap justify-center gap-2">
          {PORTFOLIO_CATS.map((c) => {
            const count = c === PORTFOLIO_CATS[0] ? PORTFOLIO.length : PORTFOLIO.filter((p) => p.cat === c).length;
            return (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-full text-sm border transition ${cat === c ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-stone-950 border-transparent font-medium' : 'border-white/15 text-stone-300 hover:bg-white/5'}`}>
                {c} <span className="opacity-60 text-xs">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-flow:dense]">
          {list.map((p, k) => (
            <button
              key={p.id}
              onClick={() => setOpen(k)}
              className={`group relative overflow-hidden rounded-3xl bg-stone-800 text-left animate-fade-in ${p.big && cat === PORTFOLIO_CATS[0] ? 'sm:col-span-2 aspect-[16/9] sm:aspect-auto sm:row-span-2' : 'aspect-[3/2]'}`}
            >
              <img src={img(p.id)} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="text-[11px] uppercase tracking-widest text-orange-300">{p.cat}</span>
                <p className="text-white font-medium text-lg">{p.title}</p>
                <p className="text-xs text-stone-300">{p.note}</p>
              </div>
              <span className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur grid place-items-center text-white opacity-0 group-hover:opacity-100 transition">
                <Maximize2 className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {cur && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in" onClick={() => setOpen(null)}>
          <div className="flex items-center justify-between px-4 sm:px-8 py-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-[11px] tracking-widest text-orange-300">{cur.cat} · {open + 1}/{list.length}</p>
              <p className="font-medium">{cur.title} <span className="text-stone-400 text-sm">— {cur.note}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <a href={designLink(cur.id)} onClick={() => setOpen(null)} className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-300 to-orange-400">
                เปิดแบบนี้ในห้องออกแบบ
              </a>
              <button onClick={() => setOpen(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center" aria-label="ปิด">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16 pb-6">
            <img src={img(cur.id)} alt={cur.title} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            {list.length > 1 && (
              <>
                <button onClick={(e) => (e.stopPropagation(), setOpen((k) => (k - 1 + list.length) % list.length))} className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white grid place-items-center" aria-label="ก่อนหน้า">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={(e) => (e.stopPropagation(), setOpen((k) => (k + 1) % list.length))} className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white grid place-items-center" aria-label="ถัดไป">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          <a href={designLink(cur.id)} onClick={() => setOpen(null)} className="sm:hidden mx-4 mb-4 text-center rounded-xl px-4 py-3 text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-300 to-orange-400">
            เปิดแบบนี้ในห้องออกแบบ
          </a>
        </div>
      )}
    </section>
  );
}
