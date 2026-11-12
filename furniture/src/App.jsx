import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingCart, LayoutDashboard, Receipt, Package, Settings as SettingsIcon, LogOut, Store } from 'lucide-react';
import { DEFAULT_SETTINGS } from './data';
import { api } from './lib/api';
import { errorMessage } from './lib/errors';
import { usePersistentState } from './lib/storage';
import { Toasts, Spinner } from './components/ui';

import Storefront, { ProductModal } from './customer/Storefront';
import CartDrawer from './customer/CartDrawer';
import Checkout from './customer/Checkout';
import Tracker from './customer/Tracker';

import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import Orders, { OrderDrawer } from './admin/Orders';
import Products from './admin/Products';
import Settings from './admin/Settings';

// Pages: "#" storefront, "#track" order tracker, "#admin" back office (link is not shown to customers)
const pageFromHash = () => (window.location.hash === '#admin' ? 'admin' : window.location.hash === '#track' ? 'track' : 'shop');

const ADMIN_TABS = [
  { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'orders', label: 'คำสั่งซื้อ', icon: Receipt },
  { id: 'products', label: 'สินค้า', icon: Package },
  { id: 'settings', label: 'ตั้งค่าร้าน', icon: SettingsIcon },
];

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [cart, setCart] = usePersistentState('furniture:cart', {}); // { productId: qty }
  const [myPhones, setMyPhones] = usePersistentState('furniture:phones', []);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  const [adminState, setAdminState] = useState({ checked: false, signedIn: false, isAdmin: false, email: null });
  const [adminTab, setAdminTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [openOrderId, setOpenOrderId] = useState(null);

  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const sync = () => {
      setPage(pageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const refreshPublic = useCallback(async () => {
    try {
      const d = await api.loadPublic();
      setProducts(d.products);
      setSettings(d.settings);
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAdminState = useCallback(async () => {
    try {
      setAdminState({ checked: true, ...(await api.getAdminState()) });
    } catch {
      setAdminState({ checked: true, signedIn: false, isAdmin: false, email: null });
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      setOrders(await api.loadOrders());
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  }, [notify]);

  useEffect(() => {
    refreshPublic();
    refreshAdminState();
    return api.onAuthChange(refreshAdminState);
  }, [refreshPublic, refreshAdminState]);

  // Admin data + live updates while the back office is open
  const isAdmin = adminState.isAdmin;
  useEffect(() => {
    if (page !== 'admin' || !isAdmin) return undefined;
    refreshPublic(); // as admin this also returns hidden products
    refreshOrders();
    let t;
    const unsub = api.subscribe(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        refreshOrders();
        refreshPublic();
      }, 400);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [page, isAdmin, refreshOrders, refreshPublic]);

  // Customers only see active products (admins get hidden ones too, for the back office)
  const shopProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: shopProducts.find((p) => p.id === id), qty }))
        .filter((i) => i.product),
    [cart, shopProducts]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const addToCart = (product, qty) => {
    const now = cart[product.id] || 0;
    const next = Math.min(product.stock, now + qty);
    if (next === now) return notify(`"${product.name}" อยู่ในตะกร้าครบจำนวนที่มีแล้ว`, 'info');
    setCart((c) => ({ ...c, [product.id]: next }));
    notify(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`);
  };
  const setQty = (id, qty) =>
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[id];
      else n[id] = qty;
      return n;
    });

  const onPlaced = (order) => {
    setCart({});
    setMyPhones((l) => [order.phone, ...l.filter((p) => p !== order.phone)].slice(0, 5));
    refreshPublic(); // stock changed
  };

  const openOrder = orders.find((o) => o.id === openOrderId) || null;

  if (page === 'admin') {
    return (
      <div className="min-h-screen font-sans text-stone-800 bg-stone-100">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
            <span className="font-semibold">{settings.shopName} · หลังบ้าน</span>
            <a href="#" className="ml-auto inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
              <Store className="w-4 h-4" /> หน้าร้าน
            </a>
            {adminState.signedIn && (
              <button onClick={() => api.signOut()} className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
                <LogOut className="w-4 h-4" /> ออก
              </button>
            )}
          </div>
          {isAdmin && (
            <nav className="mx-auto max-w-6xl px-4 flex gap-1 overflow-x-auto">
              {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setAdminTab(id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 ${adminTab === id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                  {id === 'orders' && orders.some((o) => o.status === 'Pending') && (
                    <span className="ml-1 rounded-full bg-amber-600 text-white text-[10px] px-1.5">{orders.filter((o) => o.status === 'Pending').length}</span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          {!adminState.checked ? (
            <div className="py-20 grid place-items-center text-stone-400">
              <Spinner className="w-8 h-8" />
            </div>
          ) : !isAdmin ? (
            <div className="py-10">
              <AdminLogin adminState={adminState} onSignIn={api.signIn} onSignOut={api.signOut} />
            </div>
          ) : adminTab === 'dashboard' ? (
            <Dashboard orders={orders} products={products} onOpenOrder={setOpenOrderId} />
          ) : adminTab === 'orders' ? (
            <Orders orders={orders} onOpenOrder={setOpenOrderId} />
          ) : adminTab === 'products' ? (
            <Products products={products} notify={notify} onChanged={refreshPublic} />
          ) : (
            <Settings settings={settings} notify={notify} onSaved={refreshPublic} />
          )}
        </main>
        {isAdmin && openOrder && (
          <OrderDrawer
            order={openOrder}
            notify={notify}
            onClose={() => setOpenOrderId(null)}
            onChanged={() => {
              refreshOrders();
              refreshPublic();
            }}
          />
        )}
        <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-stone-50">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <a href="#" className="text-xl font-bold tracking-tight">
            {settings.shopName}
          </a>
          <a href="#track" className={`ml-auto text-sm ${page === 'track' ? 'text-stone-900 font-medium' : 'text-stone-600 hover:text-stone-900'}`}>
            ติดตามคำสั่งซื้อ
          </a>
          <button onClick={() => setCartOpen(true)} className="relative rounded-full p-2 hover:bg-stone-100" aria-label="ตะกร้าสินค้า">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-amber-600 text-white text-xs h-5 min-w-5 px-1 grid place-items-center">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {page === 'track' ? (
        <Tracker settings={settings} myPhones={myPhones} notify={notify} />
      ) : (
        <Storefront products={shopProducts} settings={settings} loading={loading} loadError={loadError} onOpen={setViewing} onAdd={addToCart} />
      )}

      {viewing && (
        <ProductModal key={viewing.id} product={viewing} inCart={cart[viewing.id] || 0} onClose={() => setViewing(null)} onAdd={addToCart} />
      )}
      <CartDrawer
        open={cartOpen}
        items={cartItems}
        settings={settings}
        onClose={() => setCartOpen(false)}
        onQty={setQty}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <Checkout open={checkoutOpen} items={cartItems} settings={settings} notify={notify} onClose={() => setCheckoutOpen(false)} onPlaced={onPlaced} />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
