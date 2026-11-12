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
  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (s.promptPayId && !isValidPromptPayId(s.promptPayId)) return notify('หมายเลข PromptPay ไม่ถูกต้อง (เบอร์มือถือ 10 หลัก หรือเลขบัตร/ภาษี 13 หลัก)', 'error');
    setBusy(true);
    try {
      await api.saveSettings(s);
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
        <h3 className="font-semibold">ข้อมูลเว็บ</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ชื่อเว็บ / ร้าน">
            <input className={inputCls} required value={s.shopName} onChange={set('shopName')} />
          </Field>
          <Field label="เบอร์โทร">
            <input className={inputCls} value={s.phone} onChange={set('phone')} />
          </Field>
          <Field label="LINE OA" hint="เช่น @myshop หรือลิงก์เพิ่มเพื่อน https://line.me/…">
            <input className={inputCls} value={s.lineOaId} onChange={set('lineOaId')} />
          </Field>
          <Field label="ลิงก์ Facebook">
            <input className={inputCls} value={s.facebookUrl} onChange={set('facebookUrl')} />
          </Field>
          <Field label="เวลาทำการ (ตรวจสลิป)">
            <input className={inputCls} value={s.openHours} onChange={set('openHours')} />
          </Field>
        </div>
        <Field label="ข้อความหน้าแรก">
          <input className={inputCls} value={s.tagline} onChange={set('tagline')} />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={s.allowTrial} onChange={set('allowTrial')} className="w-4 h-4 mt-0.5 accent-stone-900" />
          <span>
            เปิดโหมดทดลองใช้
            <span className="block text-xs text-stone-500">ผู้ที่ยังไม่ซื้อแพ็กเกจใช้หน้าออกแบบได้ แต่บันทึกและส่งออกรูปไม่ได้ — ถ้าปิด ต้องมีรหัสที่ใช้งานอยู่จึงจะเข้าหน้าออกแบบได้</span>
          </span>
        </label>
      </section>

      <section className={section}>
        <h3 className="font-semibold">รับชำระเงิน (PromptPay)</h3>
        <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-4">
            <Field label="หมายเลข PromptPay" hint="ถ้าเว้นว่าง ลูกค้าจะไม่เห็น QR และร้านต้องแจ้งช่องทางชำระเอง">
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

      <button disabled={busy} className={`${btnPrimary} px-6`}>
        {busy && <Spinner className="w-4 h-4" />} บันทึกการตั้งค่า
      </button>
    </form>
  );
}
