// Cloud backend: Supabase (Postgres + Auth + Storage). Every browser and device sees the same data.
import { supabase } from './supabase';
import { DEFAULT_SETTINGS } from '../data';
import { toApiError } from './errors';

const SLIP_BUCKET = 'furniture-slips';

const unwrap = ({ data, error }) => {
  if (error) throw toApiError(error);
  return data;
};
const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');
const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();
// Timestamps are stored in UTC; the app shows Thailand time (UTC+7, no DST)
const bangkok = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) : null);

const rowToPlan = (r) => ({ id: r.id, name: r.name, days: r.days, price: r.price, description: r.description, active: r.active, sortOrder: r.sort_order });

async function uploadSlip(dataUrl) {
  const path = `pending/${uuid()}.jpg`;
  unwrap(await supabase.storage.from(SLIP_BUCKET).upload(path, await dataUrlToBlob(dataUrl), { contentType: 'image/jpeg' }));
  return path;
}

export const api = {
  async loadPublic() {
    const [p, s] = await Promise.all([
      supabase.from('furniture_plans').select('*').order('sort_order').order('price'),
      supabase.from('furniture_settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    return { plans: unwrap(p).map(rowToPlan), settings: { ...DEFAULT_SETTINGS, ...(unwrap(s)?.data || {}) } };
  },

  // ----- customers (secret access code) -----
  async start(form) {
    return unwrap(await supabase.rpc('furniture_start', { p: form }));
  },
  async buy(code, planId) {
    return unwrap(await supabase.rpc('furniture_buy', { p_code: code, p_plan_id: planId }));
  },
  async account(code) {
    return unwrap(await supabase.rpc('furniture_account', { p_code: code }));
  },
  // follow a payment with its claim token — returns { payment, code, expiresAt } (code only once approved)
  async claim(id, token) {
    return unwrap(await supabase.rpc('furniture_claim', { p_id: id, p_token: token }));
  },
  async claimSlip(id, token, dataUrl) {
    const path = await uploadSlip(dataUrl);
    return unwrap(await supabase.rpc('furniture_claim_slip', { p_id: id, p_token: token, p_path: path }));
  },
  async attachSlip(code, paymentId, dataUrl) {
    const path = await uploadSlip(dataUrl);
    return unwrap(await supabase.rpc('furniture_attach_slip', { p_code: code, p_payment_id: paymentId, p_path: path }));
  },
  async listProjects(code) {
    return unwrap(await supabase.rpc('furniture_projects_list', { p_code: code })) || [];
  },
  async getProject(code, id) {
    return unwrap(await supabase.rpc('furniture_project_get', { p_code: code, p_id: id }));
  },
  async saveProject(code, id, name, data) {
    return unwrap(await supabase.rpc('furniture_project_save', { p_code: code, p_id: id, p_name: name, p_data: data }));
  },
  async deleteProject(code, id) {
    unwrap(await supabase.rpc('furniture_project_delete', { p_code: code, p_id: id }));
  },

  // ----- admin (allowed only for users in public.furniture_admins — enforced by RLS) -----
  async loadAdmin() {
    const [a, p, pr] = await Promise.all([
      supabase.from('furniture_accounts').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('furniture_payments').select('*').order('created_at', { ascending: false }).limit(20000),
      supabase.from('furniture_projects').select('account_id').limit(10000),
    ]);
    const counts = {};
    unwrap(pr).forEach((x) => (counts[x.account_id] = (counts[x.account_id] || 0) + 1));
    const accounts = unwrap(a).map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      phone: r.phone,
      lineId: r.line_id || '',
      expiresAtIso: r.expires_at,
      expiresAt: bangkok(r.expires_at),
      active: Boolean(r.expires_at && new Date(r.expires_at) > new Date()),
      adminNote: r.admin_note || '',
      createdAt: bangkok(r.created_at),
      projectCount: counts[r.id] || 0,
    }));
    const byId = Object.fromEntries(accounts.map((x) => [x.id, x]));
    const payments = unwrap(p).map((r) => ({
      id: r.id,
      accountId: r.account_id,
      account: byId[r.account_id] || null,
      planName: r.plan_name,
      days: r.days,
      amount: r.amount,
      status: r.status,
      slipPath: r.slip_path,
      oldSlips: r.old_slips || [],
      hasSlip: Boolean(r.slip_path),
      decidedAtIso: r.decided_at,
      createdAtIso: r.created_at,
      createdAt: bangkok(r.created_at),
      decidedAt: bangkok(r.decided_at),
    }));
    return { accounts, payments };
  },
  async loadPlansAdmin() {
    return unwrap(await supabase.from('furniture_plans').select('*').order('sort_order').order('price')).map(rowToPlan);
  },
  async setPaymentStatus(id, status) {
    unwrap(await supabase.from('furniture_payments').update({ status }).eq('id', id).select('id').single());
  },
  async getSlipUrl(payment) {
    if (!payment.slipPath) return null;
    const { data, error } = await supabase.storage.from(SLIP_BUCKET).createSignedUrl(payment.slipPath, 600);
    return error ? null : data.signedUrl;
  },
  // Signed links for many slips at once (e.g. a whole month for the accountant)
  async getSlipUrls(paths) {
    if (!paths.length) return {};
    const out = {};
    for (let i = 0; i < paths.length; i += 100) {
      const { data, error } = await supabase.storage.from(SLIP_BUCKET).createSignedUrls(paths.slice(i, i + 100), 3600);
      if (error) throw toApiError(error);
      data.forEach((d) => d.signedUrl && (out[d.path] = d.signedUrl));
    }
    return out;
  },
  async updateAccount(id, patch) {
    const row = {};
    if ('expiresAtIso' in patch) row.expires_at = patch.expiresAtIso;
    if ('adminNote' in patch) row.admin_note = patch.adminNote;
    if ('name' in patch) row.name = patch.name;
    unwrap(await supabase.from('furniture_accounts').update(row).eq('id', id).select('id').single());
  },
  async savePlan(plan, isNew) {
    const row = { name: plan.name.trim(), days: Math.round(Number(plan.days)), price: Math.round(Number(plan.price)), description: plan.description || '', active: plan.active !== false, sort_order: Math.round(Number(plan.sortOrder) || 0) };
    if (isNew) unwrap(await supabase.from('furniture_plans').insert({ id: plan.id, ...row }).select('id').single());
    else unwrap(await supabase.from('furniture_plans').update(row).eq('id', plan.id).select('id').single());
  },
  async deletePlan(id) {
    unwrap(await supabase.from('furniture_plans').delete().eq('id', id));
  },
  async saveSettings(settings) {
    unwrap(await supabase.from('furniture_settings').upsert({ id: 1, data: settings }));
  },

  // ----- admin auth -----
  async getAdminState() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return { signedIn: false, isAdmin: false, email: null };
    const isAdmin = unwrap(await supabase.rpc('furniture_is_admin'));
    return { signedIn: true, isAdmin: Boolean(isAdmin), email: user.email };
  },
  // Back office: password only — the server function finds the admin account (no email typed or exposed)
  async signInWithPasswordOnly(password) {
    const { data, error } = await supabase.functions.invoke('furniture-admin-login', { body: { password } });
    if (error) {
      const status = error.context?.status;
      if (status === 401) throw toApiError(new Error('Invalid login credentials'));
      throw toApiError(error);
    }
    unwrap(await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token }));
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
  subscribe(cb) {
    const ch = supabase
      .channel('furniture-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'furniture_payments' }, cb)
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
};
