// Measure from a photo: set the scale from a known distance, then draw boxes around each part
import { useRef, useState } from 'react';
import { ImagePlus, Ruler, Square, MousePointer2, Trash2, Box, Info } from 'lucide-react';
import { compressImage } from '../lib/image';
import { money } from './costing';
import { matById, uid } from './model';
import { inputCls, btnGhost } from '../components/ui';

const r1 = (n) => Math.round(n * 10) / 10;

const STEPS = [
  'อัปโหลดภาพหน้างาน / ภาพจากลูกค้า',
  'ใส่ระยะอ้างอิงที่รู้ขนาดจริง เช่น 100 ซม.',
  'แตะสองจุดบนภาพที่ห่างกันเท่าระยะอ้างอิง',
  'ลากกรอบครอบส่วนประกอบแต่ละชิ้น',
  'ระบบคำนวณกว้าง × สูง พื้นที่วัสดุ และต้นทุนให้',
];

export default function PhotoMeasure({ photo, onChange, onBegin, pricing, onCreatePiece, notify }) {
  const svgRef = useRef(null);
  const fileRef = useRef(null);
  const [mode, setMode] = useState(photo?.ref?.b ? 'box' : 'ref');
  const [temp, setTemp] = useState(null);
  const [selId, setSelId] = useState(null);
  const drag = useRef(null);

  const materials = pricing.materials;
  const sheetArea = (pricing.sheetW * pricing.sheetH) / 10000;
  const ref = photo?.ref || { cm: 100 };
  const scale = ref.a && ref.b && ref.cm > 0 ? Math.hypot(ref.b.x - ref.a.x, ref.b.y - ref.a.y) / ref.cm : 0; // px per cm
  const boxes = photo?.boxes || [];
  const set = (patch) => onChange({ ...photo, ...patch });

  const upload = async (file) => {
    try {
      const src = await compressImage(file, 1100, 0.68);
      const img = new Image();
      await new Promise((ok, bad) => {
        img.onload = ok;
        img.onerror = bad;
        img.src = src;
      });
      onBegin();
      onChange({ src, iw: img.naturalWidth, ih: img.naturalHeight, ref: { cm: ref.cm || 100 }, boxes: [] });
      setMode('ref');
    } catch {
      notify('เปิดไฟล์รูปไม่ได้', 'error');
    }
  };

  const toImg = (e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: Math.max(0, Math.min(photo.iw, p.x)), y: Math.max(0, Math.min(photo.ih, p.y)) };
  };

  const onDown = (e) => {
    if (!photo?.src) return;
    const p = toImg(e);
    if (mode === 'ref') {
      onBegin();
      if (!ref.a || ref.b) set({ ref: { cm: ref.cm, a: p } });
      else set({ ref: { ...ref, b: p } });
      if (ref.a && !ref.b) setMode('box');
    } else if (mode === 'box') {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      drag.current = { kind: 'new', start: p };
      setTemp({ x: p.x, y: p.y, w: 0, h: 0 });
    } else setSelId(null);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const p = toImg(e);
    if (d.kind === 'new') setTemp({ x: Math.min(p.x, d.start.x), y: Math.min(p.y, d.start.y), w: Math.abs(p.x - d.start.x), h: Math.abs(p.y - d.start.y) });
    else {
      if (!d.moved) {
        d.moved = true;
        onBegin();
      }
      const dx = p.x - d.start.x;
      const dy = p.y - d.start.y;
      set({
        boxes: boxes.map((b) => {
          if (b.id !== d.id) return b;
          if (d.kind === 'move') return { ...b, x: d.box.x + dx, y: d.box.y + dy };
          return { ...b, w: Math.max(8, d.box.w + dx), h: Math.max(8, d.box.h + dy) };
        }),
      });
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.kind === 'new' && temp && temp.w > 8 && temp.h > 8) {
      onBegin();
      const id = uid();
      set({ boxes: [...boxes, { id, name: `ชิ้นที่ ${boxes.length + 1}`, ...temp, mat: materials[0]?.id }] });
      setSelId(id);
    }
    setTemp(null);
  };
  const startBox = (e, b, kind) => {
    if (mode !== 'select') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setSelId(b.id);
    drag.current = { kind, id: b.id, start: toImg(e), box: b };
  };

  const measure = (b) => {
    const w = scale ? b.w / scale : 0;
    const h = scale ? b.h / scale : 0;
    const area = (w * h) / 10000;
    const m = matById(materials, b.mat);
    const cost = sheetArea > 0 ? (area / sheetArea) * (Number(m.price) || 0) : 0;
    return { w: r1(w), h: r1(h), area, cost, m };
  };
  const totals = boxes.reduce((a, b) => {
    const m = measure(b);
    return { area: a.area + m.area, cost: a.cost + m.cost };
  }, { area: 0, cost: 0 });
  const stroke = photo ? Math.max(1.5, photo.iw / 450) : 2;
  const font = photo ? Math.max(12, photo.iw / 45) : 14;

  const tool = (id, Icon, label) => (
    <button onClick={() => setMode(id)} disabled={!photo?.src || (id !== 'ref' && !scale)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border disabled:opacity-40 ${mode === id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-300 hover:bg-stone-100'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0">
      <div className="flex-1 min-h-[50vh] flex flex-col min-w-0">
        <div className="p-3 flex flex-wrap items-center gap-2 bg-white border-b border-stone-200">
          <button onClick={() => fileRef.current?.click()} className={`${btnGhost} py-2`}>
            <ImagePlus className="w-4 h-4" /> {photo?.src ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
          <label className="flex items-center gap-1.5 text-sm">
            ระยะอ้างอิง
            <input type="number" min={1} className={`${inputCls} w-24 py-2`} value={ref.cm ?? ''} onChange={(e) => set({ ref: { ...ref, cm: Number(e.target.value) } })} disabled={!photo?.src} />
            ซม.
          </label>
          {tool('ref', Ruler, 'กำหนดสเกล')}
          {tool('box', Square, 'วาดกรอบ')}
          {tool('select', MousePointer2, 'เลือก / ย้าย')}
          {scale > 0 && <span className="text-xs text-stone-500">สเกล {r1(scale)} px/ซม.</span>}
        </div>
        <div className="relative flex-1 bg-stone-200 min-h-0">
          {photo?.src ? (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${photo.iw} ${photo.ih}`}
              preserveAspectRatio="xMidYMid meet"
              className={`absolute inset-0 w-full h-full touch-none select-none ${mode === 'select' ? '' : 'cursor-crosshair'}`}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <image href={photo.src} x={0} y={0} width={photo.iw} height={photo.ih} />
              {boxes.map((b) => {
                const m = measure(b);
                const sel = b.id === selId;
                return (
                  <g key={b.id}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={sel ? '#d97706' : '#0ea5e9'} fillOpacity={0.14} stroke={sel ? '#d97706' : '#0284c7'} strokeWidth={stroke} onPointerDown={(e) => startBox(e, b, 'move')} style={{ cursor: mode === 'select' ? 'move' : undefined }} />
                    <text x={b.x + b.w / 2} y={b.y - font * 0.4} fontSize={font} textAnchor="middle" fill="#fff" stroke="#0c4a6e" strokeWidth={font * 0.25} paintOrder="stroke" style={{ fontFamily: 'Prompt, sans-serif', pointerEvents: 'none' }}>
                      {b.name}: {m.w} × {m.h} ซม.
                    </text>
                    {mode === 'select' && <rect x={b.x + b.w - font * 0.5} y={b.y + b.h - font * 0.5} width={font} height={font} fill="#fff" stroke="#d97706" strokeWidth={stroke} style={{ cursor: 'nwse-resize' }} onPointerDown={(e) => startBox(e, b, 'resize')} />}
                  </g>
                );
              })}
              {temp && <rect x={temp.x} y={temp.y} width={temp.w} height={temp.h} fill="#0ea5e9" fillOpacity={0.15} stroke="#0284c7" strokeWidth={stroke} strokeDasharray={`${stroke * 4} ${stroke * 3}`} />}
              {ref.a && (
                <g>
                  {ref.b && <line x1={ref.a.x} y1={ref.a.y} x2={ref.b.x} y2={ref.b.y} stroke="#e11d48" strokeWidth={stroke * 1.5} />}
                  {[ref.a, ref.b].filter(Boolean).map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={stroke * 4} fill="#fff" stroke="#e11d48" strokeWidth={stroke * 1.5} />
                  ))}
                  {ref.b && (
                    <text x={(ref.a.x + ref.b.x) / 2} y={(ref.a.y + ref.b.y) / 2 - font * 0.6} fontSize={font} textAnchor="middle" fill="#fff" stroke="#881337" strokeWidth={font * 0.25} paintOrder="stroke" style={{ fontFamily: 'Prompt, sans-serif', pointerEvents: 'none' }}>
                      {ref.cm} ซม.
                    </text>
                  )}
                </g>
              )}
            </svg>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="absolute inset-0 grid place-items-center text-stone-500">
              <span className="text-center">
                <ImagePlus className="w-12 h-12 mx-auto mb-2" />
                แตะเพื่ออัปโหลดรูป
              </span>
            </button>
          )}
          {photo?.src && (
            <div className="absolute top-3 left-3 bg-white/95 rounded-xl px-3 py-1.5 text-xs border border-stone-200 shadow-sm">
              {mode === 'ref' ? (!ref.a || ref.b ? 'แตะจุดแรกของระยะอ้างอิง' : 'แตะจุดที่สอง') : mode === 'box' ? 'ลากกรอบครอบชิ้นงาน' : 'ลากกรอบเพื่อย้าย · ลากมุมขวาล่างเพื่อปรับขนาด'}
            </div>
          )}
        </div>
      </div>

      <aside className="lg:w-96 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-stone-200 overflow-y-auto p-4 space-y-4">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm">
          <p className="font-medium flex items-center gap-1.5"><Info className="w-4 h-4" /> วิธีวัดจากภาพ</p>
          <ol className="list-decimal pl-5 mt-1 space-y-0.5 text-stone-700">
            {STEPS.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="text-xs text-stone-500 mt-2">ความแม่นยำขึ้นกับมุมกล้อง — ถ่ายตรงหน้าชิ้นงาน และวางระยะอ้างอิงบนระนาบเดียวกับชิ้นงาน</p>
        </div>
        {boxes.length === 0 ? (
          <p className="text-sm text-stone-500 text-center py-4">{scale ? 'ลากกรอบบนภาพเพื่อเริ่มวัด' : 'ยังไม่ได้กำหนดสเกล'}</p>
        ) : (
          <ul className="space-y-2">
            {boxes.map((b) => {
              const m = measure(b);
              return (
                <li key={b.id} className={`rounded-xl border p-3 space-y-2 ${b.id === selId ? 'border-amber-500 bg-amber-50/50' : 'border-stone-200'}`} onClick={() => setSelId(b.id)}>
                  <div className="flex items-center gap-2">
                    <input className={`${inputCls} py-1.5`} value={b.name} onChange={(e) => set({ boxes: boxes.map((x) => (x.id === b.id ? { ...x, name: e.target.value } : x)) })} />
                    <button onClick={() => (onBegin(), set({ boxes: boxes.filter((x) => x.id !== b.id) }))} className="p-2 text-stone-400 hover:text-rose-600" aria-label="ลบ">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm">
                    <b>{m.w} × {m.h} ซม.</b> · {m.area.toFixed(2)} ตร.ม.
                  </p>
                  <select className={`${inputCls} py-1.5`} value={b.mat} onChange={(e) => set({ boxes: boxes.map((x) => (x.id === b.id ? { ...x, mat: e.target.value } : x)) })}>
                    {materials.map((mm) => <option key={mm.id} value={mm.id}>{mm.name} ({money(mm.price)} ฿/แผ่น)</option>)}
                  </select>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">ต้นทุนวัสดุ ≈ ฿{money(m.cost)}</span>
                    <button onClick={() => onCreatePiece({ name: b.name, W: m.w, H: m.h })} className="inline-flex items-center gap-1 text-amber-700 hover:underline text-sm">
                      <Box className="w-4 h-4" /> สร้างเป็นตู้
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {boxes.length > 0 && (
          <div className="rounded-xl bg-stone-900 text-white p-3 text-sm flex justify-between">
            <span>รวม {boxes.length} ชิ้น · {totals.area.toFixed(2)} ตร.ม.</span>
            <b>฿{money(totals.cost)}</b>
          </div>
        )}
        <p className="text-xs text-stone-500">ต้นทุนคิดตามสัดส่วนพื้นที่ต่อแผ่น {pricing.sheetW}×{pricing.sheetH} ซม. (ยังไม่รวมเศษไม้ ปิดขอบ และค่าแรง)</p>
      </aside>
    </div>
  );
}
