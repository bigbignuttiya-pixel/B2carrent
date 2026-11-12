import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ImagePlus, Star, ArrowLeft, ArrowRight, X, Search } from 'lucide-react';
import { CATEGORIES, categoryOf, baht, unitPrice } from '../data';
import { Modal, ModalHeader, Field, inputCls, btnPrimary, btnGhost, ProductImage, Spinner } from '../components/ui';
import { compressImage } from '../lib/image';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

const MAX_PHOTOS = 8;
const EMPTY = { id: '', name: '', category: 'living', price: '', salePrice: '', stock: 1, description: '', material: '', dimensions: '', color: '', images: [], featured: false, active: true };

const newId = (category) => `${category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;

function ProductForm({ initial, isNew, onClose, onSaved, notify }) {
  const [p, setP] = useState(() => ({ ...EMPTY, ...initial, salePrice: initial?.salePrice ?? '' }));
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addPhotos = async (files) => {
    const list = [...files].slice(0, MAX_PHOTOS - p.images.length);
    if (!list.length) return;
    setAdding(true);
    try {
      const urls = [];
      for (const f of list) urls.push(await compressImage(f));
      setP((x) => ({ ...x, images: [...x.images, ...urls] }));
    } catch {
      notify('อ่านไฟล์รูปไม่ได้ กรุณาเลือกไฟล์รูปภาพ', 'error');
    } finally {
      setAdding(false);
    }
  };
  const move = (i, d) =>
    setP((x) => {
      const images = [...x.images];
      [images[i], images[i + d]] = [images[i + d], images[i]];
      return { ...x, images };
    });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const price = Number(p.price);
    const sale = p.salePrice === '' ? null : Number(p.salePrice);
    if (!(price >= 0)) return setError('กรุณาใส่ราคา');
    if (sale != null && !(sale >= 0 && sale < price)) return setError('ราคาลดต้องน้อยกว่าราคาปกติ (เว้นว่างถ้าไม่ลด)');
    setBusy(true);
    try {
      const saved = await api.saveProduct({ ...p, id: isNew ? newId(p.category) : p.id, price, salePrice: sale }, isNew);
      notify(isNew ? 'เพิ่มสินค้าแล้ว' : 'บันทึกแล้ว');
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader title={isNew ? 'เพิ่มสินค้า' : `แก้ไข ${initial.name}`} onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-5">
        <div>
          <span className="text-sm font-medium text-stone-700 block mb-2">
            รูปสินค้า ({p.images.length}/{MAX_PHOTOS}) — รูปแรกคือรูปหน้าปก
          </span>
          <div className="flex flex-wrap gap-3">
            {p.images.map((u, i) => (
              <div key={u.slice(-40) + i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 group">
                <img src={u} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 text-[10px] bg-stone-900 text-white rounded px-1.5">ปก</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 text-white">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30" aria-label="เลื่อนซ้าย">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setP((x) => ({ ...x, images: x.images.filter((_, j) => j !== i) }))} className="p-1" aria-label="ลบรูป">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={i === p.images.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30" aria-label="เลื่อนขวา">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {p.images.length < MAX_PHOTOS && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 grid place-items-center text-stone-500 cursor-pointer hover:bg-stone-50">
                {adding ? <Spinner /> : <ImagePlus className="w-6 h-6" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => (addPhotos(e.target.files), (e.target.value = ''))} />
              </label>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ชื่อสินค้า *">
            <input className={inputCls} required maxLength={160} value={p.name} onChange={set('name')} />
          </Field>
          <Field label="หมวดหมู่">
            <select className={inputCls} value={p.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ราคาปกติ (บาท) *">
            <input className={inputCls} required type="number" min="0" step="1" value={p.price} onChange={set('price')} />
          </Field>
          <Field label="ราคาลด (บาท)" hint="เว้นว่างถ้าไม่ลดราคา">
            <input className={inputCls} type="number" min="0" step="1" value={p.salePrice} onChange={set('salePrice')} />
          </Field>
          <Field label="จำนวนในสต็อก *">
            <input className={inputCls} required type="number" min="0" step="1" value={p.stock} onChange={set('stock')} />
          </Field>
          <Field label="สี">
            <input className={inputCls} value={p.color} onChange={set('color')} />
          </Field>
          <Field label="วัสดุ">
            <input className={inputCls} value={p.material} onChange={set('material')} />
          </Field>
          <Field label="ขนาด">
            <input className={inputCls} placeholder="กว้าง × ลึก × สูง ซม." value={p.dimensions} onChange={set('dimensions')} />
          </Field>
        </div>
        <Field label="รายละเอียด">
          <textarea className={inputCls} rows={3} value={p.description} onChange={set('description')} />
        </Field>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={p.active} onChange={set('active')} className="w-4 h-4 accent-stone-900" /> แสดงหน้าร้าน
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={p.featured} onChange={set('featured')} className="w-4 h-4 accent-stone-900" /> สินค้าแนะนำ (แสดงก่อน)
          </label>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
          <button type="button" onClick={onClose} className={btnGhost}>
            ยกเลิก
          </button>
          <button disabled={busy || adding} className={btnPrimary}>
            {busy && <Spinner className="w-4 h-4" />} บันทึก
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Products({ products, onChanged, notify }) {
  const [editing, setEditing] = useState(null); // { product, isNew }
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => !s || `${p.id} ${p.name}`.toLowerCase().includes(s));
  }, [products, q]);

  const remove = async (p) => {
    if (!window.confirm(`ลบสินค้า "${p.name}"? (คำสั่งซื้อเดิมยังเก็บไว้) — ถ้าแค่ไม่อยากขายชั่วคราว ให้ปิด "แสดงหน้าร้าน" แทน`)) return;
    try {
      await api.deleteProduct(p.id);
      notify('ลบสินค้าแล้ว');
      onChanged();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className={`${inputCls} pl-9`} placeholder="ค้นหาสินค้า" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button onClick={() => setEditing({ product: EMPTY, isNew: true })} className={btnPrimary}>
          <Plus className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>
      <div className="grid gap-3">
        {list.map((p) => (
          <div key={p.id} className={`rounded-2xl bg-white border border-stone-200 p-3 flex items-center gap-4 ${p.active ? '' : 'opacity-60'}`}>
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-200">
              <ProductImage product={p} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {p.featured && <Star className="w-4 h-4 inline text-amber-500 fill-amber-500 mr-1 -mt-0.5" />}
                {p.name}
              </p>
              <p className="text-xs text-stone-500">
                {p.id} · {categoryOf(p.category).name} {!p.active && '· ซ่อนอยู่'}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{baht(unitPrice(p))}</p>
              <p className={p.stock === 0 ? 'text-rose-600' : p.stock <= 2 ? 'text-amber-700' : 'text-stone-500'}>สต็อก {p.stock}</p>
            </div>
            <button onClick={() => setEditing({ product: p, isNew: false })} className="p-2 rounded-lg hover:bg-stone-100" aria-label="แก้ไข">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => remove(p)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600" aria-label="ลบ">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-stone-500 py-10">ยังไม่มีสินค้า</p>}
      </div>
      {editing && (
        <ProductForm
          initial={editing.product}
          isNew={editing.isNew}
          notify={notify}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
