import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, CheckCircle2, Copy, Upload, Timer, Tag, Printer, FileText, RefreshCw, Check, AlertTriangle, Loader2, MessageCircle } from 'lucide-react';
import { ADDONS, depositOf } from '../data';
import { priceQuote, baht, formatThaiDate } from '../lib/pricing';
import { buildPromptPayPayload } from '../lib/promptpay';
import { Modal, inputCls } from '../components/ui';
import { compressImage } from '../lib/image';
import { lineChatUrl, lineMessageUrl, lineLabel } from '../lib/line';

const EMPTY_INFO = { name: '', phone: '', lineId: '', idCard: '', license: '', note: '' };

// Message the customer sends to the shop's LINE OA together with photos of their documents
export function bookingLineText(b) {
  return [
    `ส่งเอกสารการจอง ${b.id}`,
    `รถ: ${b.vehicleName}`,
    `ชื่อผู้เช่า: ${b.customerName}`,
    `โทร: ${b.phone}`,
    b.lineId ? `LINE ID: ${b.lineId}` : null,
    `รับรถ: ${formatThaiDate(b.startDate)} ${b.pickupTime}`,
    `คืนรถ: ${formatThaiDate(b.endDate)} ${b.returnTime} (${b.totalDays} วัน)`,
    `จุดรับ-คืน: ${b.pickupLocation}`,
    `ยอดชำระ: ${baht(b.totalPrice)}`,
    '',
    'แนบรูป: บัตรประชาชน/Passport และใบขับขี่' + (b.hasSlip ? '' : ' + สลิปโอนเงิน'),
  ]
    .filter((x) => x !== null)
    .join('\n');
}



