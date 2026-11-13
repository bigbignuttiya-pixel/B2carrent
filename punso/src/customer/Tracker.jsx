import React, { useState } from 'react';
import { FileText, Search, AlertTriangle, MapPin, Calendar, Upload, XCircle, Check, ShieldAlert } from 'lucide-react';
import { BOOKING_FLOW } from '../data';
import { baht, formatThaiDate } from '../lib/pricing';
import { StatusBadge } from '../components/ui';
import { compressImage } from '../lib/image';

function Timeline({ status }) {
  if (status === 'Cancelled') {
    return <div className="text-[11px] text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 flex items-center gap-2"><XCircle className="w-4 h-4" /> รายการนี้ถูกยกเลิกแล้ว</div>;
  }
  const idx = BOOKING_FLOW.indexOf(status);
  const labels = ['ส่งคำขอ/ชำระเงิน', 'ยืนยันการจอง', 'รับรถแล้ว', 'คืนรถเรียบร้อย'];
  return (
    <div className="flex items-center gap-1.5">
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${i <= idx ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-zinc-300 text-zinc-500'}`}>
              {i <= idx ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[9px] sm:text-[10px] text-center leading-tight ${i <= idx ? 'text-zinc-700' : 'text-zinc-500'}`}>{l}</span>
          </div>
          {i < labels.length - 1 && <div className={`flex-1 h-0.5 mb-4 rounded ${i < idx ? 'bg-emerald-500' : 'bg-zinc-100'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const hoursUntil = (b) => (new Date(`${b.startDate}T${b.pickupTime || '09:00'}`) - Date.now()) / 36e5;

export default function Tracker({ myBookings, onSearch, onCancel, onAttachSlip, onBrowse, notify }) {
  const [phone, setPhone] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Phone number is required — a booking id alone is guessable and would expose other customers
  const search = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits && !bookingId.trim()) return setResults(null);
    if (!/^0\d{8,9}$/.test(digits)) return notify('กรุณากรอกเบอร์โทรศัพท์ที่ใช้จองให้ถูกต้อง', 'error');
    setSearching(true);
    setResults(await onSearch(digits, bookingId.trim()));
    setSearching(false);
  };

  const list = results ?? myBookings;
  const replaceResult = (b) => b && setResults((cur) => (cur ? cur.map((x) => (x.id === b.id ? b : x)) : cur));

  const attach = async (b, file) => {
    if (!file) return;
    try {
      replaceResult(await onAttachSlip(b, await compressImage(file, 700, 0.7)));
    } catch {
      notify('ไม่สามารถอ่านไฟล์รูปได้', 'error');
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-yellow-600" /> ติดตามสถานะการจอง
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">ค้นหาด้วยเบอร์โทรศัพท์ที่ใช้จอง (ใส่รหัสจองเพิ่มได้ถ้าต้องการ)</p>
        </div>
        <button onClick={onBrowse} className="px-4 py-2 bg-zinc-900 text-yellow-300 text-xs font-bold rounded-xl hover:bg-zinc-800 border border-yellow-400/30">+ จองพาหนะเพิ่ม</button>
      </div>

      <form onSubmit={search} className="mb-8 bg-white border border-zinc-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="เบอร์โทรศัพท์ที่ใช้จอง เช่น 0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 focus:border-yellow-400 focus:outline-none"
          />
        </div>
        <input
          type="text"
          placeholder="รหัสจอง (ไม่บังคับ)"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="sm:w-48 bg-white border border-zinc-300 rounded-xl px-4 py-2.5 text-xs text-zinc-900 font-mono uppercase focus:border-yellow-400 focus:outline-none"
        />
        <button type="submit" disabled={searching} className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-lg">
          {searching ? 'กำลังค้นหา…' : 'ค้นหารายการ'}
        </button>
        {results && <button type="button" onClick={() => { setResults(null); setPhone(''); setBookingId(''); }} className="text-xs text-zinc-500 hover:text-zinc-900 px-2">ล้าง</button>}
      </form>

      {!results && (
        <p className="text-[11px] text-zinc-500 mb-3 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" /> แสดงรายการของเบอร์ที่เคยจองจากอุปกรณ์นี้ — ค้นหาด้วยเบอร์โทรเพื่อดูจากเครื่องอื่น
        </p>
      )}

      {list.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-700">{results ? 'ไม่พบข้อมูลการจองตามที่ค้นหา' : 'ยังไม่มีรายการจองบนอุปกรณ์นี้'}</h3>
          <p className="text-xs text-zinc-500 mt-1">{results ? 'โปรดตรวจสอบเบอร์โทรศัพท์หรือรหัสจองอีกครั้ง' : 'ค้นหาด้วยเบอร์โทรศัพท์ที่ใช้จองด้านบน'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((row) => {
            const b = row;
            const cancellable = ['Pending', 'Confirmed'].includes(b.status);
            const freeCancel = hoursUntil(b) >= 48;
            return (
              <div key={b.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-zinc-200 gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold text-zinc-900">{b.vehicleName}</span>
                      <span className="text-xs font-mono bg-zinc-950 border border-zinc-900 text-yellow-400 px-2.5 py-0.5 rounded-md font-bold">{b.id}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">ผู้จอง: {b.customerName} • โทร: {b.phone.replace(/(\d{3})\d{4}(\d+)/, '$1-xxxx-$2')}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <Timeline status={b.status} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-zinc-200">
                    <span className="text-zinc-500 block mb-1">จุดรับ-คืนรถ</span>
                    <span className="text-zinc-700 font-medium flex items-start"><MapPin className="w-3.5 h-3.5 mr-1 text-yellow-600 shrink-0 mt-0.5" /> {b.pickupLocation}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-zinc-200">
                    <span className="text-zinc-500 block mb-1">ระยะเวลาเช่า</span>
                    <span className="text-zinc-700 font-medium flex items-start"><Calendar className="w-3.5 h-3.5 mr-1 text-yellow-600 shrink-0 mt-0.5" /> {formatThaiDate(b.startDate)} – {formatThaiDate(b.endDate)} ({b.totalDays} วัน)</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-zinc-200">
                    <span className="text-zinc-500 block mb-1">ยอดชำระสุทธิ</span>
                    <span className="text-yellow-600 font-black text-base">{baht(b.totalPrice)}</span>
                    {b.discount > 0 && <span className="text-[10px] text-emerald-600 block">ประหยัดไป {baht(b.discount)}</span>}
                  </div>
                </div>

                {(b.status === 'Pending' || cancellable) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {b.status === 'Pending' && (
                      <label className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer bg-zinc-900/80 text-yellow-300 border border-yellow-400/30 flex items-center gap-1.5 hover:bg-zinc-800">
                        <Upload className="w-3.5 h-3.5" /> {b.hasSlip ? 'เปลี่ยนสลิป' : 'แนบสลิปโอนเงิน'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => attach(b, e.target.files?.[0])} />
                      </label>
                    )}
                    {cancellable && (
                      <button
                        onClick={() => {
                          const msg = freeCancel ? 'ยืนยันยกเลิกการจองนี้? (ยกเลิกฟรี)' : 'ยกเลิกภายใน 48 ชม. ก่อนรับรถ จะมีค่าธรรมเนียม 1 วัน ยืนยันหรือไม่?';
                          if (window.confirm(msg)) onCancel(b).then(replaceResult);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-rose-700 hover:bg-rose-500/10 border border-zinc-300 hover:border-rose-500/40"
                      >
                        ยกเลิกการจอง {freeCancel ? '(ฟรี)' : '(มีค่าธรรมเนียม)'}
                      </button>
                    )}
                    {b.hasSlip && <span className="text-[11px] text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> แนบสลิปแล้ว รอตรวจสอบ</span>}
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
