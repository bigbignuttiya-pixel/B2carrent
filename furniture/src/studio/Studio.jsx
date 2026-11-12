// FORMA STUDIO — furniture designer: 2D front view, 3D model, cut list on standard sheets, costing, quotation,
// and measuring from photos. Saving to the cloud and every export need an active access code.
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Undo2, Redo2, Save, FolderOpen, FilePlus2, Lock, Loader2, Upload, FileJson, PencilRuler, Box, Scissors, Calculator, Camera,
  DoorOpen, DoorClosed, Eye, Maximize, ImageDown, Layers, Archive, Shirt,
} from 'lucide-react';
import { buildPiece, newPiece, newStudioDesign, normalizePiece, freeSpot, DEFAULT_PRICING, DEFAULT_MATERIALS, uid, matById, innerHeight } from './model';
import { analyzeProject } from './costing';
import FrontView from './FrontView';
import { PiecesPanel, PropsPanel } from './Panels';
import { CutListView, CostView, QuoteModal } from './CutCost';
import PhotoMeasure from './PhotoMeasure';
import Configurator from './Configurator';
import { HERO_SHOTS, PRODUCTS, PORTFOLIO } from '../customer/showcase';
import { printQuotation, printCutSheet, downloadCutCsv, downloadBlob, safeName } from './printDocs';
import { usePersistentState } from '../lib/storage';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import ProjectsModal, { isStudio, openInRoomPlanner } from '../components/ProjectsModal';
import { btnPrimary, btnGhost, Spinner } from '../components/ui';

const Viewer3D = lazy(() => import('./Viewer3D'));

const TABS = [
  { id: '3d', label: 'ห้องโชว์ 3D', icon: Box },
  { id: 'design', label: 'ออกแบบ 2D', icon: PencilRuler },
  { id: 'cut', label: 'ใบตัดไม้', icon: Scissors },
  { id: 'cost', label: 'ต้นทุน / ใบเสนอราคา', icon: Calculator },
  { id: 'photo', label: 'วัดจากรูป', icon: Camera },
];
const ELEMENTS = [
  ['shelf', 'ชั้นวาง', Layers],
  ['drawer', 'ลิ้นชัก', Archive],
  ['rod', 'ราวแขวน', Shirt],
];

// Bring any saved / imported design up to the current shape
function migrate(d) {
  const base = newStudioDesign();
  const src = d && typeof d === 'object' ? d : base;
  const materials = Array.isArray(src.pricing?.materials) && src.pricing.materials.length ? src.pricing.materials : DEFAULT_MATERIALS;
  const pricing = { ...DEFAULT_PRICING, ...(src.pricing || {}), materials };
  const items = (Array.isArray(src.items) ? src.items : base.items).filter((p) => p && ['box', 'table', 'bed'].includes(p.kind)).map((p) => normalizePiece({ ...newPiece(p.template || 'box'), ...p }, materials));
  return { version: 1, kind: 'studio', room: { kind: 'studio' }, items, pricing, photo: src.photo || null };
}

