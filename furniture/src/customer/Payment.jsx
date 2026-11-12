import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { buildPromptPayPayload, isValidPromptPayId } from '../lib/promptpay';
import { compressImage } from '../lib/image';
import { baht } from '../data';
import { btnPrimary, Spinner } from '../components/ui';

// PromptPay QR for a pending payment + slip upload
export default function Payment({ payment, settings, onSlip }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canPay = isValidPromptPayId(settings.promptPayId);

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
