import React from 'react';
import { Search, Sparkles, Bike, Car, AlertTriangle, Percent, Copy, UserCheck, ChevronLeft, ChevronRight, MapPin, Navigation } from 'lucide-react';
import { HERO_SLIDES, HERO_COPY, LOCATIONS } from '../data';
import { addDaysISO, todayISO, durationTier } from '../lib/pricing';
import { inputCls } from '../components/ui';

export default function Hero({ slideIndex, setSlideIndex, searchParams, setSearchParams, rentalDays, availableCount, onSearch, notify }) {
  const slide = HERO_SLIDES[slideIndex];
  const n = HERO_SLIDES.length;
  const go = (d) => setSlideIndex((slideIndex + d + n) % n);
  const invalid = rentalDays <= 0;
  const tier = durationTier(rentalDays);
  const set = (patch) => setSearchParams({ ...searchParams, ...patch });

  const quickDuration = (n) => set({ returnDate: addDaysISO(searchParams.pickupDate, n), returnTime: searchParams.pickupTime });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('PUNSO2026');
      notify('คัดลอกโค้ด PUNSO2026 แล้ว ใช้ได้ในขั้นตอนการจอง');
    } catch {
      notify('โค้ดส่วนลด: PUNSO2026', 'info');
    }
  };

  return (
    <>
      <section className="relative">
        {/* Travel photo slider — recommended destinations */}
        <div className="relative h-[460px] sm:h-[540px] overflow-hidden bg-zinc-900">
          {HERO_SLIDES.map((s, idx) => (
            <div
              key={s.id}
              aria-hidden={idx !== slideIndex}
              className={`absolute inset-0 ${idx === slideIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
              style={{ transition: `opacity 1000ms ease-in-out, transform ${idx === slideIndex ? 8000 : 1000}ms ease-out` }}
            >
              <img src={s.bgImage} alt={s.name} className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            </div>
          ))}

          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-28 sm:pb-32">
            <div key={slide.id} className="max-w-2xl space-y-3 animate-slide-up">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-zinc-950 text-[11px] font-black px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" /> ที่เที่ยวแนะนำ • {slide.tag}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/30 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  <Navigation className="w-3 h-3" /> {slide.distance} • {slide.drive} จากตัวเมือง
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">{slide.name}</h2>
              <p className="text-sm sm:text-base text-zinc-100 max-w-xl leading-relaxed line-clamp-2">{slide.desc}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition">
                  เช่ารถไปเที่ยวที่นี่
                </button>
                <a href="#destinations" className="bg-white/10 hover:bg-white/20 border border-white/40 backdrop-blur-md text-white font-bold text-xs px-5 py-3 rounded-xl transition">
                  ดูที่เที่ยวทั้งหมด
                </a>
              </div>
            </div>
          </div>

          <div className="absolute bottom-20 sm:bottom-24 right-4 sm:right-8 flex items-center gap-3">
            <button onClick={() => go(-1)} aria-label="สไลด์ก่อนหน้า" className="hidden sm:flex w-9 h-9 rounded-full bg-white/15 hover:bg-yellow-400 hover:text-zinc-950 border border-white/30 backdrop-blur-md text-white items-center justify-center transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white/80 text-[11px] font-bold tabular-nums">{String(slideIndex + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            <div className="flex items-center gap-1.5">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  aria-label={`สไลด์ ${idx + 1}: ${s.name}`}
                  onClick={() => setSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${idx === slideIndex ? 'w-8 bg-yellow-400' : 'w-2 bg-white/50 hover:bg-white'}`}
                />
              ))}
            </div>
            <button onClick={() => go(1)} aria-label="สไลด์ถัดไป" className="hidden sm:flex w-9 h-9 rounded-full bg-white/15 hover:bg-yellow-400 hover:text-zinc-950 border border-white/30 backdrop-blur-md text-white items-center justify-center transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {slide.credit && <span className="absolute top-2 right-3 text-[8px] text-white/60">ภาพ: {slide.credit}</span>}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full z-10 -mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Copy */}
            <div className="lg:col-span-7 space-y-6 lg:pt-28">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950 border border-yellow-400/40 backdrop-blur-md rounded-full text-yellow-300 text-xs font-bold shadow-lg animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                <span>{HERO_COPY.badge}</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-tight">
                  {HERO_COPY.title.includes('|') ? HERO_COPY.title.split('|').map((t) => <span key={t} className="inline-block">{t.trim()}&nbsp;</span>) : HERO_COPY.title} <br />
                  <span className="inline-block bg-yellow-400 text-zinc-950 px-3 mt-2 rounded-xl -rotate-1 shadow-[6px_6px_0_0_#09090b]">PUNSO CAR RENTAL</span>
                </h1>
                <p className="text-zinc-600 text-sm sm:text-base max-w-xl font-light leading-relaxed">{HERO_COPY.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/80 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 backdrop-blur-sm">
                  <Bike className="w-4 h-4 text-yellow-600" /> จักรยานยนต์ (Scooter / Bigbike)
                </div>
                <div className="flex items-center gap-2 bg-white/80 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 backdrop-blur-sm">
                  <Car className="w-4 h-4 text-zinc-900" /> รถยนต์ (Sedan / SUV / EV)
                </div>
                <div className="flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/50 px-3 py-1.5 rounded-xl text-xs font-black text-yellow-600 backdrop-blur-sm">
                  <UserCheck className="w-4 h-4 text-yellow-600" /> บริการรถเช่าพร้อมคนขับ
                </div>
              </div>

              {/* Trust stats */}
              <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
                {[
                  ['4.9★', 'คะแนนรีวิวเฉลี่ย'],
                  ['3,500+', 'ทริปที่ให้บริการ'],
                  ['24 ชม.', 'ช่วยเหลือฉุกเฉิน'],
                ].map(([v, l]) => (
                  <div key={l} className="bg-white/60 border border-zinc-200 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
                    <div className="text-lg font-black text-yellow-600">{v}</div>
                    <div className="text-[10px] text-zinc-500">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search engine */}
            <div id="hero-search" className="lg:col-span-5 order-first lg:order-none scroll-mt-28">
              <div className="bg-white border-2 border-zinc-950 p-6 rounded-3xl shadow-2xl shadow-zinc-900/10 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <h2 className="text-base font-bold text-zinc-900 flex items-center">
                    <Search className="w-4 h-4 mr-2 text-yellow-600" /> ค้นหารถว่าง & เช็คราคาด่วน
                  </h2>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">อนุมัติไวใน 5 นาที</span>
                </div>

                <div className="space-y-3">
                  {/* Type segmented */}
                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-zinc-200 text-[11px] font-bold">
                    {[
                      ['All', '🛵🚗 ทั้งหมด'],
                      ['Motorcycle', '🛵 มอเตอร์ไซค์'],
                      ['Car', '🚗 รถยนต์'],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set({ vehicleType: val })}
                        className={`py-2 rounded-lg transition ${searchParams.vehicleType === val ? 'bg-zinc-900 text-yellow-300' : 'text-zinc-500 hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-600 block mb-1">จุดรับ - คืนรถ</label>
                    <select value={searchParams.location} onChange={(e) => set({ location: e.target.value })} className={inputCls}>
                      {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <label className="text-xs font-bold text-zinc-600 block mb-1">วันรับรถ</label>
                      <input
                        type="date"
                        min={todayISO()}
                        value={searchParams.pickupDate}
                        onChange={(e) => {
                          const pickupDate = e.target.value;
                          const patch = { pickupDate };
                          if (searchParams.returnDate <= pickupDate) patch.returnDate = addDaysISO(pickupDate, 1);
                          set(patch);
                        }}
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-zinc-600 block mb-1">เวลา</label>
                      <input type="time" step="1800" value={searchParams.pickupTime} onChange={(e) => set({ pickupTime: e.target.value })} className={inputCls} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-bold text-zinc-600 block mb-1">วันคืนรถ</label>
                      <input type="date" min={searchParams.pickupDate} value={searchParams.returnDate} onChange={(e) => set({ returnDate: e.target.value })} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-zinc-600 block mb-1">เวลา</label>
                      <input type="time" step="1800" value={searchParams.returnTime} onChange={(e) => set({ returnTime: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  {/* Quick durations */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-zinc-500">เลือกด่วน:</span>
                    {[1, 3, 7].map((n) => (
                      <button key={n} type="button" onClick={() => quickDuration(n)} className={`px-2.5 py-1 rounded-lg border font-bold transition ${rentalDays === n ? 'border-yellow-400 text-yellow-600 bg-yellow-400/10' : 'border-zinc-300 text-zinc-500 hover:text-zinc-900'}`}>
                        {n} วัน
                      </button>
                    ))}
                    <span className="ml-auto font-bold text-zinc-600">{invalid ? '—' : `${rentalDays} วัน`}</span>
                  </div>

                  {invalid ? (
                    <div className="flex items-center gap-2 text-[11px] text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> วัน-เวลาคืนรถต้องหลังวัน-เวลารับรถ
                    </div>
                  ) : tier ? (
                    <div className="text-[11px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">🎉 {tier.label} (คำนวณอัตโนมัติ)</div>
                  ) : (
                    <div className="text-[11px] text-zinc-500 bg-white border border-zinc-200 rounded-xl px-3 py-2">💡 เช่า 3 วันขึ้นไป รับส่วนลดทันที 5% • 7 วันขึ้นไป ลด 15%</div>
                  )}
                </div>

                <button
                  onClick={onSearch}
                  disabled={invalid}
                  className="w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-800 hover:from-zinc-800 hover:to-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-yellow-300 font-extrabold py-3 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-2 group border border-yellow-400/20"
                >
                  <Search className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                  <span>เลือกรถว่าง ({availableCount} คันว่างในช่วงวันที่เลือก)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-zinc-950 border-2 border-yellow-400 p-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-zinc-950 shadow-lg shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">สิทธิพิเศษช่วงเทศกาล!</span>
                <span className="bg-yellow-400 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full">SPECIAL PROMO</span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">ลดเพิ่ม 10% ด้วยโค้ดนี้ + ฟรีหมวกกันน็อก 2 ใบ + ส่งรถสนามบินฟรี ใช้ร่วมกับส่วนลดเช่าหลายวันได้</p>
            </div>
          </div>
          <button onClick={copyCode} className="bg-yellow-400 px-4 py-2 rounded-xl border border-dashed border-zinc-950/40 text-zinc-800 font-mono text-xs font-bold flex items-center gap-2 hover:bg-yellow-300">
            โค้ด: <span className="text-zinc-900 font-black">PUNSO2026</span>
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </>
  );
}
