import React, { useState } from 'react';
import { Lock, LogIn, Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { inputCls } from '../components/ui';

export default function AdminLogin({ adminState, onSignIn, onSignOut }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSignIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Signed in, but this account is not in public.admins
  if (adminState.signedIn && !adminState.isAdmin) {
    return (
      <div className="max-w-md mx-auto bg-zinc-50 border border-zinc-200 rounded-3xl p-8 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-black text-zinc-900">บัญชีนี้ไม่มีสิทธิ์แอดมิน</h2>
        <p className="text-xs text-zinc-500">ล็อกอินเป็น <span className="text-zinc-700">{adminState.email}</span> แต่ยังไม่ได้ถูกเพิ่มในรายชื่อแอดมิน (ตาราง admins ใน Supabase)</p>
        <button onClick={onSignOut} className="px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold inline-flex items-center gap-1.5">
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto bg-zinc-50 border border-zinc-200 rounded-3xl p-8 space-y-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-zinc-900">เข้าสู่ระบบหลังบ้าน</h2>
        <p className="text-xs text-zinc-500">เฉพาะผู้ดูแลร้าน PUNSO Car Rental</p>
      </div>
      <label className="block text-xs">
        <span className="text-zinc-500 block mb-1">อีเมล</span>
        <input className={inputCls} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-xs">
        <span className="text-zinc-500 block mb-1">รหัสผ่าน</span>
        <input className={inputCls} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
      <button disabled={busy} className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} เข้าสู่ระบบ
      </button>
    </form>
  );
}
