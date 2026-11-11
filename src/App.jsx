import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, CalendarDays, FileText, Car, Settings as SettingsIcon, LogOut, Cloud, HardDrive, Loader2, RefreshCw } from 'lucide-react';

import { DEFAULT_SETTINGS, HERO_SLIDES, LOCATIONS } from './data';
import { calculateDays, isVehicleFree, todayISO, addDaysISO } from './lib/pricing';
import { usePersistentState } from './lib/storage';
import { api, isCloud, errorMessage } from './lib/api';

import Header from './components/Header';
import { Toasts } from './components/ui';
import Hero from './customer/Hero';
import Fleet from './customer/Fleet';
import PreviewModal from './customer/PreviewModal';
import BookingModal from './customer/BookingModal';
import Tracker from './customer/Tracker';
import { HowItWorks, Destinations, WhyB2, Reviews, RequirementsAndFaq, Footer, FloatingContact } from './customer/InfoSections';

import Dashboard from './admin/Dashboard';
import Schedule from './admin/Schedule';
import Bookings, { BookingDrawer } from './admin/Bookings';
import FleetAdmin from './admin/FleetAdmin';
import Settings from './admin/Settings';
import AdminLogin from './admin/AdminLogin';

const K = (name) => `b2:v1:${name}`;

export default function App() {
  const [viewMode, setViewMode] = useState('customer');
  const [customerTab, setCustomerTab] = useState('browse');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [slideIndex, setSlideIndex] = useState(0);

  // Shared data (cloud database, or this browser in demo mode)
  const [vehicles, setVehicles] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ranges, setRanges] = useState([]); // occupied date ranges, no personal data
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Admin-only data
  const [adminState, setAdminState] = useState({ checked: false, signedIn: false, isAdmin: false, email: null });
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Per-device conveniences
  const [favorites, setFavorites] = usePersistentState(K('favorites'), []);
  const [myPhones, setMyPhones] = usePersistentState(K('my-phones'), []);
  const [myBookings, setMyBookings] = useState([]);

  // Search & filters
  const [searchParams, setSearchParams] = useState(() => ({
    location: LOCATIONS[0],
    pickupDate: addDaysISO(todayISO(), 5),
    pickupTime: '09:00',
    returnDate: addDaysISO(todayISO(), 7),
    returnTime: '09:00',
    vehicleType: 'All',
  }));
  const [filters, setFilters] = useState({ type: 'All', category: 'All', query: '', sort: 'recommended', onlyFree: false, onlyFav: false });

  // Modals
  const [previewVehicle, setPreviewVehicle] = useState(null);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [drawerBookingId, setDrawerBookingId] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  // ---------- Loading ----------
  const refreshPublic = useCallback(async () => {
    try {
      const d = await api.loadPublic();
      setVehicles(d.vehicles);
      setSettings(d.settings);
      setRanges(d.ranges);
      setLoadError('');
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    try {
      const d = await api.loadAdmin();
      setBookings(d.bookings);
      setCoupons(d.coupons);
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  }, [notify]);

  const refreshAdminState = useCallback(async () => {
    try {
      setAdminState({ checked: true, ...(await api.getAdminState()) });
    } catch {
      setAdminState({ checked: true, signedIn: false, isAdmin: false, email: null });
    }
  }, []);

  const refreshMine = useCallback(async () => {
    if (!myPhones.length) return setMyBookings([]);
    try {
      const lists = await Promise.all(myPhones.map((p) => api.findBookings(p)));
      const seen = new Set();
      setMyBookings(lists.flat().filter((b) => !seen.has(b.id) && seen.add(b.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      /* keep previous list */
    }
  }, [myPhones]);

  useEffect(() => {
    refreshPublic();
    refreshAdminState();
    return api.onAuthChange(refreshAdminState);
  }, [refreshPublic, refreshAdminState]);

  useEffect(() => {
    refreshMine();
  }, [refreshMine]);

  // Admin: load bookings/coupons and listen for live changes
  useEffect(() => {
    if (!adminState.isAdmin) {
      setBookings([]);
      setCoupons([]);
      return undefined;
    }
    refreshAdmin();
    return api.subscribe(() => {
      refreshAdmin();
      refreshPublic();
    });
  }, [adminState.isAdmin, refreshAdmin, refreshPublic]);

  // Fresh data every time the admin console is opened
  useEffect(() => {
    if (viewMode !== 'admin' || !adminState.isAdmin) return;
    refreshAdmin();
    refreshPublic();
  }, [viewMode, adminState.isAdmin, refreshAdmin, refreshPublic]);

  // Refresh when the visitor comes back to the tab (other devices may have changed data)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      refreshPublic();
      if (adminState.isAdmin) refreshAdmin();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshPublic, refreshAdmin, adminState.isAdmin]);

  // Warn when browser storage is full (demo mode)
  useEffect(() => {
    let last = 0;
    const onErr = () => {
      if (Date.now() - last < 5000) return;
      last = Date.now();
      notify('พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม — ลองลดจำนวนรูป ข้อมูลล่าสุดอาจหายเมื่อรีเฟรช', 'error');
    };
    window.addEventListener('b2:storage-error', onErr);
    return () => window.removeEventListener('b2:storage-error', onErr);
  }, [notify]);

  useEffect(() => {
    const t = setInterval(() => setSlideIndex((p) => (p + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Keep the hero vehicle-type selector and fleet type filter in sync
  useEffect(() => {
    setFilters((f) => ({ ...f, type: searchParams.vehicleType, category: 'All' }));
  }, [searchParams.vehicleType]);

  const rentalDays = useMemo(
    () => calculateDays(searchParams.pickupDate, searchParams.returnDate, searchParams.pickupTime, searchParams.returnTime),
    [searchParams]
  );

  const freeMap = useMemo(() => {
    const m = {};
    vehicles.forEach((v) => {
      m[v.id] = rentalDays > 0 && isVehicleFree(v.id, ranges, searchParams.pickupDate, searchParams.returnDate);
    });
    return m;
  }, [vehicles, ranges, searchParams.pickupDate, searchParams.returnDate, rentalDays]);

  const bookable = (v) => v && v.status === 'Available' && freeMap[v.id];

  const fleetList = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = vehicles.filter(
      (v) =>
        (filters.type === 'All' || v.type === filters.type) &&
        (filters.category === 'All' || v.category === filters.category) &&
        (!q || `${v.name} ${v.brand} ${v.category}`.toLowerCase().includes(q)) &&
        (!filters.onlyFree || bookable(v)) &&
        (!filters.onlyFav || favorites.includes(v.id))
    );
    const sorters = {
      'price-asc': (a, b) => a.pricePerDay - b.pricePerDay,
      'price-desc': (a, b) => b.pricePerDay - a.pricePerDay,
      rating: (a, b) => b.rating - a.rating,
      recommended: (a, b) => Number(bookable(b)) - Number(bookable(a)) || b.reviewsCount - a.reviewsCount,
    };
    return [...list].sort(sorters[filters.sort]);
  }, [vehicles, filters, favorites, freeMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableCount = vehicles.filter((v) => (searchParams.vehicleType === 'All' || v.type === searchParams.vehicleType) && bookable(v)).length;
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;

  // Run an async action with error toast
  const run = async (fn, successMsg, type = 'success') => {
    try {
      const out = await fn();
      if (successMsg) notify(successMsg, type);
      return out;
    } catch (err) {
      notify(errorMessage(err), 'error');
      return null;
    }
  };

  // ---------- Customer actions ----------
  const goTab = (tab) => {
    setCustomerTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollToId = (id) => {
    if (id === 'my-bookings') return goTab('my-bookings');
    setCustomerTab('browse');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const toggleFav = (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const openBooking = (v) => {
    if (!bookable(v)) return notify('รถคันนี้ไม่ว่างในช่วงวันที่เลือก กรุณาเปลี่ยนวันหรือเลือกคันอื่น', 'error');
    setPreviewVehicle(null);
    setBookingVehicle(v);
  };

  const rememberPhone = (phone) => setMyPhones((cur) => (cur.includes(phone) ? cur : [phone, ...cur].slice(0, 5)));

  const submitBooking = async ({ vehicle, info, addons, couponCode, slip }) => {
    const booking = await run(
      () =>
        api.createBooking({
          vehicleId: vehicle.id,
          startDate: searchParams.pickupDate,
          endDate: searchParams.returnDate,
          pickupTime: searchParams.pickupTime,
          returnTime: searchParams.returnTime,
          location: searchParams.location,
          addons,
          couponCode,
          name: info.name,
          phone: info.phone,
          email: info.email,
          idCard: info.idCard,
          license: info.license,
          note: info.note,
          slip,
        }),
      null
    );
    refreshPublic(); // availability changed (or someone else took the dates)
    if (!booking) return null;
    rememberPhone(booking.phone);
    setMyBookings((cur) => [booking, ...cur.filter((b) => b.id !== booking.id)]);
    if (adminState.isAdmin) refreshAdmin();
    notify(`สร้างรายการจอง ${booking.id} สำเร็จ`);
    return booking;
  };

  const replaceMine = (b) => b && setMyBookings((cur) => cur.map((x) => (x.id === b.id ? b : x)));

  const customerCancel = async (b) => {
    const out = await run(() => api.cancelBooking(b.id, b.phone), 'ยกเลิกการจองเรียบร้อย', 'info');
    replaceMine(out);
    refreshPublic();
    if (adminState.isAdmin) refreshAdmin();
    return out;
  };

  const customerAttachSlip = async (b, dataUrl) => {
    const out = await run(() => api.attachSlip(b.id, b.phone, dataUrl), 'แนบสลิปเรียบร้อย ทีมงานกำลังตรวจสอบ');
    replaceMine(out);
    if (adminState.isAdmin) refreshAdmin();
    return out;
  };

  const searchBookings = async (phone, id) => {
    const list = await run(() => api.findBookings(phone, id));
    if (list?.length) rememberPhone(list[0].phone);
    return list || [];
  };

  // ---------- Admin actions ----------
  const changeBookingStatus = async (id, status) => {
    const labels = { Confirmed: 'อนุมัติการจองแล้ว', 'Picked Up': 'บันทึกการส่งมอบรถแล้ว', Completed: 'บันทึกรับคืนรถแล้ว', Cancelled: 'ยกเลิกรายการแล้ว' };
    await run(() => api.setBookingStatus(id, status), `${id}: ${labels[status] || status}`, status === 'Cancelled' ? 'info' : 'success');
    await Promise.all([refreshAdmin(), refreshPublic()]);
  };

  const saveVehicle = async (data, id) => {
    let vehicle;
    if (id) {
      const current = vehicles.find((v) => v.id === id) || {};
      vehicle = { ...current, ...data, id };
    } else {
      const prefix = data.type === 'Motorcycle' ? 'M' : 'C';
      const max = vehicles.filter((v) => v.id.startsWith(`B2-${prefix}`)).reduce((m, v) => Math.max(m, Number(v.id.slice(4)) || 0), prefix === 'M' ? 100 : 200);
      vehicle = { ...data, id: `B2-${prefix}${max + 1}`, rating: 5.0, reviewsCount: 0, status: 'Available' };
    }
    const saved = await run(() => api.saveVehicle(vehicle, !id), id ? `บันทึกการแก้ไข ${vehicle.name} แล้ว` : `เพิ่ม ${vehicle.name} (${vehicle.id}) เข้าฟลีตแล้ว`);
    await refreshPublic();
    return saved;
  };

  const setVehicleStatus = async (id, status) => {
    await run(() => api.setVehicleStatus(id, status));
    refreshPublic();
  };

  const deleteVehicle = async (id) => {
    await run(() => api.deleteVehicle(id), 'ลบพาหนะออกจากฟลีตแล้ว', 'info');
    refreshPublic();
  };

  const saveSettings = async (s) => {
    const ok = await run(() => api.saveSettings(s), 'บันทึกการตั้งค่าเรียบร้อยแล้ว');
    if (ok !== null) setSettings(s);
  };

  const saveCoupons = async (list) => {
    setCoupons(list);
    await run(() => api.saveCoupons(list));
    refreshAdmin();
  };

  const resetDemo = async () => {
    await api.resetDemo();
    setFavorites([]);
    setMyPhones([]);
    await Promise.all([refreshPublic(), refreshAdmin()]);
    notify('รีเซ็ตข้อมูลตัวอย่างเรียบร้อย', 'info');
  };

  const signIn = async (email, password) => {
    try {
      await api.signIn(email, password);
    } catch (err) {
      throw new Error(errorMessage(err));
    }
    await refreshAdminState();
  };

  const signOut = async () => {
    await api.signOut();
    await refreshAdminState();
    notify('ออกจากระบบแล้ว', 'info');
  };

  const drawerBooking = bookings.find((b) => b.id === drawerBookingId) || null;

  const ADMIN_TABS = [
    ['dashboard', 'ภาพรวมธุรกิจ', LayoutDashboard],
    ['schedule', 'ตารางคิวรถ', CalendarDays],
    ['bookings', `รายการจอง (${bookings.length})`, FileText],
    ['vehicles', `ฟลีตรถ (${vehicles.length})`, Car],
    ['settings', 'ตั้งค่าระบบ', SettingsIcon],
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-yellow-400 selection:text-slate-950">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeTab={customerTab}
        goTab={goTab}
        bookingCount={myBookings.length}
        pendingCount={pendingCount}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {viewMode === 'customer' && (
        <>
          <main className="flex-1">
            {loadError && (
              <div className="max-w-7xl mx-auto px-4 pt-4">
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                  <span>โหลดข้อมูลไม่สำเร็จ: {loadError}</span>
                  <button onClick={refreshPublic} className="flex items-center gap-1 font-bold text-white"><RefreshCw className="w-3.5 h-3.5" /> ลองใหม่</button>
                </div>
              </div>
            )}
            {customerTab === 'browse' ? (
              <>
                <Hero
                  slideIndex={slideIndex}
                  setSlideIndex={setSlideIndex}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  rentalDays={rentalDays}
                  availableCount={availableCount}
                  onSearch={() => scrollToId('fleet-section')}
                  notify={notify}
                />
                {loading ? (
                  <div className="py-20 flex justify-center text-slate-400 text-sm gap-2"><Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดรถว่าง…</div>
                ) : (
                <Fleet
                  vehicles={vehicles}
                  list={fleetList}
                  filters={filters}
                  setFilters={setFilters}
                  freeMap={freeMap}
                  rentalDays={rentalDays}
                  favorites={favorites}
                  onToggleFav={toggleFav}
                  onPreview={setPreviewVehicle}
                  onBook={openBooking}
                />
                )}
                <HowItWorks />
                <Destinations onPickVehicleType={() => scrollToId('fleet-section')} />
                <Reviews />
                <WhyB2 />
                <RequirementsAndFaq />
              </>
            ) : (
              <Tracker
                myBookings={myBookings}
                onSearch={searchBookings}
                onCancel={customerCancel}
                onAttachSlip={customerAttachSlip}
                onBrowse={() => goTab('browse')}
                notify={notify}
              />
            )}
          </main>
          <Footer settings={settings} onNav={scrollToId} />
          <FloatingContact settings={settings} />
        </>
      )}

      <PreviewModal vehicle={previewVehicle} bookable={bookable(previewVehicle)} onClose={() => setPreviewVehicle(null)} onBook={openBooking} />
      <BookingModal
        vehicle={bookingVehicle}
        searchParams={searchParams}
        rentalDays={rentalDays}
        checkCoupon={(code, v) => api.checkCoupon(code, v)}
        settings={settings}
        onSubmit={submitBooking}
        onAttachSlip={customerAttachSlip}
        onClose={() => setBookingVehicle(null)}
        onGoTracker={() => { setBookingVehicle(null); goTab('my-bookings'); }}
        notify={notify}
      />

      {viewMode === 'admin' && !adminState.isAdmin && (
        <main className="flex-1 px-4 py-16">
          {adminState.checked ? (
            <AdminLogin adminState={adminState} onSignIn={signIn} onSignOut={signOut} />
          ) : (
            <div className="flex justify-center text-slate-400 text-sm gap-2"><Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบสิทธิ์…</div>
          )}
        </main>
      )}

      {viewMode === 'admin' && adminState.isAdmin && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center">
                <LayoutDashboard className="w-6 h-6 mr-2 text-yellow-400" /> ระบบหลังบ้าน B2 Rental Manager
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                บริหารจัดการฟลีตรถ ตารางคิว รายการจองลูกค้า และตั้งค่าระบบ
                {isCloud ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5"><Cloud className="w-3 h-3" /> ข้อมูลกลางบนคลาวด์</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5" title="ยังไม่ได้ตั้งค่า Supabase — ข้อมูลอยู่ในเบราว์เซอร์นี้เท่านั้น"><HardDrive className="w-3 h-3" /> โหมดเดโม (เก็บในเบราว์เซอร์นี้)</span>
                )}
                {adminState.email && (
                  <button onClick={signOut} className="inline-flex items-center gap-1 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-full px-2 py-0.5">
                    <LogOut className="w-3 h-3" /> {adminState.email}
                  </button>
                )}
              </p>
            </div>
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-thin">
              {ADMIN_TABS.map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setAdminTab(id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${adminTab === id ? 'bg-yellow-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                  {id === 'bookings' && pendingCount > 0 && <span className="bg-rose-500 text-white text-[9px] px-1.5 rounded-full">{pendingCount}</span>}
                </button>
              ))}
            </div>
          </div>

          {adminTab === 'dashboard' && <Dashboard bookings={bookings} vehicles={vehicles} onOpenBooking={setDrawerBookingId} />}
          {adminTab === 'schedule' && <Schedule vehicles={vehicles} bookings={bookings} onOpenBooking={setDrawerBookingId} />}
          {adminTab === 'bookings' && <Bookings bookings={bookings} onOpen={setDrawerBookingId} onStatus={changeBookingStatus} />}
          {adminTab === 'vehicles' && (
            <FleetAdmin
              vehicles={vehicles}
              bookings={bookings}
              onStatus={setVehicleStatus}
              onSave={saveVehicle}
              notify={notify}
              onDelete={deleteVehicle}
            />
          )}
          {adminTab === 'settings' && (
            <Settings
              settings={settings}
              coupons={coupons}
              onSave={saveSettings}
              onSaveCoupons={saveCoupons}
              onResetDemo={isCloud ? null : resetDemo}
            />
          )}
        </main>
      )}

      <BookingDrawer booking={drawerBooking} onClose={() => setDrawerBookingId(null)} onStatus={changeBookingStatus} getSlipUrl={api.getSlipUrl} />

      {viewMode === 'admin' && (
        <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-auto text-center text-xs text-slate-500 no-print">
          © 2026 B2 MOTORCYCLE & CAR RENTAL SERVICES — Admin Console
        </footer>
      )}
    </div>
  );
}
