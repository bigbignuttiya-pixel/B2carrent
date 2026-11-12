import { useState } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { baht, unitPrice, shippingFor } from '../data';
import { Modal, ModalHeader, Field, inputCls, btnAccent, btnGhost, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { lineChatUrl, lineMessageUrl } from '../lib/line';
import Payment from './Payment';

export const orderMessage = (o, shopName) =>
  [
    `สวัสดีค่ะ ${shopName} ขอแจ้งคำสั่งซื้อ`,
    `เลขที่: ${o.id}`,
    `ชื่อ: ${o.customerName}`,
    `โทร: ${o.phone}`,
    ...o.items.map((i) => `• ${i.name} × ${i.qty} = ${baht(i.price * i.qty)}`),
    `ค่าจัดส่ง: ${o.shipping ? baht(o.shipping) : 'ฟรี'}`,
    `ยอดรวม: ${baht(o.total)}`,
    `ที่อยู่: ${o.address}`,
  ].join('\n');

export default function Checkout({ open, items, settings, onClose, onPlaced, notify }) {
  const [form, setForm] = useState({ name: '', phone: '', lineId: '', address: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const subtotal = items.reduce((s, i) => s + unitPrice(i.product) * i.qty, 0);
  const shipping = shippingFor(subtotal, settings);

  const close = () => {
    setOrder(null);
    setError('');
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const o = await api.placeOrder({ ...form, items: items.map((i) => ({ id: i.product.id, qty: i.qty })) });
      setOrder(o);
      onPlaced(o);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const attachSlip = async (dataUrl) => {
    try {
      setOrder(await api.attachSlip(order.id, order.phone, dataUrl));
      notify('แนบสลิปเรียบร้อย');
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  };

  const lineSend = order && (lineMessageUrl(settings.lineOaId, orderMessage(order, settings.shopName)) || lineChatUrl(settings.lineOaId));

  return (
    <Modal open={open} onClose={close}>
      <ModalHeader title={order ? 'สั่งซื้อสำเร็จ' : 'ข้อมูลการจัดส่ง'} onClose={close} />
      {order ? (
        <div className="p-5 space-y-5">
          <div className="text-center space-y-1">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-sm text-stone-500">เลขที่คำสั่งซื้อ</p>
            <p className="text-2xl font-semibold tracking-wide">{order.id}</p>
            <p className="text-sm text-stone-500">ใช้เลขนี้คู่กับเบอร์โทร {order.phone} เพื่อติดตามคำสั่งซื้อ</p>
          </div>
          <Payment order={order} settings={settings} onSlip={attachSlip} />
          <div className="flex flex-col sm:flex-row gap-2">
            {lineSend && (
              <a href={lineSend} target="_blank" rel="noreferrer" className={`${btnAccent} flex-1 bg-[#06C755] hover:bg-[#05b14c]`}>
                <MessageCircle className="w-4 h-4" /> ส่งรายละเอียดทาง LINE
              </a>
            )}
            <a href="#track" onClick={close} className={`${btnGhost} flex-1`}>
              ติดตามคำสั่งซื้อ
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="p-5 grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-4">
            <Field label="ชื่อ-นามสกุล *">
              <input className={inputCls} required minLength={3} maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="เบอร์โทรศัพท์ *">
                <input className={inputCls} required inputMode="tel" autoComplete="tel" placeholder="0812345678" value={form.phone} onChange={set('phone')} />
              </Field>
              <Field label="LINE ID">
                <input className={inputCls} maxLength={40} value={form.lineId} onChange={set('lineId')} />
              </Field>
            </div>
            <Field label="ที่อยู่จัดส่ง *">
              <textarea className={inputCls} required minLength={10} maxLength={600} rows={3} autoComplete="street-address" value={form.address} onChange={set('address')} />
            </Field>
            <Field label="หมายเหตุ">
              <textarea className={inputCls} maxLength={500} rows={2} placeholder="เช่น ช่วงเวลาที่สะดวกรับของ" value={form.note} onChange={set('note')} />
            </Field>
          </div>
          <div className="md:col-span-2 space-y-3">
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 text-sm space-y-2">
              {items.map((i) => (
                <div key={i.product.id} className="flex justify-between gap-2">
                  <span className="text-stone-600">
                    {i.product.name} × {i.qty}
                  </span>
                  <span>{baht(unitPrice(i.product) * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span>ค่าจัดส่ง</span>
                <span>{shipping ? baht(shipping) : 'ฟรี'}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>รวม</span>
                <span>{baht(subtotal + shipping)}</span>
              </div>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button disabled={busy || !items.length} className={`${btnAccent} w-full py-3`}>
              {busy && <Spinner className="w-4 h-4" />} ยืนยันคำสั่งซื้อ
            </button>
            <p className="text-xs text-stone-500">กดยืนยันแล้วจะแสดง QR สำหรับชำระเงิน</p>
          </div>
        </form>
      )}
    </Modal>
  );
}
