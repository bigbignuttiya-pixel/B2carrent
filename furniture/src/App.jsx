import { useMemo, useState } from 'react';
import { ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { CATEGORIES, PRODUCTS, baht } from './data.js';

export default function App() {
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState({}); // { productId: qty }
  const [cartOpen, setCartOpen] = useState(false);

  const products = category === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);

  const items = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ ...PRODUCTS.find((p) => p.id === Number(id)), qty })),
    [cart],
  );
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  const changeQty = (id, delta) =>
    setCart((c) => {
      const qty = (c[id] || 0) + delta;
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  return (
    <div className="min-h-screen font-sans text-stone-800">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Furniture</h1>
          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-full p-2 hover:bg-stone-100"
            aria-label="ตะกร้าสินค้า"
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-amber-600 text-white text-xs h-5 min-w-5 px-1 grid place-items-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl sm:text-4xl font-semibold">เฟอร์นิเจอร์สำหรับทุกห้องในบ้าน</h2>
        <p className="mt-2 text-stone-500">ดีไซน์เรียบง่าย วัสดุคุณภาพ จัดส่งถึงบ้าน</p>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm border ${
                category === c.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white border-stone-300 hover:bg-stone-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article key={p.id} className="rounded-2xl bg-white border border-stone-200 overflow-hidden flex flex-col">
              <div className={`${p.color} aspect-[4/3] grid place-items-center text-6xl`}>{p.emoji}</div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-medium">{p.name}</h3>
                <p className="mt-1 text-lg font-semibold text-amber-700">{baht(p.price)}</p>
                <button
                  onClick={() => changeQty(p.id, 1)}
                  className="mt-auto pt-3"
                >
                  <span className="block w-full rounded-xl bg-stone-800 text-white py-2 hover:bg-stone-700">
                    ใส่ตะกร้า
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setCartOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">ตะกร้าสินค้า</h2>
              <button onClick={() => setCartOpen(false)} className="p-1 rounded hover:bg-stone-100" aria-label="ปิด">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="mt-8 text-center text-stone-500">ยังไม่มีสินค้าในตะกร้า</p>
            ) : (
              <ul className="mt-4 flex-1 overflow-y-auto divide-y divide-stone-200">
                {items.map((i) => (
                  <li key={i.id} className="py-3 flex items-center gap-3">
                    <span className="text-3xl">{i.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="text-sm text-stone-500">{baht(i.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(i.id, -1)} className="p-1 rounded border border-stone-300" aria-label="ลด">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-5 text-center">{i.qty}</span>
                      <button onClick={() => changeQty(i.id, 1)} className="p-1 rounded border border-stone-300" aria-label="เพิ่ม">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-stone-200 pt-4">
              <div className="flex justify-between font-semibold">
                <span>รวม</span>
                <span>{baht(total)}</span>
              </div>
              <button
                disabled={items.length === 0}
                className="mt-3 w-full rounded-xl bg-amber-600 text-white py-3 disabled:opacity-40"
              >
                สั่งซื้อ
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
