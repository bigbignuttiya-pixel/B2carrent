// Cloud backend: Supabase (Postgres + Auth + Storage). Every browser and device sees the same data.
import { supabase } from '../supabase';
import { DEFAULT_SETTINGS } from '../../data';
import { toApiError } from './errors';

const PHOTO_BUCKET = 'vehicle-photos';
const SLIP_BUCKET = 'slips';

const unwrap = ({ data, error }) => {
  if (error) throw toApiError(error);
  return data;
};

const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// Timestamps are stored in UTC; the app shows Thailand time (UTC+7, no DST)
const bangkokStamp = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 16);

const rowToBooking = (r) => ({
  ...r.data,
  id: r.id,
  vehicleId: r.vehicle_id,
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status,
  phone: r.phone,
  totalPrice: r.total_price,
  createdAt: bangkokStamp(r.created_at),
  hasSlip: Boolean(r.data?.slipPath),
});

const rowToVehicle = (r) => ({ ...r.data, id: r.id });

async function uploadSlip(dataUrl) {
  if (!dataUrl) return null;
  const path = `pending/${uuid()}.jpg`;
  unwrap(await supabase.storage.from(SLIP_BUCKET).upload(path, await dataUrlToBlob(dataUrl), { contentType: 'image/jpeg' }));
  return path;
}

// Replace data: URLs (new photos from file picker / camera) with uploaded public URLs
async function uploadPhotos(vehicleId, urls) {
  return Promise.all(
    urls.map(async (u) => {
      if (!u?.startsWith('data:')) return u;
      const path = `${vehicleId}/${uuid()}.jpg`;
      unwrap(await supabase.storage.from(PHOTO_BUCKET).upload(path, await dataUrlToBlob(u), { contentType: 'image/jpeg' }));
      return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
    })
  );
}

export const remoteApi = {
  mode: 'cloud',

  async loadPublic() {
    const [v, s, r] = await Promise.all([
      supabase.from('vehicles').select('id, data').order('sort_order').order('created_at'),
      supabase.from('settings').select('data').eq('id', 1).maybeSingle(),
      supabase.rpc('booked_ranges'),
    ]);
    return {
      vehicles: unwrap(v).map(rowToVehicle),
      settings: { ...DEFAULT_SETTINGS, ...(unwrap(s)?.data || {}) },
      ranges: unwrap(r).map((x, i) => ({ id: `r${i}`, vehicleId: x.vehicle_id, startDate: x.start_date, endDate: x.end_date, status: 'Confirmed' })),
    };
  },

  async loadAdmin() {
    const [b, c] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('coupons').select('*').order('code'),
    ]);
    return {
      bookings: unwrap(b).map(rowToBooking),
      coupons: unwrap(c).map((x) => ({ code: x.code, percent: x.percent, active: x.active, label: x.label, ...(x.only_category ? { onlyCategory: x.only_category } : {}) })),
    };
  },

  async checkCoupon(code, vehicle) {
    if (!code?.trim()) return null;
    return unwrap(await supabase.rpc('check_coupon', { p_code: code, p_vehicle_id: vehicle.id })) || null;
  },

  async createBooking(p) {
    const slipPath = await uploadSlip(p.slip);
    const { slip, ...payload } = p;
    return unwrap(await supabase.rpc('create_booking', { p: { ...payload, slipPath } }));
  },

  async findBookings(phone, id) {
    return unwrap(await supabase.rpc('find_bookings', { p_phone: phone, p_id: id || null })) || [];
  },

  async cancelBooking(id, phone) {
    return unwrap(await supabase.rpc('cancel_booking', { p_id: id, p_phone: phone }));
  },

  async attachSlip(id, phone, dataUrl) {
    const path = await uploadSlip(dataUrl);
    return unwrap(await supabase.rpc('attach_slip', { p_id: id, p_phone: phone, p_path: path }));
  },

  // ----- admin (allowed only for users in public.admins — enforced by RLS) -----
  async setBookingStatus(id, status) {
    unwrap(await supabase.from('bookings').update({ status }).eq('id', id).select('id').single());
  },

  async getSlipUrl(booking) {
    if (!booking.slipPath) return null;
    const { data, error } = await supabase.storage.from(SLIP_BUCKET).createSignedUrl(booking.slipPath, 600);
    return error ? null : data.signedUrl;
  },

  async saveVehicle(vehicle, isNew) {
    const gallery = await uploadPhotos(vehicle.id, vehicle.gallery || []);
    const image = gallery[0] || vehicle.image;
    const saved = { ...vehicle, image, gallery };
    const row = { id: vehicle.id, data: saved };
    if (isNew) {
      const { data: first } = await supabase.from('vehicles').select('sort_order').order('sort_order').limit(1).maybeSingle();
      row.sort_order = (first?.sort_order ?? 0) - 1; // newest first
      unwrap(await supabase.from('vehicles').insert(row).select('id').single());
    } else {
      unwrap(await supabase.from('vehicles').update({ data: saved }).eq('id', vehicle.id).select('id').single());
    }
    return saved;
  },

  async setVehicleStatus(id, status) {
    const { data } = unwrap(await supabase.from('vehicles').select('data').eq('id', id).single());
    unwrap(await supabase.from('vehicles').update({ data: { ...data, status } }).eq('id', id).select('id').single());
  },

  async deleteVehicle(id) {
    unwrap(await supabase.from('vehicles').delete().eq('id', id));
  },

  async saveSettings(settings) {
    const { lineChannelToken, ...publicSettings } = settings; // secrets never go into the public settings row
    unwrap(await supabase.from('settings').upsert({ id: 1, data: publicSettings }));
  },

  async saveCoupons(list) {
    const rows = list.map((c) => ({ code: c.code, percent: c.percent, active: c.active, label: c.label || '', only_category: c.onlyCategory || null }));
    if (rows.length) unwrap(await supabase.from('coupons').upsert(rows));
    const keep = rows.map((r) => r.code);
    let del = supabase.from('coupons').delete();
    del = keep.length ? del.not('code', 'in', `(${keep.map((c) => `"${c}"`).join(',')})`) : del.neq('code', '');
    unwrap(await del);
  },

  // ----- auth -----
  async getAdminState() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return { signedIn: false, isAdmin: false, email: null };
    const isAdmin = unwrap(await supabase.rpc('is_admin'));
    return { signedIn: true, isAdmin: Boolean(isAdmin), email: user.email };
  },

  async signIn(email, password) {
    unwrap(await supabase.auth.signInWithPassword({ email, password }));
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange(() => cb());
    return () => data.subscription.unsubscribe();
  },

  // Live updates for the admin screens (new bookings, status changes)
  subscribe(cb) {
    const ch = supabase
      .channel('b2-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, cb)
      .subscribe();
    return () => supabase.removeChannel(ch);
  },

  async resetDemo() {},
};
