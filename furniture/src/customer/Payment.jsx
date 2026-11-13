import { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Upload, CheckCircle2, Download, Smartphone } from 'lucide-react';
import { buildPromptPayPayload, isValidPromptPayId } from '../lib/promptpay';
import { compressImage } from '../lib/image';
import { baht } from '../data';
import { btnPrimary, Spinner } from '../components/ui';

// Shortcuts that open common Thai bank apps (only works when the app is installed on this phone)
const BANK_APPS = [
  ['K PLUS', 'kbank.kplus://', '#138f2d'],
  ['SCB EASY', 'scbeasy://', '#4e2a84'],
  ['Krungthai NEXT', 'ktbnext://', '#1ba5e1'],
];

// PromptPay QR for a pending payment + slip upload
export default function Payment({ payment, settings, onSlip }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canPay = isValidPromptPayId(settings.promptPayId);
  const canvasRef = useRef(null);
  // Save the QR as an image, then scan it from the gallery inside any bank app
  const saveQr = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `promptpay-${payment.id}-${payment.amount}baht.png`;
    a.click();
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onSlip(await compressImage(file));
    } catch (err) {
      setError(err.message === 'not-image' || err.message === 'decode-failed' ? 'กรุณาเลือกไฟล์รูปภาพ' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 p-5 text-center space-y-3">
      {canPay ? (
        <>
          <p className="text-sm text-stone-600">สแกนจ่ายด้วยแอปธนาคาร (PromptPay)</p>
          <div className="inline-block bg-white p-3 rounded-xl border border-stone-200">
            <QRCodeSVG value={buildPromptPayPayload(settings.promptPayId, payment.amount)} size={190} />
          </div>
          <p className="text-2xl font-semibold">{baht(payment.amount)}</p>
          {settings.accountName && <p className="text-sm text-stone-500">ชื่อบัญชี: {settings.accountName}</p>}
          <div className="hidden">
            <QRCodeCanvas ref={canvasRef} value={buildPromptPayPayload(settings.promptPayId, payment.amount)} size={600} marginSize={4} />
          </div>
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-left space-y-2">
            <p className="text-xs font-medium text-stone-700 flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> จ่ายบนมือถือเครื่องเดียวกัน</p>
            <ol className="text-xs text-stone-500 list-decimal pl-4 space-y-0.5">
              <li>กด "บันทึก QR" รูปจะเก็บไว้ในเครื่อง</li>
              <li>เปิดแอปธนาคาร → สแกน → เลือกรูปจากคลังภาพ</li>
              <li>โอนเสร็จแล้วกลับมากด "แนบสลิปการโอน"</li>
            </ol>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={saveQr} className="inline-flex items-center gap-1 rounded-lg bg-stone-900 text-white px-3 py-1.5 text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> บันทึก QR
              </button>
              {BANK_APPS.map(([name, url, color]) => (
                <a key={name} href={url} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ background: color }}>
                  {name}
                </a>
              ))}
            </div>
            <p className="text-[11px] text-stone-400">ปุ่มแอปธนาคารเปิดได้เมื่อมีแอปนั้นในมือถือ · ธนาคารอื่นเปิดแอปเองได้ตามปกติ</p>
          </div>
        </>
      ) : (
        <p className="text-sm text-amber-900 bg-amber-50 rounded-xl p-3">
          ยอดชำระ <b>{baht(payment.amount)}</b> — ร้านจะแจ้งช่องทางชำระเงินให้ทาง LINE / โทรศัพท์
        </p>
      )}
      {payment.hasSlip ? (
        <p className="inline-flex items-center gap-1.5 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5" /> ได้รับสลิปแล้ว รอร้านยืนยัน (ปกติไม่เกิน 1 ชั่วโมงในเวลาทำการ)
        </p>
      ) : (
        <label className={`${btnPrimary} cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
          {busy ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />} แนบสลิปการโอน
          <input type="file" accept="image/*" className="hidden" onChange={pick} />
        </label>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
