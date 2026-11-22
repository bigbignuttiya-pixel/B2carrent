// LINE Messaging API notifications for B2 Rental (?shop=b2) and PUNSO Car Rental (?shop=punso).
// Both shops live in this Supabase project; each has its own LINE OA, config row and bookings table.
//  1) x-hook-secret      → called by the bookings trigger (new / slip / confirmed / cancelled)
//  2) x-line-signature   → LINE webhook: "เชื่อมต่อ <code>" registers the chat/group, "ยกเลิกแจ้งเตือน" removes it
//  3) Authorization (admin JWT) → {action:"setup"} sets the webhook URL, otherwise sends a test message
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const db = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const baht = (n: number) => "฿" + Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
const thDate = (d: string) => d ? new Date(d + "T00:00:00+07:00").toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short" }) : "-";

const SHOPS: Record<string, { cfg: string; bookings: string; isAdmin: string; name: string }> = {
  b2: { cfg: "line_config", bookings: "bookings", isAdmin: "is_admin", name: "B2 Rental" },
  punso: { cfg: "punso_line_config", bookings: "punso_bookings", isAdmin: "punso_is_admin", name: "PUNSO Car Rental" },
};
const PAY: Record<string, string> = { promptpay: "พร้อมเพย์", PromptPay: "พร้อมเพย์", cash: "เงินสด", transfer: "โอน", card: "บัตร" };

async function lineApi(token: string, path: string, body: unknown) {
  const r = await fetch("https://api.line.me/v2/bot/message/" + path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body) });
  return r.ok ? null : `${r.status} ${await r.text()}`;
}
async function pushAll(S: any, c: any, text: string) {
  const errs: string[] = [];
  for (const t of c.targets || []) { const e = await lineApi(c.channel_token, "push", { to: t.id, messages: [{ type: "text", text: text.slice(0, 4900) }] }); if (e) errs.push(e); }
  await db.from(S.cfg).update(errs.length ? { last_error: errs.join(" | ").slice(0, 500) } : { last_error: null, last_sent_at: new Date().toISOString() }).eq("id", 1);
  return errs;
}
async function bookingText(S: any, ev: string, id: string) {
  const { data: b } = await db.from(S.bookings).select("*").eq("id", id).single();
  if (!b) return null;
  const d = b.data || {};
  const head: Record<string, string> = {
    new: `🆕 จองใหม่ ${b.id}${d.source && d.source !== "website" ? ` · ${d.source}` : ""}`,
    slip: `📎 ลูกค้าแนบสลิปแล้ว ${b.id} · รอตรวจ`,
    confirmed: `✅ ยืนยันการจองแล้ว ${b.id}`,
    cancelled: `❌ ยกเลิกการจอง ${b.id}`,
  };
  const L = [head[ev] || S.name, `🏷️ ${S.name}`, ""];
  L.push(`🚗 ${d.vehicleName || b.vehicle_id}`);
  L.push(`📅 ${thDate(b.start_date)}${d.pickupTime ? " " + d.pickupTime : ""} → ${thDate(b.end_date)}${d.returnTime ? " " + d.returnTime : ""}${d.totalDays ? ` (${d.totalDays} วัน)` : ""}`);
  if (d.pickupLocation) L.push(`📍 รับ: ${d.pickupLocation}`);
  if (d.returnLocation && d.returnLocation !== d.pickupLocation) L.push(`📍 คืน: ${d.returnLocation}`);
  L.push(`👤 ${d.customerName || "-"}  📞 ${b.phone || "-"}`);
  const addons = Array.isArray(d.addons) ? d.addons.map((a: any) => typeof a === "string" ? a : a?.name || a?.label).filter(Boolean) : [];
  if (addons.length) L.push(`➕ ${addons.join(", ")}`);
  if (d.note) L.push(`📝 ${d.note}`);
  L.push("");
  if (+d.discount) L.push(`ส่วนลด ${baht(d.discount)}${d.couponCode ? ` (${d.couponCode})` : ""}`);
  L.push(`💰 ยอดรวม ${baht(b.total_price)}`);
  if (d.paymentMethod) L.push(`💳 ${PAY[d.paymentMethod] || d.paymentMethod}`);
  return L.join("\n");
}
const pairCode = (c: any) => String(c?.hook_secret || "").slice(0, 6).toLowerCase();
async function verifySig(secret: string, body: string, sig: string | null) {
  if (!secret || !sig) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(mac))) === sig;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const shop = new URL(req.url).searchParams.get("shop") || "";
  const S = SHOPS[shop];
  if (!S) return json({ error: "unknown shop" }, 400);
  const raw = await req.text();

  // LINE webhook — LINE gives up after a short wait, so answer at once (before any database read)
  // and do the work in the background; a cold start plus database reads can exceed LINE's timeout.
  const sig = req.headers.get("x-line-signature");
  if (sig) {
    const work = handleLine(S, raw, sig).catch((e) => console.error("line webhook", e));
    // deno-lint-ignore no-explicit-any
    const rt = (globalThis as any).EdgeRuntime;
    if (rt?.waitUntil) { rt.waitUntil(work); return json({ ok: true }); }
    await work;
    return json({ ok: true });
  }

  const { data: c } = await db.from(S.cfg).select("*").eq("id", 1).single();

  // 1) from the database trigger
  const hook = req.headers.get("x-hook-secret");
  if (hook) {
    if (!c || hook !== c.hook_secret) return json({ error: "forbidden" }, 403);
    const { event, booking_id } = JSON.parse(raw || "{}");
    if (!c[`notify_${event}`]) return json({ skipped: true });
    const text = await bookingText(S, event, booking_id);
    if (!text) return json({ error: "booking not found" }, 404);
    const errs = await pushAll(S, c, text);
    return json({ ok: errs.length === 0, errs });
  }

  // 3) admin actions from the back office
  const auth = req.headers.get("authorization");
  if (auth) return adminAction(S, c, shop, raw, auth);
  return json({ error: "bad request" }, 400);
});

