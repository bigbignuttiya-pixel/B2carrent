import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download, Plus, Link2, X, Phone, MapPin, Calendar, CreditCard, FileImage, Clock } from 'lucide-react';
import { BOOKING_STATUS, ADDONS } from '../data';
import { baht, formatThaiDate } from '../lib/pricing';
import { StatusBadge } from '../components/ui';
import { SourceBadge } from './ExternalBookingModal';

const NEXT_ACTIONS = {
  Pending: [['Confirmed', 'ตรวจสลิปผ่าน / อนุมัติ', 'bg-emerald-600 hover:bg-emerald-500 text-white']],
  Confirmed: [['Picked Up', 'ส่งมอบรถแล้ว', 'bg-indigo-600 hover:bg-indigo-500 text-white']],
  'Picked Up': [['Completed', 'รับคืนรถสำเร็จ', 'bg-blue-700 hover:bg-blue-600 text-yellow-300']],
};

export function BookingDrawer({ booking, onClose, onStatus, getSlipUrl }) {
  const [slipUrl, setSlipUrl] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    setSlipUrl(null);
    if (!booking?.hasSlip) return undefined;
    setSlipLoading(true);
    Promise.resolve(getSlipUrl(booking))
      .then((u) => alive && setSlipUrl(u))
      .finally(() => alive && setSlipLoading(false));
    return () => {
      alive = false;
    };
  }, [booking?.id, booking?.hasSlip]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!booking) return null;
  const b = booking;
  const actions = NEXT_ACTIONS[b.status] || [];
  const canCancel = ['Pending', 'Confirmed'].includes(b.status);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur px-5 py-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="font-mono text-yellow-400 font-bold text-sm">{b.id}</div>
            <div className="text-[10px] text-slate-500">สร้างเมื่อ {b.createdAt} {b.source && <SourceBadge source={b.source} className="ml-1" />}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="ปิด"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          <div className="flex justify-between items-center">
            <StatusBadge status={b.status} />
            <span className="text-yellow-400 text-xl font-black">{baht(b.totalPrice)}</span>
          </div>

          {b.source && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3 text-sky-200 flex items-center gap-2">
              <Link2 className="w-4 h-4 shrink-0" />
              <span>จองผ่าน <b>{b.source}</b>{b.externalRef && <> • เลขอ้างอิง <span className="font-mono">{b.externalRef}</span></>}</span>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="text-sm font-bold text-white">{b.customerName}</div>
            {b.phone && <a href={`tel:${b.phone}`} className="flex items-center gap-2 text-slate-300 hover:text-yellow-300"><Phone className="w-3.5 h-3.5" /> {b.phone}</a>}
            {b.lineId && (
              <a href={`https://line.me/ti/p/~${encodeURIComponent(b.lineId)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-300 hover:text-emerald-200">💬 LINE: <span className="font-mono">{b.lineId}</span></a>
            )}
            {b.email && <div className="text-slate-400">✉ {b.email}</div>}
            <div className="text-slate-400">บัตร/Passport: <span className="font-mono text-slate-200">{b.idCard || '-'}</span></div>
            <div className="text-slate-400">ใบขับขี่: <span className="font-mono text-slate-200">{b.license || '-'}</span></div>
            {b.note && <div className="text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5">📝 {b.note}</div>}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="font-bold text-white">{b.vehicleName}</div>
            <div className="flex items-start gap-2 text-slate-300"><MapPin className="w-3.5 h-3.5 text-yellow-400 mt-0.5" /> {b.pickupLocation}</div>
            <div className="flex items-center gap-2 text-slate-300"><Calendar className="w-3.5 h-3.5 text-yellow-400" /> {formatThaiDate(b.startDate)} {b.pickupTime} → {formatThaiDate(b.endDate)} {b.returnTime}</div>
            <div className="flex items-center gap-2 text-slate-300"><Clock className="w-3.5 h-3.5 text-yellow-400" /> {b.totalDays} วัน</div>
            {b.addons?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {b.addons.map((id) => <span key={id} className="bg-slate-800 text-slate-300 rounded-md px-2 py-0.5 text-[10px]">{ADDONS.find((a) => a.id === id)?.name.split('(')[0] || id}</span>)}
              </div>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="flex justify-between text-slate-400"><span>ยอดก่อนส่วนลด</span><span>{baht(b.subtotal ?? b.totalPrice)}</span></div>
            <div className="flex justify-between text-emerald-400"><span>ส่วนลด {b.couponCode && `(${b.couponCode})`}</span><span>-{baht(b.discount || 0)}</span></div>
            <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1.5"><span>สุทธิ</span><span className="text-yellow-400">{baht(b.totalPrice)}</span></div>
            <div className="flex items-center gap-2 text-slate-500 pt-1"><CreditCard className="w-3.5 h-3.5" /> {b.paymentMethod}</div>
          </div>

          {!b.source && <div>
            <div className="font-bold text-slate-300 mb-2 flex items-center gap-1.5"><FileImage className="w-4 h-4" /> สลิปการโอน</div>
            {slipUrl ? (
              <a href={slipUrl} target="_blank" rel="noreferrer"><img src={slipUrl} alt="สลิป" className="rounded-xl border border-slate-700 max-h-80 mx-auto" /></a>
            ) : slipLoading ? (
              <div className="border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-500">กำลังโหลดสลิป…</div>
            ) : (
              <div className="border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-500">ลูกค้ายังไม่ได้แนบสลิป</div>
            )}
          </div>}

          <div className="space-y-2 pt-2">
            {actions.map(([to, label, cls]) => (
              <button key={to} onClick={() => onStatus(b.id, to)} className={`w-full py-3 rounded-xl font-black ${cls}`}>{label}</button>
            ))}
            {canCancel && (
              <button onClick={() => window.confirm('ยืนยันยกเลิกรายการนี้?') && onStatus(b.id, 'Cancelled')} className="w-full py-2.5 rounded-xl font-bold bg-slate-800 text-rose-300 hover:bg-rose-500/10">ยกเลิกรายการ</button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function toCsv(rows) {
  const cols = ['id', 'source', 'externalRef', 'customerName', 'phone', 'lineId', 'vehicleName', 'startDate', 'endDate', 'totalDays', 'subtotal', 'discount', 'totalPrice', 'status', 'createdAt'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export default function Bookings({ bookings, onOpen, onStatus, onAddExternal }) {
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bookings
      .filter((b) => status === 'All' || b.status === status)
      .filter((b) => !s || [b.id, b.customerName, b.phone, b.vehicleName, b.source, b.externalRef].some((x) => String(x).toLowerCase().includes(s)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bookings, status, q]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `b2-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-bold text-white">รายการจองของลูกค้า</h3>
        <div className="flex flex-wrap gap-2">
        {onAddExternal && (
          <button onClick={onAddExternal} className="bg-sky-600 hover:bg-sky-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> การจองจาก DriveHub / ช่องทางอื่น
          </button>
        )}
        <button onClick={exportCsv} className="bg-slate-900 border border-slate-700 hover:border-yellow-400/50 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
          <Download className="w-4 h-4" /> ส่งออก CSV ({list.length})
        </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัสจอง / ชื่อ / เบอร์โทร / รุ่นรถ" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:border-yellow-400 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          {['All', ...Object.keys(BOOKING_STATUS)].map((s) => {
            const n = s === 'All' ? bookings.length : bookings.filter((b) => b.status === s).length;
            return (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-lg border ${status === s ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300' : 'border-slate-800 text-slate-400 hover:text-white'}`}>
                {s === 'All' ? 'ทั้งหมด' : s} ({n})
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">รหัสจอง</th>
                <th className="p-4">ผู้เช่า</th>
                <th className="p-4">พาหนะ</th>
                <th className="p-4">ช่วงเวลาเช่า</th>
                <th className="p-4">ราคารวม</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {list.map((b) => {
                const next = NEXT_ACTIONS[b.status]?.[0];
                return (
                  <tr key={b.id} className="hover:bg-slate-950/50 cursor-pointer" onClick={() => onOpen(b.id)}>
                    <td className="p-4 font-mono font-bold text-yellow-400 whitespace-nowrap">
                      {b.id}
                      {b.source && <SourceBadge source={b.source} className="ml-2" />}
                      {b.status === 'Pending' && b.hasSlip && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">มีสลิป</span>}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white whitespace-nowrap">{b.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-white">{b.vehicleName}</td>
                    <td className="p-4 text-slate-400 whitespace-nowrap">{formatThaiDate(b.startDate)} – {formatThaiDate(b.endDate)} ({b.totalDays} วัน)</td>
                    <td className="p-4 font-black text-yellow-400">{baht(b.totalPrice)}</td>
                    <td className="p-4"><StatusBadge status={b.status} compact /></td>
                    <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {next && (
                        <button onClick={() => onStatus(b.id, next[0])} className={`px-2.5 py-1 font-bold rounded-lg ${next[2]}`}>{next[1]}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-slate-500">ไม่พบรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
