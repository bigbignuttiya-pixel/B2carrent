import { useState } from 'react';
import { Lock, LogOut, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { inputCls, btnPrimary, btnGhost, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

// Back-office login: just the password (other staff with their own account can use email + password)
export default function AdminLogin({ adminState, onSignOut }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (useEmail) await api.signIn(email.trim(), password);
      else await api.signInWithPasswordOnly(password);
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
        <p className="text-sm text-stone-500">ใส่รหัสผ่านของร้าน (รหัสเดียวกับหลังบ้าน B2 Rental)</p>
      </div>
      {useEmail && (
        <input className={inputCls} type="email" autoComplete="username" required placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
      )}
      <div className="relative">
        <input
          className={`${inputCls} pr-11 text-center text-lg tracking-wider`}
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          autoFocus
          required
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700" aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {error && <p className="text-sm text-rose-600 text-center">{error}</p>}
      <button disabled={busy || !password} className={`${btnPrimary} w-full py-3`}>
        {busy && <Spinner className="w-4 h-4" />} เข้าสู่ระบบ
      </button>
      <button type="button" onClick={() => setUseEmail((v) => !v)} className="block mx-auto text-xs text-stone-400 hover:text-stone-600">
        {useEmail ? 'เข้าด้วยรหัสผ่านอย่างเดียว' : 'พนักงานอื่น: เข้าด้วยอีเมล + รหัสผ่าน'}
      </button>
    </form>
  );
}
