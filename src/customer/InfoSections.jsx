import React, { useState } from 'react';
import { Compass, ShieldCheck, HardHat, MapPin, Clock, Star, Quote, FileCheck2, HelpCircle, ChevronDown, Phone, MessageCircle, Navigation, Route, Facebook, Lock } from 'lucide-react';
import { DESTINATIONS, REVIEWS, REQUIREMENTS, FAQS } from '../data';
import { SectionHeading } from '../components/ui';

export function HowItWorks() {
  const steps = [
    ['1', 'เลือกวัน & รถ', 'เช็ครถว่างแบบเรียลไทม์ตามช่วงวันที่ต้องการ'],
    ['2', 'กรอกข้อมูล & บริการเสริม', 'หมวก ประกัน คาร์ซีท WiFi เลือกได้ตามใจ'],
    ['3', 'สแกน PromptPay', 'แนบสลิป ระบบยืนยันภายใน 5 นาที'],
    ['4', 'รับรถ & ออกเดินทาง', 'ทีมงานส่งมอบรถถึงสนามบิน/โรงแรม'],
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <SectionHeading icon={Route} eyebrow="HOW IT WORKS" title="จองง่ายใน 4 ขั้นตอน" desc="ไม่ต้องใช้บัตรเครดิต ไม่ต้องเดินทางมาหน้าร้าน" center />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map(([n, t, d], i) => (
          <div key={n} className="relative bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">{n}</div>
            <h4 className="font-bold text-white text-sm mt-4">{t}</h4>
            <p className="text-xs text-slate-400 mt-1">{d}</p>
            {i < steps.length - 1 && <div className="hidden lg:block absolute top-11 -right-3 w-6 border-t-2 border-dashed border-yellow-400/40" />}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Destinations({ onPickVehicleType }) {
  return (
    <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 scroll-mt-24">
      <SectionHeading icon={Compass} eyebrow="RECOMMENDED DESTINATIONS" title="จุดหมายปลายทางยอดนิยม" desc="รับรถจาก B2 แล้วขับท่องเที่ยวไปยังแลนด์มาร์กสวยๆ ได้อย่างมั่นใจ" center />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DESTINATIONS.map((d) => (
          <div key={d.name} className="group relative h-80 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
            <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-700 rounded-xl px-2.5 py-1 text-[10px] text-slate-200 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-yellow-400" /> {d.distance} • {d.drive}
            </div>
            <div className="absolute bottom-5 left-5 right-5 space-y-1">
              <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md inline-block">{d.tag}</span>
              <h3 className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors">{d.name}</h3>
              <p className="text-xs text-slate-300 font-light">{d.desc}</p>
              <button onClick={onPickVehicleType} className="text-[11px] font-bold text-yellow-300 pt-1 hover:underline">เลือกรถสำหรับทริปนี้ →</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WhyB2() {
  const items = [
    [ShieldCheck, 'ประกันภัยมาตรฐาน', 'คุ้มครองตลอดระยะเวลาเช่า ขับขี่ได้อย่างอุ่นใจ'],
    [HardHat, 'ฟรีหมวกกันน็อก 2 ใบ', 'หมวกกันน็อกสะอาด ได้มาตรฐาน มอก. ทุกใบ'],
    [MapPin, 'จัดส่งฟรีสนามบิน', 'บริการส่งมอบและรับคืนรถที่สนามบินและโรงแรม'],
    [Clock, 'บริการ 24 ชั่วโมง', 'ทีมงานคอยช่วยเหลือและให้ข้อมูลตลอดทริป'],
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 md:p-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-black text-white">ทำไมต้องเลือกเช่ารถกับ B2 RENTAL?</h2>
          <p className="text-xs text-slate-400 mt-1">การันตีบริการมาตรฐาน สะดวก รวดเร็ว สบายใจตลอดการเดินทาง</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(([Icon, t, d]) => (
            <div key={t} className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 text-center space-y-3 hover:border-yellow-400/40 transition">
              <div className="w-12 h-12 bg-blue-900/50 border border-blue-700 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">{t}</h4>
              <p className="text-xs text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <SectionHeading icon={Star} eyebrow="CUSTOMER REVIEWS" title="เสียงจากลูกค้าจริง" desc="คะแนนเฉลี่ย 4.9 / 5 จากรีวิวกว่า 680 รายการ" center />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((r) => (
          <div key={r.name} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 relative">
            <Quote className="w-8 h-8 text-yellow-400/20 absolute top-5 right-5" />
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(r.rating) ? 'fill-amber-400' : ''}`} />
              ))}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed flex-1">“{r.text}”</p>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-yellow-300 font-black flex items-center justify-center text-sm">{r.name[0]}</div>
              <div>
                <div className="text-xs font-bold text-white">{r.name}</div>
                <div className="text-[10px] text-slate-500">เช่า {r.vehicle} • {r.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RequirementsAndFaq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <SectionHeading icon={FileCheck2} eyebrow="RENTAL REQUIREMENTS" title="เอกสารที่ต้องใช้" desc="เตรียมให้พร้อมในวันรับรถ ส่งมอบได้ภายใน 10 นาที" />
          <div className="space-y-3">
            {REQUIREMENTS.map((r, i) => (
              <div key={r.title} className="flex gap-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-blue-900/60 border border-blue-700 text-yellow-400 font-black text-xs flex items-center justify-center shrink-0">{i + 1}</div>
                <div>
                  <div className="text-sm font-bold text-white">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          <SectionHeading icon={HelpCircle} eyebrow="FAQ" title="คำถามที่พบบ่อย" desc="ยังมีข้อสงสัย? ทักแชท LINE ได้ตลอด 24 ชม." />
          <div className="space-y-2">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`border rounded-2xl transition ${open === i ? 'border-yellow-400/40 bg-slate-900' : 'border-slate-800 bg-slate-900/50'}`}>
                <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex justify-between items-center gap-3 px-5 py-4 text-left" aria-expanded={open === i}>
                  <span className="text-sm font-bold text-white">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-yellow-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
                {open === i && <p className="px-5 pb-4 text-xs text-slate-300 leading-relaxed animate-fade-in">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ settings, onNav, onStaff }) {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-900 to-indigo-600 rounded-xl border-2 border-yellow-400 flex items-center justify-center font-black text-yellow-400">B2</div>
            <span className="text-lg font-black text-white">B2 RENTAL</span>
          </div>
          <p className="text-slate-400 max-w-sm leading-relaxed">บริการเช่ารถจักรยานยนต์และรถยนต์คุณภาพสูง จังหวัดนครศรีธรรมราช รับ-ส่งฟรีสนามบิน สถานีรถไฟ และโรงแรมในตัวเมือง</p>
          <p className="text-slate-500 flex items-start gap-2"><MapPin className="w-4 h-4 text-yellow-400 shrink-0" /> {settings.storeAddress}</p>
          <p className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-400" /> เปิดทำการ {settings.openHours}</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm mb-2">เมนู</h4>
          {[
            ['ฟลีตรถเช่า', 'fleet-section'],
            ['ที่เที่ยวแนะนำ', 'destinations'],
            ['เงื่อนไข & FAQ', 'faq'],
          ].map(([l, id]) => (
            <button key={id} onClick={() => onNav(id)} className="block text-slate-400 hover:text-yellow-300">{l}</button>
          ))}
          <button onClick={() => onNav('my-bookings')} className="block text-slate-400 hover:text-yellow-300">ตรวจสถานะการจอง</button>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm mb-2">ติดต่อเรา</h4>
          <a href={`tel:${settings.storePhone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 text-slate-400 hover:text-yellow-300"><Phone className="w-4 h-4" /> {settings.storePhone}</a>
          <a href={`https://line.me/R/ti/p/${encodeURIComponent(settings.lineOaId)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-emerald-300"><MessageCircle className="w-4 h-4" /> LINE {settings.lineOaId}</a>
          {settings.facebookUrl && (
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-[#4c8dff]" aria-label="เปิดแฟนเพจ Facebook">
              <Facebook className="w-4 h-4" /> Facebook: {settings.facebookName || 'แฟนเพจ'}
            </a>
          )}
          <div className="flex gap-2 pt-2">
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" title="แฟนเพจ Facebook" aria-label="แฟนเพจ Facebook" className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition">
                <Facebook className="w-4 h-4" />
              </a>
            )}
            <a href={`https://line.me/R/ti/p/${encodeURIComponent(settings.lineOaId)}`} target="_blank" rel="noopener noreferrer" title="LINE" aria-label="LINE" className="w-9 h-9 rounded-xl bg-[#06C755] text-white flex items-center justify-center hover:scale-110 transition">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href={`tel:${settings.storePhone.replace(/[^0-9+]/g, '')}`} title="โทร" aria-label="โทร" className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center hover:scale-110 transition">
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-900 py-5 px-4 text-center text-[11px] text-slate-600 relative">
        © 2026 B2 MOTORCYCLE & CAR RENTAL SERVICES. All rights reserved.
        {onStaff && (
          <button onClick={onStaff} aria-label="staff" className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-800 hover:text-slate-500">
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </footer>
  );
}

export function FloatingContact({ settings }) {
  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-3 no-print">
      {settings.facebookUrl && (
        <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#1877F2] text-white rounded-full shadow-2xl shadow-blue-900/50 pl-3 pr-4 py-3 text-xs font-black hover:scale-105 transition" aria-label="แฟนเพจ Facebook">
          <Facebook className="w-5 h-5" />
          <span className="hidden sm:inline">Facebook</span>
        </a>
      )}
      <a href={`https://line.me/R/ti/p/${encodeURIComponent(settings.lineOaId)}`} target="_blank" rel="noreferrer" className="group flex items-center gap-2 bg-[#06C755] text-white rounded-full shadow-2xl shadow-emerald-900/50 pl-3 pr-4 py-3 text-xs font-black hover:scale-105 transition" aria-label="แชท LINE">
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">แชท LINE</span>
      </a>
      <a href={`tel:${settings.storePhone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 bg-yellow-400 text-slate-950 rounded-full shadow-2xl pl-3 pr-4 py-3 text-xs font-black hover:scale-105 transition" aria-label="โทรหาเรา">
        <Phone className="w-5 h-5" />
        <span className="hidden sm:inline">โทรเลย</span>
      </a>
    </div>
  );
}
