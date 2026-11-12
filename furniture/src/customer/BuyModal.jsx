import { useEffect, useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import { baht, daysLabel, formatCode } from '../data';
import { Modal, ModalHeader, Field, inputCls, btnAccent, btnPrimary, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import ClaimStatus from './ClaimStatus';

export function PlanCard({ plan, selected, onClick, cta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-5 bg-white transition w-full ${selected ? 'border-amber-600 shadow-md' : 'border-stone-200 hover:border-stone-400'}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{plan.name}</p>
        {selected && <Check className="w-5 h-5 text-amber-600" />}
      </div>
      <p className="text-3xl font-semibold mt-2">{baht(plan.price)}</p>
      <p className="text-sm text-stone-500">ใช้งานได้ {daysLabel(plan.days)}{plan.days > 1 ? ` · เฉลี่ยวันละ ${baht(Math.round(plan.price / plan.days))}` : ''}</p>
      {plan.description && <p className="text-sm text-stone-600 mt-2">{plan.description}</p>}
      {cta && <span className={`${btnPrimary} w-full mt-4`}>{cta}</span>}
    </button>
  );
}

export default function BuyModal({ open, plans, settings, session, initialPlanId, reason, onClose, onSession, onClaim, notify }) {
  const [planId, setPlanId] = useState(initialPlanId);
  const [form, setForm] = useState({ name: '', phone: '', lineId: '' });
  const [loginCode, setLoginCode] = useState('');
  const [mode, setMode] = useState('new'); // new | login
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { claim: { id, token }, initial: { payment, code } }

  useEffect(() => {
    if (open) {
      setPlanId(initialPlanId || plans[1]?.id || plans[0]?.id);
      setResult(null);
      setError('');
    }
  }, [open, initialPlanId, plans]);

  const plan = plans.find((p) => p.id === planId);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      const r = session
        ? await api.buy(session.code, plan.id)
        : mode === 'login'
          ? await api.buy(loginCode, plan.id)
          : await api.start({ ...form, planId: plan.id });
      const claim = { id: r.payment.id, token: r.claimToken };
      onClaim(claim);
      setResult({ claim, initial: { payment: r.payment, code: null } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader title={result ? 'ชำระค่าบริการ' : 'เลือกแพ็กเกจ'} onClose={onClose} />
      {result ? (
        <div className="p-5">
          <ClaimStatus
            claim={result.claim}
            initial={result.initial}
            settings={settings}
            notify={notify}
            onApproved={(code) => {
              onSession(code);
              notify('ชำระเงินเรียบร้อย เข้าใช้งานได้แล้ว');
            }}
          />
        </div>
      ) : (
        <form onSubmit={submit} className="p-5 space-y-5">
          {reason && <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">การ{reason} ต้องมีแพ็กเกจที่ใช้งานอยู่</p>}
          <div className={`grid gap-3 ${plans.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={p.id === planId} onClick={() => setPlanId(p.id)} />
            ))}
          </div>
          {plans.length === 0 && <p className="text-center text-stone-500">ยังไม่มีแพ็กเกจให้เลือก</p>}

          {session ? (
            <p className="text-sm text-stone-600">
              ซื้อเพิ่มให้รหัส <b className="font-mono">{formatCode(session.code)}</b> ({session.account.name}) — วันใช้งานจะต่อจากวันหมดอายุเดิม
            </p>
          ) : (
            <>
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => setMode('new')} className={`px-3 py-1.5 rounded-full border ${mode === 'new' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300'}`}>
                  ลูกค้าใหม่
                </button>
                <button type="button" onClick={() => setMode('login')} className={`px-3 py-1.5 rounded-full border inline-flex items-center gap-1 ${mode === 'login' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300'}`}>
                  <KeyRound className="w-3.5 h-3.5" /> มีรหัสอยู่แล้ว (ซื้อเพิ่มวัน)
                </button>
              </div>
              {mode === 'new' ? (
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="ชื่อ *">
                    <input className={inputCls} required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} />
                  </Field>
                  <Field label="เบอร์โทรศัพท์ *">
                    <input className={inputCls} required inputMode="tel" autoComplete="tel" placeholder="0812345678" value={form.phone} onChange={set('phone')} />
                  </Field>
                  <Field label="LINE ID">
                    <input className={inputCls} maxLength={40} value={form.lineId} onChange={set('lineId')} />
                  </Field>
                </div>
              ) : (
                <Field label="รหัสเข้าใช้งาน">
                  <input className={`${inputCls} font-mono tracking-widest uppercase`} required placeholder="XXXXX-XXXXX" value={loginCode} onChange={(e) => setLoginCode(e.target.value)} />
                </Field>
              )}
            </>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
            <p className="text-sm">{plan && <>ยอดชำระ <b className="text-lg">{baht(plan.price)}</b></>}</p>
            <button disabled={busy || !plan} className={`${btnAccent} px-6 py-3`}>
              {busy && <Spinner className="w-4 h-4" />} ดำเนินการชำระเงิน
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
