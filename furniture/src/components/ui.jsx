import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { ORDER_STATUS, categoryOf } from '../data';

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS[status] || ORDER_STATUS.Pending;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${meta.cls}`}>{meta.short}</span>;
}

export function Toasts({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const Icon = t.type === 'error' ? AlertTriangle : t.type === 'info' ? Info : CheckCircle2;
        const color = t.type === 'error' ? 'text-rose-600' : t.type === 'info' ? 'text-sky-600' : 'text-emerald-600';
        return (
          <div key={t.id} className="animate-slide-up bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-lg flex items-start gap-3 text-sm">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="text-stone-400 hover:text-stone-700" aria-label="ปิด">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-2xl' }) {
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
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-white w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden my-6 animate-slide-up`}>{children}</div>
    </div>,
    document.body
  );
}

export function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100" aria-label="ปิด">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export const inputCls =
  'w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 focus:outline-none transition';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition';
export const btnAccent =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-100 disabled:opacity-40 transition';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700 block mb-1">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500 mt-1 block">{hint}</span>}
    </label>
  );
}

const TINTS = { living: 'bg-amber-100', bedroom: 'bg-sky-100', dining: 'bg-emerald-100', office: 'bg-indigo-100', outdoor: 'bg-lime-100', decor: 'bg-rose-100' };

// Product photo, or a tinted placeholder with the category emoji when there is no photo yet
export function ProductImage({ product, className = '', index = 0 }) {
  const src = product.images?.[index];
  if (src) return <img src={src} alt={product.name} loading="lazy" className={`w-full h-full object-cover ${className}`} />;
  return (
    <div className={`w-full h-full grid place-items-center ${TINTS[product.category] || 'bg-stone-100'} ${className}`}>
      <span className="text-5xl" aria-hidden>{categoryOf(product.category).emoji}</span>
    </div>
  );
}

export function Spinner({ className = 'w-5 h-5' }) {
  return <span className={`inline-block rounded-full border-2 border-current border-r-transparent animate-spin ${className}`} />;
}
