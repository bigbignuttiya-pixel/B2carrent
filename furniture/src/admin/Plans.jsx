import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { baht, daysLabel } from '../data';
import { inputCls, btnPrimary, btnGhost, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

function PlanRow({ plan, isNew, onSaved, onCancel, notify }) {
  const [p, setP] = useState(plan);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const changed = isNew || JSON.stringify(p) !== JSON.stringify(plan);

  const save = async () => {
    if (!p.name.trim() || !(Number(p.days) >= 1) || !(Number(p.price) >= 0)) return notify('กรุณากรอกชื่อ จำนวนวัน และราคาให้ถูกต้อง', 'error');
    setBusy(true);
    try {
      await api.savePlan(p, isNew);
      notify('บันทึกแพ็กเกจแล้ว');
      onSaved();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!window.confirm(`ลบแพ็กเกจ "${plan.name}"? (ประวัติการชำระเงินเดิมยังอยู่) — ถ้าแค่ไม่ต้องการขายชั่วคราว ให้ปิด "เปิดขาย" แทน`)) return;
    try {
      await api.deletePlan(plan.id);
      onSaved();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <div className={`rounded-2xl bg-white border border-stone-200 p-4 grid gap-3 sm:grid-cols-[1.2fr_0.6fr_0.7fr_2fr_auto] items-end ${p.active ? '' : 'opacity-70'}`}>
      <label className="block">
        <span className="text-xs text-stone-500">ชื่อแพ็กเกจ</span>
        <input className={`${inputCls} py-2`} value={p.name} onChange={set('name')} />
      </label>
      <label className="block">
        <span className="text-xs text-stone-500">จำนวนวัน</span>
        <input className={`${inputCls} py-2`} type="number" min={1} value={p.days} onChange={set('days')} />
      </label>
      <label className="block">
        <span className="text-xs text-stone-500">ราคา (บาท)</span>
        <input className={`${inputCls} py-2`} type="number" min={0} value={p.price} onChange={set('price')} />
      </label>
      <label className="block">
        <span className="text-xs text-stone-500">คำอธิบาย</span>
        <input className={`${inputCls} py-2`} value={p.description} onChange={set('description')} />
      </label>
      <div className="flex items-center gap-2">
        <label className="text-xs flex items-center gap-1 whitespace-nowrap">
          <input type="checkbox" checked={p.active} onChange={set('active')} className="accent-stone-900" /> เปิดขาย
        </label>
        <button disabled={busy || !changed} onClick={save} className={`${btnPrimary} py-2`}>
          {busy && <Spinner className="w-4 h-4" />} บันทึก
        </button>
        {isNew ? (
          <button onClick={onCancel} className={`${btnGhost} py-2`}>
            ยกเลิก
          </button>
        ) : (
          <button onClick={remove} className="p-2 text-stone-400 hover:text-rose-600" aria-label="ลบ">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {!isNew && (
        <p className="text-xs text-stone-500 sm:col-span-5">
          ลูกค้าเห็นเป็น: {p.name} {baht(p.price)} / {daysLabel(Number(p.days) || 1)}
        </p>
      )}
    </div>
  );
}

export default function Plans({ notify, onChanged }) {
  const [plans, setPlans] = useState(null);
  const [adding, setAdding] = useState(false);
  const load = async () => {
    try {
      setPlans(await api.loadPlansAdmin());
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const saved = () => {
    setAdding(false);
    load();
    onChanged();
  };
  if (!plans)
    return (
      <div className="py-20 grid place-items-center text-stone-400">
        <Spinner className="w-8 h-8" />
      </div>
    );
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-stone-500">ราคาและระยะเวลาที่ลูกค้าเลือกซื้อได้ (เรียงตามราคา)</p>
        <button onClick={() => setAdding(true)} className={btnPrimary} disabled={adding}>
          <Plus className="w-4 h-4" /> เพิ่มแพ็กเกจ
        </button>
      </div>
      {adding && (
        <PlanRow
          isNew
          plan={{ id: `plan-${Date.now().toString(36)}`, name: '', days: 3, price: 0, description: '', active: true, sortOrder: plans.length + 1 }}
          notify={notify}
          onSaved={saved}
          onCancel={() => setAdding(false)}
        />
      )}
      {plans.map((p) => (
        <PlanRow key={p.id + JSON.stringify(p)} plan={p} notify={notify} onSaved={saved} />
      ))}
    </div>
  );
}
