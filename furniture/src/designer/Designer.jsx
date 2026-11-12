import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Grid3x3, Tag, Save, FolderOpen, Download, FilePlus2, Lock,
  RotateCw, RotateCcw, Copy, Trash2, Search, ChevronUp, ChevronDown, Loader2,
} from 'lucide-react';
import { CATALOG, GROUPS, FLOORS, SWATCHES, catalogItem, newDesign } from './catalog';
import { PlanContent, itemName, formatLength } from './shapes';
import { usePersistentState } from '../lib/storage';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { Modal, ModalHeader, inputCls, btnPrimary, btnGhost } from '../components/ui';

const uid = () => Math.random().toString(36).slice(2, 10);
const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const toRad = (deg) => (deg * Math.PI) / 180;

// Thumbnail of the catalog item for the sidebar
function CatalogThumb({ entry }) {
  const s = 44 / Math.max(entry.w, entry.d);
  return (
    <svg viewBox="-26 -26 52 52" className="w-12 h-12">
      <g transform={`scale(${s})`}>
        <PlanContent design={{ room: { w: 0, d: 0, floor: 'none', wall: 'none' }, items: [{ id: 't', type: entry.type, x: 0, y: 0, w: entry.w, d: entry.d, rot: 0, color: entry.color, label: entry.type === 'label' ? 'Aa' : '' }] }} showGrid={false} showDims={false} />
      </g>
    </svg>
  );
}

