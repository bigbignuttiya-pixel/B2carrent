import React from 'react';
import { Bike, Car, Star, Maximize2, ChevronRight, Flame, Search, Heart, Users, SlidersHorizontal, CalendarX } from 'lucide-react';
import { CATEGORIES } from '../data';
import { baht } from '../lib/pricing';
import { SectionHeading } from '../components/ui';
import { isCutout, STUDIO_BG, STUDIO_SHADOW } from '../lib/image';

export function VehicleCard({ v, free, units = 1, freeUnits = free ? 1 : 0, rentalDays, isFav, onToggleFav, onPreview, onBook }) {
  const bookable = v.status === 'Available' && free;
  const reason = units > 1 && freeUnits === 0 ? 'เต็มทุกคันช่วงนี้' : v.status === 'Maintenance' ? 'ซ่อมบำรุง' : v.status === 'Rented' ? 'ติดคิวเช่า' : !free ? 'ไม่ว่างช่วงนี้' : '';
  return (
    <div className="group bg-white/90 border border-zinc-200/90 hover:border-yellow-400/70 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-900/10 hover:-translate-y-1 flex flex-col relative">
      <div className={`relative h-56 overflow-hidden ${isCutout(v.image) ? STUDIO_BG : 'bg-white'}`}>
        <img src={v.image} alt={v.name} loading="lazy" className={`w-full h-full group-hover:scale-110 transition-transform duration-700 ${isCutout(v.image) ? `object-contain px-6 pt-12 pb-6 ${STUDIO_SHADOW}` : 'object-cover'} ${bookable ? '' : 'grayscale-[60%] opacity-70'}`} />
        {!isCutout(v.image) && <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />}

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-xl border border-zinc-300 text-xs font-bold text-yellow-600 flex items-center gap-1">
            {v.type === 'Motorcycle' ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
            {v.category}
          </span>
          {v.badgeTag && <span className="bg-yellow-400 text-zinc-950 font-black text-[10px] px-2.5 py-1 rounded-xl shadow-md">{v.badgeTag}</span>}
        </div>

        <button
          onClick={() => onToggleFav()}
          aria-label="บันทึกรายการโปรด"
          className={`absolute top-3 right-3 w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition ${isFav ? 'bg-rose-500/20 border-rose-400/50 text-rose-600' : 'bg-white/70 border-zinc-300 text-zinc-600 hover:text-rose-700'}`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-300 flex items-center gap-1 text-amber-600 text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-600" /> {v.rating}
          <span className="text-zinc-500 text-[10px]">({v.reviewsCount})</span>
        </div>

        {!bookable && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <span className="bg-white/90 border border-zinc-300 text-zinc-700 text-xs font-bold px-4 py-1.5 rounded-full">{reason}</span>
          </div>
        )}

        <button onClick={() => onPreview(v)} className="absolute bottom-3 right-3 bg-zinc-950 hover:bg-zinc-950 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-yellow-400/30 backdrop-blur-md flex items-center gap-1 shadow-lg">
          <Maximize2 className="w-3.5 h-3.5" /> ดูรูป & สเปก
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-zinc-900 group-hover:text-yellow-600 transition-colors">{v.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-3">
            {units > 1 ? (
              <span className={`font-bold ${freeUnits > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>ว่าง {freeUnits}/{units} คัน</span>
            ) : (
              <span>ทะเบียน: <span className="font-mono text-zinc-600 font-bold">{v.plateNumber}</span></span>
            )}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v.seats}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-200">
            {[
              ['ขุมพลัง', v.engineCc],
              ['เกียร์', v.transmission],
              ['เชื้อเพลิง', v.fuelType],
            ].map(([k, val]) => (
              <div key={k} className="bg-white/80 p-2 rounded-xl text-center border border-zinc-200" title={val}>
                <span className="text-[10px] text-zinc-500 block">{k}</span>
                <span className="font-bold text-zinc-900 text-[11px] truncate block">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-zinc-500 block">ราคาเริ่มต้น</span>
            <div className="text-2xl font-black text-yellow-600">
              {baht(v.pricePerDay)}
              <span className="text-xs font-normal text-zinc-500"> /วัน</span>
            </div>
            {rentalDays > 1 && <span className="text-[10px] text-zinc-500">{rentalDays} วัน ≈ {baht(v.pricePerDay * rentalDays)}</span>}
          </div>
          <button
            onClick={() => onBook(v)}
            disabled={!bookable}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-xl flex items-center gap-1.5 ${
              bookable
                ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 hover:from-zinc-800 hover:to-zinc-800 text-yellow-300 border border-yellow-400/30 hover:scale-105'
                : 'bg-zinc-100 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {bookable ? 'จองพาหนะนี้' : reason}
            {bookable && <ChevronRight className="w-4 h-4 text-yellow-600" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Fleet({ vehicles, list, filters, setFilters, freeMap, rentalDays, favorites, onToggleFav, onPreview, onBook }) {
  const set = (patch) => setFilters({ ...filters, ...patch });
  const cats = filters.type === 'All' ? [...CATEGORIES.Motorcycle, ...CATEGORIES.Car] : CATEGORIES[filters.type] || [];

  return (
    <section id="fleet-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 scroll-mt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <SectionHeading icon={Flame} eyebrow="PUNSO VEHICLE FLEET" title="กองยานพาหนะพร้อมส่งมอบ" desc="คัดสรรเฉพาะรถสภาพใหม่ ตรวจเช็กระยะสม่ำเสมอ ล้างฆ่าเชื้อสะอาดก่อนส่งทุกครั้ง" />
        <div className="flex flex-wrap gap-2 items-center bg-white p-1.5 rounded-2xl border border-zinc-200 text-xs font-bold w-full md:w-auto md:mb-8">
          {[
            ['All', `ทั้งหมด (${vehicles.length})`, null],
            ['Motorcycle', `จักรยานยนต์ (${vehicles.filter((v) => v.type === 'Motorcycle').length})`, Bike],
            ['Car', `รถยนต์ (${vehicles.filter((v) => v.type === 'Car').length})`, Car],
          ].map(([val, label, Icon]) => (
            <button key={val} onClick={() => set({ type: val, category: 'All' })} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${filters.type === val ? 'bg-zinc-900 text-yellow-300 shadow-md' : 'text-zinc-500 hover:text-white'}`}>
              {Icon && <Icon className="w-4 h-4" />} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/70 border border-zinc-200 rounded-2xl p-3 mb-8 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="ค้นหารุ่น / ยี่ห้อ เช่น PCX, Toyota, BYD"
            className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-900 focus:border-yellow-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          {['All', ...cats].map((c) => (
            <button key={c} onClick={() => set({ category: c })} className={`px-3 py-1.5 rounded-lg border transition ${filters.category === c ? 'border-yellow-400 bg-yellow-400/10 text-yellow-600' : 'border-zinc-300 text-zinc-500 hover:text-zinc-900'}`}>
              {c === 'All' ? 'ทุกหมวด' : c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
          <select value={filters.sort} onChange={(e) => set({ sort: e.target.value })} className="bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:border-yellow-400 focus:outline-none">
            <option value="recommended">แนะนำ</option>
            <option value="price-asc">ราคา: ต่ำ → สูง</option>
            <option value="price-desc">ราคา: สูง → ต่ำ</option>
            <option value="rating">คะแนนรีวิวสูงสุด</option>
          </select>
          <label className="flex items-center gap-1.5 text-zinc-600 font-bold cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={filters.onlyFree} onChange={(e) => set({ onlyFree: e.target.checked })} className="accent-yellow-400" />
            เฉพาะคันว่าง
          </label>
          <label className="flex items-center gap-1.5 text-zinc-600 font-bold cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={filters.onlyFav} onChange={(e) => set({ onlyFav: e.target.checked })} className="accent-rose-400" />
            ♥ ที่ชอบ ({favorites.length})
          </label>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
          <CalendarX className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-700">ไม่พบพาหนะที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-zinc-500 mt-1">ลองเปลี่ยนวันที่ ประเภทรถ หรือล้างตัวกรอง</p>
          <button onClick={() => setFilters({ type: 'All', category: 'All', query: '', sort: 'recommended', onlyFree: false, onlyFav: false })} className="mt-4 px-4 py-2 bg-zinc-900 text-yellow-300 text-xs font-bold rounded-xl">
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((g) => (
            <VehicleCard
              key={g.key}
              v={g.rep}
              free={g.freeCount > 0}
              units={g.units.length}
              freeUnits={g.freeCount}
              rentalDays={rentalDays}
              isFav={favorites.includes(g.key)}
              onToggleFav={() => onToggleFav(g.key)}
              onPreview={onPreview}
              onBook={onBook}
            />
          ))}
        </div>
      )}
    </section>
  );
}
