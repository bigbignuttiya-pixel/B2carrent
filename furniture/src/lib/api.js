// Cloud backend: Supabase (Postgres + Auth + Storage). Every browser and device sees the same data.
import { supabase } from './supabase';
import { DEFAULT_SETTINGS } from '../data';
import { toApiError } from './errors';

const PHOTO_BUCKET = 'furniture-photos';
const SLIP_BUCKET = 'furniture-slips';

const unwrap = ({ data, error }) => {
  if (error) throw toApiError(error);
  return data;
};

const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');

const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();

// Timestamps are stored in UTC; the app shows Thailand time (UTC+7, no DST)
const bangkokStamp = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 16);

const rowToProduct = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  price: r.price,
  salePrice: r.sale_price,
  stock: r.stock,
  description: r.description,
  material: r.material,
  dimensions: r.dimensions,
  color: r.color,
  images: r.images || [],
  featured: r.featured,
  active: r.active,
  sortOrder: r.sort_order,
});

const productToRow = (p) => ({
  id: p.id,
  name: p.name.trim(),
  category: p.category,
  price: Math.round(Number(p.price) || 0),
  sale_price: p.salePrice === '' || p.salePrice == null ? null : Math.round(Number(p.salePrice)),
  stock: Math.max(0, Math.round(Number(p.stock) || 0)),
  description: p.description || '',
  material: p.material || '',
  dimensions: p.dimensions || '',
  color: p.color || '',
  images: p.images || [],
  featured: Boolean(p.featured),
  active: p.active !== false,
});

const rowToOrder = (r) => ({
  id: r.id,
  status: r.status,
  phone: r.phone,
  customerName: r.customer?.name || '',
  lineId: r.customer?.lineId || '',
  address: r.customer?.address || '',
  note: r.customer?.note || '',
  items: r.items || [],
  subtotal: r.subtotal,
  shipping: r.shipping,
  total: r.total,
  slipPath: r.slip_path,
  hasSlip: Boolean(r.slip_path),
  adminNote: r.admin_note || '',
  createdAt: bangkokStamp(r.created_at),
});

async function uploadSlip(dataUrl) {
  if (!dataUrl) return null;
  const path = `pending/${uuid()}.jpg`;
  unwrap(await supabase.storage.from(SLIP_BUCKET).upload(path, await dataUrlToBlob(dataUrl), { contentType: 'image/jpeg' }));
  return path;
}

// Replace data: URLs (new photos from the file picker / camera) with uploaded public URLs
async function uploadPhotos(productId, urls) {
  return Promise.all(
    urls.map(async (u) => {
      if (!u?.startsWith('data:')) return u;
      const path = `${productId}/${uuid()}.jpg`;
      unwrap(await supabase.storage.from(PHOTO_BUCKET).upload(path, await dataUrlToBlob(u), { contentType: 'image/jpeg' }));
      return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
    })
  );
}

export const api = {
  async loadPublic() {
    const [p, s] = await Promise.all([
      supabase.from('furniture_products').select('*').order('sort_order').order('created_at'),
      supabase.from('furniture_settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    return {
      products: unwrap(p).map(rowToProduct),
      settings: { ...DEFAULT_SETTINGS, ...(unwrap(s)?.data || {}) },
    };
  },

  async placeOrder({ slip, ...payload }) {
    const slipPath = await uploadSlip(slip);
    return unwrap(await supabase.rpc('furniture_place_order', { p: { ...payload, slipPath } }));
  },

  async findOrders(phone, id) {
    return unwrap(await supabase.rpc('furniture_find_orders', { p_phone: phone, p_id: id || null })) || [];
  },

  async cancelOrder(id, phone) {
    return unwrap(await supabase.rpc('furniture_cancel_order', { p_id: id, p_phone: phone }));
  },

  async attachSlip(id, phone, dataUrl) {
    const path = await uploadSlip(dataUrl);
    return unwrap(await supabase.rpc('furniture_attach_slip', { p_id: id, p_phone: phone, p_path: path }));
  },

  // ----- admin (allowed only for users in public.furniture_admins — enforced by RLS) -----
  async loadOrders() {
    const r = await supabase.from('furniture_orders').select('*').order('created_at', { ascending: false }).limit(1000);
    return unwrap(r).map(rowToOrder);
  },

  async updateOrder(id, patch) {
    const row = {};
    if (patch.status) row.status = patch.status;
    if (patch.adminNote != null) row.admin_note = patch.adminNote;
    unwrap(await supabase.from('furniture_orders').update(row).eq('id', id).select('id').single());
  },

  async getSlipUrl(order) {
    if (!order.slipPath) return null;
    const { data, error } = await supabase.storage.from(SLIP_BUCKET).createSignedUrl(order.slipPath, 600);
    return error ? null : data.signedUrl;
  },

  async saveProduct(product, isNew) {
    const images = await uploadPhotos(product.id, product.images || []);
    const row = productToRow({ ...product, images });
    if (isNew) {
      const { data: first } = await supabase.from('furniture_products').select('sort_order').order('sort_order').limit(1).maybeSingle();
      row.sort_order = (first?.sort_order ?? 0) - 1; // newest first
      return rowToProduct(unwrap(await supabase.from('furniture_products').insert(row).select('*').single()));
    }
    const { id, ...rest } = row;
    return rowToProduct(unwrap(await supabase.from('furniture_products').update(rest).eq('id', id).select('*').single()));
  },

  async deleteProduct(id) {
    unwrap(await supabase.from('furniture_products').delete().eq('id', id));
  },

  async saveSettings(settings) {
    unwrap(await supabase.from('furniture_settings').upsert({ id: 1, data: settings }));
  },

  // ----- auth -----
  async getAdminState() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return { signedIn: false, isAdmin: false, email: null };
    const isAdmin = unwrap(await supabase.rpc('furniture_is_admin'));
    return { signedIn: true, isAdmin: Boolean(isAdmin), email: user.email };
  },

  async signIn(email, password) {
    unwrap(await supabase.auth.signInWithPassword({ email, password }));
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  onAuthChange(cb) {
    // Defer: supabase-js holds its auth lock while running this callback
    const { data } = supabase.auth.onAuthStateChange(() => setTimeout(() => cb(), 0));
    return () => data.subscription.unsubscribe();
  },

  // Live updates for the admin screens (new orders, stock changes)
  subscribe(cb) {
    const ch = supabase
      .channel('furniture-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'furniture_orders' }, cb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'furniture_products' }, cb)
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
};
