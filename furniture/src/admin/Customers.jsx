import { useMemo, useState } from 'react';
import { Search, Copy } from 'lucide-react';
import { formatCode } from '../data';
import { Modal, ModalHeader, inputCls, btnPrimary, btnGhost, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

function CustomerDrawer({ account, onClose, onChanged, notify }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(account.adminNote);
  const [days, setDays] = useState(1);

  const save = async (patch, msg) => {
    setBusy(true);
    try {
      await api.updateAccount(account.id, patch);
      notify(msg);
      onChanged();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  const extend = (n) => {
    const base = account.expiresAtIso && new Date(account.expiresAtIso) > new Date() ? new Date(account.expiresAtIso) : new Date();
    save({ expiresAtIso: new Date(base.getTime() + n * 86400e3).toISOString() }, n > 0 ? `เพิ่มสิทธิ์ ${n} วันแล้ว` : 'ปรับสิทธิ์แล้ว');
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader title={account.name} onClose={onClose} />
      <div className="p-5 space-y-5 text-sm">
        <div className="grid sm:grid-cols-2 gap-3">
          <p>เบอร์: {account.phone}</p>
          <p>LINE: {account.lineId || '-'}</p>
          <p>
            รหัส: <span className="font-mono">{formatCode(account.code)}</span>{' '}
            <button onClick={() => navigator.clipboard?.writeText(formatCode(account.code))} className="text-stone-400 hover:text-stone-700 align-middle" aria-label="คัดลอกรหัส">
              <Copy className="w-3.5 h-3.5 inline" />
            </button>
          </p>
          <p>สมัครเมื่อ {account.createdAt}</p>
          <p className={account.active ? 'text-emerald-700' : 'text-stone-500'}>
            {account.active ? `ใช้ได้ถึง ${account.expiresAt}` : account.expiresAt ? `หมดอายุ ${account.expiresAt}` : 'ยังไม่เคยเปิดใช้งาน'}
          </p>
          <p>แบบที่บันทึก {account.projectCount} แบบ</p>
        </div>

        <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-3">
          <p className="font-medium">ปรับสิทธิ์ด้วยตนเอง (เช่น แถมวัน / ชดเชย)</p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" min={1} max={3660} className={`${inputCls} w-24`} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            <span>วัน</span>
            <button disabled={busy || !(days > 0)} onClick={() => extend(days)} className={btnPrimary}>
              {busy && <Spinner className="w-4 h-4" />} เพิ่มสิทธิ์
            </button>
            {account.active && (
              <button disabled={busy} onClick={() => window.confirm('ปิดสิทธิ์การใช้งานทันที?') && save({ expiresAtIso: new Date().toISOString() }, 'ปิดสิทธิ์แล้ว')} className={`${btnGhost} text-rose-600`}>
                ปิดสิทธิ์ทันที
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500">ปกติไม่ต้องใช้ — การอนุมัติสลิปในหน้า "การชำระเงิน" เพิ่มสิทธิ์ให้อัตโนมัติ</p>
        </div>

        <div className="space-y-2">
          <span className="font-medium">บันทึกภายในร้าน</span>
          <div className="flex gap-2">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            <button disabled={busy || note === account.adminNote} onClick={() => save({ adminNote: note }, 'บันทึกแล้ว')} className={btnGhost}>
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function Customers({ accounts, onChanged, notify }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/-/g, '');
    return accounts.filter(
      (a) =>
        (filter === 'all' || (filter === 'active' ? a.active : !a.active)) &&
        (!s || `${a.name} ${a.phone} ${a.lineId} ${a.code}`.toLowerCase().replace(/-/g, '').includes(s))
    );
  }, [accounts, q, filter]);
  const open = accounts.find((a) => a.id === openId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className={`${inputCls} pl-9`} placeholder="ค้นหา ชื่อ / เบอร์ / LINE / รหัส" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-48`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="กรอง">
          <option value="all">ทั้งหมด</option>
          <option value="active">ใช้งานอยู่</option>
          <option value="inactive">หมดอายุ / ยังไม่ชำระ</option>
        </select>
      </div>
      <div className="rounded-2xl bg-white border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">ลูกค้า</th>
              <th className="px-4 py-3 font-medium">รหัส</th>
              <th className="px-4 py-3 font-medium">สิทธิ์การใช้งาน</th>
              <th className="px-4 py-3 font-medium text-right">แบบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((a) => (
              <tr key={a.id} onClick={() => setOpenId(a.id)} className="cursor-pointer hover:bg-stone-50">
                <td className="px-4 py-3">
                  {a.name}
                  <span className="block text-xs text-stone-500">{a.phone}</span>
                </td>
                <td className="px-4 py-3 font-mono">{formatCode(a.code)}</td>
                <td className={`px-4 py-3 ${a.active ? 'text-emerald-700' : 'text-stone-500'}`}>
                  {a.active ? `ถึง ${a.expiresAt}` : a.expiresAt ? `หมดอายุ ${a.expiresAt}` : 'ยังไม่เปิดใช้งาน'}
                </td>
                <td className="px-4 py-3 text-right">{a.projectCount}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-stone-500">
                  ไม่มีลูกค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open && <CustomerDrawer key={open.id + open.expiresAt} account={open} notify={notify} onClose={() => setOpenId(null)} onChanged={onChanged} />}
    </div>
  );
}
