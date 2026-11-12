import { useState } from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { inputCls, btnPrimary, btnGhost, Spinner } from '../components/ui';
import { errorMessage } from '../lib/errors';

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
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (adminState.signedIn && !adminState.isAdmin) {
    return (
      <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-semibold">บัญชีนี้ไม่มีสิทธิ์แอดมิน</h2>
        <p className="text-sm text-stone-500">
          ล็อกอินเป็น {adminState.email} แต่ยังไม่ได้อยู่ในรายชื่อแอดมิน (ตาราง furniture_admins ใน Supabase)
        </p>
        <button onClick={onSignOut} className={btnGhost}>
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto bg-white border border-stone-200 rounded-3xl p-8 space-y-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white grid place-items-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold">เข้าสู่ระบบหลังบ้าน</h2>
        <p className="text-sm text-stone-500">ใช้บัญชีเดียวกับหลังบ้าน B2 Rental ได้</p>
      </div>
      <input className={inputCls} type="email" autoComplete="username" required placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={inputCls} type="password" autoComplete="current-password" required placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={busy} className={`${btnPrimary} w-full py-3`}>
        {busy && <Spinner className="w-4 h-4" />} เข้าสู่ระบบ
      </button>
    </form>
  );
}
