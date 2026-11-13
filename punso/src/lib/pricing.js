import { ADDONS, DURATION_TIERS } from '../data';

const DAY_MS = 1000 * 60 * 60 * 24;

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const addDaysISO = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Rental days: every started 24h block counts as one day (minimum 1).
// Returns 0 when the return is not after the pickup (invalid range).
export function calculateDays(startDate, endDate, startTime = '09:00', endTime = '09:00') {
  const s = new Date(`${startDate}T${startTime}`);
  const e = new Date(`${endDate}T${endTime}`);
  const diff = e - s;
  if (!(diff > 0)) return 0;
  return Math.max(1, Math.ceil(diff / DAY_MS));
}

// Inclusive-exclusive overlap of date ranges [start, end)
export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const BLOCKING = ['Pending', 'Confirmed', 'Picked Up'];

export function isVehicleFree(vehicleId, bookings, startDate, endDate, ignoreId) {
  return !bookings.some(
    (b) =>
      b.vehicleId === vehicleId &&
      b.id !== ignoreId &&
      BLOCKING.includes(b.status) &&
      rangesOverlap(startDate, endDate, b.startDate, b.endDate)
  );
}

export const durationTier = (days) => DURATION_TIERS.find((t) => days >= t.minDays) || null;

export function findCoupon(coupons, code, vehicle) {
  if (!code) return null;
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase() && x.active);
  if (!c) return null;
  if (c.onlyCategory && vehicle && vehicle.category !== c.onlyCategory) return null;
  return c;
}

export function priceQuote(vehicle, days, addonIds, coupon) {
  if (!vehicle || days <= 0) {
    return { base: 0, addonLines: [], addonsTotal: 0, tier: null, tierDiscount: 0, couponDiscount: 0, discount: 0, subtotal: 0, total: 0 };
  }
  const base = vehicle.pricePerDay * days;
  const addonLines = addonIds
    .map((id) => ADDONS.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => {
      const qty = a.unit === 'day' ? days : a.unit === 'trip' ? a.trips || 1 : 1;
      return { id: a.id, name: a.name, qty, unit: a.unit, amount: a.price * qty };
    });
  const addonsTotal = addonLines.reduce((s, l) => s + l.amount, 0);
  const tier = durationTier(days);
  const tierDiscount = tier ? Math.round((base * tier.percent) / 100) : 0;
  const couponDiscount = coupon ? Math.round(((base - tierDiscount) * coupon.percent) / 100) : 0;
  const subtotal = base + addonsTotal;
  const discount = tierDiscount + couponDiscount;
  return { base, addonLines, addonsTotal, tier, tierDiscount, couponDiscount, discount, subtotal, total: subtotal - discount };
}

export const baht = (n) => `฿${Number(n || 0).toLocaleString('th-TH')}`;

export const formatThaiDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  } catch {
    return iso;
  }
};
