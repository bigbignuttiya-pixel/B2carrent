import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, Users, Tags, Settings as SettingsIcon, BarChart3, LogOut, Home, PencilRuler, UserRound, Lock } from 'lucide-react';
import { DEFAULT_SETTINGS, formatCode } from './data';
import { api } from './lib/api';
import { errorMessage } from './lib/errors';
import { usePersistentState } from './lib/storage';
import { Toasts, Spinner, btnPrimary, btnGhost } from './components/ui';

import Landing from './customer/Landing';
import BuyModal from './customer/BuyModal';
import Account from './customer/Account';
import Designer from './designer/Designer';

import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import Payments, { PaymentDrawer } from './admin/Payments';
import Customers from './admin/Customers';
import Revenue from './admin/Revenue';
import Plans from './admin/Plans';
import Settings from './admin/Settings';

// Pages: "#" landing, "#design" designer, "#account" customer account, "#admin" back office (not linked for customers)
const PAGES = ['design', 'account', 'admin'];
const pageFromHash = () => {
  if (window.location.hash.startsWith('#login=')) return 'design';
  // …/admin (path) also opens the back office — same as …/#admin
  if (/^\/admin\/?$/.test(window.location.pathname)) return 'admin';
  return PAGES.find((p) => window.location.hash === `#${p}`) || 'home';
};

