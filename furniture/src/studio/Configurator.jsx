// "ห้องโชว์ 3D" — configurator around a realistic 3D model: interior, dimensions, doors and finishes
import { Suspense, lazy, useRef, useState } from 'react';
import {
  Undo2, Redo2, RotateCcw, Minus, Plus, LayoutGrid, Ruler, DoorOpen, DoorClosed, Lock, FileText, ImageDown, Home, Shirt, Layers, Archive,
  ChevronDown, Palette, Sparkles, Aperture, X,
} from 'lucide-react';
import { FINISHES, TEMPLATES, autoLayout, countItems, finishById, matById } from './model';
import { money } from './costing';
import { Spinner } from '../components/ui';

const Viewer3D = lazy(() => import('./Viewer3D'));
const r1 = (n) => Math.round(n * 10) / 10;
const card = 'rounded-2xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_18px_50px_-18px_rgba(41,37,36,.35)]';
const WALLS = ['#e8e4dc', '#f4f1ea', '#d9dfe3', '#34507f', '#cfd6c7', '#e9dccf'];

function CardTitle({ icon: Icon, children, right }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
      <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 grid place-items-center">
        <Icon className="w-4 h-4" />
      </span>
      <p className="font-semibold text-sm text-stone-800">{children}</p>
      <span className="ml-auto">{right}</span>
    </div>
  );
}

function Stepper({ icon: Icon, label, value, onChange, min = 0, max = 99, step = 1, unit, disabled }) {
  return (
    <div className={`flex items-center gap-2 py-1.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {Icon && <Icon className="w-4 h-4 text-stone-400 shrink-0" />}
      <span className="text-sm text-stone-600 flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center rounded-xl border border-stone-200 bg-white overflow-hidden">
        <button onClick={() => onChange(Math.max(min, r1(value - step)))} className="w-8 h-8 grid place-items-center hover:bg-stone-100 text-stone-500" aria-label={`ลด${label}`}>
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          className="w-14 text-center text-sm font-medium bg-transparent focus:outline-none"
          value={value}
          inputMode="decimal"
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
        />
        {unit && <span className="text-[10px] text-stone-400 pr-1">{unit}</span>}
        <button onClick={() => onChange(Math.min(max, r1(value + step)))} className="w-8 h-8 grid place-items-center hover:bg-stone-100 text-stone-500" aria-label={`เพิ่ม${label}`}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded-xl bg-stone-100 p-1 gap-1">
      {options.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${value === id ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function FinishSwatches({ value, onChange, front, allowNone }) {
  const list = FINISHES.filter((f) => front || !f.frontOnly);
  return (
    <div className="flex flex-wrap gap-1.5">
      {allowNone && (
        <button onClick={() => onChange(null)} title="เหมือนโครงตู้" className={`h-7 px-2 rounded-lg border text-[10px] ${!value ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-stone-200 text-stone-500'}`}>
          เหมือนโครง
        </button>
      )}
      {list.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          title={f.name}
          className={`w-7 h-7 rounded-lg border transition hover:scale-110 ${value === f.id ? 'ring-2 ring-orange-500 ring-offset-1 border-transparent' : 'border-stone-200'}`}
          style={{
            background:
              f.kind === 'wood'
                ? `repeating-linear-gradient(100deg, ${f.color} 0 3px, color-mix(in srgb, ${f.color} 82%, #5b3a1e) 3px 4px, ${f.color} 4px 7px)`
                : f.kind === 'mirror'
                  ? 'linear-gradient(135deg,#f8fafc,#94a3b8 45%,#f1f5f9 55%,#cbd5e1)'
                  : f.kind === 'glass'
                    ? 'linear-gradient(135deg,rgba(226,232,240,.9),rgba(203,213,225,.5))'
                    : f.color,
          }}
        />
      ))}
    </div>
  );
}

