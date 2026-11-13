import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Search, ClipboardList } from 'lucide-react';
import { CATEGORIES, DEPOSIT_BY_TYPE } from '../data';
import { baht } from '../lib/pricing';
import { Modal, inputCls } from '../components/ui';
import PhotoManager from './PhotoManager';
import PlateSheet from './PlateSheet';

const BLANK = {
  name: '', type: 'Motorcycle', category: 'Scooter', brand: '', pricePerDay: 400, deposit: 500, seats: 2,
  engineCc: '125 cc', transmission: 'Automatic', fuelType: 'เบนซิน 95', plateNumber: '', photos: [],
  badgeTag: 'มาใหม่', features: 'สภาพใหม่ 100%\nตรวจเช็กระยะพร้อม\nประกันภัยคุ้มครองมาตรฐาน', mileage: 0, nextServiceKm: 5000,
};

const DEFAULT_IMG = {
  Motorcycle: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
  Car: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
};

export function VehicleForm({ open, initial, onClose, onSave, notify }) {
  const [f, setF] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (!initial) return setF(BLANK);
    // Main image first, then the rest of the gallery (deduplicated)
    const photos = [...new Set([initial.image, ...(initial.gallery || [])].filter(Boolean))];
    setF({ ...BLANK, ...initial, photos, features: (initial.features || []).join('\n') });
  }, [open, initial]);

  const set = (patch) => {
    setF((cur) => ({ ...cur, ...patch }));
    setErrors((cur) => {
      const next = { ...cur };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  // Validate in code (not browser bubbles, which are easy to miss on phones) and jump to the first problem
  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'กรุณากรอกชื่อรุ่นพาหนะ';
    if (!f.plateNumber.trim()) e.plateNumber = 'กรุณากรอกทะเบียนรถ';
    if (!(Number(f.pricePerDay) > 0)) e.pricePerDay = 'กรุณากรอกราคาต่อวัน';
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      notify(`ยังบันทึกไม่ได้ — ${Object.values(e).join(', ')}`, 'error');
      setTimeout(() => {
        const el = document.querySelector(`[data-field="${first}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus({ preventScroll: true });
      }, 50);
    }
    return !first;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    const { photos, ...rest } = f;
    rest.name = f.name.trim();
    rest.plateNumber = f.plateNumber.trim();
    rest.brand = f.brand.trim() || rest.name.split(/\s+/)[0]; // brand is optional: default to first word of the name
    const image = photos[0] || DEFAULT_IMG[f.type];
    setSaving(true);
    await onSave({
      ...rest,
      pricePerDay: Number(f.pricePerDay) || 0,
      deposit: Number(f.deposit) || 0,
      seats: Number(f.seats) || 1,
      mileage: Number(f.mileage) || 0,
      nextServiceKm: Number(f.nextServiceKm) || 0,
      image,
      gallery: photos.length ? photos : [image],
      features: f.features.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="px-6 py-4 bg-white border-b border-zinc-200 flex justify-between items-center">
        <h3 className="font-bold text-zinc-900 text-base">{initial ? `แก้ไขพาหนะ ${initial.id}` : 'เพิ่มพาหนะใหม่เข้าฟลีตร้าน PUNSO'}</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900" aria-label="ปิด"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={submit} noValidate className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <label className="col-span-1"><span className="text-zinc-500 block mb-1">ประเภท</span>
          <select className={inputCls} value={f.type} onChange={(e) => set({ type: e.target.value, category: CATEGORIES[e.target.value][0], seats: e.target.value === 'Car' ? 5 : 2, deposit: DEPOSIT_BY_TYPE[e.target.value] })}>
            <option value="Motorcycle">🛵 จักรยานยนต์</option>
            <option value="Car">🚗 รถยนต์</option>
          </select>
        </label>
        <label className="col-span-1"><span className="text-zinc-500 block mb-1">หมวดหมู่</span>
          <select className={inputCls} value={f.category} onChange={(e) => set({ category: e.target.value })}>
            {CATEGORIES[f.type].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="col-span-1"><span className="text-zinc-500 block mb-1">ยี่ห้อ <span className="text-zinc-400">(ไม่บังคับ)</span></span>
          <input className={inputCls} value={f.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Honda" />
        </label>
        <label className="col-span-1"><span className="text-zinc-500 block mb-1">ป้ายกำกับ</span>
          <input className={inputCls} value={f.badgeTag} onChange={(e) => set({ badgeTag: e.target.value })} />
        </label>
        <label className="col-span-2 sm:col-span-3"><span className="text-zinc-500 block mb-1">ชื่อรุ่นพาหนะ <span className="text-rose-600">*</span></span>
          <input data-field="name" className={`${inputCls} ${errors.name ? 'border-rose-500' : ''}`} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Honda Click 160" />
          {errors.name && <span className="text-[10px] text-rose-600 mt-1 block">{errors.name}</span>}
        </label>
        <label className="col-span-2 sm:col-span-1"><span className="text-zinc-500 block mb-1">ทะเบียนรถ <span className="text-rose-600">*</span></span>
          <input data-field="plateNumber" className={`${inputCls} ${errors.plateNumber ? 'border-rose-500' : ''}`} value={f.plateNumber} onChange={(e) => set({ plateNumber: e.target.value })} placeholder="1กข-9999 นครศรีธรรมราช" />
          {errors.plateNumber && <span className="text-[10px] text-rose-600 mt-1 block">{errors.plateNumber}</span>}
        </label>
        <label><span className="text-zinc-500 block mb-1">ราคา/วัน (฿) <span className="text-rose-600">*</span></span>
          <input data-field="pricePerDay" className={`${inputCls} ${errors.pricePerDay ? 'border-rose-500' : ''}`} type="number" inputMode="numeric" min="0" value={f.pricePerDay} onChange={(e) => set({ pricePerDay: e.target.value })} />
          {errors.pricePerDay && <span className="text-[10px] text-rose-600 mt-1 block">{errors.pricePerDay}</span>}
        </label>
        <label><span className="text-zinc-500 block mb-1">เงินมัดจำ (฿)</span>
          <input className={inputCls} type="number" min="0" value={f.deposit} onChange={(e) => set({ deposit: e.target.value })} />
        </label>
        <label><span className="text-zinc-500 block mb-1">ที่นั่ง</span>
          <input className={inputCls} type="number" min="1" value={f.seats} onChange={(e) => set({ seats: e.target.value })} />
        </label>
        <label><span className="text-zinc-500 block mb-1">ขุมพลัง</span>
          <input className={inputCls} value={f.engineCc} onChange={(e) => set({ engineCc: e.target.value })} />
        </label>
        <label className="col-span-2"><span className="text-zinc-500 block mb-1">เกียร์</span>
          <input className={inputCls} value={f.transmission} onChange={(e) => set({ transmission: e.target.value })} />
        </label>
        <label className="col-span-2"><span className="text-zinc-500 block mb-1">เชื้อเพลิง</span>
          <input className={inputCls} value={f.fuelType} onChange={(e) => set({ fuelType: e.target.value })} />
        </label>
        <label className="col-span-2"><span className="text-zinc-500 block mb-1">เลขไมล์ปัจจุบัน (กม.)</span>
          <input className={inputCls} type="number" min="0" value={f.mileage} onChange={(e) => set({ mileage: e.target.value })} />
        </label>
        <label className="col-span-2"><span className="text-zinc-500 block mb-1">เช็กระยะครั้งถัดไป (กม.)</span>
          <input className={inputCls} type="number" min="0" value={f.nextServiceKm} onChange={(e) => set({ nextServiceKm: e.target.value })} />
        </label>
        <div className="col-span-2 sm:col-span-4">
          <PhotoManager photos={f.photos} onChange={(photos) => set({ photos })} notify={notify} />
          {f.photos.length === 0 && <p className="text-[10px] text-zinc-500 mt-1">ยังไม่มีรูป — ระบบจะใช้รูปตัวอย่างของ{f.type === 'Car' ? 'รถยนต์' : 'จักรยานยนต์'}แทน</p>}
        </div>
        <label className="col-span-2 sm:col-span-4"><span className="text-zinc-500 block mb-1">คุณสมบัติเด่น (1 ข้อต่อบรรทัด)</span>
          <textarea className={`${inputCls} h-24`} value={f.features} onChange={(e) => set({ features: e.target.value })} />
        </label>
        <div className="col-span-2 sm:col-span-4 pt-3 border-t border-zinc-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl">ยกเลิก</button>
          <button type="submit" disabled={saving} className="px-5 py-2 disabled:opacity-60 bg-yellow-400 text-zinc-950 font-black rounded-xl hover:bg-yellow-300">{saving ? 'กำลังบันทึก / อัปโหลดรูป…' : initial ? 'บันทึกการแก้ไข' : 'บันทึกเข้าฟลีตร้าน'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function FleetAdmin({ vehicles, bookings, onStatus, onSave, onDelete, notify, onSavePlates }) {
  const [platesOpen, setPlatesOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null closed | 'new' | vehicle
  const [q, setQ] = useState('');
  const list = vehicles.filter((v) => !q || `${v.name} ${v.plateNumber} ${v.brand}`.toLowerCase().includes(q.toLowerCase()));
  const activeCount = (id) => bookings.filter((b) => b.vehicleId === id && ['Pending', 'Confirmed', 'Picked Up'].includes(b.status)).length;

  return (
    <div className="space-y-5">
      {onSavePlates && <PlateSheet open={platesOpen} onClose={() => setPlatesOpen(false)} vehicles={vehicles} onSave={onSavePlates} />}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-bold text-zinc-900">จัดการฟลีตรถทั้งหมด</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารุ่น / ทะเบียน" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 focus:border-yellow-400 focus:outline-none" />
          </div>
          {onSavePlates && (
            <button onClick={() => setPlatesOpen(true)} className="bg-zinc-50 border border-zinc-300 hover:border-yellow-400/50 text-zinc-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 whitespace-nowrap">
              <ClipboardList className="w-4 h-4" /> ทะเบียนรถทั้งหมด
            </button>
          )}
          <button onClick={() => setEditing('new')} className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-lg whitespace-nowrap">
            <Plus className="w-4 h-4" /> เพิ่มรถคันใหม่
          </button>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-white text-zinc-500 font-bold border-b border-zinc-200">
              <tr>
                <th className="p-4">พาหนะ</th>
                <th className="p-4">ประเภท</th>
                <th className="p-4">ทะเบียน</th>
                <th className="p-4">ราคา/วัน</th>
                <th className="p-4">เลขไมล์</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {list.map((v) => {
                const due = v.nextServiceKm && v.nextServiceKm - v.mileage <= 1000;
                const active = activeCount(v.id);
                return (
                  <tr key={v.id} className="hover:bg-white/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEditing(v)} title="แก้ไข / เพิ่มรูป" className="relative shrink-0"><img src={v.image} alt="" className="w-12 h-10 object-cover rounded-lg" /><span className="absolute -bottom-1 -right-1 bg-white border border-zinc-300 rounded-md px-1 text-[9px] text-zinc-600">{(v.gallery || []).length || 1}📷</span></button>
                        <div>
                          <div className="font-bold text-zinc-900">{v.name}</div>
                          <div className="text-[10px] text-zinc-500">{v.id} • ★ {v.rating} • คิวค้าง {active}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${v.type === 'Motorcycle' ? 'bg-yellow-400/10 text-yellow-700 border border-yellow-400/20' : 'bg-zinc-900/5 text-zinc-800 border border-zinc-400/20'}`}>
                        {v.type === 'Motorcycle' ? '🛵' : '🚗'} {v.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold whitespace-nowrap">{v.plateNumber}</td>
                    <td className="p-4 font-black text-yellow-600">{baht(v.pricePerDay)}</td>
                    <td className="p-4 whitespace-nowrap">
                      {(v.mileage || 0).toLocaleString()} กม.
                      {due && <span className="block text-[10px] text-amber-600 font-bold">⚠ ใกล้เช็กระยะ</span>}
                    </td>
                    <td className="p-4">
                      <select
                        value={v.status}
                        onChange={(e) => onStatus(v.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border bg-white ${
                          v.status === 'Available' ? 'border-emerald-500/30 text-emerald-600' : v.status === 'Rented' ? 'border-zinc-400/30 text-zinc-900' : 'border-amber-500/30 text-amber-600'
                        }`}
                      >
                        <option value="Available">ว่าง</option>
                        <option value="Rented">กำลังเช่า</option>
                        <option value="Maintenance">ซ่อมบำรุง</option>
                      </select>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(v)} className="text-zinc-500 hover:text-yellow-600 p-1.5" aria-label="แก้ไข"><Pencil className="w-4 h-4" /></button>
                      <button
                        onClick={() => {
                          if (active > 0) return window.alert(`ลบไม่ได้ — รถคันนี้มีคิวจองค้างอยู่ ${active} รายการ`);
                          if (window.confirm(`ยืนยันลบ ${v.name} ออกจากฟลีต?`)) onDelete(v.id);
                        }}
                        className="text-zinc-500 hover:text-rose-600 p-1.5"
                        aria-label="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <VehicleForm
        open={editing !== null}
        initial={editing && editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)}
        notify={notify}
        onSave={async (data) => {
          const saved = await onSave(data, editing !== 'new' ? editing.id : null);
          if (saved) setEditing(null);
        }}
      />
    </div>
  );
}
