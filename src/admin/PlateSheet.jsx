import React, { useEffect, useMemo, useState } from 'react';
import { X, Lock, ClipboardList } from 'lucide-react';
import { Modal } from '../components/ui';

const PENDING = /^รอระบุทะเบียน/;
const modelKey = (v) => `${v.type}|${(v.name || '').trim().toLowerCase()}`;

// One screen to check every unit against DriveHub. Only cars are editable —
// motorcycles are shown read-only so they can't be changed by mistake.
export default function PlateSheet({ open, onClose, vehicles, onSave }) {
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setDraft({});
  }, [open]);

  const groups = useMemo(() => {
    const map = new Map();
    [...vehicles]
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'Car' ? -1 : 1) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
      .forEach((v) => {
        const k = modelKey(v);
        if (!map.has(k)) map.set(k, { key: k, name: v.name, type: v.type, units: [] });
        map.get(k).units.push(v);
      });
    return [...map.values()];
  }, [vehicles]);

  const val = (v, field) => (draft[v.id]?.[field] ?? (field === 'plateNumber' && PENDING.test(v.plateNumber || '') ? '' : v[field] || ''));
  const edit = (v, field) => (e) => setDraft((d) => ({ ...d, [v.id]: { ...d[v.id], [field]: e.target.value } }));

  const changes = Object.entries(draft)
    .map(([id, ch]) => {
      const v = vehicles.find((x) => x.id === id);
      if (!v || v.type !== 'Car') return null;
      const plate = (ch.plateNumber ?? val(v, 'plateNumber')).trim();
      const dh = (ch.driveHubName ?? (v.driveHubName || '')).trim();
      const next = { plateNumber: plate || `รอระบุทะเบียน (${id})`, driveHubName: dh };
      if (next.plateNumber === v.plateNumber && next.driveHubName === (v.driveHubName || '')) return null;
      return { id, ...next };
    })
    .filter(Boolean);

  const cars = vehicles.filter((v) => v.type === 'Car');
  const missing = cars.filter((v) => PENDING.test(v.plateNumber || '')).length;

  const save = async () => {
    if (!changes.length) return onClose();
    setBusy(true);
    try {
      if (await onSave(changes)) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} maxWidth="max-w-3xl">
      <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-start gap-3">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2"><ClipboardList className="w-4 h-4 text-yellow-400" /> ทะเบียนรถทั้งหมด (เทียบกับ DriveHub)</h3>
          <p className="text-[11px] text-slate-400">
            รถยนต์ {cars.length} คัน • ยังไม่มีทะเบียน <span className={missing ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>{missing}</span> คัน • มอเตอร์ไซค์ล็อกไว้ ไม่ให้แก้
          </p>
        </div>
        <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-white" aria-label="ปิด"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
        {groups.map((g) => {
          const locked = g.type !== 'Car';
          return (
            <div key={g.key} className={`rounded-2xl border ${locked ? 'border-slate-800 bg-slate-950/40' : 'border-slate-700 bg-slate-950'} overflow-hidden`}>
              <div className="px-4 py-2.5 flex justify-between items-center border-b border-slate-800">
                <span className="text-xs font-black text-white">{locked ? '🛵' : '🚗'} {g.name} <span className="text-slate-500 font-normal">({g.units.length} คัน)</span></span>
                {locked && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> ล็อก</span>}
              </div>
              <div className="divide-y divide-slate-800/70">
                {g.units.map((v) => (
                  <div key={v.id} className="px-4 py-2 grid grid-cols-[70px_1fr_1fr] gap-2 items-center text-xs">
                    <span className="font-mono text-yellow-400 font-bold">{v.id}</span>
                    {locked ? (
                      <>
                        <span className="text-slate-400">{v.plateNumber}</span>
                        <span className="text-slate-600">—</span>
                      </>
                    ) : (
                      <>
                        <input value={val(v, 'plateNumber')} onChange={edit(v, 'plateNumber')} placeholder="ทะเบียน เช่น 1กข-1234" className={`w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 text-white focus:border-yellow-400 focus:outline-none ${val(v, 'plateNumber') ? 'border-slate-700' : 'border-amber-500/50'}`} />
                        <input value={val(v, 'driveHubName')} onChange={edit(v, 'driveHubName')} placeholder="ชื่อใน DriveHub (ถ้ามี)" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-yellow-400 focus:outline-none" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-slate-800 flex gap-2 justify-end items-center">
        <span className="text-[11px] text-slate-500 mr-auto">{changes.length ? `แก้ไข ${changes.length} คัน` : 'ยังไม่มีการแก้ไข'}</span>
        <button onClick={onClose} disabled={busy} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700">ปิด</button>
        <button onClick={save} disabled={busy || !changes.length} className="px-5 py-2.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-slate-950 disabled:opacity-50">
          {busy ? 'กำลังบันทึก…' : 'บันทึกทะเบียน'}
        </button>
      </div>
    </Modal>
  );
}
