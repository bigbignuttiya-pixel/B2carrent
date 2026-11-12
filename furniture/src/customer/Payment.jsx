import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { buildPromptPayPayload, isValidPromptPayId } from '../lib/promptpay';
import { compressImage } from '../lib/image';
import { baht } from '../data';
import { btnPrimary, Spinner } from '../components/ui';

// PromptPay QR for an order + slip upload. Used after checkout and from the order tracker.
export default function Payment({ order, settings, onSlip }) {
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
      await onSlip(await compressImage(file, 1400, 0.8));
    } catch (err) {
      setError(err.message === 'not-image' || err.message === 'decode-failed' ? 'กรุณาเลือกไฟล์รูปภาพ' : err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!canPay) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        ร้านจะติดต่อกลับเพื่อแจ้งช่องทางชำระเงินยอด <b>{baht(order.total)}</b> ภายในเวลาทำการ
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 p-5 text-center space-y-3">
      <p className="text-sm text-stone-600">สแกนจ่ายด้วยแอปธนาคาร (PromptPay)</p>
      <div className="inline-block bg-white p-3 rounded-xl border border-stone-200">
        <QRCodeSVG value={buildPromptPayPayload(settings.promptPayId, order.total)} size={200} />
      </div>
      <p className="text-2xl font-semibold">{baht(order.total)}</p>
      {settings.accountName && <p className="text-sm text-stone-500">ชื่อบัญชี: {settings.accountName}</p>}
      {order.hasSlip ? (
        <p className="inline-flex items-center gap-1.5 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5" /> ได้รับสลิปแล้ว ร้านจะตรวจสอบและยืนยันคำสั่งซื้อ
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
