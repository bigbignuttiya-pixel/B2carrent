// "My designs" — every saved project of this access code: room layouts and FORMA STUDIO furniture projects
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, LayoutGrid, Hammer, Search } from 'lucide-react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { Modal, ModalHeader, btnPrimary, inputCls } from './ui';

const len = (cm) => (cm >= 100 ? `${(cm / 100).toFixed(cm % 100 ? 2 : 0)} ม.` : `${Math.round(cm)} ซม.`);
export const isStudio = (p) => p?.kind === 'studio' || p?.room?.kind === 'studio';

const STUDIO_KEY = 'furniture:studio';
const ROOM_KEY = 'furniture:draft';

// Hand a project to the other editor (it reads its draft from this device when it opens)
export function openInStudio(r) {
  try {
    localStorage.setItem(STUDIO_KEY, JSON.stringify({ projectId: r.id, name: r.name, design: r.data }));
  } catch {
    /* storage full */
  }
  window.location.hash = '#studio';
}
export function openInRoomPlanner(r) {
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify({ projectId: r.id, name: r.name, design: r.data }));
  } catch {
    /* storage full */
  }
  window.location.hash = '#design';
}

export default function ProjectsModal({ code, onClose, onOpen, notify }) {
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const load = useCallback(async () => {
    try {
      setList(await api.listProjects(code));
    } catch (err) {
      notify(errorMessage(err), 'error');
      setList([]);
    }
  }, [code, notify]);
  useEffect(() => {
    load();
  }, [load]);
  const remove = async (p) => {
    if (!window.confirm(`ลบแบบ "${p.name}"?`)) return;
    try {
      await api.deleteProject(code, p.id);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  const shown = (list || []).filter((p) => (filter === 'all' || (filter === 'studio') === isStudio(p)) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <Modal open onClose={onClose}>
      <ModalHeader title="แบบของฉัน" onClose={onClose} />
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {[
            ['all', 'ทั้งหมด'],
            ['studio', 'เฟอร์นิเจอร์ (FORMA STUDIO)'],
            ['room', 'จัดห้อง'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`px-3 py-1.5 rounded-full text-sm border ${filter === id ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 hover:bg-stone-100'}`}>
              {label}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input className={`${inputCls} pl-9 py-1.5`} placeholder="ค้นหาชื่อแบบ" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {!list ? (
          <div className="py-10 grid place-items-center text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-stone-500">ยังไม่มีแบบที่บันทึกไว้</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {shown.map((p) => {
              const studio = isStudio(p);
              const Icon = studio ? Hammer : LayoutGrid;
              return (
                <li key={p.id} className="py-3 flex items-center gap-3">
                  <span className={`w-9 h-9 shrink-0 rounded-xl grid place-items-center ${studio ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-stone-500">
                      {studio ? 'เฟอร์นิเจอร์ · ' : p.room?.w ? `ห้อง ${len(p.room.w)} × ${len(p.room.d)} · ` : ''}
                      {p.itemCount} ชิ้น · แก้ไขล่าสุด {p.updatedAt}
                    </p>
                  </div>
                  <button onClick={() => onOpen(p)} className={btnPrimary}>
                    เปิด
                  </button>
                  <button onClick={() => remove(p)} className="p-2 text-stone-400 hover:text-rose-600" aria-label="ลบ">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
