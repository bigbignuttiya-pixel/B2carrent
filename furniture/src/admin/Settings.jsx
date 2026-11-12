import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Field, inputCls, btnPrimary, Spinner } from '../components/ui';
import { buildPromptPayPayload, isValidPromptPayId } from '../lib/promptpay';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

export default function Settings({ settings, onSaved, notify }) {
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  useEffect(() => setS(settings), [settings]);
  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (s.promptPayId && !isValidPromptPayId(s.promptPayId)) return notify('หมายเลข PromptPay ไม่ถูกต้อง (เบอร์มือถือ 10 หลัก หรือเลขบัตร/ภาษี 13 หลัก)', 'error');
    setBusy(true);
    try {
      const data = { ...s, shippingFee: Math.max(0, Math.round(Number(s.shippingFee) || 0)), freeShippingMin: Math.max(0, Math.round(Number(s.freeShippingMin) || 0)) };
      await api.saveSettings(data);
      notify('บันทึกการตั้งค่าแล้ว');
      onSaved();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const section = 'rounded-2xl bg-white border border-stone-200 p-5 space-y-4';
  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <section className={section}>
        <h3 className="font-semibold">ข้อมูลร้าน</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ชื่อร้าน">
            <input className={inputCls} required value={s.shopName} onChange={set('shopName')} />
          </Field>
          <Field label="เบอร์โทรร้าน">
            <input className={inputCls} value={s.phone} onChange={set('phone')} />
          </Field>
          <Field label="LINE OA" hint="เช่น @myshop หรือลิงก์เพิ่มเพื่อน https://line.me/…">
            <input className={inputCls} value={s.lineOaId} onChange={set('lineOaId')} />
          </Field>
          <Field label="ลิงก์ Facebook">
            <input className={inputCls} value={s.facebookUrl} onChange={set('facebookUrl')} />
          </Field>
          <Field label="เวลาทำการ">
            <input className={inputCls} value={s.openHours} onChange={set('openHours')} />
          </Field>
        </div>
        <Field label="ข้อความหน้าแรก">
          <input className={inputCls} value={s.tagline} onChange={set('tagline')} />
        </Field>
        <Field label="ที่อยู่ร้าน">
          <textarea className={inputCls} rows={2} value={s.address} onChange={set('address')} />
        </Field>
      </section>

      <section className={section}>
        <h3 className="font-semibold">การชำระเงิน (PromptPay)</h3>
        <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-4">
            <Field label="หมายเลข PromptPay" hint="ถ้าเว้นว่าง ลูกค้าจะเห็นข้อความว่าร้านจะติดต่อกลับเรื่องการชำระเงิน">
              <input className={inputCls} inputMode="numeric" value={s.promptPayId} onChange={set('promptPayId')} />
            </Field>
            <Field label="ชื่อบัญชี">
              <input className={inputCls} value={s.accountName} onChange={set('accountName')} />
            </Field>
          </div>
          {isValidPromptPayId(s.promptPayId) && (
            <div className="text-center">
              <div className="inline-block p-2 border border-stone-200 rounded-xl">
                <QRCodeSVG value={buildPromptPayPayload(s.promptPayId, 1)} size={120} />
              </div>
              <p className="text-xs text-stone-500 mt-1">ทดลองสแกน (1 บาท)</p>
            </div>
          )}
        </div>
      </section>

      <section className={section}>
        <h3 className="font-semibold">การจัดส่ง</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ค่าจัดส่ง (บาท / คำสั่งซื้อ)">
            <input className={inputCls} type="number" min="0" value={s.shippingFee} onChange={set('shippingFee')} />
          </Field>
          <Field label="ส่งฟรีเมื่อซื้อครบ (บาท)" hint="ใส่ 0 ถ้าไม่มีส่งฟรี">
            <input className={inputCls} type="number" min="0" value={s.freeShippingMin} onChange={set('freeShippingMin')} />
          </Field>
        </div>
        <Field label="ข้อความเรื่องการจัดส่ง">
          <input className={inputCls} value={s.shippingNote} onChange={set('shippingNote')} />
        </Field>
      </section>

      <button disabled={busy} className={`${btnPrimary} px-6`}>
        {busy && <Spinner className="w-4 h-4" />} บันทึกการตั้งค่า
      </button>
    </form>
  );
}