export default function Studio({ settings, session, onNeedAccess, notify }) {
  const [draft, setDraft] = usePersistentState('furniture:studio', { projectId: null, name: 'โปรเจกต์เฟอร์นิเจอร์', design: newStudioDesign() });
  const design = useMemo(() => migrate(draft.design), [draft.design]);
  const { name, projectId } = draft;
  const materials = design.pricing.materials;

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(() => design.items[0]?.id || null);
  const [selection, setSelection] = useState({ col: 0, item: null });
  const [tab, setTab] = useState('3d');
  const [mobilePanel, setMobilePanel] = useState('props');
  const [showDoors, setShowDoors] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [ghost, setGhost] = useState(null); // palette drag { kind, x, y }
  const dropRef = useRef(null);
  const viewerRef = useRef(null);
  const fileRef = useRef(null);

  const active = Boolean(session?.account.active);
  const piece = design.items.find((p) => p.id === selectedId) || design.items[0] || null;
  const analysis = useMemo(() => analyzeProject(design), [design]);

  // ---------- history ----------
  const setDesign = useCallback((fn) => setDraft((d) => ({ ...d, design: fn(migrate(d.design)) })), [setDraft]);
  const begin = useCallback(() => {
    setPast((p) => [...p.slice(-60), design]);
    setFuture([]);
    setDirty(true);
  }, [design]);
  const change = useCallback(
    (fn) => {
      begin();
      setDesign(fn);
    },
    [begin, setDesign]
  );
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [design, ...f]);
    setDraft((d) => ({ ...d, design: past[past.length - 1] }));
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, design]);
    setDraft((d) => ({ ...d, design: future[0] }));
    setFuture((f) => f.slice(1));
  };

  const mapPiece = (d, id, fn) => ({ ...d, items: d.items.map((p) => (p.id === id ? normalizePiece(fn(p), d.pricing.materials) : p)) });
  const updatePiece = (fn) => piece && change((d) => mapPiece(d, piece.id, fn));
  const livePiece = (fn) => piece && setDesign((d) => mapPiece(d, piece.id, fn));
  const setPricing = (patch) =>
    change((d) => {
      const pricing = { ...d.pricing, ...patch };
      return { ...d, pricing, items: d.items.map((p) => normalizePiece(p, pricing.materials)) };
    });

  const selectPiece = (id) => {
    setSelectedId(id);
    setSelection({ col: 0, item: null });
  };
  const addPiece = (templateId, extra) => {
    const p = newPiece(templateId, extra);
    change((d) => ({ ...d, items: [...d.items, p] }));
    selectPiece(p.id);
    return p;
  };
  const movePiece = (id, dir) =>
    change((d) => {
      const i = d.items.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.items.length) return d;
      const items = [...d.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...d, items };
    });

  const actions = {
    duplicate: () => {
      const copy = { ...structuredClone(piece), id: uid(), name: `${piece.name} (สำเนา)` };
      if (copy.columns) copy.columns = copy.columns.map((c) => ({ ...c, id: uid(), items: c.items.map((it) => ({ ...it, id: uid() })) }));
      change((d) => {
        const i = d.items.findIndex((p) => p.id === piece.id);
        const items = [...d.items];
        items.splice(i + 1, 0, copy);
        return { ...d, items };
      });
      selectPiece(copy.id);
    },
    remove: () => {
      if (!window.confirm(`ลบ "${piece.name}"?`)) return;
      const rest = design.items.filter((p) => p.id !== piece.id);
      change((d) => ({ ...d, items: d.items.filter((p) => p.id !== piece.id) }));
      selectPiece(rest[0]?.id || null);
    },
    addColumn: () => {
      const ci = selection.col ?? piece.columns.length - 1;
      updatePiece((p) => {
        const cols = [...p.columns];
        const c = cols[ci] || cols[cols.length - 1];
        const idx = cols.indexOf(c);
        cols.splice(idx, 1, { ...c, w: c.w / 2 }, { id: uid(), w: c.w / 2, door: c.door === 'double' ? 'right' : c.door, items: [] });
        if (c.door === 'double') cols[idx] = { ...cols[idx], door: 'left' };
        return { ...p, columns: cols };
      });
      setSelection({ col: ci + 1, item: null });
    },
    removeColumn: () => {
      const ci = selection.col ?? piece.columns.length - 1;
      updatePiece((p) => (p.columns.length < 2 ? p : { ...p, columns: p.columns.filter((_, i) => i !== ci) }));
      setSelection({ col: Math.max(0, ci - 1), item: null });
    },
    addElement: (kind, ci, y) => {
      if (!piece || piece.kind !== 'box') return;
      const col = piece.columns[ci] ?? piece.columns[0];
      const idx = piece.columns.indexOf(col);
      const id = uid();
      const h = kind === 'drawer' ? 18 : 0;
      const at = y == null ? freeSpot(piece, materials, col, kind) : Math.max(0, y - (kind === 'drawer' ? h / 2 : 0));
      updatePiece((p) => ({ ...p, columns: p.columns.map((c, i) => (i === idx ? { ...c, items: [...c.items, { id, kind, y: Math.round(at), h }] } : c)) }));
      setSelection({ col: idx, item: id });
    },
    removeElement: (ci, id) => {
      updatePiece((p) => ({ ...p, columns: p.columns.map((c, i) => (i === ci ? { ...c, items: c.items.filter((x) => x.id !== id) } : c)) }));
      setSelection({ col: ci, item: null });
    },
  };

  // Landing page "ออกแบบชิ้นนี้": #studio?showcase=<id> adds that sample's pieces to the project
  useEffect(() => {
    const open = () => {
      const m = window.location.hash.match(/^#studio\?showcase=([\w-]+)/);
      if (!m) return;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#studio`);
      const shot = [...PRODUCTS, ...PORTFOLIO, ...HERO_SHOTS].find((x) => x.id === m[1]);
      if (!shot) return;
      const pieces = shot.pieces.map((x) => newPiece(x.template, x));
      change((d) => {
        // fixed positions (wall cabinets over base cabinets) are relative to where this set starts in the row
        const start = d.items.reduce((x, p) => (p.posX == null ? x + buildPiece(p, d.pricing.materials).outer.outerW + (p.gap ?? 30) : x), 0);
        return { ...d, items: [...d.items, ...pieces.map((p) => (p.posX == null ? p : { ...p, posX: p.posX + start }))] };
      });
      setTimeout(() => viewerRef.current?.fit(), 400);
      selectPiece(pieces[0].id);
      setTab('3d');
      notify(`เพิ่ม "${shot.name || shot.title}" ในโปรเจกต์แล้ว — ปรับขนาด สี และวัสดุได้เลย`);
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: undo / redo / delete element
  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selection.item && piece?.kind === 'box') {
        e.preventDefault();
        actions.removeElement(selection.col, selection.item);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------- palette drag (mouse and touch) ----------
  const startPaletteDrag = (e, kind) => {
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    const mv = (ev) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return;
      moved = true;
      setGhost({ kind, x: ev.clientX, y: ev.clientY });
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      setGhost(null);
      if (!moved) return actions.addElement(kind, selection.col ?? 0);
      const hit = dropRef.current?.(ev.clientX, ev.clientY);
      if (hit) actions.addElement(kind, hit.col, hit.y);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  // ---------- projects / files (paid) ----------
  const requireActive = (what) => {
    if (active) return true;
    onNeedAccess(what);
    return false;
  };

  const payload = () => {
    let data = design;
    if (JSON.stringify(data).length > 360000 && data.photo?.src) {
      data = { ...data, photo: { ...data.photo, src: null } };
      notify('รูปในแท็บ "วัดจากรูป" ใหญ่เกินไป จึงบันทึกเฉพาะค่าที่วัดไว้', 'info');
    }
    return data;
  };
  const save = async (asNew = false) => {
    if (!requireActive('บันทึกโปรเจกต์')) return;
    setSaving(true);
    try {
      const r = await api.saveProject(session.code, asNew ? null : projectId, name, payload());
      setDraft((d) => ({ ...d, projectId: r.id, name: r.name }));
      setDirty(false);
      notify('บันทึกโปรเจกต์แล้ว');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };
  const loadDesign = (data, meta) => {
    const d = migrate(data);
    setDraft({ projectId: meta.id ?? null, name: meta.name || 'โปรเจกต์เฟอร์นิเจอร์', design: d });
    setPast([]);
    setFuture([]);
    setDirty(false);
    selectPiece(d.items[0]?.id || null);
  };
  const openProject = async (p) => {
    try {
      const r = await api.getProject(session.code, p.id);
      setProjectsOpen(false);
      if (!isStudio(r.data)) return openInRoomPlanner(r);
      loadDesign(r.data, r);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };
  const startNew = () => {
    if (dirty && !window.confirm('เริ่มโปรเจกต์ใหม่? งานที่ยังไม่บันทึกจะหายไป')) return;
    loadDesign(newStudioDesign(), { name: 'โปรเจกต์ใหม่' });
  };
  const exportJson = () => {
    if (!requireActive('บันทึกไฟล์แบบ')) return;
    downloadBlob(new Blob([JSON.stringify({ app: 'forma-studio', version: 1, name, design }, null, 1)], { type: 'application/json' }), `${safeName(name)}.forma.json`);
  };
  const importJson = async (file) => {
    try {
      const j = JSON.parse(await file.text());
      const data = j.design || j;
      if (!Array.isArray(data.items)) throw new Error('bad');
      if (dirty && !window.confirm('เปิดไฟล์แบบนี้? งานที่ยังไม่บันทึกจะหายไป')) return;
      loadDesign(data, { name: j.name || file.name.replace(/\.(forma\.)?json$/i, '') });
      notify('เปิดไฟล์แบบแล้ว');
    } catch {
      notify('ไฟล์นี้ไม่ใช่ไฟล์แบบของ FORMA STUDIO', 'error');
    }
  };
  const popupBlocked = (ok) => ok || notify('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up', 'error');
  const doCsv = () => requireActive('ส่งออกรายการตัดไม้') && downloadCutCsv(analysis, name);
  const doCutPdf = () => requireActive('พิมพ์ใบตัดไม้') && popupBlocked(printCutSheet({ design, analysis, settings, name }));
  const doQuote = () => requireActive('สร้างใบเสนอราคา') && setQuoteOpen(true);
  const doSnapshot = () => {
    if (!requireActive('ส่งออกรูป 3D')) return;
    const url = viewerRef.current?.snapshot();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName(name)}-3d.png`;
    a.click();
  };

  // ---------- layout ----------
  const tool = 'p-2 rounded-lg hover:bg-stone-100 disabled:opacity-30 text-stone-700';
  const lockIcon = !active && <Lock className="w-3.5 h-3.5" />;
  const piecesPanel = <PiecesPanel design={design} selectedId={piece?.id} onSelect={selectPiece} onAdd={(id) => addPiece(id)} onMove={movePiece} />;
  const propsPanel = <PropsPanel piece={piece} design={design} selection={selection} onSelect={setSelection} update={updatePiece} actions={actions} />;
  const isBox = piece?.kind === 'box';

  const editor = (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row">
      <aside className="hidden md:block w-64 shrink-0 bg-white border-r border-stone-200 overflow-y-auto p-3">{piecesPanel}</aside>
      <div className="relative flex-1 min-h-[48vh] md:min-h-0 overflow-hidden bg-stone-100 bg-[radial-gradient(circle,rgba(120,113,108,.18)_1px,transparent_1px)] [background-size:18px_18px]">
        {tab === 'design' ? (
          piece ? (
            <>
              <div className="absolute inset-0 p-4 pt-16 pb-10">
                <FrontView piece={piece} materials={materials} showDoors={showDoors} selection={selection} onSelect={setSelection} onBegin={begin} onLive={livePiece} dropRef={dropRef} />
              </div>
              <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2">
                {isBox && (
                  <div className="flex items-center gap-1 bg-white rounded-xl border border-stone-200 p-1 shadow-sm">
                    <span className="text-[11px] text-stone-500 px-1.5 hidden sm:inline">ลากไปวางในตู้:</span>
                    {ELEMENTS.map(([k, label, Icon]) => (
                      <button key={k} onPointerDown={(e) => startPaletteDrag(e, k)} className="touch-none inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-50 border border-transparent hover:border-amber-300 cursor-grab">
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                )}
                {isBox && (
                  <button onClick={() => setShowDoors((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border shadow-sm ${showDoors ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200'}`}>
                    {showDoors ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />} {showDoors ? 'ซ่อนบาน (ดูภายใน)' : 'แสดงบานประตู'}
                  </button>
                )}
              </div>
              <div className="hidden sm:block absolute bottom-3 left-3 bg-white/90 rounded-lg px-2.5 py-1 text-xs text-stone-600 border border-stone-200">
                {piece.name} · {piece.W} × {piece.D} × {piece.H} ซม.{isBox ? ` · ภายในสูง ${innerHeight(piece, materials)} ซม. · ไม้ ${matById(materials, piece.carcass).t * 10} มม.` : ''}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-stone-500 text-sm">เพิ่มเฟอร์นิเจอร์จากรายการด้านซ้าย</div>
          )
        ) : (
          <>
            <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-stone-400"><Spinner className="w-8 h-8" /></div>}>
              <Viewer3D ref={viewerRef} pieces={design.items} materials={materials} selectedId={piece?.id} allOpen={allOpen} onlySelected={onlySelected} />
            </Suspense>
            <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-none">
              <button onClick={() => setAllOpen((v) => !v)} className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border shadow-sm ${allOpen ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200'}`}>
                {allOpen ? <DoorClosed className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />} {allOpen ? 'ปิดบานทั้งหมด' : 'เปิดบาน / ลิ้นชักทั้งหมด'}
              </button>
              {design.items.length > 1 && (
                <button onClick={() => setOnlySelected((v) => !v)} className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border bg-white border-stone-200 shadow-sm">
                  <Eye className="w-4 h-4" /> {onlySelected ? 'แสดงทุกชิ้น' : 'แสดงเฉพาะชิ้นที่เลือก'}
                </button>
              )}
              <button onClick={() => viewerRef.current?.fit()} className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border bg-white border-stone-200 shadow-sm">
                <Maximize className="w-4 h-4" /> พอดีจอ
              </button>
              <button onClick={doSnapshot} className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border bg-white border-stone-200 shadow-sm">
                <ImageDown className="w-4 h-4" /> บันทึกรูป {lockIcon}
              </button>
            </div>
            <div className="hidden sm:block absolute bottom-3 left-3 bg-white/90 rounded-lg px-2.5 py-1 text-xs text-stone-600 border border-stone-200 pointer-events-none">
              ลากเพื่อหมุน · ล้อเมาส์ / สองนิ้วเพื่อซูม · แตะบานหรือลิ้นชักเพื่อเปิด-ปิด
            </div>
          </>
        )}
        {!active && (
          <div className="absolute bottom-3 right-3 z-10 bg-amber-50 border border-amber-200 text-amber-900 rounded-full px-3 py-1.5 text-xs shadow-sm">
            โหมดทดลอง — <button onClick={() => onNeedAccess('บันทึกและส่งออกแบบ')} className="underline font-medium">ซื้อแพ็กเกจ</button>
          </div>
        )}
      </div>
      <aside className="hidden md:block w-80 shrink-0 bg-white border-l border-stone-200 overflow-y-auto p-4">{propsPanel}</aside>
      <div className="md:hidden bg-white border-t border-stone-200 max-h-[48vh] flex flex-col">
        <div className="flex border-b border-stone-200 text-sm">
          {[
            ['pieces', `ชิ้นงาน (${design.items.length})`],
            ['props', piece ? piece.name : 'ปรับแต่ง'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setMobilePanel(id)} className={`flex-1 py-2.5 truncate px-2 ${mobilePanel === id ? 'border-b-2 border-stone-900 font-medium' : 'text-stone-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-4">{mobilePanel === 'pieces' ? piecesPanel : propsPanel}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-stone-100">
      {/* toolbar */}
      <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center gap-1 overflow-x-auto">
        <span className="text-xs font-bold tracking-[0.2em] text-amber-700 mr-1 whitespace-nowrap hidden sm:inline">FORMA STUDIO</span>
        <input
          className="border border-transparent hover:border-stone-200 focus:border-amber-600 rounded-lg px-2 py-1.5 text-sm font-medium w-40 sm:w-56 focus:outline-none"
          value={name}
          maxLength={120}
          onChange={(e) => (setDraft((d) => ({ ...d, name: e.target.value })), setDirty(true))}
          aria-label="ชื่อโปรเจกต์"
        />
        {dirty && projectId && <span className="text-xs text-amber-700 whitespace-nowrap">ยังไม่บันทึก</span>}
        <span className="w-px h-6 bg-stone-200 mx-1" />
        <button className={tool} onClick={undo} disabled={!past.length} title="ย้อนกลับ (Ctrl+Z)">
          <Undo2 className="w-5 h-5" />
        </button>
        <button className={tool} onClick={redo} disabled={!future.length} title="ทำซ้ำ (Ctrl+Y)">
          <Redo2 className="w-5 h-5" />
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={startNew} title="โปรเจกต์ใหม่">
            <FilePlus2 className="w-5 h-5" /> <span className="hidden lg:inline">ใหม่</span>
          </button>
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={() => (session ? setProjectsOpen(true) : onNeedAccess('เปิดโปรเจกต์ที่บันทึกไว้'))} title="โปรเจกต์ของฉัน">
            <FolderOpen className="w-5 h-5" /> <span className="hidden lg:inline">โปรเจกต์ของฉัน</span>
          </button>
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={() => fileRef.current?.click()} title="เปิดไฟล์แบบ (.json)">
            <Upload className="w-5 h-5" /> <span className="hidden xl:inline">เปิดไฟล์</span>
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => (e.target.files[0] && importJson(e.target.files[0]), (e.target.value = ''))} />
          <button className={`${tool} flex items-center gap-1 text-sm whitespace-nowrap`} onClick={exportJson} title="บันทึกเป็นไฟล์ (.json)">
            <FileJson className="w-5 h-5" /> <span className="hidden xl:inline">บันทึกไฟล์</span> {lockIcon}
          </button>
          <button className={`${btnPrimary} py-2 whitespace-nowrap`} onClick={() => save(false)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึก {lockIcon}
          </button>
          {projectId && active && (
            <button className={`${btnGhost} py-2 whitespace-nowrap hidden sm:inline-flex`} onClick={() => save(true)} disabled={saving}>
              บันทึกเป็นโปรเจกต์ใหม่
            </button>
          )}
        </div>
      </div>
      {/* tabs */}
      <nav className="bg-white border-b border-stone-200 px-2 flex gap-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 ${tab === id ? 'border-amber-600 text-stone-900 font-medium' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
            <Icon className="w-4 h-4" /> {label}
            {id === 'cost' && <span className="text-xs text-stone-400">ทุน ฿{Math.round(analysis.cost).toLocaleString('th-TH')}</span>}
          </button>
        ))}
      </nav>

      {tab === '3d' ? (
        <Configurator
          design={design}
          piece={piece}
          analysis={analysis}
          selectedId={piece?.id}
          onSelect={selectPiece}
          onAdd={(id) => addPiece(id)}
          update={updatePiece}
          undo={undo}
          redo={redo}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onQuote={doQuote}
          onSnapshot={doSnapshot}
          viewerRef={viewerRef}
          locked={!active}
        />
      ) : tab === 'design' ? (
        editor
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {tab === 'cut' ? (
            <CutListView design={design} analysis={analysis} setPricing={setPricing} onCsv={doCsv} onPrint={doCutPdf} locked={!active} />
          ) : tab === 'cost' ? (
            <CostView design={design} analysis={analysis} setPricing={setPricing} onQuote={doQuote} locked={!active} />
          ) : (
            <div className="h-full">
              <PhotoMeasure
                photo={design.photo}
                pricing={design.pricing}
                notify={notify}
                onBegin={begin}
                onChange={(photo) => setDesign((d) => ({ ...d, photo }))}
                onCreatePiece={({ name: n, W, H }) => {
                  if (!(W > 0 && H > 0)) return notify('กำหนดสเกลก่อน', 'error');
                  const p = newPiece('box', { name: n, W: Math.min(600, W), H: Math.min(300, H), D: 40 });
                  change((d) => ({ ...d, items: [...d.items, p] }));
                  selectPiece(p.id);
                  setTab('design');
                  notify(`สร้าง "${n}" ${W}×${H} ซม. แล้ว`);
                }}
              />
            </div>
          )}
        </div>
      )}

      {ghost && (
        <div className="fixed z-[80] pointer-events-none -translate-x-1/2 -translate-y-1/2 bg-amber-600 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg" style={{ left: ghost.x, top: ghost.y }}>
          {ELEMENTS.find((e) => e[0] === ghost.kind)?.[1]}
        </div>
      )}
      {projectsOpen && session && <ProjectsModal code={session.code} notify={notify} onClose={() => setProjectsOpen(false)} onOpen={openProject} />}
      {quoteOpen && (
        <QuoteModal
          open
          projectName={name}
          onClose={() => setQuoteOpen(false)}
          onPrint={(info) => {
            popupBlocked(printQuotation({ design, analysis, settings, info }));
            setQuoteOpen(false);
          }}
        />
      )}
    </div>
  );
}
