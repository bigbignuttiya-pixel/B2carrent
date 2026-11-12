// "ใบตัดไม้" tab (cut list + nesting on standard sheets) and "ราคา" tab (costing + quotation)
import { useState } from 'react';
import { FileDown, Printer, Plus, Trash2, FileText, Lock, AlertTriangle } from 'lucide-react';
import SheetLayout from './SheetLayout';
import { bandLabel, money } from './costing';
import { SHEET_PRESETS, uid } from './model';
import { NumberField } from './Panels';
import { Modal, ModalHeader, Field, inputCls, btnPrimary, btnGhost } from '../components/ui';

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function CutListView({ design, analysis: A, setPricing, onCsv, onPrint, locked }) {
  const pr = design.pricing;
  const preset = SHEET_PRESETS.findIndex((s) => s.w === pr.sheetW && s.h === pr.sheetH);
  const lock = locked && <Lock className="w-3.5 h-3.5" />;
  return (
    <div className="p-4 space-y-5 max-w-6xl mx-auto">
      <div className="rounded-2xl bg-white border border-stone-200 p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <label className="block lg:col-span-2">
          <span className="text-xs text-stone-500">ขนาดแผ่นไม้มาตรฐาน</span>
          <select className={`${inputCls} py-2`} value={preset} onChange={(e) => Number(e.target.value) >= 0 && setPricing({ sheetW: SHEET_PRESETS[e.target.value].w, sheetH: SHEET_PRESETS[e.target.value].h })}>
            {SHEET_PRESETS.map((s, i) => (
              <option key={s.name} value={i}>{s.name}</option>
            ))}
            <option value={-1}>กำหนดเอง</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          <NumberField label="กว้างแผ่น" value={pr.sheetW} min={30} max={300} onChange={(v) => setPricing({ sheetW: v })} />
          <NumberField label="ยาวแผ่น" value={pr.sheetH} min={30} max={400} onChange={(v) => setPricing({ sheetH: v })} />
        </div>
        <NumberField label="ระยะใบเลื่อย" value={pr.kerf} min={0} max={1} step={0.1} onChange={(v) => setPricing({ kerf: v })} />
        <label className="flex items-center gap-2 text-sm lg:col-span-3">
          <input type="checkbox" className="accent-amber-600" checked={pr.allowRotate} onChange={(e) => setPricing({ allowRotate: e.target.checked })} />
          หมุนชิ้นงานได้ (ปิดถ้าต้องการให้ลายไม้วิ่งตามความยาวชิ้น)
        </label>
        <div className="flex gap-2 lg:col-span-2 lg:justify-end">
          <button onClick={onCsv} className={`${btnGhost} py-2`}>
            <FileDown className="w-4 h-4" /> CSV {lock}
          </button>
          <button onClick={onPrint} className={`${btnPrimary} py-2`}>
            <Printer className="w-4 h-4" /> ใบตัดไม้ PDF {lock}
          </button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="แผ่นไม้ที่ใช้" value={`${A.totalSheets} แผ่น`} sub={`${pr.sheetW} × ${pr.sheetH} ซม. (${A.sheetArea.toFixed(2)} ตร.ม./แผ่น)`} />
        <Stat label="พื้นที่ชิ้นงานรวม" value={`${A.partArea.toFixed(2)} ตร.ม.`} sub={`${A.rows.reduce((a, r) => a + r.qty, 0)} ชิ้น`} />
        <Stat label="ใช้เนื้อไม้" value={`${A.totalSheets ? Math.round((A.partArea / (A.totalSheets * A.sheetArea)) * 100) : 0}%`} sub="เศษที่เหลือ = ส่วนลายเส้นในภาพ" />
        <Stat label="ปิดขอบ (Edge)" value={`${A.edgeM.toFixed(1)} ม.`} />
      </div>

      {A.mats.map((m) => (
        <section key={m.id} className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 flex flex-wrap items-center gap-2">
            <p className="font-medium">{m.material.name}</p>
            <span className="text-sm text-stone-500">
              {m.sheets} แผ่น · ชิ้นงาน {m.partArea.toFixed(2)} ตร.ม. · ใช้เนื้อไม้ {Math.round(m.utilization * 100)}%
            </span>
          </div>
          {m.layout.oversize.length > 0 && (
            <p className="px-4 py-2 text-sm bg-rose-50 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ชิ้นที่ใหญ่กว่าแผ่นมาตรฐาน: {m.layout.oversize.map((o) => `#${o.label} (${o.w}×${o.h})`).join(', ')} — ต้องต่อแผ่นหรือสั่งแผ่นพิเศษ (คิดเพิ่มชิ้นละ 1 แผ่น)
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500">
                <tr>
                  <th className="text-left px-3 py-2">ชิ้น</th>
                  <th className="text-left px-3 py-2">เฟอร์นิเจอร์</th>
                  <th className="text-left px-3 py-2">ชื่อชิ้นส่วน</th>
                  <th className="text-right px-3 py-2">ยาว</th>
                  <th className="text-right px-3 py-2">กว้าง</th>
                  <th className="text-right px-3 py-2">หนา (มม.)</th>
                  <th className="text-right px-3 py-2">จำนวน</th>
                  <th className="text-left px-3 py-2">ปิดขอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {A.rows
                  .filter((r) => r.mat === m.id)
                  .map((r) => (
                    <tr key={r.no}>
                      <td className="px-3 py-1.5 font-medium">#{r.no}</td>
                      <td className="px-3 py-1.5 text-stone-500 whitespace-nowrap">{r.pieceNo}. {r.pieceName}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{r.name}</td>
                      <td className="px-3 py-1.5 text-right">{r.L}</td>
                      <td className="px-3 py-1.5 text-right">{r.W}</td>
                      <td className="px-3 py-1.5 text-right">{Math.round(r.t * 10)}</td>
                      <td className="px-3 py-1.5 text-right">{r.qty}</td>
                      <td className="px-3 py-1.5 text-stone-500 whitespace-nowrap">{bandLabel(r)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-stone-50 border-t border-stone-200">
            {m.layout.sheets.map((s, i) => (
              <div key={i} className="rounded-xl bg-white border border-stone-200 p-2">
                <p className="text-xs mb-1">
                  <b>แผ่นที่ {i + 1}</b> <span className="text-stone-500">ใช้ {Math.round((s.used / (pr.sheetW * pr.sheetH)) * 100)}%</span>
                </p>
                <SheetLayout sheet={s} W={pr.sheetW} H={pr.sheetH} />
              </div>
            ))}
          </div>
        </section>
      ))}
      {!A.rows.length && <p className="text-center text-stone-500 py-10">ยังไม่มีชิ้นงาน</p>}
    </div>
  );
}

function PriceInput({ label, value, onChange, suffix = '฿' }) {
  return <NumberField label={label} value={Number(value) || 0} min={0} max={1000000} step={1} suffix={suffix} onChange={onChange} />;
}

export function CostView({ design, analysis: A, setPricing, onQuote, locked }) {
  const pr = design.pricing;
  const usedMats = new Set(design.items.flatMap((p) => [p.carcass, p.front, p.back]));
  const setMat = (id, patch) => setPricing({ materials: pr.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const addMat = () => setPricing({ materials: [...pr.materials, { id: `m_${uid()}`, name: 'วัสดุใหม่ 18 มม.', t: 1.8, price: 900 }] });
  const pieceName = Object.fromEntries(design.items.map((p, i) => [p.id, `${i + 1}. ${p.name}`]));
  const row = (label, value, cls = '') => (
    <tr key={label} className={cls}>
      <td className="py-1.5">{label}</td>
      <td className="py-1.5 text-right whitespace-nowrap">฿{money(value)}</td>
    </tr>
  );
  return (
    <div className="p-4 max-w-6xl mx-auto grid gap-5 lg:grid-cols-[1fr_380px] items-start">
      <div className="space-y-5">
        <section className="rounded-2xl bg-white border border-stone-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">ราคาแผ่นวัสดุ (ต่อแผ่น {pr.sheetW}×{pr.sheetH} ซม.)</p>
            <button onClick={addMat} className={`${btnGhost} py-1.5 text-xs`}>
              <Plus className="w-4 h-4" /> เพิ่มวัสดุ
            </button>
          </div>
          <div className="space-y-2">
            {pr.materials.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_88px_120px_auto] gap-2 items-end">
                <label className="block">
                  <span className="text-xs text-stone-500">ชื่อวัสดุ</span>
                  <input className={`${inputCls} py-2`} value={m.name} onChange={(e) => setMat(m.id, { name: e.target.value })} />
                </label>
                <NumberField label="หนา" value={m.t * 10} min={2} max={50} step={1} suffix="มม." onChange={(v) => setMat(m.id, { t: v / 10 })} />
                <PriceInput label="ราคา/แผ่น" value={m.price} onChange={(v) => setMat(m.id, { price: v })} />
                <button onClick={() => setPricing({ materials: pr.materials.filter((x) => x.id !== m.id) })} disabled={usedMats.has(m.id) || pr.materials.length < 2} className="p-2 mb-0.5 text-stone-400 hover:text-rose-600 disabled:opacity-20" title={usedMats.has(m.id) ? 'วัสดุนี้ถูกใช้อยู่' : 'ลบ'}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-stone-200 p-4">
          <p className="font-medium mb-3">อุปกรณ์ ค่าแรง และกำไร</p>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            <PriceInput label="ปิดขอบ ต่อเมตร" value={pr.edgePerM} onChange={(v) => setPricing({ edgePerM: v })} />
            <PriceInput label="บานพับ ต่อตัว" value={pr.hinge} onChange={(v) => setPricing({ hinge: v })} />
            <PriceInput label="รางลิ้นชัก ต่อคู่" value={pr.slide} onChange={(v) => setPricing({ slide: v })} />
            <PriceInput label="มือจับ ต่อชิ้น" value={pr.handle} onChange={(v) => setPricing({ handle: v })} />
            <PriceInput label="ราวแขวน ต่อเมตร" value={pr.rodPerM} onChange={(v) => setPricing({ rodPerM: v })} />
            <PriceInput label="ชุดรางบานเลื่อน ต่อบาน" value={pr.slidingPerDoor} onChange={(v) => setPricing({ slidingPerDoor: v })} />
            <PriceInput label="ชั้นรองเท้า ต่อชุด" value={pr.shoeRack} onChange={(v) => setPricing({ shoeRack: v })} />
            <PriceInput label="ตะกร้าลวด ต่อชุด" value={pr.basket} onChange={(v) => setPricing({ basket: v })} />
            <PriceInput label="ราวกางเกง ต่อชุด" value={pr.pantsRack} onChange={(v) => setPricing({ pantsRack: v })} />
            <PriceInput label="ขาโต๊ะเหล็ก ต่อชุด" value={pr.metalLegs} onChange={(v) => setPricing({ metalLegs: v })} />
            <PriceInput label="ท็อปเคาน์เตอร์ ต่อเมตร" value={pr.countertopPerM} onChange={(v) => setPricing({ countertopPerM: v })} />
            <PriceInput label="ค่าแรง ต่อแผ่น" value={pr.laborPerSheet} onChange={(v) => setPricing({ laborPerSheet: v })} />
            <PriceInput label="ค่าขนส่ง / ติดตั้ง" value={pr.install} onChange={(v) => setPricing({ install: v })} />
            <PriceInput label="กำไร" value={pr.marginPct} suffix="%" onChange={(v) => setPricing({ marginPct: v })} />
            <PriceInput label="ส่วนลด" value={pr.discount} onChange={(v) => setPricing({ discount: v })} />
            <PriceInput label="VAT (0 = ไม่คิด)" value={pr.vatPct} suffix="%" onChange={(v) => setPricing({ vatPct: v })} />
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-stone-200 p-4">
          <p className="font-medium mb-2">ราคาต่อชิ้นงาน</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-stone-100">
              {A.piecePrices.map((x) => (
                <tr key={x.id}>
                  <td className="py-1.5">{pieceName[x.id]}</td>
                  <td className="py-1.5 text-right text-stone-500 whitespace-nowrap">{x.area.toFixed(2)} ตร.ม. · ทุน ฿{money(x.cost)}</td>
                  <td className="py-1.5 text-right font-medium whitespace-nowrap pl-3">฿{money(x.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <aside className="rounded-2xl bg-white border border-stone-200 p-4 lg:sticky lg:top-4">
        <p className="font-medium mb-2">สรุปต้นทุน</p>
        <table className="w-full text-sm">
          <tbody>
            {A.mats.map((m) => row(`${m.material.name} × ${m.sheets} แผ่น`, m.cost, 'text-stone-600'))}
            {row(`ปิดขอบ ${A.edgeM.toFixed(1)} ม.`, A.edgeCost, 'text-stone-600')}
            {A.hwLines.map((l) => row(`${l.name} ${l.qty} ${l.unit}`, l.total, 'text-stone-600'))}
            {row(`ค่าแรง ${A.totalSheets} แผ่น`, A.laborCost, 'text-stone-600')}
            {A.install > 0 && row('ค่าขนส่ง / ติดตั้ง', A.install, 'text-stone-600')}
            {row('ต้นทุนรวม', A.cost, 'font-medium border-t border-stone-200')}
            {row(`ราคาขาย (กำไร ${pr.marginPct}%)`, A.subtotal)}
            {A.discount > 0 && row('ส่วนลด', -A.discount)}
            {A.vat > 0 && row(`VAT ${pr.vatPct}%`, A.vat)}
          </tbody>
        </table>
        <div className="mt-3 rounded-xl bg-stone-900 text-white p-3 flex items-center justify-between">
          <span>ยอดเสนอราคา</span>
          <b className="text-xl">฿{money(A.total)}</b>
        </div>
        <p className="text-xs text-stone-500 mt-2">กำไรโดยประมาณ ฿{money(A.profit)} · พื้นที่วัสดุ {A.partArea.toFixed(2)} ตร.ม.</p>
        <button onClick={onQuote} className={`${btnPrimary} w-full mt-4`}>
          <FileText className="w-4 h-4" /> สร้างใบเสนอราคา PDF {locked && <Lock className="w-3.5 h-3.5" />}
        </button>
        <p className="text-[11px] text-stone-400 mt-2">ราคาวัสดุตั้งต้นเป็นราคาประมาณการ แก้ให้ตรงกับร้านวัสดุของคุณได้ทุกช่อง</p>
      </aside>
    </div>
  );
}

export function QuoteModal({ open, onClose, onPrint, projectName, initial }) {
  const [f, setF] = useState(() => ({
    customer: '',
    phone: '',
    site: '',
    project: projectName,
    validDays: 15,
    depositPct: 50,
    notes: 'ราคานี้รวมค่าวัสดุ อุปกรณ์ และค่าแรงประกอบ\nระยะเวลาผลิตประมาณ 15–20 วันหลังยืนยันแบบ',
    number: `QT${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    ...initial,
  }));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader title="ใบเสนอราคา" onClose={onClose} />
      <form
        className="p-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onPrint(f);
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อลูกค้า">
            <input className={inputCls} value={f.customer} onChange={set('customer')} />
          </Field>
          <Field label="เบอร์โทร">
            <input className={inputCls} value={f.phone} onChange={set('phone')} inputMode="tel" />
          </Field>
        </div>
        <Field label="ชื่องาน / โครงการ">
          <input className={inputCls} value={f.project} onChange={set('project')} />
        </Field>
        <Field label="สถานที่ติดตั้ง">
          <input className={inputCls} value={f.site} onChange={set('site')} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="เลขที่">
            <input className={inputCls} value={f.number} onChange={set('number')} />
          </Field>
          <Field label="ยืนราคา (วัน)">
            <input className={inputCls} type="number" value={f.validDays} onChange={set('validDays')} />
          </Field>
          <Field label="มัดจำ (%)">
            <input className={inputCls} type="number" value={f.depositPct} onChange={set('depositPct')} />
          </Field>
        </div>
        <Field label="หมายเหตุ">
          <textarea className={`${inputCls} h-24`} value={f.notes} onChange={set('notes')} />
        </Field>
        <button className={`${btnPrimary} w-full`}>
          <Printer className="w-4 h-4" /> เปิดใบเสนอราคา (พิมพ์ / บันทึก PDF)
        </button>
      </form>
    </Modal>
  );
}
