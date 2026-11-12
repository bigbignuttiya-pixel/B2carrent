import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Phone, MessageCircle } from 'lucide-react';
import { baht, daysLabel, formatCode, PAYMENT_STATUS } from '../data';
import { Modal, ModalHeader, StatusBadge, inputCls, btnPrimary, btnGhost, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { lineChatUrl } from '../lib/line';

export function PaymentDrawer({ payment, onClose, onChanged, notify }) {
  const [slipUrl, setSlipUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setSlipUrl(null);
    if (payment?.hasSlip) api.getSlipUrl(payment).then(setSlipUrl);
  }, [payment?.id, payment?.hasSlip]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!payment) return null;
  const a = payment.account;

  const setStatus = async (status, msg) => {
    setBusy(true);
    try {
      await api.setPaymentStatus(payment.id, status);
      notify(msg);
      onChanged();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader title={`รายการ ${payment.id}`} onClose={onClose} />
      <div className="p-5 grid sm:grid-cols-2 gap-5 text-sm">
        <div className="space-y-2">
          <StatusBadge status={payment.status} />
          <p className="text-2xl font-semibold">{baht(payment.amount)}</p>
          <p>
            {payment.planName} · {daysLabel(payment.days)}
          </p>
          <p className="text-stone-500">สร้างเมื่อ {payment.createdAt}</p>
          {payment.decidedAt && <p className="text-stone-500">ตัดสินเมื่อ {payment.decidedAt}</p>}
          {a && (
            <div className="border-t border-stone-100 pt-3 space-y-1">
              <p className="font-medium">{a.name}</p>
              <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 text-stone-600 hover:underline">
                <Phone className="w-4 h-4" /> {a.phone}
              </a>
              {a.lineId && (
                <a href={lineChatUrl(a.lineId)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-stone-600 hover:underline">
                  <MessageCircle className="w-4 h-4" /> LINE: {a.lineId}
                </a>
              )}
              <p className="text-stone-600">
                รหัส <span className="font-mono">{formatCode(a.code)}</span>
              </p>
              <p className="text-stone-600">{a.active ? `ใช้ได้ถึง ${a.expiresAt}` : a.expiresAt ? `หมดอายุ ${a.expiresAt}` : 'ยังไม่เคยเปิดใช้งาน'}</p>
            </div>
          )}
        </div>
        <div>
          {payment.hasSlip ? (
            slipUrl ? (
              <a href={slipUrl} target="_blank" rel="noreferrer">
                <img src={slipUrl} alt="สลิป" className="max-h-80 rounded-xl border border-stone-200 mx-auto" />
              </a>
            ) : (
              <div className="h-48 grid place-items-center text-stone-400">
                <Spinner />
              </div>
            )
          ) : (
            <p className="h-48 grid place-items-center rounded-xl bg-stone-50 border border-dashed border-stone-300 text-stone-500">ยังไม่มีสลิป</p>
          )}
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          {payment.status !== 'Approved' && (
            <button disabled={busy} onClick={() => setStatus('Approved', `อนุมัติแล้ว — เพิ่มสิทธิ์ ${daysLabel(payment.days)}`)} className={btnPrimary}>
              {busy && <Spinner className="w-4 h-4" />} อนุมัติ (เพิ่มสิทธิ์ {daysLabel(payment.days)})
            </button>
          )}
          {payment.status === 'Pending' && (
            <button disabled={busy} onClick={() => setStatus('Rejected', 'ไม่อนุมัติรายการนี้')} className={`${btnGhost} text-rose-600`}>
              ไม่อนุมัติ
            </button>
          )}
          {payment.status === 'Approved' && (
            <button
              disabled={busy}
              onClick={() => window.confirm(`ยกเลิกการอนุมัติ? สิทธิ์ ${daysLabel(payment.days)} จะถูกหักออก`) && setStatus('Pending', 'ยกเลิกการอนุมัติแล้ว')}
              className={`${btnGhost} text-rose-600`}
            >
              ยกเลิกการอนุมัติ
            </button>
          )}
          {payment.status === 'Rejected' && (
            <button disabled={busy} onClick={() => setStatus('Pending', 'ย้ายกลับไปรอตรวจสอบ')} className={btnGhost}>
              กลับไปรอตรวจสอบ
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function exportCsv(list) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['เลขที่', 'วันที่', 'สถานะ', 'ชื่อ', 'โทร', 'แพ็กเกจ', 'วัน', 'ยอด'],
    ...list.map((p) => [p.id, p.createdAt, PAYMENT_STATUS[p.status]?.short, p.account?.name, p.account?.phone, p.planName, p.days, p.amount]),
  ];
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `furniture-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Payments({ payments, onOpenPayment }) {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/-/g, '');
    return payments.filter(
      (p) => (status === 'all' || p.status === status) && (!s || `${p.id} ${p.account?.name} ${p.account?.phone} ${p.account?.code}`.toLowerCase().replace(/-/g, '').includes(s))
    );
  }, [payments, status, q]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className={`${inputCls} pl-9`} placeholder="ค้นหา เลขที่ / ชื่อ / เบอร์ / รหัส" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-48`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="สถานะ">
          <option value="all">ทุกสถานะ</option>
          {Object.entries(PAYMENT_STATUS).map(([k, m]) => (
            <option key={k} value={k}>
              {m.short}
            </option>
          ))}
        </select>
        <button onClick={() => exportCsv(list)} className={btnGhost}>
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>
      <div className="rounded-2xl bg-white border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">เลขที่</th>
              <th className="px-4 py-3 font-medium">วันที่</th>
              <th className="px-4 py-3 font-medium">ลูกค้า</th>
              <th className="px-4 py-3 font-medium">แพ็กเกจ</th>
              <th className="px-4 py-3 font-medium text-right">ยอด</th>
              <th className="px-4 py-3 font-medium">สลิป</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((p) => (
              <tr key={p.id} onClick={() => onOpenPayment(p.id)} className="cursor-pointer hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{p.id}</td>
                <td className="px-4 py-3 text-stone-500">{p.createdAt}</td>
                <td className="px-4 py-3">
                  {p.account?.name}
                  <span className="block text-xs text-stone-500">{p.account?.phone}</span>
                </td>
                <td className="px-4 py-3">{p.planName}</td>
                <td className="px-4 py-3 text-right">{baht(p.amount)}</td>
                <td className="px-4 py-3">{p.hasSlip ? '✓' : '-'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                  ไม่มีรายการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