function NumberField({ label, value, onChange, min = 1, max = 5000, step = 1, suffix = 'ซม.' }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(Math.round(value * 10) / 10)), [value]);
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n)) onChange(clampNum(n, min, max));
    else setText(String(value));
  };
  return (
    <label className="block">
      <span className="text-xs text-stone-500">{label}</span>
      <div className="relative">
        <input
          className={`${inputCls} pr-11 py-2`}
          inputMode="decimal"
          type="number"
          step={step}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{suffix}</span>
      </div>
    </label>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border ${value === c ? 'ring-2 ring-amber-600 ring-offset-1' : 'border-stone-300'}`}
          style={{ background: c }}
          aria-label={c}
        />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" aria-label="เลือกสีเอง" />
    </div>
  );
}

function ProjectsModal({ code, onClose, onOpen, notify }) {
  const [list, setList] = useState(null);
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
  return (
    <Modal open onClose={onClose}>
      <ModalHeader title="แบบของฉัน" onClose={onClose} />
      <div className="p-5">
        {!list ? (
          <div className="py-10 grid place-items-center text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-stone-500">ยังไม่มีแบบที่บันทึกไว้</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {list.map((p) => (
              <li key={p.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-stone-500">
                    {p.room ? `${formatLength(p.room.w)} × ${formatLength(p.room.d)} · ` : ''}
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
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export default function Designer({ settings, session, onNeedAccess, notify }) {
  const [draft, setDraft] = usePersistentState('furniture:draft', { projectId: null, name: 'แบบห้องของฉัน', design: newDesign() });
  const { design, name, projectId } = draft;
  const setDesign = useCallback((fn) => setDraft((d) => ({ ...d, design: typeof fn === 'function' ? fn(d.design) : fn })), [setDraft]);

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [snap, setSnap] = useState(true);
  const [query, setQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('add');
  const [saving, setSaving] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const active = Boolean(session?.account?.active);
  const selected = design.items.find((i) => i.id === selectedId) || null;

  // ---------- history ----------
  const commit = useCallback(
    (before) => {
      setPast((p) => [...p.slice(-80), before]);
      setFuture([]);
      setDirty(true);
    },
    []
  );
  const change = useCallback(
    (fn) => {
      setDraft((d) => {
        const next = fn(d.design);
        if (next === d.design) return d;
        commit(d.design);
        return { ...d, design: next };
      });
    },
    [setDraft, commit]
  );
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [design, ...f]);
    setDesign(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, design]);
    setDesign(future[0]);
    setFuture((f) => f.slice(1));
  };

  const updateItem = (id, patch) => change((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const removeItem = (id) => {
    change((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
    setSelectedId(null);
  };
  const duplicate = (item) => {
    const copy = { ...item, id: uid(), x: item.x + 20, y: item.y + 20 };
    change((d) => ({ ...d, items: [...d.items, copy] }));
    setSelectedId(copy.id);
  };
  const reorder = (id, dir) =>
    change((d) => {
      const i = d.items.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.items.length) return d;
      const items = [...d.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...d, items };
    });
  const addItem = (entry) => {
    // cascade new items from the top-left area so they do not hide each other
    const n = design.items.length % 8;
    const item = {
      id: uid(),
      type: entry.type,
      x: Math.round(clampNum(entry.w / 2 + 30 + n * 25, 0, design.room.w)),
      y: Math.round(clampNum(entry.d / 2 + 30 + n * 25, 0, design.room.d)),
      w: entry.w,
      d: entry.d,
      rot: 0,
      color: entry.color,
      label: entry.type === 'label' ? 'ห้องนั่งเล่น' : '',
    };
    // rugs go under everything else
    change((d) => ({ ...d, items: entry.type === 'rug' ? [item, ...d.items] : [...d.items, item] }));
    setSelectedId(item.id);
    setMobileTab('props');
  };

  // ---------- viewport ----------
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState({ s: 1, ox: 40, oy: 40 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fit = useCallback(() => {
    const m = 64;
    const s = Math.max(0.05, Math.min((size.w - m * 2) / design.room.w, (size.h - m * 2) / design.room.d));
    setView({ s, ox: (size.w - design.room.w * s) / 2, oy: (size.h - design.room.d * s) / 2 });
  }, [size.w, size.h, design.room.w, design.room.d]);
  const fitKey = `${Math.round(size.w)}x${Math.round(size.h)}`;
  useEffect(() => {
    fit();
  }, [fitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomAt = (factor, px = size.w / 2, py = size.h / 2) =>
    setView((v) => {
      const s = clampNum(v.s * factor, 0.05, 20);
      const k = s / v.s;
      return { s, ox: px - (px - v.ox) * k, oy: py - (py - v.oy) * k };
    });

  const toCm = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.ox) / view.s, y: (e.clientY - r.top - view.oy) / view.s, px: e.clientX - r.left, py: e.clientY - r.top };
  };

  // ---------- pointer interactions ----------
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const snapV = (v) => (snap ? Math.round(v / 5) * 5 : Math.round(v));

  const onPointerDown = (e, mode, item) => {
    e.stopPropagation();
    svgRef.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current = { mode: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), before: design };
      return;
    }
    const p = toCm(e);
    if (item) setSelectedId(item.id);
    else if (mode === 'pan') setSelectedId(null);
    drag.current = { mode, id: item?.id, start: p, item: item && { ...item }, view: { ...view }, before: design, moved: false };
  };

  const onPointerMove = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = drag.current;
    if (!g) return;
    if (g.mode === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = svgRef.current.getBoundingClientRect();
      zoomAt(dist / g.dist, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      g.dist = dist;
      return;
    }
    const p = toCm(e);
    if (g.mode === 'pan') {
      setView({ ...g.view, ox: g.view.ox + (p.px - g.start.px), oy: g.view.oy + (p.py - g.start.py) });
      return;
    }
    const it = g.item;
    let patch;
    if (g.mode === 'move') {
      patch = { x: snapV(it.x + p.x - g.start.x), y: snapV(it.y + p.y - g.start.y) };
    } else if (g.mode === 'resize') {
      // pointer in the item's own (unrotated) frame, resizing symmetrically around the centre
      const dx = p.x - it.x, dy = p.y - it.y, a = toRad(-(it.rot || 0));
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      patch = { w: clampNum(snapV(Math.abs(lx) * 2), 5, 3000), d: clampNum(snapV(Math.abs(ly) * 2), 2, 3000) };
    } else if (g.mode === 'rotate') {
      let deg = (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI + 90;
      deg = ((Math.round(deg / (e.shiftKey ? 1 : 15)) * (e.shiftKey ? 1 : 15)) % 360 + 360) % 360;
      patch = { rot: deg };
    }
    if (patch) {
      g.moved = true;
      setDesign((d) => ({ ...d, items: d.items.map((x) => (x.id === g.id ? { ...x, ...patch } : x)) }));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    const g = drag.current;
    if (g && g.moved && g.mode !== 'pan' && g.mode !== 'pinch') commit(g.before);
    drag.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const r = svgRef.current.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  };
  useEffect(() => {
    const el = svgRef.current;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (selected) {
        const step = e.shiftKey ? 10 : 1;
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (moves[e.key]) {
          e.preventDefault();
          updateItem(selected.id, { x: selected.x + moves[e.key][0], y: selected.y + moves[e.key][1] });
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          removeItem(selected.id);
        } else if (e.key.toLowerCase() === 'r' && !mod) {
          updateItem(selected.id, { rot: ((selected.rot || 0) + 90) % 360 });
        } else if (mod && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          duplicate(selected);
        } else if (e.key === 'Escape') setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------- paid features ----------
  const requireActive = (what) => {
    if (active) return true;
    onNeedAccess(what);
    return false;
  };

  const save = async (asNew = false) => {
    if (!requireActive('บันทึกแบบ')) return;
    setSaving(true);
    try {
      const r = await api.saveProject(session.code, asNew ? null : projectId, name, design);
      setDraft((d) => ({ ...d, projectId: r.id, name: r.name }));
      setDirty(false);
      notify('บันทึกแบบแล้ว');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openProject = async (p) => {
    try {
      const r = await api.getProject(session.code, p.id);
      setDraft({ projectId: r.id, name: r.name, design: { ...newDesign(), ...r.data } });
      setPast([]);
      setFuture([]);
      setSelectedId(null);
      setDirty(false);
      setProjectsOpen(false);
      setTimeout(fit, 0);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  const startNew = () => {
    if (design.items.length && dirty && !window.confirm('เริ่มแบบใหม่? งานที่ยังไม่บันทึกจะหายไป')) return;
    setDraft({ projectId: null, name: 'แบบห้องใหม่', design: newDesign() });
    setPast([]);
    setFuture([]);
    setSelectedId(null);
    setDirty(false);
    setTimeout(fit, 0);
  };

  const doExport = async () => {
    if (!requireActive('ส่งออกรูปแบบห้อง')) return;
    try {
      const { exportPng } = await import('./exportPng');
      await exportPng(design, { name, shopName: settings.shopName, showLabels });
    } catch {
      notify('ส่งออกรูปไม่สำเร็จ', 'error');
    }
  };

  // ---------- panels ----------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [query]);

  const catalogPanel = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input className={`${inputCls} pl-9 py-2`} placeholder="ค้นหาเฟอร์นิเจอร์" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {GROUPS.map((g) => {
        const list = filtered.filter((c) => c.group === g.id);
        if (!list.length) return null;
        return (
          <div key={g.id}>
            <p className="text-xs font-medium text-stone-500 mb-2">{g.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {list.map((c) => (
                <button
                  key={c.type}
                  onClick={() => addItem(c)}
                  className="rounded-xl border border-stone-200 bg-white hover:border-amber-600 hover:bg-amber-50 p-1.5 flex flex-col items-center text-center"
                  title={`${c.name} ${c.w}×${c.d} ซม.`}
                >
                  <CatalogThumb entry={c} />
                  <span className="text-[11px] leading-tight mt-1">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const roomPanel = (
    <div className="space-y-4">
      <p className="font-medium">ขนาดห้อง</p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="กว้าง" value={design.room.w} min={100} max={3000} onChange={(v) => change((d) => ({ ...d, room: { ...d.room, w: v } }))} />
        <NumberField label="ยาว" value={design.room.d} min={100} max={3000} onChange={(v) => change((d) => ({ ...d, room: { ...d.room, d: v } }))} />
      </div>
      <p className="text-sm text-stone-500">พื้นที่ {((design.room.w * design.room.d) / 10000).toFixed(2)} ตร.ม.</p>
      <div>
        <p className="text-xs text-stone-500 mb-1.5">พื้น</p>
        <div className="flex flex-wrap gap-2">
          {FLOORS.map((f) => (
            <button
              key={f.color}
              onClick={() => change((d) => ({ ...d, room: { ...d.room, floor: f.color } }))}
              className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${design.room.floor === f.color ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}
            >
              <span className="w-4 h-4 rounded border border-stone-300" style={{ background: f.color }} /> {f.name}
            </button>
          ))}
          <input type="color" value={design.room.floor} onChange={(e) => change((d) => ({ ...d, room: { ...d.room, floor: e.target.value } }))} className="w-8 h-8 cursor-pointer" aria-label="สีพื้น" />
        </div>
      </div>
      <div>
        <p className="text-xs text-stone-500 mb-1.5">ผนัง</p>
        <ColorPicker value={design.room.wall} onChange={(c) => change((d) => ({ ...d, room: { ...d.room, wall: c } }))} />
      </div>
      <div className="text-xs text-stone-500 space-y-1 border-t border-stone-100 pt-3">
        <p>• ลากเพื่อย้าย · จุด ◢ มุมขวาล่างเพื่อปรับขนาด · จุดด้านบนเพื่อหมุน</p>
        <p>• ลากพื้นที่ว่างเพื่อเลื่อนมุมมอง · ล้อเมาส์ / ใช้สองนิ้วเพื่อซูม</p>
        <p>• คีย์ลัด: R หมุน 90° · Delete ลบ · ลูกศรขยับ · Ctrl+Z ย้อนกลับ · Ctrl+D ทำซ้ำ</p>
      </div>
    </div>
  );

  const propsPanel = selected ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{catalogItem(selected.type).name}</p>
        <button onClick={() => setSelectedId(null)} className="text-xs text-stone-500 hover:text-stone-800">
          ตั้งค่าห้อง
        </button>
      </div>
      <label className="block">
        <span className="text-xs text-stone-500">{selected.type === 'label' ? 'ข้อความ' : 'ชื่อที่แสดง'}</span>
        <input className={`${inputCls} py-2`} maxLength={60} placeholder={catalogItem(selected.type).name} value={selected.label || ''} onChange={(e) => updateItem(selected.id, { label: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="กว้าง" value={selected.w} min={5} max={3000} onChange={(v) => updateItem(selected.id, { w: v })} />
        <NumberField label={selected.type === 'label' ? 'ขนาดตัวอักษร' : 'ลึก'} value={selected.d} min={2} max={3000} onChange={(v) => updateItem(selected.id, { d: v })} />
        <NumberField label="ตำแหน่ง X" value={selected.x} min={-2000} max={5000} onChange={(v) => updateItem(selected.id, { x: v })} />
        <NumberField label="ตำแหน่ง Y" value={selected.y} min={-2000} max={5000} onChange={(v) => updateItem(selected.id, { y: v })} />
      </div>
      <div>
        <span className="text-xs text-stone-500">การหมุน {Math.round(selected.rot || 0)}°</span>
        <div className="flex items-center gap-2">
          <button onClick={() => updateItem(selected.id, { rot: ((selected.rot || 0) + 270) % 360 })} className={`${btnGhost} px-2.5 py-2`} aria-label="หมุนซ้าย 90°">
            <RotateCcw className="w-4 h-4" />
          </button>
          <input type="range" min={0} max={359} value={selected.rot || 0} onChange={(e) => setDesign((d) => ({ ...d, items: d.items.map((i) => (i.id === selected.id ? { ...i, rot: Number(e.target.value) } : i)) }))}
            onPointerDown={() => (drag.current = { mode: 'slider', before: design })} onPointerUp={() => { if (drag.current?.mode === 'slider') commit(drag.current.before); drag.current = null; }}
            className="flex-1 accent-amber-600" aria-label="องศา" />
          <button onClick={() => updateItem(selected.id, { rot: ((selected.rot || 0) + 90) % 360 })} className={`${btnGhost} px-2.5 py-2`} aria-label="หมุนขวา 90°">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div>
        <span className="text-xs text-stone-500 block mb-1.5">สี</span>
        <ColorPicker value={selected.color} onChange={(c) => updateItem(selected.id, { color: c })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => duplicate(selected)} className={`${btnGhost} py-2`}>
          <Copy className="w-4 h-4" /> ทำซ้ำ
        </button>
        <button onClick={() => removeItem(selected.id)} className={`${btnGhost} py-2 text-rose-600`}>
          <Trash2 className="w-4 h-4" /> ลบ
        </button>
        <button onClick={() => reorder(selected.id, 1)} className={`${btnGhost} py-2`}>
          <ChevronUp className="w-4 h-4" /> ยกขึ้นบน
        </button>
        <button onClick={() => reorder(selected.id, -1)} className={`${btnGhost} py-2`}>
          <ChevronDown className="w-4 h-4" /> ไว้ด้านล่าง
        </button>
      </div>
    </div>
  ) : (
    roomPanel
  );

  // ---------- selection overlay ----------
  const handleR = 7 / view.s; // handle radius in cm so it stays ~7px on screen
  const overlay = selected && (
    <g transform={`translate(${selected.x} ${selected.y}) rotate(${selected.rot || 0})`}>
      <rect x={-selected.w / 2} y={-selected.d / 2} width={selected.w} height={selected.d} fill="none" stroke="#d97706" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray="6 4" pointerEvents="none" />
      <line x1={0} y1={-selected.d / 2} x2={0} y2={-selected.d / 2 - 26 / view.s} stroke="#d97706" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <circle cx={0} cy={-selected.d / 2 - 26 / view.s} r={handleR} fill="#fff" stroke="#d97706" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ cursor: 'grab' }} onPointerDown={(e) => onPointerDown(e, 'rotate', selected)} />
      <rect x={selected.w / 2 - handleR} y={selected.d / 2 - handleR} width={handleR * 2} height={handleR * 2} fill="#d97706" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => onPointerDown(e, 'resize', selected)} />
      <text y={selected.d / 2 + 18 / view.s} textAnchor="middle" fontSize={12 / view.s} fill="#b45309" stroke="#fff" strokeWidth={3 / view.s} paintOrder="stroke" transform={`rotate(${-(selected.rot || 0)})`} pointerEvents="none" style={{ fontFamily: 'Prompt, sans-serif' }}>
        {Math.round(selected.w)} × {Math.round(selected.d)} ซม.
      </text>
    </g>
  );

  const tool = 'p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30 text-stone-700';
  const lockIcon = !active && <Lock className="w-3.5 h-3.5" />;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-stone-100">
      {/* toolbar */}
      <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center gap-1 overflow-x-auto">
        <input
          className="border border-transparent hover:border-stone-200 focus:border-amber-600 rounded-lg px-2 py-1.5 text-sm font-medium w-40 sm:w-56 focus:outline-none"
          value={name}
          maxLength={120}
          onChange={(e) => (setDraft((d) => ({ ...d, name: e.target.value })), setDirty(true))}
          aria-label="ชื่อแบบ"
        />
        {dirty && projectId && <span className="text-xs text-amber-700 whitespace-nowrap">ยังไม่บันทึก</span>}
        <span className="w-px h-6 bg-stone-200 mx-1" />
        <button className={tool} onClick={undo} disabled={!past.length} title="ย้อนกลับ (Ctrl+Z)">
          <Undo2 className="w-5 h-5" />
        </button>
        <button className={tool} onClick={redo} disabled={!future.length} title="ทำซ้ำ (Ctrl+Y)">
          <Redo2 className="w-5 h-5" />
        </button>
        <span className="w-px h-6 bg-stone-200 mx-1" />
        <button className={tool} onClick={() => zoomAt(1 / 1.25)} title="ซูมออก">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button className={tool} onClick={fit} title="พอดีจอ">
          <Maximize className="w-5 h-5" />
        </button>
        <button className={tool} onClick={() => zoomAt(1.25)} title="ซูมเข้า">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className={`${tool} ${showGrid ? 'bg-stone-100' : ''}`} onClick={() => setShowGrid((v) => !v)} title="เส้นตาราง 50 ซม.">
          <Grid3x3 className="w-5 h-5" />
        </button>
        <button className={`${tool} ${showLabels ? 'bg-stone-100' : ''}`} onClick={() => setShowLabels((v) => !v)} title="แสดงชื่อ">
          <Tag className="w-5 h-5" />
        </button>
        <label className="flex items-center gap-1 text-xs text-stone-600 px-2 whitespace-nowrap">
          <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-amber-600" /> จับระยะ 5 ซม.
        </label>
        <div className="ml-auto flex items-center gap-1">
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={startNew} title="แบบใหม่">
            <FilePlus2 className="w-5 h-5" /> <span className="hidden lg:inline">ใหม่</span>
          </button>
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={() => (session ? setProjectsOpen(true) : onNeedAccess('เปิดแบบที่บันทึกไว้'))} title="แบบของฉัน">
            <FolderOpen className="w-5 h-5" /> <span className="hidden lg:inline">แบบของฉัน</span>
          </button>
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={doExport} title="ส่งออกรูป PNG">
            <Download className="w-5 h-5" /> <span className="hidden lg:inline">ส่งออกรูป</span> {lockIcon}
          </button>
          <button className={`${btnPrimary} py-2 whitespace-nowrap`} onClick={() => save(false)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึก {lockIcon}
          </button>
          {projectId && active && (
            <button className={`${btnGhost} py-2 whitespace-nowrap hidden sm:inline-flex`} onClick={() => save(true)} disabled={saving}>
              บันทึกเป็นแบบใหม่
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <aside className="hidden md:block w-72 shrink-0 bg-white border-r border-stone-200 overflow-y-auto p-4">{catalogPanel}</aside>

        <div ref={wrapRef} className="relative flex-1 min-h-[45vh] overflow-hidden touch-none select-none">
          {!active && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-amber-50 border border-amber-200 text-amber-900 rounded-full px-4 py-1.5 text-xs shadow-sm whitespace-nowrap">
              โหมดทดลองใช้ — <button onClick={() => onNeedAccess('บันทึกและส่งออกแบบ')} className="underline font-medium">ซื้อแพ็กเกจ</button> เพื่อบันทึกและส่งออก
            </div>
          )}
          <svg
            ref={svgRef}
            width={size.w}
            height={size.h}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => onPointerDown(e, 'pan')}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <g transform={`translate(${view.ox} ${view.oy}) scale(${view.s})`}>
              <PlanContent design={design} showGrid={showGrid} showLabels={showLabels} />
              {/* invisible hit areas, drawn top-most so every item can be grabbed */}
              {design.items.map((it) => (
                <rect
                  key={it.id}
                  x={-it.w / 2}
                  y={-it.d / 2}
                  width={it.w}
                  height={it.d}
                  transform={`translate(${it.x} ${it.y}) rotate(${it.rot || 0})`}
                  fill="transparent"
                  style={{ cursor: 'move' }}
                  onPointerDown={(e) => onPointerDown(e, 'move', it)}
                />
              ))}
              {overlay}
            </g>
          </svg>
          <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg px-2.5 py-1 text-xs text-stone-600 border border-stone-200">
            {formatLength(design.room.w)} × {formatLength(design.room.d)} · {design.items.length} ชิ้น
          </div>
        </div>

        <aside className="hidden md:block w-72 shrink-0 bg-white border-l border-stone-200 overflow-y-auto p-4">{propsPanel}</aside>

        {/* mobile panels */}
        <div className="md:hidden bg-white border-t border-stone-200 max-h-[45vh] flex flex-col">
          <div className="flex border-b border-stone-200 text-sm">
            {[
              ['add', 'เพิ่มเฟอร์นิเจอร์'],
              ['props', selected ? itemName(selected) : 'ตั้งค่าห้อง'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setMobileTab(id)} className={`flex-1 py-2.5 truncate px-2 ${mobileTab === id ? 'border-b-2 border-stone-900 font-medium' : 'text-stone-500'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto p-4">{mobileTab === 'add' ? catalogPanel : propsPanel}</div>
        </div>
      </div>

      {projectsOpen && session && <ProjectsModal code={session.code} notify={notify} onClose={() => setProjectsOpen(false)} onOpen={openProject} />}
    </div>
  );
}
