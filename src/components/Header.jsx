import React, { useRef, useState } from 'react';
import { Key, LayoutDashboard, FileText, Menu, X, Car, Compass, HelpCircle, Bell } from 'lucide-react';

export default function Header({ viewMode, setViewMode, activeTab, goTab, bookingCount, pendingCount, showAdminSwitch = true, onSecretTap }) {
  const [open, setOpen] = useState(false);
  // Hidden staff entrance: 5 quick taps on the logo
  const taps = useRef([]);
  const logoTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      onSecretTap?.();
      return true;
    }
    return false;
  };

  const scrollTo = (id) => {
    goTab('browse');
    setOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const navBtn = (active) =>
    `px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
      active
        ? 'bg-blue-700/80 text-yellow-300 shadow-md shadow-blue-900/50 border border-yellow-400/40'
        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-blue-900/40 shadow-2xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Logo */}
        <button className="flex items-center gap-3 group text-left" onClick={() => { if (logoTap()) return; setViewMode('customer'); goTab('browse'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-blue-900 via-blue-700 to-indigo-600 rounded-2xl border-2 border-yellow-400 shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <span className="font-black text-2xl text-yellow-400 tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">B2</span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wide text-white group-hover:text-yellow-400 transition-colors">B2 RENTAL</span>
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">MOTOR & CAR</span>
            </div>
            <span className="block text-[10px] text-blue-300/80 font-medium tracking-wider">บริการเช่ารถจักรยานยนต์และรถยนต์ • พร้อมคนขับ</span>
          </div>
        </button>

        {/* Desktop nav */}
        {viewMode === 'customer' ? (
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold">
            <button onClick={() => goTab('browse')} className={navBtn(activeTab === 'browse')}>
              <Car className="w-3.5 h-3.5 text-yellow-400" /> หน้าแรก & ฟลีตรถ
            </button>
            <button onClick={() => scrollTo('destinations')} className={navBtn(false)}>
              <Compass className="w-3.5 h-3.5 text-yellow-400" /> ที่เที่ยว
            </button>
            <button onClick={() => scrollTo('faq')} className={navBtn(false)}>
              <HelpCircle className="w-3.5 h-3.5 text-yellow-400" /> เงื่อนไข & FAQ
            </button>
            <button onClick={() => goTab('my-bookings')} className={navBtn(activeTab === 'my-bookings')}>
              <FileText className="w-3.5 h-3.5 text-yellow-400" /> ตรวจสถานะการจอง
              {bookingCount > 0 && <span className="bg-yellow-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">{bookingCount}</span>}
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-3 text-xs font-medium">
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-slate-300 flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <span>ระบบหลังบ้าน: <strong className="text-emerald-400">ออนไลน์</strong></span>
            </div>
            {pendingCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> รอตรวจสลิป {pendingCount} รายการ
              </div>
            )}
          </div>
        )}

        {/* Mode switcher + mobile menu */}
        <div className="flex items-center gap-2">
          {(showAdminSwitch || viewMode === 'admin') && <div className="bg-slate-900/90 p-1 rounded-2xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setViewMode('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'customer' ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-yellow-300 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              <span>หน้าบ้าน</span>
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'admin' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>หลังบ้าน</span>
              {pendingCount > 0 && viewMode !== 'admin' && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">{pendingCount}</span>}
            </button>
          </div>}
          {viewMode === 'customer' && (
            <button className="lg:hidden p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-200" onClick={() => setOpen(!open)} aria-label="เมนู">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && viewMode === 'customer' && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-3 space-y-1 text-sm font-bold animate-slide-up">
          {[
            ['หน้าแรก & ฟลีตรถ', () => { goTab('browse'); setOpen(false); }],
            ['เลือกรถว่าง', () => scrollTo('fleet-section')],
            ['ที่เที่ยวแนะนำ', () => scrollTo('destinations')],
            ['เงื่อนไขการเช่า & FAQ', () => scrollTo('faq')],
            [`ตรวจสถานะการจอง (${bookingCount})`, () => { goTab('my-bookings'); setOpen(false); }],
          ].map(([label, fn]) => (
            <button key={label} onClick={fn} className="w-full text-left px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-900 hover:text-yellow-300">
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