// deno-lint-ignore no-explicit-any
async function handleLine(S: any, raw: string, sig: string) {
  {
    const { data: c } = await db.from(S.cfg).select("*").eq("id", 1).single();
    if (!c || !(await verifySig(c.channel_secret, raw, sig))) { console.warn("line webhook: bad signature"); return; }
    const { events = [] } = JSON.parse(raw || "{}");
    let targets: any[] = c.targets || [];
    for (const e of events) {
      const src = e.source || {}; const id = src.groupId || src.roomId || src.userId; const type = src.groupId ? "group" : src.roomId ? "room" : "user";
      const text = e.type === "message" && e.message?.type === "text" ? String(e.message.text).trim() : "";
      // Only someone who knows the shop's pairing code (shown in the back office) can subscribe —
      // otherwise any customer who adds the LINE OA could receive other customers' bookings.
      const m = text.match(/^(?:เชื่อมต่อ|เปิดแจ้งเตือน)\s*([A-Za-z0-9]*)/);
      const join = Boolean(m && m[1].toLowerCase() === pairCode(c));
      if (m && !join && e.replyToken) {
        await lineApi(c.channel_token, "reply", { replyToken: e.replyToken, messages: [{ type: "text", text: "🔐 พิมพ์ \"เชื่อมต่อ\" ตามด้วยรหัส 6 หลักจากหน้าหลังบ้าน เช่น เชื่อมต่อ a1b2c3" }] });
        continue;
      }
      const leave = e.type === "leave" || e.type === "unfollow" || /ยกเลิกแจ้งเตือน|ปิดแจ้งเตือน/.test(text);
      if (join && id && !targets.some((t) => t.id === id)) {
        targets = [...targets, { id, type, added: new Date().toISOString() }];
        if (e.replyToken) await lineApi(c.channel_token, "reply", { replyToken: e.replyToken, messages: [{ type: "text", text: `✅ เชื่อมต่อแจ้งเตือน ${S.name} แล้ว\nการจองใหม่ สลิป และการยืนยันจะส่งมาที่นี่\n(พิมพ์ "ยกเลิกแจ้งเตือน" เพื่อหยุด)` }] });
      } else if (leave && id) {
        targets = targets.filter((t) => t.id !== id);
        if (e.replyToken && e.type === "message") await lineApi(c.channel_token, "reply", { replyToken: e.replyToken, messages: [{ type: "text", text: "🔕 หยุดแจ้งเตือนที่นี่แล้ว" }] });
      } else if (text && e.replyToken && /^(สถานะ|ทดสอบ)/.test(text)) {
        await lineApi(c.channel_token, "reply", { replyToken: e.replyToken, messages: [{ type: "text", text: targets.some((t) => t.id === id) ? "🟢 ที่นี่เชื่อมต่อแจ้งเตือนอยู่" : "⚪ ยังไม่เชื่อมต่อ พิมพ์ \"เชื่อมต่อ\" ตามด้วยรหัสจากหลังบ้าน" }] });
      }
    }
    await db.from(S.cfg).update({ targets, updated_at: new Date().toISOString() }).eq("id", 1);
  }
}

