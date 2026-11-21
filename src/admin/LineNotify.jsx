import React, { useEffect, useState } from 'react';
import { Bell, Save, Send, Copy, Check, Loader2 } from 'lucide-react';
import { supabase, hasSupabase } from '../lib/supabase';
import { inputCls } from '../components/ui';

// Booking notifications pushed to the shop's LINE (Messaging API). The token and secret are stored in
// the database (admin-only table) and used only by the line-notify Edge Function — never in the page.
const SHOP = 'b2';
const TABLE = 'line_config';
const T = {
  card: 'bg-slate-900 border border-slate-800',
  h: 'text-white border-slate-800',
  muted: 'text-slate-400',
  box: 'bg-slate-950 border border-slate-800',
  ghost: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
};
const TOGGLES = [
  ['notify_new', '🆕 มีการจองใหม่'],
  ['notify_slip', '📎 ลูกค้าแนบสลิป'],
  ['notify_confirmed', '✅ ยืนยันการจอง (รับเงินแล้ว)'],
  ['notify_cancelled', '❌ ยกเลิกการจอง'],
];

export default function LineNotify() {
  const [c, setC] = useState(null);
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', 1).single();
    if (error) setMsg({ ok: false, text: 'โหลดการตั้งค่า LINE ไม่ได้: ' + error.message });
    else setC(data);
  };
  useEffect(() => {
    if (hasSupabase) load();
  }, []);
  if (!hasSupabase) return null;

  const call = (body) => supabase.functions.invoke(`line-notify?shop=${SHOP}`, { body }).then(({ data, error }) => data || { ok: false, error: error?.message });

  const save = async () => {
    setBusy('save');
    setMsg(null);
    const patch = { updated_at: new Date().toISOString() };
    TOGGLES.forEach(([k]) => (patch[k] = c[k]));
    if (token.trim()) patch.channel_token = token.trim();
    if (secret.trim()) patch.channel_secret = secret.trim();
    const { error } = await supabase.from(TABLE).update(patch).eq('id', 1);
    if (error) {
      setMsg({ ok: false, text: 'บันทึกไม่สำเร็จ: ' + error.message });
    } else {
      setToken('');
      setSecret('');
      const r = token.trim() || c.channel_token ? await call({ action: 'setup' }) : { ok: true };
      setMsg(r.ok ? { ok: true, text: `บันทึกแล้ว${r.bot ? ` • เชื่อมกับบอท "${r.bot}" ${r.basicId || ''}` : ''} • ตั้ง Webhook ให้อัตโนมัติแล้ว` } : { ok: false, text: r.error || 'ตั้ง Webhook ไม่สำเร็จ' });
      await load();
    }
    setBusy('');
  };

  const test = async () => {
    setBusy('test');
    setMsg(null);
    const r = await call({});
    setMsg(r.ok ? { ok: true, text: 'ส่งข้อความทดสอบแล้ว — เช็กใน LINE ได้เลย' } : { ok: false, text: r.error || 'ส่งไม่สำเร็จ' });
    await load();
    setBusy('');
  };

  const removeTarget = async (id) => {
    if (!window.confirm('หยุดส่งแจ้งเตือนไปที่แชทนี้?')) return;
    await supabase.from(TABLE).update({ targets: c.targets.filter((t) => t.id !== id) }).eq('id', 1);
    load();
  };

  if (!c) return <section className={`${T.card} rounded-3xl p-6 text-xs ${T.muted}`}>{msg?.text || 'กำลังโหลดการตั้งค่า LINE…'}</section>;

  const code = String(c.hook_secret || '').slice(0, 6);
  const ready = c.channel_token && c.channel_secret;
  const targets = c.targets || [];

  return (
    <section className={`${T.card} rounded-3xl p-6 space-y-4 text-xs`}>
      <h3 className={`text-base font-bold border-b pb-3 flex items-center gap-2 ${T.h}`}><Bell className="w-4 h-4 text-yellow-400" /> แจ้งเตือนการจองเข้า LINE ร้าน</h3>

      <p className={ready && targets.length ? 'text-emerald-400 font-bold' : T.muted}>
        {!ready ? '⚪ ยังไม่ได้ตั้งค่า' : targets.length ? `🟢 พร้อมใช้งาน • ส่งไป ${targets.length} แชท` : '🟡 ใส่รหัสแล้ว — รอเชื่อมต่อแชท (ขั้นที่ 5)'}
        {c.last_sent_at && ` • ส่งล่าสุด ${new Date(c.last_sent_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`}
      </p>
      {c.last_error && <p className="text-rose-400">ข้อผิดพลาดล่าสุด: {c.last_error}</p>}

      <details className={`${T.box} rounded-xl p-4`} open={!ready}>
        <summary className="cursor-pointer font-bold">📋 วิธีตั้งค่า (ทำครั้งเดียว)</summary>
        <ol className={`list-decimal pl-5 mt-2 space-y-1 ${T.muted}`}>
          <li>เปิด <a className="underline text-sky-400" href="https://manager.line.biz" target="_blank" rel="noreferrer">LINE Official Account Manager</a> → บัญชีร้าน → ตั้งค่า → Messaging API → เปิดใช้ แล้วคัดลอก <b>Channel secret</b></li>
          <li>เปิด <a className="underline text-sky-400" href="https://developers.line.biz/console/" target="_blank" rel="noreferrer">LINE Developers</a> → Channel ร้าน → แท็บ Messaging API → ล่างสุด กด Issue ที่ <b>Channel access token</b> แล้วคัดลอก</li>
          <li>วางทั้งสองช่องด้านล่าง แล้วกด <b>บันทึก</b> — ระบบตั้ง Webhook ให้เอง</li>
          <li>LINE OA Manager → ตั้งค่าการตอบกลับ → เปิด <b>Webhook</b></li>
          <li>แอดเพื่อน LINE ร้าน (หรือเชิญเข้ากลุ่มพนักงาน) แล้วพิมพ์ <b className="text-yellow-400">เชื่อมต่อ {code}</b> → กด ส่งข้อความทดสอบ</li>
        </ol>
      </details>

      <div className={`${T.box} rounded-xl p-3 flex items-center justify-between gap-2`}>
        <span>รหัสเชื่อมต่อ: <b className="font-mono text-yellow-400 text-sm">เชื่อมต่อ {code}</b> <span className={T.muted}>(ให้เฉพาะคนในร้าน)</span></span>
        <button onClick={() => { navigator.clipboard?.writeText(`เชื่อมต่อ ${code}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 ${T.ghost}`}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} คัดลอก
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label><span className={`${T.muted} block mb-1`}>Channel access token</span>
          <input type="password" autoComplete="off" className={inputCls} value={token} onChange={(e) => setToken(e.target.value)} placeholder={c.channel_token ? '•••••• (บันทึกแล้ว — วางใหม่เพื่อเปลี่ยน)' : 'วาง Channel access token'} />
        </label>
        <label><span className={`${T.muted} block mb-1`}>Channel secret</span>
          <input type="password" autoComplete="off" className={inputCls} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={c.channel_secret ? '•••••• (บันทึกแล้ว)' : 'วาง Channel secret'} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TOGGLES.map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-yellow-400 w-4 h-4" checked={Boolean(c[k])} onChange={(e) => setC({ ...c, [k]: e.target.checked })} /> {label}
          </label>
        ))}
      </div>

      {targets.length > 0 && (
        <div className="space-y-1">
          <span className={T.muted}>แชทที่รับแจ้งเตือน</span>
          {targets.map((t) => (
            <div key={t.id} className={`${T.box} rounded-lg px-3 py-2 flex justify-between items-center`}>
              <span>{t.type === 'group' ? '👥 กลุ่ม' : t.type === 'room' ? '💬 ห้องแชท' : '👤 ผู้ใช้'} <span className={`font-mono ${T.muted}`}>…{t.id.slice(-6)}</span></span>
              <button onClick={() => removeTarget(t.id)} className="text-rose-400 font-bold">ลบ</button>
            </div>
          ))}
        </div>
      )}

      {msg && <p className={msg.ok ? 'text-emerald-400' : 'text-rose-400'}>{msg.text}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <button disabled={!!busy || !ready || !targets.length} onClick={test} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-40 ${T.ghost}`}>
          {busy === 'test' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} ส่งข้อความทดสอบ
        </button>
        <button disabled={!!busy} onClick={save} className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-black rounded-xl flex items-center gap-1.5">
          {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึก
        </button>
      </div>
    </section>
  );
}
