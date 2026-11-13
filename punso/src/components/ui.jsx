import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { BOOKING_STATUS } from '../data';

export function StatusBadge({ status, compact = false }) {
  const meta = BOOKING_STATUS[status] || BOOKING_STATUS.Pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border whitespace-nowrap ${meta.cls}`}>
      <span>{meta.icon}</span>
      <span>{compact ? status : meta.label}</span>
    </span>
  );
}

export function Toasts({ toasts, onDismiss }) {
  return (
    <div className="fixed top-24 right-4 z-[70] space-y-2 w-[calc(100%-2rem)] max-w-sm no-print">
      {toasts.map((t) => {
        const Icon = t.type === 'error' ? AlertTriangle : t.type === 'info' ? Info : CheckCircle2;
        const color = t.type === 'error' ? 'border-rose-500/40 text-rose-600' : t.type === 'info' ? 'border-zinc-400/40 text-zinc-900' : 'border-emerald-500/40 text-emerald-600';
        return (
          <div key={t.id} className={`animate-slide-up bg-zinc-50/95 backdrop-blur-xl border ${color} rounded-2xl px-4 py-3 shadow-2xl flex items-start gap-3 text-xs`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 text-zinc-800">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="text-zinc-500 hover:text-zinc-900" aria-label="ปิด">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-3xl', z = 'z-50' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  // Portal to <body> so a modal opened from inside another modal (e.g. camera / background remover
  // inside the vehicle form) is not trapped by the parent's CSS transform
  return createPortal(
    <div
      className={`fixed inset-0 ${z} bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-zinc-50 border border-zinc-200 w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden my-6 animate-slide-up`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export const inputCls =
  'w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none font-medium transition';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-zinc-600 block mb-1">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-zinc-500 mt-1 block">{hint}</span>}
    </label>
  );
}

export function SectionHeading({ icon: Icon, eyebrow, title, desc, center = false }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto mb-10' : 'mb-8'}>
      <div className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 mb-1">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{eyebrow}</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-zinc-900">{title}</h2>
      {desc && <p className="text-xs text-zinc-500 mt-1">{desc}</p>}
    </div>
  );
}
