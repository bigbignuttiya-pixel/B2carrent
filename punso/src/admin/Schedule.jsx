import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { addDaysISO, todayISO } from '../lib/pricing';

const COLORS = {
  Pending: 'bg-amber-400/80 text-zinc-950',
  Confirmed: 'bg-emerald-500/80 text-white',
  'Picked Up': 'bg-zinc-800/90 text-white',
  Completed: 'bg-zinc-300 text-zinc-700',
};
const DAYS = 14;

export default function Schedule({ vehicles, bookings, onOpenBooking, onAddExternal }) {
  const [start, setStart] = useState(addDaysISO(todayISO(), -2));
  const today = todayISO();
  const days = Array.from({ length: DAYS }, (_, i) => addDaysISO(start, i));
  const end = days[DAYS - 1];
  const active = bookings.filter((b) => b.status !== 'Cancelled' && b.startDate <= end && b.endDate > start);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-yellow-600" /> ตารางคิวรถ (Fleet Schedule)</h3>
        <div className="flex items-center gap-2 text-xs">
          {onAddExternal && (
            <button onClick={onAddExternal} className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black flex items-center gap-1"><Plus className="w-4 h-4" /> จองจาก DriveHub</button>
          )}
          <button onClick={() => setStart(addDaysISO(start, -7))} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900" aria-label="ก่อนหน้า"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setStart(addDaysISO(todayISO(), -2))} className="px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 font-bold hover:text-zinc-900">วันนี้</button>
          <button onClick={() => setStart(addDaysISO(start, 7))} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900" aria-label="ถัดไป"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
        {Object.entries(COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${c.split(' ')[0]}`} /> {k}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[repeating-linear-gradient(45deg,#78350f,#78350f_3px,#1e293b_3px,#1e293b_6px)]" /> ซ่อมบำรุง</span>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-3xl overflow-x-auto scrollbar-thin">
        <div className="min-w-[900px]">
          <div className="grid border-b border-zinc-200" style={{ gridTemplateColumns: `200px repeat(${DAYS}, 1fr)` }}>
            <div className="p-3 text-[11px] font-bold text-zinc-500">พาหนะ</div>
            {days.map((d) => {
              const dt = new Date(d + 'T00:00:00');
              const weekend = dt.getDay() === 0 || dt.getDay() === 6;
              return (
                <div key={d} className={`p-2 text-center text-[10px] border-l border-zinc-200 ${d === today ? 'bg-yellow-400/10 text-yellow-600 font-black' : weekend ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  <div>{dt.toLocaleDateString('th-TH', { weekday: 'short' })}</div>
                  <div className="font-bold text-xs">{dt.getDate()}</div>
                </div>
              );
            })}
          </div>

          {vehicles.map((v) => {
            const rows = active.filter((b) => b.vehicleId === v.id);
            return (
              <div key={v.id} className="grid border-b border-zinc-200/70 relative" style={{ gridTemplateColumns: `200px repeat(${DAYS}, 1fr)` }}>
                <div className="p-3 flex items-center gap-2 min-w-0">
                  <img src={v.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-zinc-900 truncate">{v.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">{v.plateNumber.split(' ')[0]}</div>
                  </div>
                </div>
                {days.map((d) => (
                  <div key={d} className={`border-l border-zinc-200/70 h-14 ${d === today ? 'bg-yellow-400/5' : ''} ${v.status === 'Maintenance' && d >= today ? 'bg-[repeating-linear-gradient(45deg,rgba(120,53,15,.35),rgba(120,53,15,.35)_4px,transparent_4px,transparent_8px)]' : ''}`} />
                ))}
                {/* Booking bars */}
                {rows.map((b) => {
                  const s = Math.max(0, days.indexOf(b.startDate < start ? start : b.startDate));
                  const lastDay = addDaysISO(b.endDate, -1);
                  const e = lastDay > end ? DAYS - 1 : days.indexOf(lastDay);
                  if (e < 0 || e < s) return null;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onOpenBooking(b.id)}
                      title={`${b.id} • ${b.customerName}${b.source ? ` • ${b.source}` : ''}`}
                      className={`absolute top-3 h-8 rounded-lg px-2 text-[10px] font-bold truncate text-left shadow-md hover:ring-2 hover:ring-yellow-300 ${COLORS[b.status] || 'bg-zinc-300'}`}
                      style={{ left: `calc(200px + (100% - 200px) * ${s / DAYS} + 2px)`, width: `calc((100% - 200px) * ${(e - s + 1) / DAYS} - 4px)` }}
                    >
                      {b.source && <span className="mr-1 px-1 rounded bg-white/80 text-sky-800 text-[9px]">{b.source === 'DriveHub' ? 'DH' : b.source}</span>}
                      {b.customerName}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
