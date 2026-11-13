// Side panels of FORMA STUDIO: piece list / templates and the properties of the selected piece
import { useEffect, useState } from 'react';
import { Plus, Minus, Copy, Trash2, ChevronUp, ChevronDown, Layers, Archive, Shirt, Footprints, ShoppingBasket, GripHorizontal } from 'lucide-react';
import { TEMPLATES, DOORS, COLORS, ELEMENT_KINDS, elementH, matById, innerHeight, pieceSize } from './model';
import { FrontDrawing, frontViewBox } from './FrontView';
import { inputCls } from '../components/ui';

const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function NumberField({ label, value, onChange, min = 0, max = 1000, step = 0.5, suffix = 'ซม.' }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(r1(value))), [value]);
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n) && text !== '') onChange(clamp(n, min, max));
    else setText(String(r1(value)));
  };
  return (
    <label className="block">
      <span className="text-xs text-stone-500">{label}</span>
      <div className="relative">
        <input
          className={`${inputCls} !px-2.5 !pr-8 py-2`}
          inputMode="decimal"
          type="number"
          step={step}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (commit(), e.currentTarget.blur())}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none">{suffix}</span>
      </div>
    </label>
  );
}

function Swatches({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} className={`w-6 h-6 rounded-full border ${value === c ? 'ring-2 ring-amber-600 ring-offset-1' : 'border-stone-300'}`} style={{ background: c }} aria-label={c} />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" aria-label="เลือกสีเอง" />
    </div>
  );
}

function Thumb({ piece, materials }) {
  const { vb, built } = frontViewBox(piece, materials, 0.04);
  return (
    <svg viewBox={vb} className="w-12 h-12 shrink-0">
      <FrontDrawing piece={piece} materials={materials} dims={false} built={built} />
    </svg>
  );
}

