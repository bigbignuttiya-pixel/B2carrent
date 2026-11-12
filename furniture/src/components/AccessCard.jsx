import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Link2 } from 'lucide-react';
import { formatCode } from '../data';

// Login link that signs this code in on any device (scan the QR or open the link)
export const loginUrl = (code) => `${window.location.origin}${window.location.pathname}#login=${code}`;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function AccessCard({ code, expiresAt, title = 'รหัสเข้าใช้งานของคุณ', compact = false }) {
  const [copied, setCopied] = useState('');
  const copy = async (what, text) => {
    if (await copyText(text)) {
      setCopied(what);
      setTimeout(() => setCopied(''), 1500);
    }
  };
  return (
    <div className={`rounded-2xl bg-stone-900 text-white ${compact ? 'p-4' : 'p-5'} flex ${compact ? 'flex-row gap-4 items-center' : 'flex-col items-center text-center gap-3'}`}>
      <div className="bg-white p-2 rounded-xl shrink-0">
        <QRCodeSVG value={loginUrl(code)} size={compact ? 96 : 170} />
      </div>
      <div className={compact ? 'min-w-0' : ''}>
        <p className="text-xs text-stone-300">{title}</p>
        <p className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} font-semibold tracking-[0.2em] my-1 font-mono`}>{formatCode(code)}</p>
        {expiresAt && <p className="text-xs text-emerald-300">ใช้งานได้ถึง {expiresAt} น.</p>}
        <p className="text-xs text-stone-400 mt-1">สแกน QR เพื่อเข้าใช้งานบนมือถือ/เครื่องอื่น หรือพิมพ์รหัสที่หน้า "เข้าใช้งาน"</p>
        <div className={`flex gap-4 mt-2 text-xs ${compact ? '' : 'justify-center'}`}>
          <button onClick={() => copy('code', formatCode(code))} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
            <Copy className="w-3.5 h-3.5" /> {copied === 'code' ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
          </button>
          <button onClick={() => copy('link', loginUrl(code))} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
            <Link2 className="w-3.5 h-3.5" /> {copied === 'link' ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์เข้าใช้งาน'}
          </button>
        </div>
      </div>
    </div>
  );
}
