// Demo backend: keeps data in this browser's localStorage (used when Supabase is not configured).
import { INITIAL_VEHICLES, INITIAL_BOOKINGS, DEFAULT_COUPONS, DEFAULT_SETTINGS } from '../../data';
import { calculateDays, isVehicleFree, priceQuote, findCoupon, todayISO } from '../pricing';
import { ApiError } from './errors';

const K = (name) => `punso:v1:${name}`;
const read = (name, fallback) => {
  try {
    const raw = window.localStorage.getItem(K(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (name, value) => {
  try {
    window.localStorage.setItem(K(name), JSON.stringify(value));
  } catch (err) {
    window.dispatchEvent(new CustomEvent('punso:storage-error', { detail: { key: name, name: err?.name } }));
  }
};
const nowStamp = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').slice(0, 16);
};
const digits = (s) => String(s || '').replace(/[^0-9]/g, '');

const vehicles = () => read('vehicles', INITIAL_VEHICLES);
const bookings = () => read('bookings', INITIAL_BOOKINGS);
const coupons = () => read('coupons', DEFAULT_COUPONS);
const withSlipFlag = (b) => ({ ...b, hasSlip: Boolean(b.slip) });

function updateBooking(id, fn) {
  let out = null;
  write('bookings', bookings().map((b) => (b.id === id ? (out = fn(b)) : b)));
  return out;
}

export const localApi = {
  mode: 'local',

  async loadPublic() {
    const all = bookings();
    return {
      vehicles: vehicles(),
      settings: { ...DEFAULT_SETTINGS, ...read('settings', DEFAULT_SETTINGS) },
      ranges: all
        .filter((b) => ['Pending', 'Confirmed', 'Picked Up'].includes(b.status))
        .map((b) => ({ id: b.id, vehicleId: b.vehicleId, startDate: b.startDate, endDate: b.endDate, status: b.status })),
    };
  },

  async loadAdmin() {
    return { bookings: bookings().map(withSlipFlag), coupons: coupons() };
  },

  async checkCoupon(code, vehicle) {
    return findCoupon(coupons(), code, vehicle);
  },

  async createBooking(p) {
    const v = vehicles().find((x) => x.id === p.vehicleId);
    if (!v) throw new ApiError('vehicle_not_found');
    const days = calculateDays(p.startDate, p.endDate, p.pickupTime, p.returnTime);
    if (days <= 0 || p.startDate < todayISO()) throw new ApiError('invalid_dates');
    if (v.status !== 'Available' || !isVehicleFree(v.id, bookings(), p.startDate, p.endDate)) throw new ApiError('vehicle_unavailable');
    let coupon = null;
    if (p.couponCode) {
      coupon = findCoupon(coupons(), p.couponCode, v);
      if (!coupon) throw new ApiError('invalid_coupon');
    }
    const q = priceQuote(v, days, p.addons, coupon);
    const all = bookings();
    const max = all.reduce((m, b) => Math.max(m, Number(b.id.split('-').pop()) || 0), 1000);
    const booking = {
      id: `PS-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}`,
      vehicleId: v.id,
      vehicleName: v.name,
      vehicleType: v.type,
      customerName: p.name.trim(),
      phone: digits(p.phone),
      lineId: p.lineId || undefined,
      idCard: p.idCard || '-',
      license: p.license,
      note: p.note,
      pickupLocation: p.location,
      returnLocation: p.location,
      startDate: p.startDate,
      endDate: p.endDate,
      pickupTime: p.pickupTime,
      returnTime: p.returnTime,
      totalDays: days,
      addons: p.addons,
      subtotal: q.subtotal,
      discount: q.discount,
      totalPrice: q.total,
      couponCode: coupon?.code || '',
      status: 'Pending',
      createdAt: nowStamp(),
      paymentMethod: 'PromptPay QR',
      slip: p.slip || null,
    };
    write('bookings', [booking, ...all]);
    return withSlipFlag(booking);
  },

  async findBookings(phone, id) {
    const ph = digits(phone);
    if (ph.length < 9) return [];
    return bookings()
      .filter((b) => b.phone === ph && (!id || b.id === id.trim().toUpperCase()))
      .map(withSlipFlag);
  },

  async cancelBooking(id, phone) {
    const b = bookings().find((x) => x.id === id);
    if (!b || b.phone !== digits(phone) || !['Pending', 'Confirmed'].includes(b.status)) throw new ApiError('not_allowed');
    return withSlipFlag(updateBooking(id, (x) => ({ ...x, status: 'Cancelled' })));
  },

  async attachSlip(id, phone, dataUrl) {
    const b = bookings().find((x) => x.id === id);
    if (!b || b.phone !== digits(phone) || b.status !== 'Pending') throw new ApiError('not_allowed');
    return withSlipFlag(updateBooking(id, (x) => ({ ...x, slip: dataUrl })));
  },

  // ----- admin -----
  async addExternalBooking(p) {
    const v = vehicles().find((x) => x.id === p.vehicleId);
    if (!v) throw new ApiError('vehicle_not_found');
    const days = calculateDays(p.startDate, p.endDate, p.pickupTime, p.returnTime);
    if (days <= 0) throw new ApiError('invalid_dates');
    if (!isVehicleFree(v.id, bookings(), p.startDate, p.endDate)) throw new ApiError('vehicle_unavailable');
    const all = bookings();
    const max = all.reduce((m, b) => Math.max(m, Number(b.id.split('-').pop()) || 0), 1000);
    const source = p.source || 'DriveHub';
    const price = Math.max(0, Math.round(Number(p.totalPrice) || 0));
    const booking = {
      id: `PS-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}`,
      vehicleId: v.id,
      vehicleName: v.name,
      vehicleType: v.type,
      customerName: (p.name || '').trim() || `ลูกค้า ${source}`,
      phone: digits(p.phone),
      idCard: '-',
      note: p.note,
      source,
      externalRef: (p.externalRef || '').trim() || undefined,
      pickupLocation: p.location || 'ร้านบีทูรถเช่า',
      returnLocation: p.location || 'ร้านบีทูรถเช่า',
      startDate: p.startDate,
      endDate: p.endDate,
      pickupTime: p.pickupTime,
      returnTime: p.returnTime,
      totalDays: days,
      addons: [],
      subtotal: price,
      discount: 0,
      totalPrice: price,
      status: 'Confirmed',
      createdAt: nowStamp(),
      paymentMethod: `ชำระผ่าน ${source}`,
    };
    write('bookings', [booking, ...all]);
    return withSlipFlag(booking);
  },

  async setBookingStatus(id, status) {
    const target = bookings().find((b) => b.id === id);
    if (!target) throw new ApiError('not_allowed');
    updateBooking(id, (b) => ({ ...b, status }));
    // mirror the database trigger: keep vehicle status in sync with handover / return
    if (status === 'Picked Up') write('vehicles', vehicles().map((v) => (v.id === target.vehicleId ? { ...v, status: 'Rented' } : v)));
    if (status === 'Completed') {
      const stillOut = bookings().some((b) => b.id !== id && b.vehicleId === target.vehicleId && b.status === 'Picked Up');
      if (!stillOut) write('vehicles', vehicles().map((v) => (v.id === target.vehicleId && v.status === 'Rented' ? { ...v, status: 'Available' } : v)));
    }
  },

  async getSlipUrl(booking) {
    return booking.slip || null;
  },

  async saveVehicle(vehicle, isNew) {
    write('vehicles', isNew ? [vehicle, ...vehicles()] : vehicles().map((v) => (v.id === vehicle.id ? vehicle : v)));
    return vehicle;
  },

  async setVehicleStatus(id, status) {
    write('vehicles', vehicles().map((v) => (v.id === id ? { ...v, status } : v)));
  },

  async deleteVehicle(id) {
    write('vehicles', vehicles().filter((v) => v.id !== id));
  },

  async saveSettings(settings) {
    write('settings', settings);
  },

  async saveCoupons(list) {
    write('coupons', list);
  },

  // ----- auth (demo mode has no login) -----
  async getAdminState() {
    return { signedIn: true, isAdmin: true, email: null };
  },
  async signIn() {},
  async signOut() {},
  onAuthChange() {
    return () => {};
  },
  subscribe() {
    return () => {};
  },

  async resetDemo() {
    ['vehicles', 'bookings', 'settings', 'coupons'].forEach((k) => {
      try {
        window.localStorage.removeItem(K(k));
      } catch {
        /* ignore */
      }
    });
  },
};