function Stepper({ step }) {
  const steps = ['ข้อมูล & ออปชัน', 'ชำระเงิน', 'ยืนยันการจอง'];
  return (
    <div className="flex items-center gap-2 px-6 pt-5">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border ${done ? 'bg-emerald-500 border-emerald-400 text-white' : active ? 'bg-yellow-400 border-yellow-300 text-zinc-950' : 'bg-white border-zinc-300 text-zinc-500'}`}>
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-[11px] font-bold hidden sm:inline ${active ? 'text-zinc-900' : 'text-zinc-500'}`}>{s}</span>
            </div>
            {n < steps.length && <div className={`flex-1 h-0.5 rounded ${step > n ? 'bg-emerald-500' : 'bg-zinc-100'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function BookingModal({ vehicle, searchParams, rentalDays, checkCoupon, settings, onSubmit, onAttachSlip, onClose, onGoTracker, notify }) {
  const [step, setStep] = useState(1);
  const [addons, setAddons] = useState([]);
  const [info, setInfo] = useState(EMPTY_INFO);
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [agree, setAgree] = useState(false);
  const [slip, setSlip] = useState(null);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // Reset whenever a new vehicle is opened
  useEffect(() => {
    if (!vehicle) return;
    setStep(1);
    setAddons(vehicle.type === 'Motorcycle' ? ['helmet', 'insurance'] : ['insurance']);
    setInfo(EMPTY_INFO);
    setErrors({});
    setCouponInput('');
    setCoupon(null);
    setAgree(false);
    setSlip(null);
    setResult(null);
    setBusy(false);
  }, [vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== 2) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const availableAddons = useMemo(() => ADDONS.filter((a) => !a.onlyFor || a.onlyFor === vehicle?.type), [vehicle?.type]);
  const quote = useMemo(() => priceQuote(vehicle, rentalDays, addons, coupon), [vehicle, rentalDays, addons, coupon]);
  const amount = result?.totalPrice ?? quote.total; // server-calculated once the booking exists
  const payload = useMemo(() => buildPromptPayPayload(settings.promptPayId, amount), [settings.promptPayId, amount]);

  if (!vehicle) return null;

  const remaining = Math.max(0, deadline - now);
  const expired = step === 2 && remaining === 0;
  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

  const toggleAddon = (id) => setAddons((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const applyCoupon = async () => {
    let c = null;
    try {
      c = await checkCoupon(couponInput, vehicle);
    } catch {
      return notify('ตรวจสอบโค้ดไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
    if (c) {
      setCoupon(c);
      notify(`ใช้โค้ด ${c.code} สำเร็จ — ${c.label}`);
    } else {
      setCoupon(null);
      notify('โค้ดส่วนลดไม่ถูกต้อง หมดอายุ หรือไม่สามารถใช้กับรถคันนี้ได้', 'error');
    }
  };

  const validate = () => {
    const e = {};
    if (info.name.trim().length < 3) e.name = 'กรุณากรอกชื่อ-นามสกุลจริง';
    const digits = info.phone.replace(/[^0-9]/g, '');
    if (!/^0\d{8,9}$/.test(digits)) e.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง (เช่น 0812345678)';
    if (info.lineId && !/^@?[A-Za-z0-9._-]{2,40}$/.test(info.lineId.trim())) e.lineId = 'LINE ID ไม่ถูกต้อง (ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข . _ - เท่านั้น)';
    if (!agree) e.agree = 'กรุณายอมรับเงื่อนไขการเช่า';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Create the booking first (reserves the dates and fixes the price on the server), then show the QR
  const goPayment = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    if (rentalDays <= 0) return notify('ช่วงวันที่เช่าไม่ถูกต้อง', 'error');
    if (!validate()) return;
    setBusy(true);
    const booking = await onSubmit({
      vehicle,
      info: { ...info, phone: info.phone.replace(/[^0-9]/g, '') },
      addons,
      couponCode: coupon?.code || '',
    });
    setBusy(false);
    if (!booking) return;
    setResult(booking);
    setDeadline(Date.now() + settings.paymentWindowMin * 60000);
    setNow(Date.now());
    setStep(2);
  };

  const onSlip = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return notify('กรุณาแนบไฟล์รูปภาพสลิปเท่านั้น', 'error');
    try {
      setSlip(await compressImage(file, 700, 0.7));
    } catch {
      notify('ไม่สามารถอ่านไฟล์รูปได้', 'error');
    }
  };

  const finalize = async () => {
    if (busy) return;
    if (slip) {
      setBusy(true);
      const updated = await onAttachSlip(result, slip);
      setBusy(false);
      if (!updated) return;
      setResult(updated);
    }
    setStep(3);
  };

  const copy = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(msg);
    } catch {
      notify(text, 'info');
    }
  };

  const err = (k) => errors[k] && <span className="text-[10px] text-rose-600 mt-1 block">{errors[k]}</span>;

  return (
    <Modal open={!!vehicle} onClose={onClose}>
      <div className="px-6 py-4 bg-white border-b border-zinc-200 flex justify-between items-center no-print">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center text-yellow-400 font-black text-base border border-yellow-400/40 shrink-0">P</div>
          <div className="min-w-0">
            <h3 className="font-bold text-zinc-900 text-sm truncate">
              {step === 1 && `จองเช่า ${vehicle.name}`}
              {step === 2 && 'ชำระเงินผ่าน PromptPay QR Code'}
              {step === 3 && 'ส่งคำขอจองเรียบร้อย'}
            </h3>
            <span className="text-[10px] text-zinc-500">
              {formatThaiDate(searchParams.pickupDate)} {searchParams.pickupTime} → {formatThaiDate(searchParams.returnDate)} {searchParams.returnTime} • {rentalDays} วัน
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 p-1" aria-label="ปิด">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="no-print"><Stepper step={step} /></div>

      {/* STEP 1 */}
      {step === 1 && (
        <form onSubmit={goPayment} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex items-center gap-4">
              <img src={vehicle.image} alt="" className="w-24 h-16 object-cover rounded-xl" />
              <div>
                <h4 className="font-bold text-zinc-900 text-sm">{vehicle.name}</h4>
                <p className="text-xs text-yellow-600 font-bold">{baht(vehicle.pricePerDay)} / วัน</p>
                <p className="text-[11px] text-zinc-500">📍 {searchParams.location}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-zinc-600 block mb-2">เลือกบริการเสริมเพิ่มเติม</span>
              <div className="space-y-2">
                {availableAddons.map((a) => {
                  const Icon = a.icon;
                  const on = addons.includes(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggleAddon(a.id)}
                      className={`w-full p-3 rounded-xl border text-xs flex items-center justify-between gap-3 text-left transition-colors ${on ? 'bg-zinc-950 border-yellow-400/50 text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-yellow-400 border-yellow-400' : 'border-zinc-400'}`}>{on && <Check className="w-3 h-3 text-zinc-950" />}</span>
                        <Icon className={`w-4 h-4 shrink-0 ${on ? 'text-yellow-600' : 'text-zinc-500'}`} />
                        <span className="font-bold">{a.name}</span>
                      </span>
                      <span className="font-extrabold text-yellow-600 whitespace-nowrap">{a.price === 0 ? 'ฟรี' : `+${baht(a.price)}`}<span className="text-[9px] text-zinc-500 font-normal block text-right">{a.price ? a.note : ''}</span></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-600">ข้อมูลผู้เช่าพาหนะ</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-zinc-500 block mb-1">ชื่อ - นามสกุลจริง *</label>
                <input className={inputCls} placeholder="เช่น นายสมชาย ภักดี" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
                {err('name')}
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">เบอร์โทรศัพท์ *</label>
                <input className={inputCls} type="tel" inputMode="numeric" placeholder="08xxxxxxxx" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
                {err('phone')}
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">LINE ID (สำหรับติดต่อกลับ)</label>
                <input className={inputCls} autoCapitalize="none" autoCorrect="off" placeholder="เช่น somchai123" value={info.lineId} onChange={(e) => setInfo({ ...info, lineId: e.target.value })} />
                {err('lineId')}
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">เลขบัตรประชาชน / Passport</label>
                <input className={inputCls} placeholder="1100200300400" value={info.idCard} onChange={(e) => setInfo({ ...info, idCard: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">เลขใบขับขี่</label>
                <input className={inputCls} placeholder="ใช้ตรวจสอบวันรับรถ" value={info.license} onChange={(e) => setInfo({ ...info, license: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-zinc-500 block mb-1">หมายเหตุ (เที่ยวบิน / ชื่อโรงแรม)</label>
                <input className={inputCls} placeholder="เช่น เที่ยวบิน FD3201 ถึง 08:40" value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} />
              </div>
            </div>

            {/* Coupon */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1">โค้ดส่วนลด</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className={`${inputCls} pl-9 uppercase font-mono`} placeholder="PUNSO2026" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())} />
                </div>
                {coupon ? (
                  <button type="button" onClick={() => { setCoupon(null); setCouponInput(''); }} className="px-3 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-600">ลบ</button>
                ) : (
                  <button type="button" onClick={applyCoupon} className="px-4 rounded-xl text-xs font-black bg-yellow-400 text-zinc-950 hover:bg-yellow-300">ใช้โค้ด</button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-500"><span>ค่าเช่าพาหนะ ({rentalDays} วัน × {baht(vehicle.pricePerDay)})</span><span>{baht(quote.base)}</span></div>
              {quote.addonLines.filter((l) => l.amount > 0).map((l) => (
                <div key={l.id} className="flex justify-between text-zinc-500"><span className="truncate pr-2">+ {l.name.split('(')[0].trim()} ×{l.qty}</span><span>{baht(l.amount)}</span></div>
              ))}
              {quote.tierDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>ส่วนลด{quote.tier.label}</span><span>-{baht(quote.tierDiscount)}</span></div>}
              {quote.couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>โค้ด {coupon.code} ({coupon.percent}%)</span><span>-{baht(quote.couponDiscount)}</span></div>}
              <div className="border-t border-zinc-200 pt-2 flex justify-between items-center font-bold text-zinc-900">
                <span>รวมยอดชำระทั้งสิ้น</span>
                <span className="text-yellow-600 text-lg font-black">{baht(quote.total)}</span>
              </div>
              <div className="text-[10px] text-zinc-500">* เงินมัดจำ {baht(depositOf(vehicle))} ชำระวันรับรถ และคืนเต็มจำนวนเมื่อคืนรถ</div>
            </div>

            <label className="flex items-start gap-2 text-[11px] text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-yellow-400" />
              <span>ข้าพเจ้ายอมรับเงื่อนไขการเช่า นโยบายยกเลิกฟรีก่อน 48 ชม. และยินยอมให้เก็บข้อมูลส่วนบุคคลตาม PDPA เพื่อการให้บริการ</span>
            </label>
            {err('agree')}

            <button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-zinc-800 hover:to-zinc-800 disabled:opacity-60 text-yellow-300 font-extrabold py-3.5 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 border border-yellow-400/30">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4 text-yellow-600" />} {busy ? 'กำลังจองคิวรถ…' : 'ยืนยันการจอง & ไปหน้าชำระเงิน PromptPay'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="text-center space-y-3">
              <div className={`relative bg-white p-5 rounded-3xl border-4 border-zinc-900 inline-block shadow-2xl ${expired ? 'opacity-30' : ''}`}>
                <div className="bg-[#0e3a5c] text-white text-[11px] font-black tracking-wider rounded-xl py-1.5 mb-3">THAI QR PAYMENT • พร้อมเพย์</div>
                <QRCodeSVG value={payload} size={208} level="M" includeMargin={false} />
                <div className="mt-3 text-zinc-950 font-black text-lg">{baht(amount)}</div>
              </div>
              <div className={`flex items-center justify-center gap-2 text-xs font-bold ${expired ? 'text-rose-600' : remaining < 120000 ? 'text-amber-600' : 'text-zinc-600'}`}>
                <Timer className="w-4 h-4" />
                {expired ? 'QR Code หมดอายุแล้ว' : `กรุณาชำระภายใน ${mm}:${ss} นาที`}
              </div>
              {expired && (
                <button onClick={() => setDeadline(Date.now() + settings.paymentWindowMin * 60000)} className="text-xs font-bold text-yellow-600 inline-flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> สร้าง QR Code ใหม่
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 text-xs space-y-2">
                <div className="flex justify-between gap-3 border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 shrink-0">บัญชีรับชำระ</span>
                  <span className="text-zinc-900 font-bold text-right">{settings.accountName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500">พร้อมเพย์</span>
                  <button onClick={() => copy(settings.promptPayId, 'คัดลอกหมายเลขพร้อมเพย์แล้ว')} className="text-yellow-600 font-mono font-bold flex items-center gap-1.5">
                    {settings.promptPayId} <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between pt-1 font-bold text-zinc-900">
                  <span>ยอดโอนชำระเงิน</span>
                  <span className="text-yellow-600 text-base font-black">{baht(amount)}</span>
                </div>
                {result && <div className="text-[10px] text-zinc-500">รหัสจอง <span className="font-mono text-yellow-600">{result.id}</span> — จองคิวรถไว้ให้แล้ว รอชำระเงิน</div>}
              </div>
              {result && result.totalPrice !== quote.total && (
                <div className="text-[11px] text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">ยอดชำระถูกปรับตามราคาล่าสุดของร้าน กรุณาโอนตามยอดนี้</div>
              )}

              <ol className="text-[11px] text-zinc-500 space-y-1 list-decimal list-inside">
                <li>เปิดแอปธนาคาร เลือก “สแกนจ่าย”</li>
                <li>สแกน QR Code ยอดเงินจะขึ้นอัตโนมัติ</li>
                <li>บันทึกสลิปแล้วแนบด้านล่างเพื่อให้ทีมงานตรวจสอบ</li>
              </ol>

              <label className={`block border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${slip ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-300 hover:border-yellow-400/60'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={onSlip} />
                {slip ? (
                  <div className="flex items-center gap-3 text-left">
                    <img src={slip} alt="สลิป" className="w-14 h-20 object-cover rounded-lg border border-zinc-300" />
                    <div className="text-xs">
                      <div className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> แนบสลิปแล้ว</div>
                      <div className="text-zinc-500">แตะเพื่อเปลี่ยนรูป</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 space-y-1">
                    <Upload className="w-6 h-6 mx-auto text-yellow-600" />
                    <div className="font-bold text-zinc-700">แนบสลิปการโอนเงิน</div>
                    <div className="text-[10px]">รองรับ JPG / PNG — ช่วยให้อนุมัติไวขึ้น</div>
                  </div>
                )}
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={finalize}
                  className="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {slip ? 'ส่งสลิปให้ร้านตรวจสอบ' : 'ชำระแล้ว (แนบสลิปภายหลัง)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && result && (
        <div className="p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 no-print">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="no-print">
            <h4 className="text-2xl font-black text-zinc-900">ได้รับคำขอจองของคุณแล้ว!</h4>
            <p className="text-xs text-zinc-500 mt-1">ทีมงานจะตรวจสอบการชำระเงินและยืนยันทาง SMS/LINE ภายใน 5 นาที</p>
            <button onClick={() => copy(result.id, 'คัดลอกรหัสจองแล้ว')} className="mt-2 inline-flex items-center gap-1.5 font-mono text-yellow-600 font-bold text-sm bg-white border border-zinc-200 px-3 py-1 rounded-lg">
              {result.id} <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div id="print-receipt" className="bg-white border border-zinc-200 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <span className="font-black text-zinc-900 text-sm">PUNSO CAR RENTAL — ใบยืนยันการจอง</span>
              <span className="font-mono text-yellow-600">{result.id}</span>
            </div>
            {[
              ['รุ่นพาหนะ', result.vehicleName],
              ['ชื่อผู้เช่า', result.customerName],
              ['เบอร์โทรศัพท์', result.phone],
              ...(result.lineId ? [['LINE ID', result.lineId]] : []),
              ['จุดรับ-คืนรถ', result.pickupLocation],
              ['รับรถ', `${formatThaiDate(result.startDate)} ${result.pickupTime}`],
              ['คืนรถ', `${formatThaiDate(result.endDate)} ${result.returnTime} (${result.totalDays} วัน)`],
              ['ส่วนลด', result.discount ? `-${baht(result.discount)}` : '-'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 shrink-0">{k}</span>
                <span className="text-zinc-800 font-medium text-right">{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500">ยอดชำระทั้งสิ้น</span>
              <span className="text-yellow-600 text-base font-bold">{baht(result.totalPrice)}</span>
            </div>
            <div className="text-[10px] text-zinc-500 pt-1">สถานะ: รอตรวจสอบการชำระเงิน • ติดต่อ {settings.storePhone}</div>
          </div>

          {!result.hasSlip && (
            <div className="max-w-md mx-auto text-[11px] text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex gap-2 text-left no-print">
              <AlertTriangle className="w-4 h-4 shrink-0" /> ยังไม่ได้แนบสลิป — สามารถแนบได้ที่หน้า “ตรวจสถานะการจอง” หรือส่งทาง LINE {lineLabel(settings.lineOaId)}
            </div>
          )}

          <div className="max-w-md mx-auto text-left bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3 no-print">
            <div className="text-sm font-black text-emerald-600 flex items-center gap-2"><MessageCircle className="w-4 h-4" /> ขั้นตอนต่อไป: ส่งเอกสารทาง LINE</div>
            <p className="text-[11px] text-zinc-600">กรุณาส่งรูปเอกสารต่อไปนี้ทาง LINE <b className="text-emerald-600">{lineLabel(settings.lineOaId)}</b> พร้อมรายละเอียดการจอง เพื่อให้ทีมงานยืนยันได้รวดเร็ว</p>
            <ul className="text-[11px] text-zinc-700 space-y-1">
              <li>✅ บัตรประชาชน / Passport ของผู้เช่า</li>
              <li>✅ ใบขับขี่ที่ยังไม่หมดอายุ</li>
              {!result.hasSlip && <li>✅ สลิปการโอนเงิน</li>}
            </ul>
            <div className="flex flex-wrap gap-2">
              {lineChatUrl(settings.lineOaId) && (
                <a
                  href={lineMessageUrl(settings.lineOaId, bookingLineText(result)) || lineChatUrl(settings.lineOaId)}
                  onClick={() => !lineMessageUrl(settings.lineOaId, '') && copy(bookingLineText(result), 'คัดลอกรายละเอียดการจองแล้ว — วางในแชต LINE ได้เลย')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[180px] text-center px-4 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" /> ส่งรายละเอียดการจองทาง LINE
                </a>
              )}
              <button onClick={() => copy(bookingLineText(result), 'คัดลอกรายละเอียดการจองแล้ว')} className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Copy className="w-4 h-4" /> คัดลอก
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">{lineMessageUrl(settings.lineOaId, '') ? 'กดปุ่มแล้ว LINE จะเปิดพร้อมข้อความการจอง จากนั้นแนบรูปเอกสารแล้วกดส่ง' : 'กดปุ่มแล้วระบบจะคัดลอกรายละเอียดการจองให้ และเปิด LINE ของร้าน — กด "วาง" ในแชต แนบรูปเอกสาร แล้วกดส่ง'}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 no-print">
            <button onClick={() => window.print()} className="px-5 py-3 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
            </button>
            <button onClick={onGoTracker} className="px-5 py-3 bg-zinc-900 text-yellow-300 hover:bg-zinc-800 rounded-xl text-xs font-bold shadow-lg border border-yellow-400/30 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> ติดตามสถานะการจอง
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

