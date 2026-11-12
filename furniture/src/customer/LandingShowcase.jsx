// Landing page: full-width hero banner, products & services cards, portfolio gallery.
// Images in /public/showcase are rendered from the pieces in ./showcase.js by the studio's 3D engine.
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Phone, MessageCircle, ChevronLeft, ChevronRight, X, PencilRuler, Ruler, Maximize2 } from 'lucide-react';
import { HERO_SHOTS, PRODUCTS, PORTFOLIO, PORTFOLIO_CATS } from './showcase';
import { newPiece, newStudioDesign } from '../studio/model';
import { analyzeProject, money } from '../studio/costing';
import { lineChatUrl } from '../lib/line';

const img = (id) => `/showcase/${id}.jpg`;
const priceOf = (pieces) => {
  const d = newStudioDesign();
  d.items = pieces.map((p) => newPiece(p.template, p));
  return analyzeProject(d).total;
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
            เห็นภาพจริง
            <br />
            <span className="text-gradient animate-shine">ก่อนสั่งทำเฟอร์นิเจอร์</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-stone-200/90 max-w-xl leading-relaxed">
            ออกแบบตู้เสื้อผ้า ตู้ครัว เตียง ชั้นวาง ด้วยภาพ 3D ตามขนาดจริง เลือกสี เลือกวัสดุ เปิดบานดูภายใน พร้อมคำนวณแผ่นไม้ ต้นทุน และออกใบเสนอราคาได้ทันที
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
            <a href="#products" className="hover:text-white underline-offset-4 hover:underline">สินค้าและบริการ</a>
            <a href="#portfolio" className="hover:text-white underline-offset-4 hover:underline">ผลงานการออกแบบ</a>
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

// ---------- 2. Products & services ----------
export function Products() {
  const prices = useMemo(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, priceOf(p.pieces)])), []);
  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-24 scroll-mt-16">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-300">PRODUCTS & SERVICES</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">สินค้าและบริการ</h2>
          <p className="mt-2 text-stone-400 max-w-xl">เลือกแบบเริ่มต้น แล้วปรับขนาด สี วัสดุ และการจัดภายในได้ทุกส่วน — ราคาคำนวณใหม่ทันทีที่แก้แบบ</p>
        </div>
        <a href="#studio" className="text-sm text-orange-300 hover:text-orange-200 inline-flex items-center gap-1">
          ดูแบบทั้งหมดในห้องออกแบบ <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p, i) => (
          <article key={p.id} className="reveal group rounded-3xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-orange-300/40 hover:-translate-y-1 transition duration-300 flex flex-col" style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
            <div className="relative aspect-[9/7] overflow-hidden bg-stone-200">
              <img src={img(p.id)} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              <span className="absolute top-3 left-3 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[11px] text-white">ออกแบบได้ 2D / 3D</span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-medium text-white text-lg">{p.name}</h3>
              <p className="mt-1 text-xs text-stone-400 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> {p.size}
              </p>
              <p className="mt-2 text-sm text-stone-400 leading-relaxed flex-1">{p.detail}</p>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] text-stone-500">ราคาประเมินสั่งทำ</p>
                  <p className="text-xl font-semibold text-gradient">฿{money(prices[p.id])}</p>
                </div>
                <a href={designLink(p.id)} className="rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-950 bg-gradient-to-r from-amber-300 to-orange-400 hover:shadow-[0_6px_24px_-6px_rgba(251,146,60,.9)] transition">
                  ออกแบบชิ้นนี้
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-stone-500">* ราคาประเมินจากราคาวัสดุมาตรฐาน อุปกรณ์ และค่าแรงตั้งต้นของระบบ เพื่อใช้วางแผนงบประมาณ — เว็บไซต์เก็บค่าบริการใช้งานเครื่องมือออกแบบเท่านั้น ไม่ได้ขายสินค้า</p>
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
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">ผลงานการออกแบบ</h2>
          <p className="mt-2 text-stone-400">ทุกภาพสร้างจาก FORMA STUDIO — กดที่ภาพเพื่อดูขนาดใหญ่ หรือเปิดแบบไปแก้ต่อได้ทันที</p>
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
