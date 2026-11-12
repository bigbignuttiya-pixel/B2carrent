import { baht } from '../data';
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

export default function Dashboard({ accounts, payments, onOpenPayment }) {
  const approved = payments.filter((p) => p.status === 'Approved');
  const today = todayBangkok();
  const month = today.slice(0, 7);
  const sum = (l) => l.reduce((s, p) => s + p.amount, 0);
  const todays = approved.filter((p) => (p.decidedAt || p.createdAt).startsWith(today));
  const months = approved.filter((p) => (p.decidedAt || p.createdAt).startsWith(month));
  const pending = payments.filter((p) => p.status === 'Pending');
  const activeCount = accounts.filter((a) => a.active).length;
  const designs = accounts.reduce((s, a) => s + a.projectCount, 0);

  // revenue per day, last 14 days
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() + 7 * 3600e3 - (13 - i) * 86400e3).toISOString().slice(0, 10));
  const perDay = days.map((d) => sum(approved.filter((p) => (p.decidedAt || p.createdAt).startsWith(d))));
  const max = Math.max(1, ...perDay);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="รายได้วันนี้" value={baht(sum(todays))} sub={`${todays.length} รายการ`} />
        <Stat label="รายได้เดือนนี้" value={baht(sum(months))} sub={`${months.length} รายการ`} />
        <Stat label="รอตรวจสอบสลิป" value={pending.length} sub={`แนบสลิปแล้ว ${pending.filter((p) => p.hasSlip).length}`} />
        <Stat label="ลูกค้าที่ใช้งานอยู่" value={activeCount} sub={`ทั้งหมด ${accounts.length} · แบบที่บันทึก ${designs}`} />
      </div>

      <section className="rounded-2xl bg-white border border-stone-200 p-5">
        <h3 className="font-semibold mb-4">รายได้ 14 วันล่าสุด</h3>
        <div className="flex items-end gap-1.5 h-40">
          {perDay.map((v, i) => (
            <div key={days[i]} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${days[i]}: ${baht(v)}`}>
              <div className="w-full max-w-8 rounded-t bg-amber-600" style={{ height: `${Math.max(v ? 4 : 1, (v / max) * 100)}%`, opacity: v ? 1 : 0.15 }} />
              <span className="text-[10px] text-stone-400">{days[i].slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-stone-200 p-5">
        <h3 className="font-semibold mb-3">รอตรวจสอบการชำระเงิน</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-stone-500">ไม่มีรายการค้าง</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {pending.slice(0, 10).map((p) => (
              <li key={p.id}>
                <button onClick={() => onOpenPayment(p.id)} className="w-full py-2.5 px-2 flex items-center gap-3 text-left text-sm hover:bg-stone-50 rounded-lg">
                  <span className="font-medium w-28">{p.id}</span>
                  <span className="flex-1 truncate text-stone-600">
                    {p.account?.name} · {p.planName}
                  </span>
                  <span>{baht(p.amount)}</span>
                  <span className="text-xs w-16 text-right">{p.hasSlip ? 'มีสลิป' : 'ยังไม่มีสลิป'}</span>
                  <StatusBadge status={p.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
