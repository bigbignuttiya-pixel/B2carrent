import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Save, Trash2, Plus, Info, RotateCcw } from 'lucide-react';
import { buildPromptPayPayload, isValidPromptPayId } from '../lib/promptpay';
import { inputCls } from '../components/ui';

export default function Settings({ settings, coupons, onSave, onSaveCoupons, onResetDemo }) {
  const [form, setForm] = useState(settings);
  const [cps, setCps] = useState(coupons);
  const [newCp, setNewCp] = useState({ code: '', percent: 10, label: '' });
  useEffect(() => setForm(settings), [settings]);
  useEffect(() => setCps(coupons), [coupons]);

  const set = (patch) => setForm({ ...form, ...patch });
  const ppValid = isValidPromptPayId(form.promptPayId);
  const fbValid = !form.facebookUrl || /^https:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me)\/\S+$/i.test(form.facebookUrl.trim());
  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  const addCoupon = () => {
    const code = newCp.code.trim().toUpperCase();
    if (!code || cps.some((c) => c.code === code)) return;
    const percent = Math.min(90, Math.max(1, Number(newCp.percent) || 0));
    const next = [...cps, { code, percent, active: true, label: newCp.label || `ส่วนลด ${percent}%` }];
    setCps(next);
    onSaveCoupons(next);
    setNewCp({ code: '', percent: 10, label: '' });
  };
  const updateCoupons = (next) => {
    setCps(next);
    onSaveCoupons(next);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">บัญชีรับเงิน PromptPay</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label><span className="text-slate-400 block mb-1">หมายเลขพร้อมเพย์ (เบอร์มือถือ / เลขบัตร / Tax ID)</span>
              <input className={`${inputCls} font-mono ${ppValid ? '' : 'border-rose-500'}`} value={form.promptPayId} onChange={(e) => set({ promptPayId: e.target.value })} />
              {!ppValid && <span className="text-[10px] text-rose-400">รูปแบบไม่ถูกต้อง — QR จะสแกนไม่ได้</span>}
            </label>
            <label><span className="text-slate-400 block mb-1">ระยะเวลาให้ชำระ (นาที)</span>
              <input className={inputCls} type="number" min="5" max="120" value={form.paymentWindowMin} onChange={(e) => set({ paymentWindowMin: Number(e.target.value) || 15 })} />
            </label>
            <label className="sm:col-span-2"><span className="text-slate-400 block mb-1">ชื่อบัญชีรับเงิน (แสดงบนหน้าชำระเงิน)</span>
              <input className={inputCls} value={form.accountName} onChange={(e) => set({ accountName: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">ข้อมูลร้าน & ช่องทางติดต่อ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label><span className="text-slate-400 block mb-1">เบอร์โทรหน้าร้าน</span><input className={inputCls} value={form.storePhone} onChange={(e) => set({ storePhone: e.target.value })} /></label>
            <label><span className="text-slate-400 block mb-1">อีเมล</span><input className={inputCls} value={form.storeEmail} onChange={(e) => set({ storeEmail: e.target.value })} /></label>
            <label><span className="text-slate-400 block mb-1">LINE Official Account ID</span><input className={inputCls} value={form.lineOaId} onChange={(e) => set({ lineOaId: e.target.value })} placeholder="@b2rental" /></label>
            <label><span className="text-slate-400 block mb-1">ลิงก์แฟนเพจ Facebook</span>
              <input className={`${inputCls} ${fbValid ? '' : 'border-rose-500'}`} value={form.facebookUrl} onChange={(e) => set({ facebookUrl: e.target.value })} placeholder="https://www.facebook.com/…" />
              {!fbValid && <span className="text-[10px] text-rose-400">ต้องเป็นลิงก์ facebook.com หรือ fb.com (เว้นว่างเพื่อซ่อนปุ่ม)</span>}
            </label>
            <label><span className="text-slate-400 block mb-1">ชื่อแฟนเพจ (แสดงใน footer)</span><input className={inputCls} value={form.facebookName} onChange={(e) => set({ facebookName: e.target.value })} placeholder="B2 Rental" /></label>
            <label><span className="text-slate-400 block mb-1">เวลาเปิดทำการ</span><input className={inputCls} value={form.openHours} onChange={(e) => set({ openHours: e.target.value })} /></label>
            <label className="sm:col-span-2"><span className="text-slate-400 block mb-1">ที่อยู่ร้าน</span><textarea className={`${inputCls} h-16`} value={form.storeAddress} onChange={(e) => set({ storeAddress: e.target.value })} /></label>
            <label className="sm:col-span-2"><span className="text-slate-400 block mb-1">LINE Messaging API — Channel Access Token (แจ้งเตือนเมื่อมีการจองใหม่)</span>
              <input className={`${inputCls} font-mono`} type="password" autoComplete="off" value={form.lineChannelToken} onChange={(e) => set({ lineChannelToken: e.target.value })} placeholder="เก็บไว้ที่ฝั่งเซิร์ฟเวอร์เท่านั้น" />
              <span className="text-[10px] text-slate-500 mt-1 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> LINE Notify ปิดให้บริการแล้วตั้งแต่ 31 มี.ค. 2025 — ใช้ LINE Messaging API ผ่าน Official Account แทน และห้ามฝัง Token ไว้ในโค้ดฝั่งหน้าเว็บ</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            {dirty && <button onClick={() => setForm(settings)} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">ยกเลิกการแก้ไข</button>}
            <button disabled={!dirty || !fbValid} onClick={() => onSave({ ...form, facebookUrl: form.facebookUrl.trim() })} className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5">
              <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">โค้ดส่วนลด</h3>
          <div className="space-y-2">
            {cps.map((c, i) => (
              <div key={c.code} className="flex flex-wrap items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs">
                <span className="font-mono font-black text-yellow-400 w-32">{c.code}</span>
                <span className="text-white font-bold w-12">{c.percent}%</span>
                <span className="text-slate-400 flex-1 min-w-[120px]">{c.label}{c.onlyCategory && ` (เฉพาะ ${c.onlyCategory})`}</span>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input type="checkbox" className="accent-yellow-400" checked={c.active} onChange={(e) => updateCoupons(cps.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} />
                  ใช้งาน
                </label>
                <button onClick={() => updateCoupons(cps.filter((_, j) => j !== i))} className="text-slate-500 hover:text-rose-400" aria-label="ลบโค้ด"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            <input className={`${inputCls} sm:col-span-2 uppercase font-mono`} placeholder="CODE" value={newCp.code} onChange={(e) => setNewCp({ ...newCp, code: e.target.value })} />
            <input className={inputCls} type="number" min="1" max="90" placeholder="%" value={newCp.percent} onChange={(e) => setNewCp({ ...newCp, percent: e.target.value })} />
            <input className={`${inputCls} sm:col-span-2`} placeholder="คำอธิบาย" value={newCp.label} onChange={(e) => setNewCp({ ...newCp, label: e.target.value })} />
            <button onClick={addCoupon} className="bg-blue-700 hover:bg-blue-600 text-yellow-300 font-bold rounded-xl flex items-center justify-center gap-1 py-2"><Plus className="w-4 h-4" /> เพิ่ม</button>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
          <h4 className="text-sm font-bold text-white">ตัวอย่าง QR (ยอด ฿1.00)</h4>
          <div className="bg-white p-4 rounded-2xl inline-block">
            {ppValid ? <QRCodeSVG value={buildPromptPayPayload(form.promptPayId, 1)} size={160} /> : <div className="w-40 h-40 flex items-center justify-center text-rose-500 text-xs">PromptPay ID ไม่ถูกต้อง</div>}
          </div>
          <p className="text-[11px] text-slate-400">ลองสแกนด้วยแอปธนาคารเพื่อตรวจสอบว่าชื่อบัญชีถูกต้องก่อนเปิดใช้งานจริง</p>
        </div>
        <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-6 space-y-3">
          <h4 className="text-sm font-bold text-white">ข้อมูลตัวอย่าง (Demo)</h4>
          <p className="text-[11px] text-slate-400">ข้อมูลทั้งหมดถูกบันทึกไว้ในเบราว์เซอร์นี้ (localStorage) — ระบบจริงควรเชื่อมต่อฐานข้อมูลและ API หลังบ้าน</p>
          <button onClick={() => window.confirm('รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น?') && onResetDemo()} className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-rose-300 hover:bg-rose-500/10 flex items-center justify-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </div>
      </aside>
    </div>
  );
}
