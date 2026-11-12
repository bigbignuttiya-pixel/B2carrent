import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, KeyRound } from 'lucide-react';
import { baht, daysLabel, formatCode } from '../data';
import { Modal, ModalHeader, Field, inputCls, btnAccent, btnGhost, btnPrimary, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { lineChatUrl, lineMessageUrl } from '../lib/line';
import Payment from './Payment';

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
      <p className="text-sm text-stone-500">ใช้งานได้ {daysLabel(plan.days)}</p>
      {plan.description && <p className="text-sm text-stone-600 mt-2">{plan.description}</p>}
      {cta && <span className={`${btnPrimary} w-full mt-4`}>{cta}</span>}
    </button>
  );
}

export function CodeBox({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="rounded-2xl bg-stone-900 text-white p-4 text-center">
      <p className="text-xs text-stone-300">รหัสเข้าใช้งานของคุณ — จดหรือแคปหน้าจอเก็บไว้</p>
      <p className="text-2xl sm:text-3xl font-semibold tracking-[0.2em] my-1 font-mono">{formatCode(code)}</p>
      <button onClick={copy} className="text-xs inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
        <Copy className="w-3.5 h-3.5" /> {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
      </button>
    </div>
  );
}

const paymentMessage = (shopName, code, pay, name) =>
  [`สวัสดีค่ะ ${shopName}`, `แจ้งชำระค่าบริการออกแบบ`, `เลขที่: ${pay.id}`, `แพ็กเกจ: ${pay.planName} (${daysLabel(pay.days)})`, `ยอด: ${baht(pay.amount)}`, `ชื่อ: ${name || '-'}`, `รหัสเข้าใช้งาน: ${formatCode(code)}`].join('\n');

export default function BuyModal({ open, plans, settings, session, initialPlanId, reason, onClose, onSession, notify }) {
  const [planId, setPlanId] = useState(initialPlanId);
  const [form, setForm] = useState({ name: '', phone: '', lineId: '' });
  const [loginCode, setLoginCode] = useState('');
  const [mode, setMode] = useState('new'); // new | login
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { code, payment, name }

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
      if (session) {
        const payment = await api.buy(session.code, plan.id);
        setResult({ code: session.code, payment, name: session.account.name });
        onSession(session.code);
      } else if (mode === 'login') {
        const payment = await api.buy(loginCode, plan.id);
        const acc = await api.account(loginCode);
        setResult({ code: acc.account.code, payment, name: acc.account.name });
        onSession(acc.account.code);
      } else {
        const r = await api.start({ ...form, planId: plan.id });
        setResult({ code: r.account.code, payment: r.payment, name: r.account.name });
        onSession(r.account.code);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const attachSlip = async (dataUrl) => {
    try {
      const payment = await api.attachSlip(result.code, result.payment.id, dataUrl);
      setResult((r) => ({ ...r, payment }));
      onSession(result.code);
      notify('แนบสลิปเรียบร้อย');
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  };

  const lineSend = result && (lineMessageUrl(settings.lineOaId, paymentMessage(settings.shopName, result.code, result.payment, result.name)) || lineChatUrl(settings.lineOaId));

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader title={result ? 'ชำระค่าบริการ' : 'เลือกแพ็กเกจ'} onClose={onClose} />
      {result ? (
        <div className="p-5 grid md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <CodeBox code={result.code} />
            <div className="text-sm text-stone-600 space-y-1">
              <p>เลขที่รายการ: <b>{result.payment.id}</b></p>
              <p>แพ็กเกจ: {result.payment.planName} ({daysLabel(result.payment.days)})</p>
              <p className="pt-2">เมื่อร้านยืนยันการชำระเงินแล้ว รหัสนี้จะใช้บันทึกและส่งออกแบบได้ทันที ระหว่างนี้เริ่มออกแบบในโหมดทดลองได้เลย</p>
            </div>
            <div className="flex flex-col gap-2">
              {lineSend && (
                <a href={lineSend} target="_blank" rel="noreferrer" className={`${btnAccent} bg-[#06C755] hover:bg-[#05b14c]`}>
                  <MessageCircle className="w-4 h-4" /> แจ้งชำระเงินทาง LINE
                </a>
              )}
              <a href="#design" onClick={onClose} className={btnGhost}>
                ไปหน้าออกแบบ
              </a>
            </div>
          </div>
          <Payment payment={result.payment} settings={settings} onSlip={attachSlip} />
        </div>
      ) : (
        <form onSubmit={submit} className="p-5 space-y-5">
          {reason && <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">การ{reason} ต้องมีแพ็กเกจที่ใช้งานอยู่</p>}
          <div className="grid sm:grid-cols-3 gap-3">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={p.id === planId} onClick={() => setPlanId(p.id)} />
            ))}
          </div>
          {plans.length === 0 && <p className="text-center text-stone-500">ยังไม่มีแพ็กเกจให้เลือก</p>}

          {session ? (
            <p className="text-sm text-stone-600">
              ต่ออายุให้รหัส <b className="font-mono">{formatCode(session.code)}</b> ({session.account.name}) — วันใช้งานจะต่อจากวันหมดอายุเดิม
            </p>
          ) : (
            <>
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => setMode('new')} className={`px-3 py-1.5 rounded-full border ${mode === 'new' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300'}`}>
                  ลูกค้าใหม่
                </button>
                <button type="button" onClick={() => setMode('login')} className={`px-3 py-1.5 rounded-full border inline-flex items-center gap-1 ${mode === 'login' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300'}`}>
                  <KeyRound className="w-3.5 h-3.5" /> มีรหัสอยู่แล้ว (ต่ออายุ)
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
