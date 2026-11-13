import React, { useEffect, useMemo, useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { Modal, Field, inputCls } from '../components/ui';
import { addDaysISO, calculateDays, isVehicleFree, todayISO } from '../lib/pricing';

// Channels a booking can come from besides this website (must match admin_add_booking in schema.sql)
export const EXTERNAL_SOURCES = ['DriveHub', 'โทรศัพท์', 'LINE', 'Facebook', 'Walk-in', 'อื่น ๆ'];

export function SourceBadge({ source, className = '' }) {
  if (!source) return null;
  const dh = source === 'DriveHub';
  return (
    <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded ${dh ? 'bg-sky-500/20 text-sky-700 border border-sky-500/30' : 'bg-fuchsia-500/15 text-fuchsia-700 border border-fuchsia-500/30'} ${className}`}>
      {source}
    </span>
  );
}

const modelKey = (v) => `${v.type}|${(v.name || '').trim().toLowerCase()}`;

const blank = () => ({
  source: 'DriveHub',
  model: '',
  vehicleId: '',
  startDate: todayISO(),
  endDate: addDaysISO(todayISO(), 1),
  pickupTime: '09:00',
  returnTime: '09:00',
  name: '',
  phone: '',
  totalPrice: '',
  externalRef: '',
  note: '',
});

export default function ExternalBookingModal({ open, onClose, vehicles, bookings, onSubmit }) {
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (open) {
      setF(blank());
      setErr('');
    }
  }, [open]);
  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value }));

  // One entry per model (type + name), like the customer fleet page
  const models = useMemo(() => {
    const map = new Map();
    vehicles.forEach((v) => {
      const k = modelKey(v);
      if (!map.has(k)) map.set(k, { key: k, name: v.name, type: v.type, units: [] });
      map.get(k).units.push(v);
    });
    return [...map.values()].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  }, [vehicles]);

  const datesOk = calculateDays(f.startDate, f.endDate, f.pickupTime, f.returnTime) > 0;
  const days = datesOk ? calculateDays(f.startDate, f.endDate, f.pickupTime, f.returnTime) : 0;
  const units = (models.find((m) => m.key === f.model)?.units || []).map((u) => ({
    ...u,
    free: datesOk && isVehicleFree(u.id, bookings, f.startDate, f.endDate),
  }));
  const freeUnits = units.filter((u) => u.free);

  // Auto-pick a free unit whenever the model or dates change (admin can still choose another)
  useEffect(() => {
    if (!f.model) return;
    const cur = units.find((u) => u.id === f.vehicleId);
    if (cur?.free) return;
    setF((x) => ({ ...x, vehicleId: freeUnits[0]?.id || '' }));
  }, [f.model, f.startDate, f.endDate, f.pickupTime, f.returnTime, bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.model) return setErr('กรุณาเลือกรุ่นรถ');
    if (!datesOk) return setErr('วัน-เวลาคืนรถต้องหลังวันรับรถ');
    if (!f.vehicleId) return setErr('รุ่นนี้ไม่มีคันว่างในช่วงวันที่เลือก');
    const phone = f.phone.replace(/[^0-9]/g, '');
    if (phone && (phone.length < 6 || phone.length > 15)) return setErr('เบอร์โทรไม่ถูกต้อง (เว้นว่างได้)');
    if (f.totalPrice !== '' && !(Number(f.totalPrice) >= 0)) return setErr('ราคาไม่ถูกต้อง');
    setBusy(true);
    try {
      const { model, ...payload } = f;
      const ok = await onSubmit({ ...payload, phone, totalPrice: f.totalPrice === '' ? 0 : Number(f.totalPrice) });
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} maxWidth="max-w-xl">
      <form onSubmit={submit} noValidate>
        <div className="px-5 py-4 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2"><Link2 className="w-4 h-4 text-sky-600" /> บันทึกการจองจากช่องทางอื่น</h3>
            <p className="text-[11px] text-zinc-500">ระบบจะกันคิวรถให้ทันที ลูกค้าบนเว็บจะจองวันซ้อนไม่ได้</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="text-zinc-500 hover:text-zinc-900" aria-label="ปิด"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="text-xs font-bold text-zinc-600 block mb-1.5">ช่องทาง</span>
            <div className="flex flex-wrap gap-1.5">
              {EXTERNAL_SOURCES.map((s) => (
                <button type="button" key={s} onClick={() => setF((x) => ({ ...x, source: s }))} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${f.source === s ? 'border-sky-400 bg-sky-400/10 text-sky-700' : 'border-zinc-300 text-zinc-500 hover:text-white'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Field label="รุ่นรถ *">
            <select value={f.model} onChange={set('model')} className={inputCls}>
              <option value="">— เลือกรุ่นรถ —</option>
              {models.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.type === 'Motorcycle' ? '🛵' : '🚗'} {m.name} ({m.units.length} คัน){' '}
                  {m.units.map((u) => u.plateNumber).filter((p) => p && !/^รอระบุ/.test(p)).join(', ')}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="วันรับรถ *"><input type="date" value={f.startDate} onChange={set('startDate')} className={inputCls} /></Field>
            <Field label="เวลารับ"><input type="time" value={f.pickupTime} onChange={set('pickupTime')} className={inputCls} /></Field>
            <Field label="วันคืนรถ *"><input type="date" value={f.endDate} min={f.startDate} onChange={set('endDate')} className={inputCls} /></Field>
            <Field label="เวลาคืน"><input type="time" value={f.returnTime} onChange={set('returnTime')} className={inputCls} /></Field>
          </div>

          {f.model && (
            <Field label={`คันที่ใช้ (ว่าง ${freeUnits.length}/${units.length} คัน${days ? ` • ${days} วัน` : ''})`} hint="ระบบเลือกคันที่ว่างให้อัตโนมัติ เปลี่ยนได้">
              <select value={f.vehicleId} onChange={set('vehicleId')} className={inputCls}>
                {!freeUnits.length && <option value="">ไม่มีคันว่างในช่วงนี้</option>}
                {units.map((u) => (
                  <option key={u.id} value={u.id} disabled={!u.free}>
                    {u.plateNumber || 'ไม่ระบุทะเบียน'} • {u.id}{u.driveHubName ? ` • DH: ${u.driveHubName}` : ''} {u.free ? '' : '— ไม่ว่าง'}{u.status === 'Maintenance' ? ' (ซ่อมบำรุง)' : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="ชื่อลูกค้า"><input value={f.name} onChange={set('name')} placeholder={`ลูกค้า ${f.source}`} className={inputCls} /></Field>
            <Field label="เบอร์โทร"><input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="เว้นว่างได้" className={inputCls} /></Field>
            <Field label="ยอดเงิน (บาท)"><input value={f.totalPrice} onChange={set('totalPrice')} inputMode="numeric" placeholder="0" className={inputCls} /></Field>
            <Field label={f.source === 'DriveHub' ? 'เลขที่จอง DriveHub' : 'เลขอ้างอิง'}><input value={f.externalRef} onChange={set('externalRef')} placeholder="เว้นว่างได้" className={inputCls} /></Field>
          </div>
          <Field label="หมายเหตุ"><textarea value={f.note} onChange={set('note')} rows={2} className={inputCls} placeholder="เช่น รับที่สนามบิน, เที่ยวบิน FD3xxx" /></Field>

          {err && <div className="text-xs text-rose-700 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{err}</div>}
        </div>

        <div className="px-5 py-4 border-t border-zinc-200 flex gap-2 justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200">ยกเลิก</button>
          <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-60">
            {busy ? 'กำลังบันทึก…' : 'บันทึกและกันคิวรถ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
