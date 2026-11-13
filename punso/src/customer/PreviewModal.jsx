import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Modal } from '../components/ui';
import { baht } from '../lib/pricing';
import { isCutout, STUDIO_BG, STUDIO_SHADOW } from '../lib/image';
import { depositOf } from '../data';

export default function PreviewModal({ vehicle, unitCount = 1, bookable, onClose, onBook }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [vehicle?.id]);
  if (!vehicle) return null;
  const gallery = vehicle.gallery?.length ? vehicle.gallery : [vehicle.image];
  const step = (d) => setIdx((i) => (i + d + gallery.length) % gallery.length);

  return (
    <Modal open={!!vehicle} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 p-6 bg-white flex flex-col gap-4">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden border border-zinc-200">
            <img src={gallery[idx]} alt={vehicle.name} className={`w-full h-full ${isCutout(gallery[idx]) ? `object-contain p-6 ${STUDIO_SHADOW} ${STUDIO_BG}` : 'object-cover'}`} />
            <span className="absolute top-3 left-3 bg-yellow-400 text-zinc-950 font-black text-[10px] px-2.5 py-1 rounded-lg">{vehicle.badgeTag || vehicle.category}</span>
            {gallery.length > 1 && (
              <>
                <button onClick={() => step(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 border border-zinc-300 text-zinc-900 flex items-center justify-center" aria-label="รูปก่อนหน้า">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => step(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 border border-zinc-300 text-zinc-900 flex items-center justify-center" aria-label="รูปถัดไป">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 right-3 bg-white/80 text-[10px] text-zinc-700 px-2 py-0.5 rounded-md">{idx + 1}/{gallery.length}</span>
              </>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {gallery.map((img, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${i === idx ? 'border-yellow-400 scale-105' : 'border-zinc-200 opacity-60'}`}>
                <img src={img} alt="" className={`w-full h-full ${isCutout(img) ? `object-contain p-1 ${STUDIO_BG}` : 'object-cover'}`} />
              </button>
            ))}
          </div>
          <div className="text-[11px] text-zinc-500 bg-white border border-zinc-200 rounded-xl p-3 flex gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ผ่านการตรวจสภาพ 30 รายการก่อนส่งมอบ • เงินมัดจำ {baht(depositOf(vehicle))} (คืนเต็มจำนวน)
          </div>
        </div>

        <div className="md:w-1/2 p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">{vehicle.brand}</span>
                <h3 className="text-2xl font-black text-zinc-900">{vehicle.name}</h3>
                <p className="text-xs text-zinc-500">{unitCount > 1 ? `ร้านมีรุ่นนี้ ${unitCount} คัน` : `เลขทะเบียน: ${vehicle.plateNumber}`}</p>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 p-1" aria-label="ปิด">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-200 text-xs">
              <h4 className="font-bold text-zinc-600">คุณสมบัติเด่นประจำรถ</h4>
              {vehicle.features.map((f) => (
                <div key={f} className="flex items-center text-zinc-600 gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {f}
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 grid grid-cols-2 gap-3 text-xs">
              {[
                ['ขนาดเครื่องยนต์/พลังงาน', vehicle.engineCc],
                ['เกียร์', vehicle.transmission],
                ['เชื้อเพลิง', vehicle.fuelType],
                ['จำนวนที่นั่ง', `${vehicle.seats} ที่นั่ง`],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-zinc-500 block">{k}</span>
                  <span className="font-bold text-zinc-900">{v}</span>
                </div>
              ))}
              <div className="col-span-2">
                <span className="text-zinc-500 block">คะแนนรีวิว</span>
                <span className="font-bold text-amber-600">★ {vehicle.rating} / 5.0</span> <span className="text-zinc-500">จาก {vehicle.reviewsCount} รีวิว</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-zinc-500">อัตราค่าเช่า</span>
              <div className="text-2xl font-black text-yellow-600">
                {baht(vehicle.pricePerDay)} <span className="text-xs text-zinc-500 font-normal">/ วัน</span>
              </div>
            </div>
            <button
              disabled={!bookable}
              onClick={() => onBook(vehicle)}
              className="bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-zinc-800 hover:to-zinc-800 disabled:from-zinc-100 disabled:to-zinc-100 disabled:text-zinc-500 text-yellow-300 font-black px-6 py-3 rounded-xl text-xs border border-yellow-400/30 shadow-lg"
            >
              {bookable ? 'ดำเนินการจองรถคันนี้' : 'ไม่ว่างในช่วงวันที่เลือก'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
