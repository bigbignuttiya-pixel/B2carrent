import { useEffect, useMemo, useState } from 'react';
import { Download, Search, MessageCircle, Phone } from 'lucide-react';
import { baht, ORDER_STATUS, STATUS_FLOW } from '../data';
import { Modal, ModalHeader, StatusBadge, inputCls, btnPrimary, btnGhost, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { lineChatUrl } from '../lib/line';

const NEXT = { Pending: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Completed' };
const NEXT_LABEL = { Pending: 'ยืนยันการชำระเงิน', Confirmed: 'แจ้งจัดส่งแล้ว', Shipped: 'ลูกค้าได้รับแล้ว' };

export function OrderDrawer({ order, onClose, onChanged, notify }) {
  const [slipUrl, setSlipUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(order?.adminNote || '');

  useEffect(() => {
    setSlipUrl(null);
    setNote(order?.adminNote || '');
    if (order?.hasSlip) api.getSlipUrl(order).then(setSlipUrl);
  }, [order?.id, order?.hasSlip]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!order) return null;

  const update = async (patch, msg) => {
    setBusy(true);
    try {
      await api.updateOrder(order.id, patch);
      notify(msg);
      onChanged();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const line = order.lineId ? lineChatUrl(order.lineId) : null;

  return (
    <Modal open onClose={onClose}>
      <ModalHeader title={`คำสั่งซื้อ ${order.id}`} onClose={onClose} />
      <div className="p-5 space-y-5 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-stone-500">{order.createdAt}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-medium">{order.customerName}</p>
            <a href={`tel:${order.phone}`} className="flex items-center gap-1.5 text-stone-600 hover:underline">
              <Phone className="w-4 h-4" /> {order.phone}
            </a>
            {order.lineId && (
              <a href={line} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-stone-600 hover:underline">
                <MessageCircle className="w-4 h-4" /> LINE: {order.lineId}
              </a>
            )}
            <p className="text-stone-600 whitespace-pre-line">{order.address}</p>
            {order.note && <p className="text-amber-800 bg-amber-50 rounded-lg p-2">หมายเหตุ: {order.note}</p>}
          </div>
          <div>
            {order.hasSlip ? (
              slipUrl ? (
                <a href={slipUrl} target="_blank" rel="noreferrer">
                  <img src={slipUrl} alt="สลิป" className="max-h-64 rounded-xl border border-stone-200 mx-auto" />
                </a>
              ) : (
                <div className="h-40 grid place-items-center text-stone-400">
                  <Spinner />
                </div>
              )
            ) : (
              <p className="h-40 grid place-items-center rounded-xl bg-stone-50 border border-dashed border-stone-300 text-stone-500">ยังไม่มีสลิป</p>
            )}
          </div>
        </div>

        <table className="w-full">
          <tbody className="divide-y divide-stone-100">
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2">
                  {i.name} <span className="text-stone-400">({i.id})</span>
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  {baht(i.price)} × {i.qty}
                </td>
                <td className="py-2 text-right w-24">{baht(i.price * i.qty)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2" colSpan={2}>
                ค่าจัดส่ง
              </td>
              <td className="py-2 text-right">{baht(order.shipping)}</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2" colSpan={2}>
                รวม
              </td>
              <td className="py-2 text-right">{baht(order.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-2">
          <span className="font-medium">บันทึกภายในร้าน (เช่น เลขพัสดุ)</span>
          <div className="flex gap-2">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            <button disabled={busy || note === order.adminNote} onClick={() => update({ adminNote: note }, 'บันทึกแล้ว')} className={btnGhost}>
              บันทึก
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          {NEXT[order.status] && (
            <button disabled={busy} onClick={() => update({ status: NEXT[order.status] }, `เปลี่ยนสถานะเป็น "${ORDER_STATUS[NEXT[order.status]].short}"`)} className={btnPrimary}>
              {busy && <Spinner className="w-4 h-4" />} {NEXT_LABEL[order.status]}
            </button>
          )}
          {order.status !== 'Cancelled' && order.status !== 'Completed' && (
            <button
              disabled={busy}
              onClick={() => window.confirm('ยกเลิกคำสั่งซื้อนี้? สินค้าจะถูกคืนเข้าสต็อก') && update({ status: 'Cancelled' }, 'ยกเลิกคำสั่งซื้อแล้ว')}
              className={`${btnGhost} text-rose-600`}
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          )}
          {order.status === 'Cancelled' && (
            <button disabled={busy} onClick={() => update({ status: 'Pending' }, 'นำคำสั่งซื้อกลับมาแล้ว')} className={btnGhost}>
              นำกลับมา (รอตรวจสอบ)
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function exportCsv(orders) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['เลขที่', 'วันที่', 'สถานะ', 'ชื่อ', 'โทร', 'LINE', 'ที่อยู่', 'สินค้า', 'ค่าจัดส่ง', 'รวม', 'บันทึก'],
    ...orders.map((o) => [
      o.id,
      o.createdAt,
      ORDER_STATUS[o.status]?.short,
      o.customerName,
      o.phone,
      o.lineId,
      o.address,
      o.items.map((i) => `${i.name} x${i.qty}`).join('; '),
      o.shipping,
      o.total,
      o.adminNote,
    ]),
  ];
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `furniture-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Orders({ orders, onOpenOrder }) {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders.filter(
      (o) => (status === 'all' || o.status === status) && (!s || `${o.id} ${o.customerName} ${o.phone} ${o.lineId}`.toLowerCase().includes(s))
    );
  }, [orders, status, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className={`${inputCls} pl-9`} placeholder="ค้นหา เลขที่ / ชื่อ / เบอร์" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-48`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="สถานะ">
          <option value="all">ทุกสถานะ</option>
          {[...STATUS_FLOW, 'Cancelled'].map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS[s].short}
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
              <th className="px-4 py-3 font-medium text-right">ยอดรวม</th>
              <th className="px-4 py-3 font-medium">สลิป</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((o) => (
              <tr key={o.id} onClick={() => onOpenOrder(o.id)} className="cursor-pointer hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3 text-stone-500">{o.createdAt}</td>
                <td className="px-4 py-3">
                  {o.customerName}
                  <span className="block text-xs text-stone-500">{o.phone}</span>
                </td>
                <td className="px-4 py-3 text-right">{baht(o.total)}</td>
                <td className="px-4 py-3">{o.hasSlip ? '✓' : '-'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                  ไม่มีคำสั่งซื้อ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
