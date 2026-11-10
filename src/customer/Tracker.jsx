import React, { useState } from 'react';
import { FileText, Search, AlertTriangle, MapPin, Calendar, Upload, XCircle, Check, ShieldAlert } from 'lucide-react';
import { BOOKING_FLOW } from '../data';
import { baht, formatThaiDate } from '../lib/pricing';
import { StatusBadge } from '../components/ui';
import { compressImage } from './BookingModal';

function Timeline({ status }) {
  if (status === 'Cancelled') {
    return <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 flex items-center gap-2"><XCircle className="w-4 h-4" /> รายการนี้ถูกยกเลิกแล้ว</div>;
  }
  const idx = BOOKING_FLOW.indexOf(status);
  const labels = ['ส่งคำขอ/ชำระเงิน', 'ยืนยันการจอง', 'รับรถแล้ว', 'คืนรถเรียบร้อย'];
  return (
    <div className="flex items-center gap-1.5">
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${i <= idx ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-500'}`}>
              {i <= idx ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[9px] sm:text-[10px] text-center leading-tight ${i <= idx ? 'text-slate-200' : 'text-slate-500'}`}>{l}</span>
          </div>
          {i < labels.length - 1 && <div className={`flex-1 h-0.5 mb-4 rounded ${i < idx ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const hoursUntil = (b) => (new Date(`${b.startDate}T${b.pickupTime || '09:00'}`) - Date.now()) / 36e5;

export default function Tracker({ bookings, myBookingIds, onCancel, onAttachSlip, onBrowse, notify }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);

  const search = (e) => {
    e.preventDefault();
    const q = input.trim().toLowerCase();
    if (!q) return setResults(null);
    const digits = q.replace(/[^0-9]/g, '');
    // Exact match only — avoids exposing other customers' bookings by partial search
    setResults(bookings.filter((b) => b.id.toLowerCase() === q || (digits.length >= 9 && b.phone === digits)));
  };

  const mine = bookings.filter((b) => myBookingIds.includes(b.id));
  const list = results ?? mine;
  const live = (id) => bookings.find((b) => b.id === id);

  const attach = async (id, file) => {
    if (!file) return;
    try {
      onAttachSlip(id, await compressImage(file));
    } catch {
      notify('ไม่สามารถอ่านไฟล์รูปได้', 'error');
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-yellow-400" /> ติดตามสถานะการจอง
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">ค้นหาด้วยเบอร์โทรศัพท์ หรือรหัสอ้างอิงการจอง (เช่น B2-2026-0881)</p>
        </div>
        <button onClick={onBrowse} className="px-4 py-2 bg-blue-700 text-yellow-300 text-xs font-bold rounded-xl hover:bg-blue-600 border border-yellow-400/30">+ จองพาหนะเพิ่ม</button>
      </div>

      <form onSubmit={search} className="mb-8 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="เบอร์โทรศัพท์ (0819998877) หรือ รหัสจอง (B2-2026-0881)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
          />
        </div>
        <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-lg">ค้นหารายการ</button>
        {results && <button type="button" onClick={() => { setResults(null); setInput(''); }} className="text-xs text-slate-400 hover:text-white px-2">ล้าง</button>}
      </form>

      {!results && (
        <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" /> แสดงเฉพาะรายการที่จองจากอุปกรณ์นี้ — ค้นหาด้วยเบอร์โทรเพื่อดูรายการอื่นของคุณ
        </p>
      )}

      {list.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-200">{results ? 'ไม่พบข้อมูลการจองตามที่ค้นหา' : 'ยังไม่มีรายการจองบนอุปกรณ์นี้'}</h3>
          <p className="text-xs text-slate-500 mt-1">{results ? 'โปรดตรวจสอบเบอร์โทรศัพท์หรือรหัสจองอีกครั้ง' : 'ลองค้นหาด้วยเบอร์ 0819998877 เพื่อดูตัวอย่าง'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((row) => {
            const b = live(row.id) || row;
            const cancellable = ['Pending', 'Confirmed'].includes(b.status);
            const freeCancel = hoursUntil(b) >= 48;
            return (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-800 gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold text-white">{b.vehicleName}</span>
                      <span className="text-xs font-mono bg-blue-950 border border-blue-800 text-yellow-400 px-2.5 py-0.5 rounded-md font-bold">{b.id}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">ผู้จอง: {b.customerName} • โทร: {b.phone.replace(/(\d{3})\d{4}(\d+)/, '$1-xxxx-$2')}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <Timeline status={b.status} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">จุดรับ-คืนรถ</span>
                    <span className="text-slate-200 font-medium flex items-start"><MapPin className="w-3.5 h-3.5 mr-1 text-yellow-400 shrink-0 mt-0.5" /> {b.pickupLocation}</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">ระยะเวลาเช่า</span>
                    <span className="text-slate-200 font-medium flex items-start"><Calendar className="w-3.5 h-3.5 mr-1 text-yellow-400 shrink-0 mt-0.5" /> {formatThaiDate(b.startDate)} – {formatThaiDate(b.endDate)} ({b.totalDays} วัน)</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">ยอดชำระสุทธิ</span>
                    <span className="text-yellow-400 font-black text-base">{baht(b.totalPrice)}</span>
                    {b.discount > 0 && <span className="text-[10px] text-emerald-400 block">ประหยัดไป {baht(b.discount)}</span>}
                  </div>
                </div>

                {(b.status === 'Pending' || cancellable) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {b.status === 'Pending' && (
                      <label className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer bg-blue-700/80 text-yellow-300 border border-yellow-400/30 flex items-center gap-1.5 hover:bg-blue-600">
                        <Upload className="w-3.5 h-3.5" /> {b.slip ? 'เปลี่ยนสลิป' : 'แนบสลิปโอนเงิน'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => attach(b.id, e.target.files?.[0])} />
                      </label>
                    )}
                    {cancellable && (
                      <button
                        onClick={() => {
                          const msg = freeCancel ? 'ยืนยันยกเลิกการจองนี้? (ยกเลิกฟรี)' : 'ยกเลิกภายใน 48 ชม. ก่อนรับรถ จะมีค่าธรรมเนียม 1 วัน ยืนยันหรือไม่?';
                          if (window.confirm(msg)) onCancel(b.id);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-rose-300 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/40"
                      >
                        ยกเลิกการจอง {freeCancel ? '(ฟรี)' : '(มีค่าธรรมเนียม)'}
                      </button>
                    )}
                    {b.slip && <span className="text-[11px] text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> แนบสลิปแล้ว รอตรวจสอบ</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