export default function Configurator({ design, piece, analysis, selectedId, onSelect, onAdd, update, undo, redo, canUndo, canRedo, onQuote, onSnapshot, onSaveImage, viewerRef, locked }) {
  const materials = design.pricing.materials;
  const [col, setCol] = useState(0);
  const [allOpen, setAllOpen] = useState(false);
  const [showRoom, setShowRoom] = useState(true);
  const [showDecor, setShowDecor] = useState(true);
  const [wall, setWall] = useState(WALLS[0]);
  const [az, setAz] = useState(20);
  const [zoom, setZoom] = useState(100);
  const [addOpen, setAddOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('inside');
  const azTimer = useRef(0);
  const [pt, setPt] = useState(null); // { progress } while rendering
  const [photo, setPhoto] = useState(null); // finished photoreal image
  const cancelRef = useRef(false);
  const photoreal = async () => {
    if (pt) return;
    cancelRef.current = false;
    setPt({ progress: 0, started: Date.now() });
    try {
      const small = window.innerWidth < 768;
      const url = await viewerRef.current?.renderPhotoreal({ samples: window.__FORMA_PT_SAMPLES || (small ? 64 : 160), onProgress: (p) => setPt((x) => x && { ...x, progress: p }), isCancelled: () => cancelRef.current });
      if (url) setPhoto(url);
    } catch (err) {
      console.error(err);
      alert('อุปกรณ์นี้เรนเดอร์ภาพสมจริงไม่ได้ (ต้องใช้เบราว์เซอร์ที่รองรับ WebGL2)');
    } finally {
      setPt(null);
    }
  };

  const isBox = piece?.kind === 'box';
  const ci = isBox ? Math.min(col, piece.columns.length - 1) : 0;
  const column = isBox ? piece.columns[ci] : null;
  const counts = column ? countItems(column) : null;
  const t = piece ? matById(materials, piece.carcass).t : 1.8;
  const sliding = piece?.doorStyle === 'sliding';
  const doorMode = !isBox ? null : sliding ? 'sliding' : piece.columns.every((c) => c.door === 'none') ? 'none' : 'hinged';
  const pp = analysis.piecePrices.find((x) => x.id === piece?.id);
  const price = pp?.price || 0;
  const cost = pp?.cost || 0;

  const setCounts = (patch) => update((p) => autoLayout(p, materials, ci, { ...countItems(p.columns[ci]), ...patch }));
  const setColumns = (n) =>
    update((p) => {
      const cur = p.columns;
      if (n === cur.length) return p;
      const inner = p.W - 2 * t - (n - 1) * t;
      const w = inner / n;
      const base = cur[cur.length - 1];
      const cols = Array.from({ length: n }, (_, i) => (cur[i] ? { ...cur[i], w } : { ...base, id: Math.random().toString(36).slice(2, 10), w, items: base.items.map((it) => ({ ...it, id: Math.random().toString(36).slice(2, 10) })) }));
      return { ...p, columns: cols };
    });
  const setDoorMode = (mode) =>
    update((p) => {
      if (mode === 'sliding') return { ...p, doorStyle: 'sliding', slideCount: p.slideCount || Math.max(2, Math.min(4, Math.round(p.W / 80))) };
      if (mode === 'none') return { ...p, doorStyle: 'hinged', columns: p.columns.map((c) => ({ ...c, door: 'none' })) };
      const n = p.columns.length;
      return {
        ...p,
        doorStyle: 'hinged',
        columns: p.columns.map((c, i) => (c.door !== 'none' && p.doorStyle !== 'sliding' ? c : { ...c, door: n === 1 ? (c.w > 60 ? 'double' : 'left') : i < n / 2 ? 'left' : 'right' })),
      };
    });
  const setFinish = (key, colorKey) => (id) => update((p) => ({ ...p, [key]: id, ...(colorKey && id ? { [colorKey]: finishById(id).color } : {}) }));

  // ---------- panels ----------
  const insidePanel = isBox ? (
    <div className="px-4 pb-4">
      <Stepper icon={LayoutGrid} label="จำนวนช่อง" value={piece.columns.length} min={1} max={6} onChange={setColumns} />
      <div className="flex flex-wrap gap-1.5 my-2">
        {piece.columns.map((c, i) => (
          <button key={c.id} onClick={() => setCol(i)} className={`px-2.5 py-1 rounded-lg text-xs border transition ${ci === i ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 hover:border-stone-400'}`}>
            ช่อง {i + 1} · {Math.round(c.w)}
          </button>
        ))}
      </div>
      <Stepper icon={Layers} label="ชั้นวาง" value={counts.shelves} max={12} onChange={(v) => setCounts({ shelves: v })} />
      <Stepper icon={Shirt} label="ราวแขวน" value={counts.rods} max={2} onChange={(v) => setCounts({ rods: v })} />
      <Stepper icon={Archive} label="ลิ้นชัก" value={counts.drawers} max={8} onChange={(v) => setCounts({ drawers: v })} />
      {doorMode === 'hinged' && (
        <label className="flex items-center gap-2 pt-2 text-sm text-stone-600">
          <DoorOpen className="w-4 h-4 text-stone-400" /> บานช่องนี้
          <select className="ml-auto rounded-lg border border-stone-200 px-2 py-1 text-xs bg-white" value={column.door} onChange={(e) => update((p) => ({ ...p, columns: p.columns.map((c, i) => (i === ci ? { ...c, door: e.target.value } : c)) }))}>
            <option value="none">ไม่มีบาน</option>
            <option value="left">บานพับซ้าย</option>
            <option value="right">บานพับขวา</option>
            <option value="double">บานคู่</option>
            <option value="flip">บานยก</option>
          </select>
        </label>
      )}
      <p className="text-[11px] text-stone-400 mt-2">ปรับตำแหน่งละเอียด / ลากชั้น ได้ที่แท็บ "ออกแบบ 2D"</p>
    </div>
  ) : (
    <p className="px-4 pb-4 text-sm text-stone-500">{piece ? 'ชิ้นนี้ไม่มีการจัดภายใน — ปรับขนาดและวัสดุได้ด้านขวา' : 'เพิ่มเฟอร์นิเจอร์เพื่อเริ่มต้น'}</p>
  );

  const sizePanel = piece && (
    <div className="px-4 pb-3">
      <Stepper label={piece.kind === 'bed' ? 'กว้างที่นอน' : 'กว้าง'} unit="มม." value={Math.round(piece.W * 10)} step={10} min={200} max={6000} onChange={(v) => update((p) => ({ ...p, W: v / 10 }))} />
      <Stepper label={piece.kind === 'bed' ? 'สูงพื้นเตียง' : 'สูง'} unit="มม." value={Math.round(piece.H * 10)} step={10} min={150} max={3000} onChange={(v) => update((p) => ({ ...p, H: v / 10 }))} />
      <Stepper label={piece.kind === 'bed' ? 'ยาวที่นอน' : 'ลึก'} unit="มม." value={Math.round(piece.D * 10)} step={10} min={150} max={piece.kind === 'bed' ? 2300 : 1200} onChange={(v) => update((p) => ({ ...p, D: v / 10 }))} />
    </div>
  );

  const doorPanel = piece && (
    <div className="px-4 pb-4 space-y-3">
      {isBox && (
        <>
          <Segmented options={[['hinged', 'บานเปิด'], ['sliding', 'บานเลื่อน'], ['none', 'ไม่มีบาน']]} value={doorMode} onChange={setDoorMode} />
          {sliding && <Segmented options={[[2, '2 บาน'], [3, '3 บาน'], [4, '4 บาน']]} value={piece.slideCount} onChange={(n) => update((p) => ({ ...p, slideCount: n }))} />}
        </>
      )}
      <div>
        <p className="text-xs text-stone-500 mb-1.5">{piece.kind === 'table' ? 'หน้าโต๊ะ' : piece.kind === 'bed' ? 'หัวเตียง' : 'หน้าบาน / ลิ้นชัก'} <span className="text-stone-400">· {finishById(piece.frontFinish)?.name || 'สีที่เลือกเอง'}</span></p>
        <FinishSwatches front value={piece.frontFinish} onChange={setFinish('frontFinish', 'frontColor')} />
      </div>
      <div>
        <p className="text-xs text-stone-500 mb-1.5">โครง <span className="text-stone-400">· {finishById(piece.finish)?.name || 'สีที่เลือกเอง'}</span></p>
        <FinishSwatches value={piece.finish} onChange={setFinish('finish', 'color')} />
      </div>
      {isBox && (
        <div>
          <p className="text-xs text-stone-500 mb-1.5">ชั้นวางภายใน</p>
          <FinishSwatches allowNone value={piece.shelfFinish} onChange={setFinish('shelfFinish')} />
        </div>
      )}
      <div>
        <p className="text-xs text-stone-500 mb-1.5">สีผนังห้อง</p>
        <div className="flex gap-1.5">
          {WALLS.map((c) => (
            <button key={c} onClick={() => setWall(c)} className={`w-7 h-7 rounded-full border ${wall === c ? 'ring-2 ring-orange-500 ring-offset-1' : 'border-stone-200'}`} style={{ background: c }} aria-label={c} />
          ))}
        </div>
      </div>
    </div>
  );

  const pieceBar = (
    <div className={`${card} p-1.5 flex items-center gap-1 max-w-full overflow-x-auto`}>
      {design.items.map((p, i) => (
        <button key={p.id} onClick={() => onSelect(p.id)} className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition ${p.id === selectedId ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow' : 'text-stone-600 hover:bg-stone-100'}`}>
          {i + 1}. {p.name}
        </button>
      ))}
      <div className="relative shrink-0">
        <button onClick={() => setAddOpen((v) => !v)} className="px-3 py-1.5 rounded-xl text-xs font-medium text-orange-700 hover:bg-orange-50 inline-flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> เพิ่ม <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
  const addMenu = addOpen && (
    <div className={`${card} absolute z-20 top-16 left-4 p-2 w-64 max-h-80 overflow-y-auto`}>
      {TEMPLATES.map((tp) => (
        <button key={tp.id} onClick={() => (onAdd(tp.id), setAddOpen(false))} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-orange-50">
          <span className="text-[10px] text-stone-400 mr-2">{tp.group}</span>
          {tp.name}
        </button>
      ))}
    </div>
  );

  const toolBtn = (on) => `w-9 h-9 grid place-items-center rounded-xl transition ${on ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`;
  const toolbar = (
    <div className={`${card} px-2 py-1.5 flex items-center gap-1`}>
      <button className={toolBtn(false)} onClick={undo} disabled={!canUndo} title="ย้อนกลับ">
        <Undo2 className={`w-4 h-4 ${canUndo ? '' : 'opacity-30'}`} />
      </button>
      <button className={toolBtn(false)} onClick={redo} disabled={!canRedo} title="ทำซ้ำ">
        <Redo2 className={`w-4 h-4 ${canRedo ? '' : 'opacity-30'}`} />
      </button>
      <span className="w-px h-6 bg-stone-200 mx-1" />
      <div className="hidden sm:flex items-center gap-2 px-1">
        <input
          type="range"
          min={-180}
          max={180}
          value={az}
          onChange={(e) => {
            const v = Number(e.target.value);
            setAz(v);
            clearTimeout(azTimer.current);
            viewerRef.current?.setAzimuth(v);
          }}
          className="w-28 accent-orange-500"
          aria-label="หมุนมุมมอง"
        />
        <span className="text-xs tabular-nums w-9 text-stone-500">{az}°</span>
      </div>
      <button className={toolBtn(false)} onClick={() => (viewerRef.current?.fit(), setZoom(100))} title="รีเซ็ตมุมมอง">
        <RotateCcw className="w-4 h-4" />
      </button>
      <span className="w-px h-6 bg-stone-200 mx-1" />
      <button className={toolBtn(allOpen)} onClick={() => setAllOpen((v) => !v)} title={allOpen ? 'ปิดบานทั้งหมด' : 'เปิดบาน / ลิ้นชักทั้งหมด'}>
        {allOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
      </button>
      <button className={toolBtn(showRoom)} onClick={() => setShowRoom((v) => !v)} title="แสดงห้อง">
        <Home className="w-4 h-4" />
      </button>
      <button className={toolBtn(showDecor)} onClick={() => setShowDecor((v) => !v)} title="แสดงเสื้อผ้า / ของตกแต่ง">
        <Sparkles className="w-4 h-4" />
      </button>
      <button className={toolBtn(false)} onClick={onSnapshot} title="บันทึกรูป">
        <ImageDown className="w-4 h-4" />
      </button>
      <button onClick={photoreal} disabled={Boolean(pt)} className="ml-1 h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-[0_6px_20px_-6px_rgba(234,88,12,.9)] disabled:opacity-50 transition" title="เรนเดอร์ภาพสมจริง (แสงสะท้อนหลายรอบ)">
        <Aperture className="w-4 h-4" /> <span className="hidden sm:inline">เรนเดอร์ภาพสมจริง</span>
      </button>
    </div>
  );

  const zoomCtl = (
    <div className={`${card} px-1.5 py-1 flex items-center gap-1`}>
      <button className={toolBtn(false)} onClick={() => (viewerRef.current?.zoom(1.15), setZoom((z) => Math.max(10, Math.round(z / 1.15))))} aria-label="ซูมออก">
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-xs w-10 text-center tabular-nums">{zoom}%</span>
      <button className={toolBtn(false)} onClick={() => (viewerRef.current?.zoom(1 / 1.15), setZoom((z) => Math.round(z * 1.15)))} aria-label="ซูมเข้า">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  const priceCard = (
    <div className={`${card} p-4 w-full lg:w-72`}>
      <p className="text-xs text-stone-500">ต้นทุนชิ้นนี้ (วัสดุ + อุปกรณ์ + ค่าแรง) · {piece?.name}</p>
      <p className="text-3xl font-semibold tracking-tight text-stone-900">฿{money(cost)}</p>
      <p className="text-xs text-stone-500 mt-0.5">
        ราคาเสนอ (กำไร {design.pricing.marginPct}%) ฿{money(price)} · ทั้งโปรเจกต์ทุน ฿{money(analysis.cost)} · ไม้ {analysis.totalSheets} แผ่น
      </p>
      <button onClick={onQuote} className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-[0_10px_30px_-10px_rgba(234,88,12,.8)] hover:-translate-y-0.5 transition">
        <FileText className="w-4 h-4" /> สร้างใบเสนอราคา {locked && <Lock className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:block relative">
      {/* canvas */}
      <div className="relative h-[58vh] lg:h-full lg:absolute lg:inset-0 bg-gradient-to-br from-[#f7efe5] via-[#f2ede8] to-[#e7e3f1] overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-stone-400"><Spinner className="w-8 h-8" /></div>}>
          <Viewer3D ref={viewerRef} pieces={design.items} materials={materials} selectedId={piece?.id} allOpen={allOpen} showRoom={showRoom} showDecor={showDecor} wallColor={wall} onAzimuth={setAz} />
        </Suspense>
        <div className="absolute top-3 left-3 right-3 lg:right-auto lg:max-w-[calc(100%-24rem)]">{pieceBar}</div>
        {addMenu}
        {/* desktop floating cards */}
        <div className="hidden lg:block absolute left-4 top-20 w-72">
          <div className={card}>
            <CardTitle icon={LayoutGrid}>จัดภายในตู้</CardTitle>
            {insidePanel}
          </div>
        </div>
        <div className="hidden lg:block absolute right-4 top-3 w-80 space-y-3 max-h-[calc(100%-6rem)] overflow-y-auto pb-2">
          <div className={card}>
            <CardTitle icon={Ruler}>ขนาด</CardTitle>
            {sizePanel}
          </div>
          <div className={card}>
            <CardTitle icon={Palette}>ประตูและวัสดุ</CardTitle>
            {doorPanel}
          </div>
        </div>
        <div className="hidden lg:block absolute left-4 bottom-4">{priceCard}</div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 lg:bottom-4">{toolbar}</div>
        <div className="hidden lg:block absolute right-4 bottom-4">{zoomCtl}</div>
        {pt && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[min(92%,360px)] rounded-2xl bg-stone-900/90 text-white backdrop-blur p-4 shadow-2xl">
            <p className="text-sm font-medium flex items-center gap-2"><Aperture className="w-4 h-4 text-orange-300 animate-spin" /> กำลังเรนเดอร์ภาพสมจริง… {Math.round(pt.progress * 100)}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-300 to-orange-500 transition-all" style={{ width: `${pt.progress * 100}%` }} /></div>
            <p className="mt-2 text-[11px] text-stone-400">คำนวณแสงสะท้อนจริงทีละรอบ ภาพจะค่อย ๆ ชัดขึ้น (ประมาณ 10–60 วินาที ขึ้นกับเครื่อง)</p>
            <button onClick={() => (cancelRef.current = true)} className="mt-2 text-xs text-stone-300 underline">ยกเลิก</button>
          </div>
        )}
        {photo && (
          <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex flex-col p-3 sm:p-8 animate-fade-in" onClick={() => setPhoto(null)}>
            <div className="flex items-center justify-between text-white mb-3" onClick={(e) => e.stopPropagation()}>
              <p className="font-medium">ภาพเรนเดอร์สมจริง · {piece?.name}</p>
              <div className="flex gap-2">
                <button onClick={() => onSaveImage(photo)} className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-300 to-orange-400 inline-flex items-center gap-1.5">
                  <ImageDown className="w-4 h-4" /> บันทึกรูป {locked && <Lock className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setPhoto(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center" aria-label="ปิด"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 min-h-0 grid place-items-center"><img src={photo} alt="ภาพเรนเดอร์" className="max-w-full max-h-full rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} /></div>
          </div>
        )}
      </div>

      {/* mobile panels */}
      <div className="lg:hidden bg-white border-t border-stone-200 flex-1 min-h-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white flex border-b border-stone-200 text-sm">
          {[
            ['inside', 'จัดภายใน'],
            ['size', 'ขนาด'],
            ['door', 'ประตู / วัสดุ'],
            ['price', `ทุน ฿${money(cost)}`],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setMobileTab(id)} className={`flex-1 py-2.5 ${mobileTab === id ? 'border-b-2 border-orange-500 font-medium text-stone-900' : 'text-stone-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="pt-3">{mobileTab === 'inside' ? insidePanel : mobileTab === 'size' ? sizePanel : mobileTab === 'door' ? doorPanel : <div className="px-4 pb-4">{priceCard}</div>}</div>
      </div>
    </div>
  );
}
