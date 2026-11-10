import React, { useMemo } from 'react';
import { DollarSign, Activity, Percent, Bike, Car, ArrowUpRight, ArrowDownLeft, Wrench, Clock } from 'lucide-react';
import { baht, todayISO, addDaysISO, formatThaiDate } from '../lib/pricing';
import { StatusBadge } from '../components/ui';
import { BOOKING_STATUS } from '../data';

function Kpi({ label, value, sub, icon: Icon, accent = 'text-yellow-400' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
      <div className="flex justify-between items-center text-slate-400 text-xs">
        <span>{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div className={`text-2xl font-black ${accent === 'text-yellow-400' ? 'text-yellow-400' : 'text-white'}`}>{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}

export default function Dashboard({ bookings, vehicles, onOpenBooking }) {
  const today = todayISO();
  const stats = useMemo(() => {
    const valid = bookings.filter((b) => b.status !== 'Cancelled');
    const revenue = valid.reduce((s, b) => s + b.totalPrice, 0);
    const pendingRevenue = bookings.filter((b) => b.status === 'Pending').reduce((s, b) => s + b.totalPrice, 0);
    const byType = {
      Motorcycle: valid.filter((b) => b.vehicleType === 'Motorcycle').reduce((s, b) => s + b.totalPrice, 0),
      Car: valid.filter((b) => b.vehicleType === 'Car').reduce((s, b) => s + b.totalPrice, 0),
    };
    const onRoad = bookings.filter((b) => b.status === 'Picked Up').length;
    const busy = vehicles.filter((v) => v.status !== 'Available').length;
    const util = vehicles.length ? Math.round((busy / vehicles.length) * 100) : 0;
    const avgTicket = valid.length ? Math.round(revenue / valid.length) : 0;

    // Revenue for the next/last 7 days around today, by pickup date
    const days = Array.from({ length: 14 }, (_, i) => addDaysISO(today, i - 7));
    const series = days.map((d) => ({
      d,
      count: bookings.filter((b) => b.status !== 'Cancelled' && b.startDate <= d && d < b.endDate).length,
    }));
    const statusCounts = Object.keys(BOOKING_STATUS).map((s) => ({ s, n: bookings.filter((b) => b.status === s).length }));

    const vehicleRevenue = vehicles
      .map((v) => ({ v, total: valid.filter((b) => b.vehicleId === v.id).reduce((s, b) => s + b.totalPrice, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { revenue, pendingRevenue, byType, onRoad, util, avgTicket, series, statusCounts, vehicleRevenue };
  }, [bookings, vehicles, today]);

  const pickups = bookings.filter((b) => b.startDate === today && ['Confirmed', 'Pending'].includes(b.status));
  const returns = bookings.filter((b) => b.endDate === today && b.status === 'Picked Up');
  const upcoming = bookings
    .filter((b) => b.startDate > today && b.startDate <= addDaysISO(today, 7) && ['Confirmed', 'Pending'].includes(b.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const serviceDue = vehicles.filter((v) => v.mileage && v.nextServiceKm && v.nextServiceKm - v.mileage <= 1000);
  const maxCount = Math.max(1, ...stats.series.map((x) => x.count));
  const totalStatus = Math.max(1, bookings.length);
  const statusColor = { Pending: 'bg-amber-400', Confirmed: 'bg-emerald-400', 'Picked Up': 'bg-indigo-400', Completed: 'bg-blue-400', Cancelled: 'bg-rose-400' };

  const BookingRow = ({ b, kind }) => (
    <button onClick={() => onOpenBooking(b.id)} className="w-full flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 hover:border-yellow-400/40 rounded-xl px-3 py-2.5 text-left">
      <div className="min-w-0">
        <div className="text-xs font-bold text-white truncate">{b.customerName} • {b.vehicleName}</div>
        <div className="text-[10px] text-slate-500 truncate">{kind === 'return' ? `คืน ${b.returnTime || ''}` : `รับ ${formatThaiDate(b.startDate)} ${b.pickupTime || ''}`} • {b.pickupLocation}</div>
      </div>
      <StatusBadge status={b.status} compact />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Kpi label="รายได้รวม (ไม่รวมที่ยกเลิก)" value={baht(stats.revenue)} sub={`รอตรวจสลิป ${baht(stats.pendingRevenue)}`} icon={DollarSign} />
        <Kpi label="กำลังวิ่งให้บริการ" value={`${stats.onRoad} คัน`} sub={`ค่าเฉลี่ยต่อบิล ${baht(stats.avgTicket)}`} icon={Activity} accent="text-blue-400" />
        <Kpi label="อัตราการใช้งานฟลีต" value={`${stats.util}%`} sub="สัดส่วนรถที่ไม่ว่าง (เช่า/ซ่อม)" icon={Percent} accent="text-emerald-400" />
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="text-slate-400 text-xs">รายได้แยกตามประเภท</div>
          {[
            ['Motorcycle', '🛵 มอเตอร์ไซค์', 'bg-yellow-400', Bike],
            ['Car', '🚗 รถยนต์', 'bg-blue-500', Car],
          ].map(([k, l, c]) => {
            const pct = stats.revenue ? Math.round((stats.byType[k] / stats.revenue) * 100) : 0;
            return (
              <div key={k}>
                <div className="flex justify-between text-[11px] mb-1"><span className="text-slate-300 font-bold">{l}</span><span className="text-slate-400">{baht(stats.byType[k])} • {pct}%</span></div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${c} rounded-full`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">จำนวนรถที่ถูกเช่าต่อวัน (±7 วัน)</h3>
            <span className="text-[10px] text-slate-500">แท่งสีเหลือง = วันนี้</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-2 border-b border-slate-800 pt-4">
            {stats.series.map((x) => (
              <div key={x.d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{x.count}</span>
                <div
                  className={`w-full rounded-t-md transition-all ${x.d === today ? 'bg-yellow-400' : x.d < today ? 'bg-slate-700' : 'bg-gradient-to-t from-blue-700 to-indigo-500'}`}
                  style={{ height: `${Math.max(4, (x.count / maxCount) * 100)}%` }}
                  title={`${x.d}: ${x.count} คัน`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-slate-500">
            {stats.series.map((x, i) => <span key={x.d} className={`flex-1 text-center ${i % 2 ? 'hidden sm:block' : ''}`}>{x.d.slice(8)}</span>)}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white">สถานะรายการจอง</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
            {stats.statusCounts.map(({ s, n }) => n > 0 && <div key={s} className={statusColor[s]} style={{ width: `${(n / totalStatus) * 100}%` }} title={`${s}: ${n}`} />)}
          </div>
          <div className="space-y-2">
            {stats.statusCounts.map(({ s, n }) => (
              <div key={s} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-300"><span className={`w-2.5 h-2.5 rounded-full ${statusColor[s]}`} /> {BOOKING_STATUS[s].label}</span>
                <span className="font-bold text-white">{n}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2">Top รายได้ต่อคัน</h4>
            {stats.vehicleRevenue.map(({ v, total }) => (
              <div key={v.id} className="flex justify-between text-[11px] py-1">
                <span className="text-slate-400 truncate pr-2">{v.name}</span>
                <span className="text-yellow-400 font-bold">{baht(total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-400" /> ส่งมอบรถวันนี้ ({pickups.length})</h3>
          {pickups.length ? pickups.map((b) => <BookingRow key={b.id} b={b} />) : <p className="text-xs text-slate-500">ไม่มีคิวส่งมอบวันนี้</p>}
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pt-2"><ArrowDownLeft className="w-4 h-4 text-blue-400" /> รับคืนรถวันนี้ ({returns.length})</h3>
          {returns.length ? returns.map((b) => <BookingRow key={b.id} b={b} kind="return" />) : <p className="text-xs text-slate-500">ไม่มีคิวรับคืนวันนี้</p>}
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-400" /> คิวรับรถ 7 วันข้างหน้า ({upcoming.length})</h3>
          {upcoming.length ? upcoming.map((b) => <BookingRow key={b.id} b={b} />) : <p className="text-xs text-slate-500">ยังไม่มีคิว</p>}
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-400" /> ใกล้ถึงรอบเช็กระยะ ({serviceDue.length})</h3>
          {serviceDue.length ? serviceDue.map((v) => (
            <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <div className="text-xs font-bold text-white">{v.name}</div>
              <div className="text-[10px] text-slate-500">{v.mileage.toLocaleString()} / {v.nextServiceKm.toLocaleString()} กม. • เหลือ <span className="text-amber-400 font-bold">{(v.nextServiceKm - v.mileage).toLocaleString()} กม.</span></div>
            </div>
          )) : <p className="text-xs text-slate-500">ทุกคันอยู่ในเกณฑ์ปกติ</p>}
        </div>
      </div>
    </div>
  );
}
