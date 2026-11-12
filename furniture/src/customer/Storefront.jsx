import { useMemo, useState } from 'react';
import { Search, Truck, ShieldCheck, Phone, MapPin, Clock, Facebook, MessageCircle } from 'lucide-react';
import { CATEGORIES, baht, unitPrice, categoryOf } from '../data';
import { ProductImage, Modal, ModalHeader, btnPrimary, inputCls } from '../components/ui';
import { lineChatUrl } from '../lib/line';

function PriceTag({ product, big = false }) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${big ? 'text-2xl' : 'text-lg'} font-semibold text-amber-700`}>{baht(unitPrice(product))}</span>
      {onSale && <span className="text-sm text-stone-400 line-through">{baht(product.price)}</span>}
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd }) {
  const out = product.stock <= 0;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  return (
    <article className="group rounded-2xl bg-white border border-stone-200 overflow-hidden flex flex-col hover:shadow-md transition">
      <button onClick={() => onOpen(product)} className="relative aspect-[4/3] overflow-hidden text-left">
        <ProductImage product={product} className="group-hover:scale-105 transition duration-300" />
        {onSale && <span className="absolute top-3 left-3 rounded-full bg-rose-600 text-white text-xs px-2.5 py-1">ลดราคา</span>}
        {out && <span className="absolute inset-0 bg-white/60 grid place-items-center text-sm font-medium">สินค้าหมด</span>}
      </button>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-stone-500">{categoryOf(product.category).name}</p>
        <button onClick={() => onOpen(product)} className="text-left font-medium mt-0.5 hover:underline">
          {product.name}
        </button>
        <div className="mt-1">
          <PriceTag product={product} />
        </div>
        <div className="mt-auto pt-3">
          <button disabled={out} onClick={() => onAdd(product, 1)} className={`${btnPrimary} w-full`}>
            {out ? 'สินค้าหมด' : 'ใส่ตะกร้า'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductModal({ product, inCart, onClose, onAdd }) {
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const left = product.stock - inCart;
  const specs = [
    ['วัสดุ', product.material],
    ['ขนาด', product.dimensions],
    ['สี', product.color],
  ].filter(([, v]) => v);
  return (
    <Modal open onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader title={product.name} onClose={onClose} />
      <div className="grid md:grid-cols-2 gap-6 p-5">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-stone-200">
            <ProductImage product={product} index={img} />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((u, i) => (
                <button key={u} onClick={() => setImg(i)} className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${i === img ? 'border-amber-600' : 'border-transparent'}`}>
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <p className="text-sm text-stone-500">{categoryOf(product.category).name}</p>
          <PriceTag product={product} big />
          {product.description && <p className="text-sm text-stone-700 whitespace-pre-line">{product.description}</p>}
          {specs.length > 0 && (
            <dl className="text-sm divide-y divide-stone-100 border-y border-stone-100">
              {specs.map(([k, v]) => (
                <div key={k} className="flex py-2">
                  <dt className="w-20 text-stone-500">{k}</dt>
                  <dd className="flex-1">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-sm text-stone-500">{product.stock > 0 ? `เหลือ ${product.stock} ชิ้น` : 'สินค้าหมด'}</p>
          {left > 0 && (
            <div className="flex gap-3">
              <select className={`${inputCls} w-24`} value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="จำนวน">
                {Array.from({ length: Math.min(left, 20) }, (_, i) => i + 1).map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <button
                className={`${btnPrimary} flex-1`}
                onClick={() => {
                  onAdd(product, qty);
                  onClose();
                }}
              >
                ใส่ตะกร้า
              </button>
            </div>
          )}
          {product.stock > 0 && left <= 0 && <p className="text-sm text-amber-700">คุณใส่สินค้านี้ในตะกร้าครบจำนวนที่มีแล้ว</p>}
        </div>
      </div>
    </Modal>
  );
}

export default function Storefront({ products, settings, loading, loadError, onOpen, onAdd }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recommended');

  const usedCategories = CATEGORIES.filter((c) => products.some((p) => p.category === c.id));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let l = products.filter(
      (p) => (category === 'all' || p.category === category) && (!q || `${p.name} ${p.description} ${p.material} ${p.color}`.toLowerCase().includes(q))
    );
    if (sort === 'price-asc') l = [...l].sort((a, b) => unitPrice(a) - unitPrice(b));
    if (sort === 'price-desc') l = [...l].sort((a, b) => unitPrice(b) - unitPrice(a));
    if (sort === 'recommended') l = [...l].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.stock > 0) - (a.stock > 0));
    return l;
  }, [products, category, query, sort]);

  const line = lineChatUrl(settings.lineOaId);

  return (
    <>
      <section className="bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-semibold leading-tight max-w-2xl">{settings.tagline || 'เฟอร์นิเจอร์สำหรับทุกห้องในบ้าน'}</h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
            {settings.shippingNote && (
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> {settings.shippingNote}
              </span>
            )}
            {settings.freeShippingMin > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> ส่งฟรีเมื่อซื้อครบ {baht(settings.freeShippingMin)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> ชำระผ่าน PromptPay ปลอดภัย
            </span>
          </div>
          <a href="#shop" className={`${btnPrimary} mt-8 px-6 py-3`}>
            เลือกซื้อสินค้า
          </a>
        </div>
      </section>

      <main id="shop" className="mx-auto max-w-6xl px-4 py-10 scroll-mt-16">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input className={`${inputCls} pl-9`} placeholder="ค้นหาสินค้า" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className={`${inputCls} sm:w-48`} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="เรียงลำดับ">
            <option value="recommended">แนะนำ</option>
            <option value="price-asc">ราคาต่ำ → สูง</option>
            <option value="price-desc">ราคาสูง → ต่ำ</option>
          </select>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {[{ id: 'all', name: 'ทั้งหมด' }, ...usedCategories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm border ${category === c.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-300 hover:bg-stone-100'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loadError && <p className="mt-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-4 text-sm">{loadError}</p>}
        {loading ? (
          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="rounded-2xl bg-stone-200/60 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-12 text-center text-stone-500">{products.length ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในร้าน'}</p>
        ) : (
          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} onAdd={onAdd} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm text-stone-600">
          <div>
            <p className="font-semibold text-stone-900 text-base">{settings.shopName}</p>
            {settings.address && (
              <p className="mt-2 flex gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {settings.address}
              </p>
            )}
            {settings.openHours && (
              <p className="mt-2 flex gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" /> {settings.openHours}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-stone-900">ติดต่อเรา</p>
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="flex gap-2 hover:text-stone-900">
                <Phone className="w-4 h-4" /> {settings.phone}
              </a>
            )}
            {line && (
              <a href={line} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-stone-900">
                <MessageCircle className="w-4 h-4" /> LINE {settings.lineOaId.startsWith('http') ? '' : settings.lineOaId}
              </a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-stone-900">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-stone-900">คำสั่งซื้อ</p>
            <a href="#track" className="block hover:text-stone-900">ติดตามคำสั่งซื้อ</a>
          </div>
        </div>
        <p className="text-center text-xs text-stone-400 pb-6">© {new Date().getFullYear()} {settings.shopName}</p>
      </footer>
    </>
  );
}