const ADMIN_TABS = [
  { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'payments', label: 'การชำระเงิน', icon: Receipt },
  { id: 'revenue', label: 'รายรับรายเดือน', icon: BarChart3 },
  { id: 'customers', label: 'ลูกค้า', icon: Users },
  { id: 'plans', label: 'แพ็กเกจ', icon: Tags },
  { id: 'settings', label: 'ตั้งค่า', icon: SettingsIcon },
];

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Customer session: the secret access code is remembered on this device
  const [code, setCode] = usePersistentState('furniture:code', '');
  const [session, setSession] = useState(null); // { code, account, payments, projectCount }
  const [buy, setBuy] = useState(null); // { planId, reason } when the plan picker is open
  // Purchases made on this device ({ id, token }) — followed until the shop approves and the code is issued
  const [claims, setClaims] = usePersistentState('furniture:claims', []);
  const addClaim = useCallback((c) => setClaims((l) => [c, ...l.filter((x) => x.id !== c.id)].slice(0, 10)), [setClaims]);
  const forgetClaim = (id) => setClaims((l) => l.filter((x) => x.id !== id));

  const [adminState, setAdminState] = useState({ checked: false, signedIn: false, isAdmin: false, email: null });
  const [adminTab, setAdminTab] = useState('dashboard');
  const [adminData, setAdminData] = useState({ accounts: [], payments: [] });
  const [openPaymentId, setOpenPaymentId] = useState(null);

  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const sync = () => {
      setPage(pageFromHash());
      if (window.location.hash !== '#plans') window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const refreshPublic = useCallback(async () => {
    try {
      const d = await api.loadPublic();
      setPlans(d.plans.filter((p) => p.active));
      setSettings(d.settings);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setLoaded(true);
    }
  }, [notify]);

  // Load (or re-check) the customer's account. `strict` throws so the login form can show the error.
  const loadSession = useCallback(
    async (c, strict = false) => {
      try {
        const d = await api.account(c);
        setSession({ code: d.account.code, ...d });
        setCode(d.account.code);
        return d;
      } catch (err) {
        if (strict) throw err;
        if (err.code === 'invalid_code') {
          setSession(null);
          setCode('');
        }
        return null;
      }
    },
    [setCode]
  );

  useEffect(() => {
    refreshPublic();
  }, [refreshPublic]);
  // Scanned QR / login link: …/#login=CODE signs this device in and opens the designer
  useEffect(() => {
    const tryLogin = async () => {
      const m = window.location.hash.match(/^#login=([A-Za-z0-9-]+)/);
      if (!m) return false;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#design`);
      setPage('design');
      try {
        await loadSession(m[1], true);
        notify('เข้าใช้งานเรียบร้อย');
      } catch (err) {
        notify(errorMessage(err), 'error');
        window.location.hash = '#account';
      }
      return true;
    };
    tryLogin().then((did) => {
      if (!did && code) loadSession(code);
    });
    const onHash = () => tryLogin();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While a payment is waiting for approval, re-check every 30 s so the designer unlocks by itself
  const waiting = session && !session.account.active && session.payments.some((p) => p.status === 'Pending');
  useEffect(() => {
    if (!waiting) return undefined;
    const t = setInterval(() => loadSession(session.code), 30000);
    return () => clearInterval(t);
  }, [waiting, session?.code, loadSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const signOutCustomer = () => {
    setSession(null);
    setCode('');
    window.location.hash = '';
  };

  // ---------- admin ----------
  const refreshAdminState = useCallback(async () => {
    try {
      setAdminState({ checked: true, ...(await api.getAdminState()) });
    } catch {
      setAdminState({ checked: true, signedIn: false, isAdmin: false, email: null });
    }
  }, []);
  const refreshAdmin = useCallback(async () => {
    try {
      setAdminData(await api.loadAdmin());
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  }, [notify]);
  useEffect(() => {
    if (page !== 'admin') return undefined;
    refreshAdminState();
    return api.onAuthChange(refreshAdminState);
  }, [page, refreshAdminState]);
  const isAdmin = adminState.isAdmin;
  useEffect(() => {
    if (page !== 'admin' || !isAdmin) return undefined;
    refreshAdmin();
    let t;
    const unsub = api.subscribe(() => {
      clearTimeout(t);
      t = setTimeout(refreshAdmin, 400);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [page, isAdmin, refreshAdmin]);

  const toastsEl = <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />;

  if (page === 'admin') {
    const pendingCount = adminData.payments.filter((p) => p.status === 'Pending').length;
    const openPayment = adminData.payments.find((p) => p.id === openPaymentId) || null;
    return (
      <div className="min-h-screen font-sans text-stone-800 bg-stone-100">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
            <span className="font-semibold">{settings.shopName} · หลังบ้าน</span>
            <a href="/" className="ml-auto inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
              <Home className="w-4 h-4" /> หน้าเว็บ
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
                  {id === 'payments' && pendingCount > 0 && <span className="ml-1 rounded-full bg-amber-600 text-white text-[10px] px-1.5">{pendingCount}</span>}
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
            <Dashboard {...adminData} onOpenPayment={setOpenPaymentId} />
          ) : adminTab === 'payments' ? (
            <Payments payments={adminData.payments} onOpenPayment={setOpenPaymentId} />
          ) : adminTab === 'revenue' ? (
            <Revenue payments={adminData.payments} shopName={settings.shopName} notify={notify} />
          ) : adminTab === 'customers' ? (
            <Customers accounts={adminData.accounts} notify={notify} onChanged={refreshAdmin} />
          ) : adminTab === 'plans' ? (
            <Plans notify={notify} onChanged={refreshPublic} />
          ) : (
            <Settings settings={settings} notify={notify} onSaved={refreshPublic} />
          )}
        </main>
        {isAdmin && openPayment && <PaymentDrawer payment={openPayment} notify={notify} onClose={() => setOpenPaymentId(null)} onChanged={refreshAdmin} />}
        {toastsEl}
      </div>
    );
  }

  const active = Boolean(session?.account.active);
  const openBuy = (planId, reason) => setBuy({ planId, reason });
  const navLink = (id, label, Icon) => (
    <a href={`#${id === 'home' ? '' : id}`} className={`inline-flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg ${page === id ? 'text-stone-900 font-medium bg-stone-100' : 'text-stone-600 hover:text-stone-900'}`}>
      <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
    </a>
  );

  return (
    <div className="min-h-screen font-sans text-stone-800 bg-stone-50">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className={`mx-auto ${page === 'design' ? '' : 'max-w-6xl'} px-4 h-16 flex items-center gap-2`}>
          <a href="#" className="text-lg sm:text-xl font-bold tracking-tight mr-auto truncate">
            {settings.shopName}
          </a>
          {navLink('design', 'ออกแบบ', PencilRuler)}
          {navLink('account', session ? (active ? `ใช้ได้ถึง ${session.account.expiresAt.slice(5, 10).split('-').reverse().join('/')}` : 'บัญชีของฉัน') : 'เข้าใช้งาน', UserRound)}
          {!active && (
            <button onClick={() => openBuy()} className={`${btnPrimary} py-2`}>
              ซื้อแพ็กเกจ
            </button>
          )}
        </div>
      </header>

      {page === 'design' ? (
        !loaded ? (
          <div className="py-32 grid place-items-center text-stone-400">
            <Spinner className="w-8 h-8" />
          </div>
        ) : active || settings.allowTrial ? (
          <Designer settings={settings} session={session} notify={notify} onNeedAccess={(reason) => ((session ? session.payments.some((p) => p.status === 'Pending') : claims.length > 0) && !active ? (window.location.hash = '#account') : openBuy(undefined, reason))} />
        ) : (
          <main className="px-4 py-16">
            <div className="max-w-md mx-auto rounded-3xl bg-white border border-stone-200 p-8 text-center space-y-4">
              <Lock className="w-10 h-10 mx-auto text-amber-600" />
              <h1 className="text-lg font-semibold">หน้าออกแบบสำหรับผู้ที่มีแพ็กเกจ</h1>
              <p className="text-sm text-stone-500">
                {session ? `รหัส ${formatCode(session.code)} ยังไม่ได้เปิดใช้งานหรือหมดอายุแล้ว` : 'ซื้อแพ็กเกจหรือเข้าใช้งานด้วยรหัสที่มีอยู่'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button onClick={() => openBuy()} className={btnPrimary}>
                  ซื้อแพ็กเกจ
                </button>
                <a href="#account" className={btnGhost}>
                  {session ? 'ดูสถานะการชำระเงิน' : 'เข้าใช้งานด้วยรหัส'}
                </a>
              </div>
            </div>
          </main>
        )
      ) : page === 'account' ? (
        <Account session={session} settings={settings} claims={claims} notify={notify} onSession={loadSession} onSignOut={signOutCustomer} onBuy={(planId) => openBuy(planId)} onForgetClaim={forgetClaim} />
      ) : (
        <Landing settings={settings} plans={plans} onBuy={(planId) => openBuy(planId)} />
      )}

      <BuyModal
        open={Boolean(buy)}
        plans={plans}
        settings={settings}
        session={session}
        initialPlanId={buy?.planId}
        reason={buy?.reason}
        notify={notify}
        onClose={() => setBuy(null)}
        onSession={(c) => loadSession(c)}
        onClaim={addClaim}
      />
      {toastsEl}
    </div>
  );
}