export function PiecesPanel({ design, selectedId, onSelect, onAdd, onMove }) {
  const materials = design.pricing.materials;
  const groups = [...new Set(TEMPLATES.map((t) => t.group))];
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-stone-500 mb-2">ชิ้นงานในโปรเจกต์ ({design.items.length})</p>
        <ul className="space-y-1.5">
          {design.items.map((p, i) => (
            <li key={p.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(p.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(p.id)}
                className={`w-full flex items-center gap-2 rounded-xl border p-1.5 text-left cursor-pointer ${p.id === selectedId ? 'border-amber-600 bg-amber-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
              >
                <Thumb piece={p} materials={materials} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{i + 1}. {p.name}</span>
                  <span className="block text-[11px] text-stone-500">{pieceSize(p)}</span>
                </span>
                <span className="flex flex-col">
                  <button onClick={(e) => (e.stopPropagation(), onMove(p.id, -1))} disabled={i === 0} className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20" aria-label="เลื่อนขึ้น">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => (e.stopPropagation(), onMove(p.id, 1))} disabled={i === design.items.length - 1} className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20" aria-label="เลื่อนลง">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium text-stone-500 mb-2">เพิ่มเฟอร์นิเจอร์</p>
        {groups.map((g) => (
          <div key={g} className="mb-3">
            <p className="text-[11px] text-stone-400 mb-1">{g}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.filter((t) => t.group === g).map((t) => (
                <button key={t.id} onClick={() => onAdd(t.id)} className="rounded-xl border border-stone-200 bg-white hover:border-amber-600 hover:bg-amber-50 px-2 py-2 text-xs text-left leading-tight inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 shrink-0 text-amber-700" /> {t.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ICONS = { shelf: Layers, drawer: Archive, rod: Shirt, shoe: Footprints, basket: ShoppingBasket, pants: GripHorizontal };

export function PropsPanel({ piece, design, selection, onSelect, update, actions }) {
  const materials = design.pricing.materials;
  if (!piece) return <p className="text-sm text-stone-500">เลือกชิ้นงานจากรายการ หรือเพิ่มเฟอร์นิเจอร์ใหม่</p>;
  const isBox = piece.kind === 'box';
  const Hi = isBox ? innerHeight(piece, materials) : 0;
  const t = matById(materials, piece.carcass).t;
  const col = isBox && selection.col != null ? piece.columns[selection.col] : null;
  const ci = selection.col;
  const set = (patch) => update((p) => ({ ...p, ...patch }));
  const setCol = (fn) => update((p) => ({ ...p, columns: p.columns.map((c, i) => (i === ci ? fn(c) : c)) }));

  const setColWidth = (v) =>
    update((p) => {
      if (p.columns.length < 2) return p;
      const inner = p.W - 2 * t - (p.columns.length - 1) * t;
      const w = clamp(v, 10, inner - 10 * (p.columns.length - 1));
      const others = p.columns.reduce((a, c, i) => (i === ci ? a : a + c.w), 0) || 1;
      return { ...p, columns: p.columns.map((c, i) => (i === ci ? { ...c, w } : { ...c, w: (c.w / others) * (inner - w) })) };
    });

  const matSelect = (label, key) => (
    <label className="block">
      <span className="text-xs text-stone-500">{label}</span>
      <select className={`${inputCls} py-2`} value={piece[key]} onChange={(e) => set({ [key]: e.target.value })}>
        {materials.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <input className={`${inputCls} py-2 font-medium`} value={piece.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} aria-label="ชื่อชิ้นงาน" />
        <button onClick={actions.duplicate} className="p-2 rounded-lg hover:bg-stone-100" title="ทำซ้ำ">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={actions.remove} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600" title="ลบชิ้นงาน">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberField label={piece.kind === 'bed' ? 'กว้างที่นอน' : 'กว้าง'} value={piece.W} min={20} max={600} onChange={(v) => set({ W: v })} />
        <NumberField label={piece.kind === 'bed' ? 'สูงพื้นเตียง' : 'สูง'} value={piece.H} min={piece.kind === 'bed' ? 15 : 20} max={300} onChange={(v) => set({ H: v })} />
        <NumberField label={piece.kind === 'bed' ? 'ยาวที่นอน' : 'ลึก'} value={piece.D} min={15} max={piece.kind === 'bed' ? 230 : 120} onChange={(v) => set({ D: v })} />
      </div>

      {isBox && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="ฐาน / บังโป๊" value={piece.plinth || 0} min={0} max={30} onChange={(v) => set({ plinth: v })} />
          <NumberField label="ติดตั้งสูงจากพื้น" value={piece.elev || 0} min={0} max={250} onChange={(v) => set({ elev: v })} />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-amber-600" checked={Boolean(piece.countertop)} onChange={(e) => set({ countertop: e.target.checked })} /> มีท็อปเคาน์เตอร์ (คิดราคาเป็นเมตร)
          </label>
        </div>
      )}
      {piece.kind === 'table' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-stone-500">ขาโต๊ะ</span>
            <select className={`${inputCls} py-2`} value={piece.legs} onChange={(e) => set({ legs: e.target.value })}>
              <option value="panel">แผ่นไม้ 2 ข้าง</option>
              <option value="metal">ขาเหล็ก (สำเร็จรูป)</option>
            </select>
          </label>
          <NumberField label="บังตา (0 = ไม่มี)" value={piece.apron || 0} min={0} max={60} onChange={(v) => set({ apron: v })} />
        </div>
      )}
      {piece.kind === 'bed' && <NumberField label="ความสูงหัวเตียง" value={piece.headH || 100} min={30} max={180} onChange={(v) => set({ headH: v })} />}

      <div className="space-y-2">
        {matSelect(piece.kind === 'bed' ? 'วัสดุโครงเตียง' : 'วัสดุโครง', 'carcass')}
        {piece.kind !== 'table' && matSelect(piece.kind === 'bed' ? 'วัสดุหัวเตียง' : 'วัสดุหน้าบาน / หน้าลิ้นชัก', 'front')}
        {isBox && matSelect('แผ่นหลัง / ก้นลิ้นชัก', 'back')}
      </div>
      <div>
        <p className="text-xs text-stone-500 mb-1.5">สีโครง</p>
        <Swatches value={piece.color} onChange={(c) => set({ color: c, finish: null })} />
        <p className="text-xs text-stone-500 mb-1.5 mt-3">{piece.kind === 'table' ? 'สีหน้าโต๊ะ' : piece.kind === 'bed' ? 'สีหัวเตียง' : 'สีหน้าบาน'}</p>
        <Swatches value={piece.frontColor} onChange={(c) => set({ frontColor: c, frontFinish: null })} />
      </div>

      {isBox && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-stone-500">รูปแบบประตู</span>
            <select className={`${inputCls} py-2`} value={piece.doorStyle || 'hinged'} onChange={(e) => set({ doorStyle: e.target.value })}>
              <option value="hinged">บานเปิด (แต่ละช่อง)</option>
              <option value="sliding">บานเลื่อน</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">ชั้นโชว์ปลายตู้ (มุม)</span>
            <select className={`${inputCls} py-2`} value={piece.endShelf || 'none'} onChange={(e) => set({ endShelf: e.target.value })}>
              <option value="none">ไม่มี</option>
              <option value="left">ด้านซ้าย</option>
              <option value="right">ด้านขวา</option>
            </select>
          </label>
          {piece.doorStyle === 'sliding' && (
            <label className="block">
              <span className="text-xs text-stone-500">จำนวนบานเลื่อน</span>
              <select className={`${inputCls} py-2`} value={piece.slideCount || 2} onChange={(e) => set({ slideCount: Number(e.target.value) })}>
                {[2, 3, 4].map((n) => <option key={n} value={n}>{n} บาน</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      {isBox && (
        <div className="border-t border-stone-200 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">ช่องตู้ ({piece.columns.length})</p>
            <div className="flex gap-1">
              <button onClick={actions.removeColumn} disabled={piece.columns.length < 2} className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 disabled:opacity-30" title="ลบช่องที่เลือก">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={actions.addColumn} disabled={piece.columns.length >= 8} className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 disabled:opacity-30" title="แบ่งช่องเพิ่ม">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {piece.columns.map((c, i) => (
              <button key={c.id} onClick={() => onSelect({ col: i, item: null })} className={`px-2.5 py-1 rounded-lg text-xs border ${ci === i ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 hover:bg-stone-100'}`}>
                ช่อง {i + 1} · {r1(c.w)}
              </button>
            ))}
          </div>
          {!col ? (
            <p className="text-xs text-stone-500">แตะช่องในภาพหรือปุ่มด้านบนเพื่อปรับแต่งช่อง · ลากแผ่นกั้นเพื่อปรับความกว้าง</p>
          ) : (
            <div className="rounded-2xl border border-stone-200 p-3 space-y-3 bg-stone-50">
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="กว้างช่อง" value={col.w} min={10} max={piece.W} onChange={setColWidth} />
                <label className="block">
                  <span className="text-xs text-stone-500">ประตู</span>
                  <select className={`${inputCls} py-2`} value={col.door} onChange={(e) => setCol((c) => ({ ...c, door: e.target.value }))}>
                    {DOORS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              {col.door !== 'none' && col.items.some((i) => i.kind === 'drawer') && <p className="text-[11px] text-stone-500">ลิ้นชักในช่องที่มีบานจะเป็นลิ้นชักใน (อยู่หลังบาน)</p>}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ELEMENT_KINDS).map(([k, v]) => {
                  const Icon = ICONS[k];
                  return (
                    <button key={k} onClick={() => actions.addElement(k, ci)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-stone-300 bg-white hover:border-amber-600">
                      <Icon className="w-3.5 h-3.5" /> + {v.name}
                    </button>
                  );
                })}
              </div>
              {col.items.length === 0 ? (
                <p className="text-xs text-stone-500">ช่องว่าง — เพิ่มชั้น ลิ้นชัก หรือราวแขวน</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...col.items].sort((a, b) => b.y - a.y).map((it) => {
                    const Icon = ICONS[it.kind];
                    const sel = selection.item === it.id;
                    const max = it.kind === 'rod' ? Hi - 5 : Hi - elementH(it, t);
                    return (
                      <li key={it.id} className={`rounded-xl border bg-white p-2 ${sel ? 'border-amber-600' : 'border-stone-200'}`} onClick={() => onSelect({ col: ci, item: it.id })}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-stone-500 shrink-0" />
                          <span className="text-xs font-medium w-14 shrink-0">{ELEMENT_KINDS[it.kind].name}</span>
                          <div className="flex-1 grid grid-cols-2 gap-1.5">
                            <NumberField label="สูงจากพื้นตู้" value={it.y} min={0} max={max} onChange={(v) => setCol((c) => ({ ...c, items: c.items.map((x) => (x.id === it.id ? { ...x, y: v } : x)) }))} />
                            {it.kind === 'drawer' && <NumberField label="สูงลิ้นชัก" value={it.h} min={8} max={60} onChange={(v) => setCol((c) => ({ ...c, items: c.items.map((x) => (x.id === it.id ? { ...x, h: v } : x)) }))} />}
                          </div>
                          <button onClick={(e) => (e.stopPropagation(), actions.removeElement(ci, it.id))} className="p-1.5 text-stone-400 hover:text-rose-600" aria-label="ลบ">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-[11px] text-stone-500">ความสูงภายในช่อง {r1(Hi)} ซม. · ลากชิ้นในภาพขึ้น-ลงเพื่อย้าย</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
