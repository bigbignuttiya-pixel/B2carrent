import { Minus, Plus, Trash2, X } from 'lucide-react';
import { baht, unitPrice, shippingFor } from '../data';
import { ProductImage, btnAccent } from '../components/ui';

export default function CartDrawer({ open, items, settings, onClose, onQty, onCheckout }) {
  if (!open) return null;
  const subtotal = items.reduce((s, i) => s + unitPrice(i.product) * i.qty, 0);
  const shipping = shippingFor(subtotal, settings);
  const remainingForFree = settings.freeShippingMin > 0 ? settings.freeShippingMin - subtotal : 0;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 animate-fade-in" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold">ตะกร้าสินค้า</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100" aria-label="ปิด">
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="flex-1 grid place-items-center text-stone-500">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-stone-100 px-5">
            {items.map(({ product: p, qty }) => (
              <li key={p.id} className="py-4 flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                  <ProductImage product={p} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-sm text-stone-500">{baht(unitPrice(p))}</p>
                  {qty > p.stock && <p className="text-xs text-rose-600">เหลือเพียง {p.stock} ชิ้น</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => onQty(p.id, qty - 1)} className="p-1 rounded-lg border border-stone-300" aria-label="ลดจำนวน">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm">{qty}</span>
                    <button disabled={qty >= p.stock} onClick={() => onQty(p.id, qty + 1)} className="p-1 rounded-lg border border-stone-300 disabled:opacity-30" aria-label="เพิ่มจำนวน">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => onQty(p.id, 0)} className="ml-auto p-1 text-stone-400 hover:text-rose-600" aria-label="ลบ">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium">{baht(unitPrice(p) * qty)}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-stone-200 p-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>ราคาสินค้า</span>
            <span>{baht(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>ค่าจัดส่ง</span>
            <span>{shipping ? baht(shipping) : subtotal ? 'ฟรี' : '-'}</span>
          </div>
          {remainingForFree > 0 && subtotal > 0 && <p className="text-xs text-amber-700">ซื้อเพิ่มอีก {baht(remainingForFree)} ส่งฟรี</p>}
          <div className="flex justify-between text-base font-semibold pt-2">
            <span>รวมทั้งหมด</span>
            <span>{baht(subtotal + shipping)}</span>
          </div>
          <button
            disabled={!items.length || items.some((i) => i.qty > i.product.stock)}
            onClick={onCheckout}
            className={`${btnAccent} w-full py-3 mt-2`}
          >
            สั่งซื้อสินค้า
          </button>
        </div>
      </aside>
    </div>
  );
}
