import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, CalendarDays, FileText, Car, Settings as SettingsIcon } from 'lucide-react';

import { INITIAL_VEHICLES, INITIAL_BOOKINGS, DEFAULT_COUPONS, DEFAULT_SETTINGS, HERO_SLIDES, LOCATIONS } from './data';
import { calculateDays, isVehicleFree, todayISO, addDaysISO } from './lib/pricing';
import { usePersistentState, resetPersistentData } from './lib/storage';

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

const K = (name) => `b2:v1:${name}`;
const nowStamp = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').slice(0, 16);
};

export default function App() {
  const [viewMode, setViewMode] = useState('customer');
  const [customerTab, setCustomerTab] = useState('browse');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [slideIndex, setSlideIndex] = useState(0);

  // Persistent data (demo backend)
  const [vehicles, setVehicles] = usePersistentState(K('vehicles'), INITIAL_VEHICLES);
  const [bookings, setBookings] = usePersistentState(K('bookings'), INITIAL_BOOKINGS);
  const [settings, setSettings] = usePersistentState(K('settings'), DEFAULT_SETTINGS);
  const [coupons, setCoupons] = usePersistentState(K('coupons'), DEFAULT_COUPONS);
  const [favorites, setFavorites] = usePersistentState(K('favorites'), []);
  const [myBookingIds, setMyBookingIds] = usePersistentState(K('my-bookings'), []);

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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // Warn when browser storage is full (e.g. many large photos) — data stays in memory only
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
      m[v.id] = rentalDays > 0 && isVehicleFree(v.id, bookings, searchParams.pickupDate, searchParams.returnDate);
    });
    return m;
  }, [vehicles, bookings, searchParams.pickupDate, searchParams.returnDate, rentalDays]);

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

  const nextBookingId = () => {
    const year = new Date().getFullYear();
    const max = bookings.reduce((m, b) => Math.max(m, Number(b.id.split('-').pop()) || 0), 0);
    return `B2-${year}-${String(max + 1).padStart(4, '0')}`;
  };

  const submitBooking = ({ vehicle, info, addons, quote, couponCode, slip }) => {
    // Re-check availability at submit time (another booking may have landed meanwhile)
    if (!isVehicleFree(vehicle.id, bookings, searchParams.pickupDate, searchParams.returnDate)) {
      notify('ขออภัย รถคันนี้เพิ่งถูกจองในช่วงเวลาดังกล่าว', 'error');
      return null;
    }
    const booking = {
      id: nextBookingId(),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleType: vehicle.type,
      customerName: info.name.trim(),
      phone: info.phone,
      email: info.email,
      idCard: info.idCard || '-',
      license: info.license,
      note: info.note,
      pickupLocation: searchParams.location,
      returnLocation: searchParams.location,
      startDate: searchParams.pickupDate,
      endDate: searchParams.returnDate,
      pickupTime: searchParams.pickupTime,
      returnTime: searchParams.returnTime,
      totalDays: rentalDays,
      addons,
      subtotal: quote.subtotal,
      discount: quote.discount,
      totalPrice: quote.total,
      couponCode,
      status: 'Pending',
      createdAt: nowStamp(),
      paymentMethod: 'PromptPay QR',
      slip,
    };
    setBookings((cur) => [booking, ...cur]);
    setMyBookingIds((cur) => [booking.id, ...cur]);
    notify(`สร้างรายการจอง ${booking.id} สำเร็จ`);
    return booking;
  };

  // ---------- Booking status (shared by customer & admin) ----------
  const changeBookingStatus = (id, status) => {
    const target = bookings.find((b) => b.id === id);
    if (!target) return;
    setBookings((cur) => cur.map((b) => (b.id === id ? { ...b, status } : b)));
    // Keep vehicle status in sync with physical handover / return
    if (status === 'Picked Up') setVehicles((cur) => cur.map((v) => (v.id === target.vehicleId ? { ...v, status: 'Rented' } : v)));
    if (status === 'Completed') {
      const stillOut = bookings.some((b) => b.id !== id && b.vehicleId === target.vehicleId && b.status === 'Picked Up');
      if (!stillOut) setVehicles((cur) => cur.map((v) => (v.id === target.vehicleId && v.status === 'Rented' ? { ...v, status: 'Available' } : v)));
    }
    const labels = { Confirmed: 'อนุมัติการจองแล้ว', 'Picked Up': 'บันทึกการส่งมอบรถแล้ว', Completed: 'บันทึกรับคืนรถแล้ว', Cancelled: 'ยกเลิกรายการแล้ว' };
    notify(`${id}: ${labels[status] || status}`, status === 'Cancelled' ? 'info' : 'success');
  };

  const attachSlip = (id, slip) => {
    setBookings((cur) => cur.map((b) => (b.id === id ? { ...b, slip } : b)));
    notify('แนบสลิปเรียบร้อย ทีมงานกำลังตรวจสอบ');
  };

  // ---------- Fleet actions ----------
  const saveVehicle = (data, id) => {
    if (id) {
      setVehicles((cur) => cur.map((v) => (v.id === id ? { ...v, ...data, id } : v)));
      notify(`บันทึกการแก้ไข ${data.name} แล้ว`);
    } else {
      const prefix = data.type === 'Motorcycle' ? 'M' : 'C';
      const max = vehicles.filter((v) => v.id.startsWith(`B2-${prefix}`)).reduce((m, v) => Math.max(m, Number(v.id.slice(4)) || 0), prefix === 'M' ? 100 : 200);
      const v = { ...data, id: `B2-${prefix}${max + 1}`, rating: 5.0, reviewsCount: 0, status: 'Available' };
      setVehicles((cur) => [v, ...cur]);
      notify(`เพิ่ม ${v.name} (${v.id}) เข้าฟลีตแล้ว`);
    }
  };

  const resetDemo = () => {
    resetPersistentData('b2:');
    setVehicles(INITIAL_VEHICLES);
    setBookings(INITIAL_BOOKINGS);
    setSettings(DEFAULT_SETTINGS);
    setCoupons(DEFAULT_COUPONS);
    setFavorites([]);
    setMyBookingIds([]);
    notify('รีเซ็ตข้อมูลตัวอย่างเรียบร้อย', 'info');
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
        bookingCount={myBookingIds.length}
        pendingCount={pendingCount}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {viewMode === 'customer' && (
        <>
          <main className="flex-1">
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
                <HowItWorks />
                <Destinations onPickVehicleType={() => scrollToId('fleet-section')} />
                <Reviews />
                <WhyB2 />
                <RequirementsAndFaq />
              </>
            ) : (
              <Tracker
                bookings={bookings}
                myBookingIds={myBookingIds}
                onCancel={(id) => changeBookingStatus(id, 'Cancelled')}
                onAttachSlip={attachSlip}
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
        coupons={coupons}
        settings={settings}
        onSubmit={submitBooking}
        onClose={() => setBookingVehicle(null)}
        onGoTracker={() => { setBookingVehicle(null); goTab('my-bookings'); }}
        notify={notify}
      />

      {viewMode === 'admin' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center">
                <LayoutDashboard className="w-6 h-6 mr-2 text-yellow-400" /> ระบบหลังบ้าน B2 Rental Manager
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">บริหารจัดการฟลีตรถ ตารางคิว รายการจองลูกค้า และตั้งค่าระบบ</p>
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
              onStatus={(id, status) => setVehicles((cur) => cur.map((v) => (v.id === id ? { ...v, status } : v)))}
              onSave={saveVehicle}
              notify={notify}
              onDelete={(id) => { setVehicles((cur) => cur.filter((v) => v.id !== id)); notify('ลบพาหนะออกจากฟลีตแล้ว', 'info'); }}
            />
          )}
          {adminTab === 'settings' && (
            <Settings
              settings={settings}
              coupons={coupons}
              onSave={(s) => { setSettings(s); notify('บันทึกการตั้งค่าเรียบร้อยแล้ว'); }}
              onSaveCoupons={setCoupons}
              onResetDemo={resetDemo}
            />
          )}
        </main>
      )}

      <BookingDrawer booking={drawerBooking} onClose={() => setDrawerBookingId(null)} onStatus={changeBookingStatus} />

      {viewMode === 'admin' && (
        <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-auto text-center text-xs text-slate-500 no-print">
          © 2026 B2 MOTORCYCLE & CAR RENTAL SERVICES — Admin Console
        </footer>
      )}
    </div>
  );
}