// Is LINE's "Use webhook" switch on? (the endpoint can be set by API, the switch only in the console)
async function webhookActive(token: string) {
  const r = await fetch("https://api.line.me/v2/bot/channel/webhook/endpoint", { headers: { Authorization: "Bearer " + token } });
  return r.ok ? Boolean((await r.json()).active) : null;
}
const USE_WEBHOOK_OFF = "⚠️ LINE ยังปิด \"Use webhook\" อยู่ — เข้า LINE Developers → Channel ร้าน → แท็บ Messaging API → Webhook settings → เปิด Use webhook (ไม่เช่นนั้นพิมพ์ \"เชื่อมต่อ\" แล้วระบบจะไม่ได้รับ)";

// 3) admin actions from the back office
// deno-lint-ignore no-explicit-any
async function adminAction(S: any, c: any, shop: string, raw: string, auth: string) {
  const u = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: isAdmin } = await u.rpc(S.isAdmin);
  if (!isAdmin) return json({ error: "admin only" }, 403);
  if (!c?.channel_token) return json({ ok: false, error: "ยังไม่ได้ใส่ Channel access token" });
  const body = JSON.parse(raw || "{}");
  if (body.action === "setup") {
    const ep = `${URL_}/functions/v1/line-notify?shop=${shop}`;
    const r = await fetch("https://api.line.me/v2/bot/channel/webhook/endpoint", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + c.channel_token }, body: JSON.stringify({ endpoint: ep }) });
    if (!r.ok) return json({ ok: false, error: `ตั้ง Webhook ไม่สำเร็จ (${r.status}) — ตรวจ Channel access token อีกครั้ง` });
    const bi = await fetch("https://api.line.me/v2/bot/info", { headers: { Authorization: "Bearer " + c.channel_token } });
    const info = bi.ok ? await bi.json() : {};
    if ((await webhookActive(c.channel_token)) === false) return json({ ok: false, error: `บันทึกแล้ว เชื่อมกับบอท "${info.displayName || ""}" ${info.basicId || ""} แต่ ${USE_WEBHOOK_OFF}` });
    return json({ ok: true, bot: info.displayName || "", basicId: info.basicId || "" });
  }
  if (!(c.targets || []).length) {
    const off = (await webhookActive(c.channel_token)) === false;
    return json({ ok: false, error: off ? USE_WEBHOOK_OFF : "ยังไม่มีผู้รับ — แอดเพื่อน LINE ร้านแล้วพิมพ์ \"เชื่อมต่อ\" ตามด้วยรหัสจากหลังบ้าน" });
  }
  const errs = await pushAll(S, c, `🔔 ทดสอบแจ้งเตือนจาก ${S.name}\nถ้าเห็นข้อความนี้ แปลว่าระบบแจ้งการจองเข้า LINE พร้อมใช้งานแล้ว ✅`);
  return json({ ok: errs.length === 0, error: errs.join(" | ") || undefined });
}
