import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { addDaysISO, todayISO } from '../lib/pricing';

const COLORS = {
  Pending: 'bg-amber-400/80 text-slate-950',
  Confirmed: 'bg-emerald-500/80 text-white',
  'Picked Up': 'bg-indigo-500/90 text-white',
  Completed: 'bg-blue-500/40 text-blue-100',
};
const DAYS = 14;

export default function Schedule({ vehicles, bookings, onOpenBooking }) {
  const [start, setStart] = useState(addDaysISO(todayISO(), -2));
  const today = todayISO();
  const days = Array.from({ length: DAYS }, (_, i) => addDaysISO(start, i));
  const end = days[DAYS - 1];
  const active = bookings.filter((b) => b.status !== 'Cancelled' && b.startDate <= end && b.endDate > start);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-yellow-400" /> ตารางคิวรถ (Fleet Schedule)</h3>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setStart(addDaysISO(start, -7))} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white" aria-label="ก่อนหน้า"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setStart(addDaysISO(todayISO(), -2))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:text-white">วันนี้</button>
          <button onClick={() => setStart(addDaysISO(start, 7))} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white" aria-label="ถัดไป"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
        {Object.entries(COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${c.split(' ')[0]}`} /> {k}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[repeating-linear-gradient(45deg,#78350f,#78350f_3px,#1e293b_3px,#1e293b_6px)]" /> ซ่อมบำรุง</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-x-auto scrollbar-thin">
        <div className="min-w-[900px]">
          <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: `200px repeat(${DAYS}, 1fr)` }}>
            <div className="p-3 text-[11px] font-bold text-slate-400">พาหนะ</div>
            {days.map((d) => {
              const dt = new Date(d + 'T00:00:00');
              const weekend = dt.getDay() === 0 || dt.getDay() === 6;
              return (
                <div key={d} className={`p-2 text-center text-[10px] border-l border-slate-800 ${d === today ? 'bg-yellow-400/10 text-yellow-300 font-black' : weekend ? 'text-slate-300' : 'text-slate-500'}`}>
                  <div>{dt.toLocaleDateString('th-TH', { weekday: 'short' })}</div>
                  <div className="font-bold text-xs">{dt.getDate()}</div>
                </div>
              );
            })}
          </div>

          {vehicles.map((v) => {
            const rows = active.filter((b) => b.vehicleId === v.id);
            return (
              <div key={v.id} className="grid border-b border-slate-800/70 relative" style={{ gridTemplateColumns: `200px repeat(${DAYS}, 1fr)` }}>
                <div className="p-3 flex items-center gap-2 min-w-0">
                  <img src={v.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">{v.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{v.plateNumber.split(' ')[0]}</div>
                  </div>
                </div>
                {days.map((d) => (
                  <div key={d} className={`border-l border-slate-800/70 h-14 ${d === today ? 'bg-yellow-400/5' : ''} ${v.status === 'Maintenance' && d >= today ? 'bg-[repeating-linear-gradient(45deg,rgba(120,53,15,.35),rgba(120,53,15,.35)_4px,transparent_4px,transparent_8px)]' : ''}`} />
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
                      title={`${b.id} • ${b.customerName}`}
                      className={`absolute top-3 h-8 rounded-lg px-2 text-[10px] font-bold truncate text-left shadow-md hover:ring-2 hover:ring-yellow-300 ${COLORS[b.status] || 'bg-slate-600'}`}
                      style={{ left: `calc(200px + (100% - 200px) * ${s / DAYS} + 2px)`, width: `calc((100% - 200px) * ${(e - s + 1) / DAYS} - 4px)` }}
                    >
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
