import { useCallback, useEffect, useState } from 'react';
import { Clock, XCircle, PencilRuler, MessageCircle } from 'lucide-react';
import { baht, daysLabel } from '../data';
import { btnPrimary, btnAccent, StatusBadge, Spinner } from '../components/ui';
import AccessCard from '../components/AccessCard';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { lineChatUrl, lineMessageUrl } from '../lib/line';
import Payment from './Payment';

const paymentMessage = (shopName, pay) =>
  [`สวัสดีค่ะ ${shopName}`, 'แจ้งชำระค่าบริการใช้งานเว็บออกแบบ', `เลขที่: ${pay.id}`, `แพ็กเกจ: ${pay.planName} (${daysLabel(pay.days)})`, `ยอด: ${baht(pay.amount)}`, 'แนบสลิปในเว็บแล้ว รบกวนตรวจสอบค่ะ'].join('\n');

// One purchase, followed with its claim token: pay → wait for approval → receive the access code + QR
export default function ClaimStatus({ claim, settings, notify, onApproved, initial, compact = false }) {
  const [data, setData] = useState(initial || null); // { payment, code, expiresAt }
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api.claim(claim.id, claim.token);
      setData(d);
      setError('');
      return d;
    } catch (err) {
      setError(errorMessage(err));
      return null;
    }
  }, [claim.id, claim.token]);

  useEffect(() => {
    if (!initial) load();
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check every 10 s until the shop approves or rejects
  const status = data?.payment.status;
  useEffect(() => {
    if (status !== 'Pending') return undefined;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [status, load]);

  useEffect(() => {
    if (data?.code) onApproved?.(data.code);
  }, [data?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const slip = async (dataUrl) => {
    try {
      const payment = await api.claimSlip(claim.id, claim.token, dataUrl);
      setData((d) => ({ ...d, payment }));
      const v = await api.verifySlip({ id: claim.id, token: claim.token });
      if (v?.result === 'approved') {
        await load();
        notify('ตรวจสลิปผ่าน — อนุมัติอัตโนมัติแล้ว');
      } else if (v?.result === 'verified') notify('ตรวจสลิปผ่านแล้ว รอร้านกดยืนยัน');
      else if (v?.result === 'review') notify('แนบสลิปเรียบร้อย ร้านจะตรวจสอบให้อีกครั้ง', 'info');
      else notify('แนบสลิปเรียบร้อย รอร้านยืนยัน');
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  };

  if (error && !data) return <p className="text-sm text-rose-600">{claim.id}: {error}</p>;
  if (!data)
    return (
      <div className="py-8 grid place-items-center text-stone-400">
        <Spinner />
      </div>
    );

  const pay = data.payment;
  const lineSend = lineMessageUrl(settings.lineOaId, paymentMessage(settings.shopName, pay)) || lineChatUrl(settings.lineOaId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          <b>{pay.id}</b> · {pay.planName}{pay.planName.includes(String(pay.days)) ? "" : ` (${daysLabel(pay.days)})`} · {baht(pay.amount)}
        </span>
        <StatusBadge status={pay.status} />
      </div>

      {pay.status === 'Approved' && data.code ? (
        <div className="space-y-3">
          <p className="text-sm text-emerald-700 font-medium">ชำระเงินเรียบร้อย — นี่คือรหัสสำหรับเข้าใช้งาน</p>
          <AccessCard code={data.code} expiresAt={data.expiresAt} compact={compact} />
          <a href="#studio" className={`${btnPrimary} w-full py-3`}>
            <PencilRuler className="w-4 h-4" /> เริ่มออกแบบ
          </a>
        </div>
      ) : pay.status === 'Rejected' ? (
        <p className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 p-3 text-sm flex gap-2">
          <XCircle className="w-5 h-5 shrink-0" /> ร้านไม่สามารถยืนยันการชำระเงินรายการนี้ได้ กรุณาติดต่อร้าน
        </p>
      ) : (
        <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
          <Payment payment={pay} settings={settings} onSlip={slip} />
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-3">
            <p className="font-medium flex items-center gap-1.5">
              <Clock className="w-5 h-5" /> {pay.hasSlip ? 'รอร้านยืนยันการชำระเงิน' : 'รอชำระเงิน'}
            </p>
            <p>เมื่อร้านยืนยันแล้ว <b>รหัสเข้าใช้งานและ QR สำหรับสแกน</b> จะแสดงที่นี่อัตโนมัติ</p>
            <p className="text-xs">ปิดหน้านี้ได้ กลับมาดูได้ที่เมนู "เข้าใช้งาน" บนเครื่องนี้{settings.openHours ? ` · ตรวจสลิป ${settings.openHours}` : ''}</p>
            {lineSend && (
              <a href={lineSend} target="_blank" rel="noreferrer" className={`${btnAccent} w-full bg-[#06C755] hover:bg-[#05b14c]`}>
                <MessageCircle className="w-4 h-4" /> แจ้งร้านทาง LINE
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
