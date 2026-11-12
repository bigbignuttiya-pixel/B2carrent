import { baht, ORDER_STATUS } from '../data';
import { StatusBadge } from '../components/ui';

const todayBangkok = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ orders, products, onOpenOrder }) {
  const live = orders.filter((o) => o.status !== 'Cancelled');
  const today = todayBangkok();
  const month = today.slice(0, 7);
  const sum = (l) => l.reduce((s, o) => s + o.total, 0);
  const todays = live.filter((o) => o.createdAt.startsWith(today));
  const months = live.filter((o) => o.createdAt.startsWith(month));
  const waiting = orders.filter((o) => o.status === 'Pending');
  const toShip = orders.filter((o) => o.status === 'Confirmed');
  const lowStock = products.filter((p) => p.active && p.stock <= 2).sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="ยอดขายวันนี้" value={baht(sum(todays))} sub={`${todays.length} คำสั่งซื้อ`} />
        <Stat label="ยอดขายเดือนนี้" value={baht(sum(months))} sub={`${months.length} คำสั่งซื้อ`} />
        <Stat label="รอตรวจสอบชำระเงิน" value={waiting.length} sub={`มีสลิปแล้ว ${waiting.filter((o) => o.hasSlip).length}`} />
        <Stat label="รอจัดส่ง" value={toShip.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white border border-stone-200 p-5">
          <h3 className="font-semibold mb-3">ต้องดำเนินการ</h3>
          {[...waiting, ...toShip].length === 0 ? (
            <p className="text-sm text-stone-500">ไม่มีคำสั่งซื้อค้าง</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {[...waiting, ...toShip].slice(0, 10).map((o) => (
                <li key={o.id}>
                  <button onClick={() => onOpenOrder(o.id)} className="w-full py-2.5 flex items-center gap-3 text-left text-sm hover:bg-stone-50 rounded-lg px-2">
                    <span className="font-medium w-28">{o.id}</span>
                    <span className="flex-1 truncate text-stone-600">{o.customerName}</span>
                    <span>{baht(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-white border border-stone-200 p-5">
          <h3 className="font-semibold mb-3">สินค้าใกล้หมด (เหลือ ≤ 2)</h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-500">สต็อกเพียงพอทุกรายการ</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="py-2.5 flex justify-between">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? 'text-rose-600 font-medium' : 'text-amber-700'}>{p.stock === 0 ? 'หมด' : `เหลือ ${p.stock}`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white border border-stone-200 p-5">
        <h3 className="font-semibold mb-3">สถานะคำสั่งซื้อทั้งหมด</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ORDER_STATUS).map(([k, m]) => (
            <span key={k} className={`px-3 py-1.5 rounded-xl border text-sm ${m.cls}`}>
              {m.short} {orders.filter((o) => o.status === k).length}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
