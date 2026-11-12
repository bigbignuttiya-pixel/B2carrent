import { useState } from 'react';
import { Search, XCircle } from 'lucide-react';
import { baht, ORDER_STATUS, STATUS_FLOW } from '../data';
import { inputCls, btnPrimary, btnGhost, StatusBadge, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import Payment from './Payment';

function Timeline({ status }) {
  if (status === 'Cancelled') return <p className="text-sm text-stone-500">{ORDER_STATUS.Cancelled.label}</p>;
  const at = STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-1 text-[11px] sm:text-xs text-center">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className="space-y-1">
          <div className={`h-1.5 rounded-full ${i <= at ? 'bg-amber-600' : 'bg-stone-200'}`} />
          <span className={i <= at ? 'text-stone-900' : 'text-stone-400'}>{ORDER_STATUS[s].short}</span>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, settings, onChange, notify }) {
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    if (!window.confirm(`ยกเลิกคำสั่งซื้อ ${order.id}?`)) return;
    setBusy(true);
    try {
      onChange(await api.cancelOrder(order.id, order.phone));
      notify('ยกเลิกคำสั่งซื้อแล้ว');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  const slip = async (dataUrl) => {
    try {
      onChange(await api.attachSlip(order.id, order.phone, dataUrl));
      notify('แนบสลิปเรียบร้อย');
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  };
  return (
    <article className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{order.id}</p>
          <p className="text-xs text-stone-500">{order.createdAt}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <Timeline status={order.status} />
      <ul className="text-sm space-y-1">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2">
            <span className="text-stone-600">
              {i.name} × {i.qty}
            </span>
            <span>{baht(i.price * i.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between text-stone-600">
          <span>ค่าจัดส่ง</span>
          <span>{order.shipping ? baht(order.shipping) : 'ฟรี'}</span>
        </li>
        <li className="flex justify-between font-semibold border-t border-stone-100 pt-1">
          <span>รวม</span>
          <span>{baht(order.total)}</span>
        </li>
      </ul>
      <p className="text-sm text-stone-600">จัดส่งที่: {order.address}</p>
      {order.status === 'Pending' && (
        <>
          <Payment order={order} settings={settings} onSlip={slip} />
          <button disabled={busy} onClick={cancel} className={`${btnGhost} text-rose-600`}>
            <XCircle className="w-4 h-4" /> ยกเลิกคำสั่งซื้อ
          </button>
        </>
      )}
    </article>
  );
}

export default function Tracker({ settings, myPhones, notify }) {
  const [phone, setPhone] = useState(myPhones[0] || '');
  const [id, setId] = useState('');
  const [orders, setOrders] = useState(null);
  const [busy, setBusy] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      setOrders(await api.findOrders(phone, id));
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">ติดตามคำสั่งซื้อ</h1>
      <form onSubmit={search} className="rounded-2xl bg-white border border-stone-200 p-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
        <input className={inputCls} required inputMode="tel" placeholder="เบอร์โทรที่ใช้สั่งซื้อ" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={inputCls} placeholder="เลขที่คำสั่งซื้อ (ไม่บังคับ)" value={id} onChange={(e) => setId(e.target.value)} />
        <button disabled={busy} className={btnPrimary}>
          {busy ? <Spinner className="w-4 h-4" /> : <Search className="w-4 h-4" />} ค้นหา
        </button>
      </form>
      {orders && orders.length === 0 && <p className="text-center text-stone-500">ไม่พบคำสั่งซื้อของเบอร์นี้</p>}
      {orders?.map((o) => (
        <OrderCard key={o.id} order={o} settings={settings} notify={notify} onChange={(n) => setOrders((l) => l.map((x) => (x.id === n.id ? n : x)))} />
      ))}
    </main>
  );
}
