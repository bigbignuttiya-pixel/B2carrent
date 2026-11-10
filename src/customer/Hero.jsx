import React from 'react';
import { Search, Sparkles, Bike, Car, AlertTriangle, Percent, Copy } from 'lucide-react';
import { HERO_SLIDES, LOCATIONS } from '../data';
import { addDaysISO, todayISO, durationTier } from '../lib/pricing';
import { inputCls } from '../components/ui';

export default function Hero({ slideIndex, setSlideIndex, searchParams, setSearchParams, rentalDays, availableCount, onSearch, notify }) {
  const slide = HERO_SLIDES[slideIndex];
  const invalid = rentalDays <= 0;
  const tier = durationTier(rentalDays);
  const set = (patch) => setSearchParams({ ...searchParams, ...patch });

  const quickDuration = (n) => set({ returnDate: addDaysISO(searchParams.pickupDate, n), returnTime: searchParams.pickupTime });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('B2DRIVE2026');
      notify('คัดลอกโค้ด B2DRIVE2026 แล้ว ใช้ได้ในขั้นตอนการจอง');
    } catch {
      notify('โค้ดส่วนลด: B2DRIVE2026', 'info');
    }
  };

  return (
    <>
      <section className="relative overflow-hidden min-h-[640px] flex items-center border-b border-blue-900/30">
        {HERO_SLIDES.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all ease-in-out ${idx === slideIndex ? 'opacity-100 scale-105 duration-[8000ms]' : 'opacity-0 scale-100 duration-1000'}`}
          >
            <img src={s.bgImage} alt="" className="w-full h-full object-cover object-center brightness-[0.35]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div key={slide.id} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-900/60 border border-yellow-400/40 backdrop-blur-md rounded-full text-yellow-300 text-xs font-bold shadow-lg animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span>{slide.badge}</span>
              </div>

              <div key={`t-${slide.id}`} className="space-y-3 animate-slide-up">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                  {slide.title} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">B2 MOTORCYCLE & CAR RENTAL</span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-xl font-light leading-relaxed">{slide.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-sm">
                  <Bike className="w-4 h-4 text-yellow-400" /> จักรยานยนต์ (Scooter / Bigbike)
                </div>
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 backdrop-blur-sm">
                  <Car className="w-4 h-4 text-blue-400" /> รถยนต์ (Sedan / SUV / EV)
                </div>
              </div>

              {/* Trust stats */}
              <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
                {[
                  ['4.9★', 'คะแนนรีวิวเฉลี่ย'],
                  ['3,500+', 'ทริปที่ให้บริการ'],
                  ['24 ชม.', 'ช่วยเหลือฉุกเฉิน'],
                ].map(([v, l]) => (
                  <div key={l} className="bg-slate-900/60 border border-slate-800 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
                    <div className="text-lg font-black text-yellow-400">{v}</div>
                    <div className="text-[10px] text-slate-400">{l}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    aria-label={`สไลด์ ${idx + 1}`}
                    onClick={() => setSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-500 ${idx === slideIndex ? 'w-8 bg-yellow-400' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                  />
                ))}
              </div>
            </div>

            {/* Search engine */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/85 backdrop-blur-2xl border border-blue-900/60 p-6 rounded-3xl shadow-2xl shadow-blue-950/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center">
                    <Search className="w-4 h-4 mr-2 text-yellow-400" /> ค้นหารถว่าง & เช็คราคาด่วน
                  </h2>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">อนุมัติไวใน 5 นาที</span>
                </div>

                <div className="space-y-3">
                  {/* Type segmented */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                    {[
                      ['All', '🛵🚗 ทั้งหมด'],
                      ['Motorcycle', '🛵 มอเตอร์ไซค์'],
                      ['Car', '🚗 รถยนต์'],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set({ vehicleType: val })}
                        className={`py-2 rounded-lg transition ${searchParams.vehicleType === val ? 'bg-blue-700 text-yellow-300' : 'text-slate-400 hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">จุดรับ - คืนรถ</label>
                    <select value={searchParams.location} onChange={(e) => set({ location: e.target.value })} className={inputCls}>
                      {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <label className="text-xs font-bold text-slate-300 block mb-1">วันรับรถ</label>
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
                      <label className="text-xs font-bold text-slate-300 block mb-1">เวลา</label>
                      <input type="time" step="1800" value={searchParams.pickupTime} onChange={(e) => set({ pickupTime: e.target.value })} className={inputCls} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-bold text-slate-300 block mb-1">วันคืนรถ</label>
                      <input type="date" min={searchParams.pickupDate} value={searchParams.returnDate} onChange={(e) => set({ returnDate: e.target.value })} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1">เวลา</label>
                      <input type="time" step="1800" value={searchParams.returnTime} onChange={(e) => set({ returnTime: e.target.value })} className={inputCls} />
                    </div>
                  </div>

                  {/* Quick durations */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">เลือกด่วน:</span>
                    {[1, 3, 7].map((n) => (
                      <button key={n} type="button" onClick={() => quickDuration(n)} className={`px-2.5 py-1 rounded-lg border font-bold transition ${rentalDays === n ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                        {n} วัน
                      </button>
                    ))}
                    <span className="ml-auto font-bold text-slate-300">{invalid ? '—' : `${rentalDays} วัน`}</span>
                  </div>

                  {invalid ? (
                    <div className="flex items-center gap-2 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> วัน-เวลาคืนรถต้องหลังวัน-เวลารับรถ
                    </div>
                  ) : tier ? (
                    <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">🎉 {tier.label} (คำนวณอัตโนมัติ)</div>
                  ) : (
                    <div className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">💡 เช่า 3 วันขึ้นไป รับส่วนลดทันที 5% • 7 วันขึ้นไป ลด 15%</div>
                  )}
                </div>

                <button
                  onClick={onSearch}
                  disabled={invalid}
                  className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-yellow-300 font-extrabold py-3 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-2 group border border-yellow-400/20"
                >
                  <Search className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                  <span>เลือกรถว่าง ({availableCount} คันว่างในช่วงวันที่เลือก)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-yellow-400/40 p-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">สิทธิพิเศษช่วงเทศกาล!</span>
                <span className="bg-yellow-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">SPECIAL PROMO</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">ลดเพิ่ม 10% ด้วยโค้ดนี้ + ฟรีหมวกกันน็อก 2 ใบ + ส่งรถสนามบินฟรี ใช้ร่วมกับส่วนลดเช่าหลายวันได้</p>
            </div>
          </div>
          <button onClick={copyCode} className="bg-slate-950 px-4 py-2 rounded-xl border border-dashed border-yellow-400/60 text-yellow-400 font-mono text-xs font-bold flex items-center gap-2 hover:bg-slate-900">
            โค้ด: <span className="text-white font-black">B2DRIVE2026</span>
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </>
  );
}
