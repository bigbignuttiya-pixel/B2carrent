import { useState } from 'react';
import { KeyRound, LogOut, PencilRuler, RefreshCw, ShieldCheck, Clock } from 'lucide-react';
import { baht, daysLabel, formatCode } from '../data';
import { inputCls, btnPrimary, btnGhost, btnAccent, StatusBadge, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import AccessCard from '../components/AccessCard';
import Payment from './Payment';
import ClaimStatus from './ClaimStatus';

export function CodeLogin({ onSession, onBuy }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSession(code, true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="max-w-md mx-auto rounded-3xl bg-white border border-stone-200 p-8 space-y-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white grid place-items-center mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-semibold">เข้าใช้งานด้วยรหัส</h1>
        <p className="text-sm text-stone-500">ใส่รหัส 10 หลักที่ได้รับหลังชำระเงิน หรือสแกน QR เข้าใช้งานด้วยกล้องมือถือ</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input className={`${inputCls} text-center font-mono tracking-[0.2em] uppercase text-lg`} required placeholder="XXXXX-XXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className={`${btnPrimary} w-full py-3`}>
          {busy && <Spinner className="w-4 h-4" />} เข้าใช้งาน
        </button>
      </form>
      <p className="text-center text-sm text-stone-500">
        ยังไม่มีรหัส?{' '}
        <button onClick={onBuy} className="text-amber-700 underline">
          ซื้อแพ็กเกจ
        </button>
      </p>
    </div>
  );
}

export default function Account({ session, settings, claims, onSession, onSignOut, onBuy, onForgetClaim, notify }) {
  const [refreshing, setRefreshing] = useState(false);
  if (!session)
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        {claims.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">รายการชำระเงินบนเครื่องนี้</h2>
            {claims.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white border border-stone-200 p-5">
                <ClaimStatus claim={c} settings={settings} notify={notify} compact onApproved={(code) => onSession(code)} />
                <button onClick={() => onForgetClaim(c.id)} className="mt-3 text-xs text-stone-400 hover:text-stone-600">
                  ซ่อนรายการนี้
                </button>
              </div>
            ))}
          </section>
        )}
        <CodeLogin onSession={onSession} onBuy={() => onBuy()} />
      </main>
    );

  const { account, payments, projectCount } = session;
  const pending = payments.filter((p) => p.status === 'Pending');

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onSession(session.code);
    } finally {
      setRefreshing(false);
    }
  };
  const attach = (pay) => async (dataUrl) => {
    try {
      await api.attachSlip(session.code, pay.id, dataUrl);
      const v = await api.verifySlip({ id: pay.id, code: session.code });
      await onSession(session.code);
      notify(v?.result === 'approved' ? 'ตรวจสลิปผ่าน — อนุมัติอัตโนมัติแล้ว' : 'แนบสลิปเรียบร้อย');
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">บัญชีของฉัน</h1>
        <button onClick={refresh} className={`${btnGhost} py-2`} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> อัปเดตสถานะ
        </button>
      </div>

      <section className="grid sm:grid-cols-2 gap-4">
        <AccessCard code={session.code} expiresAt={account.active ? account.expiresAt : null} />
        <div className={`rounded-2xl border p-4 ${account.active ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <p className="font-medium flex items-center gap-1.5">
            {account.active ? <ShieldCheck className="w-5 h-5 text-emerald-700" /> : <Clock className="w-5 h-5 text-amber-700" />}
            {account.active ? 'ใช้งานได้' : account.expiresAt ? 'หมดอายุแล้ว' : 'รอยืนยันการชำระเงิน'}
          </p>
          {account.expiresAt && <p className="text-sm mt-1">{account.active ? 'ใช้ได้ถึง' : 'หมดอายุเมื่อ'} {account.expiresAt} น.</p>}
          <p className="text-sm text-stone-600 mt-1">
            {account.name} · {account.phone} · แบบที่บันทึก {projectCount} แบบ
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href="#studio" className={`${btnPrimary} py-2`}>
              <PencilRuler className="w-4 h-4" /> ออกแบบเฟอร์นิเจอร์
            </a>
            <a href="#design" className={`${btnGhost} py-2`}>
              จัดห้อง
            </a>
            <button onClick={() => onBuy()} className={`${btnAccent} py-2`}>
              {account.active ? 'ซื้อเพิ่มวัน' : 'ซื้อแพ็กเกจ'}
            </button>
          </div>
        </div>
      </section>

      {pending.map((p) => (
        <section key={p.id} className="rounded-2xl bg-white border border-stone-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              รอชำระ {p.id} · {p.planName} ({daysLabel(p.days)})
            </p>
            <StatusBadge status={p.status} />
          </div>
          <Payment payment={p} settings={settings} onSlip={attach(p)} />
        </section>
      ))}

      <section className="rounded-2xl bg-white border border-stone-200 p-5">
        <h2 className="font-semibold mb-3">ประวัติการชำระเงิน</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-stone-500">ยังไม่มีรายการ</p>
        ) : (
          <ul className="divide-y divide-stone-100 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="py-2.5 flex items-center gap-3">
                <span className="w-28 font-medium">{p.id}</span>
                <span className="flex-1 text-stone-600">
                  {p.planName} · {p.createdAt}
                </span>
                <span>{baht(p.amount)}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={onSignOut} className={`${btnGhost} text-stone-600`}>
        <LogOut className="w-4 h-4" /> ออกจากระบบบนเครื่องนี้
      </button>
      <p className="text-xs text-stone-500">รหัส {formatCode(session.code)} ใช้เข้าได้จากทุกเครื่อง แบบที่บันทึกไว้จะตามไปด้วย</p>
    </main>
  );
}
