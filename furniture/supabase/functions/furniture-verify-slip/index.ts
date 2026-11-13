// Automatic slip check (EasySlip). Called by the website right after the customer attaches a slip.
// The slip image is read from private storage here on the server and sent to EasySlip, which reads the
// slip's QR and confirms the transfer with the bank. The payment is approved automatically only when:
//   - the amount equals the package price,
//   - the receiving account ends with the same 4 digits as the shop's PromptPay number,
//   - the slip's reference number was never used for another payment,
//   - the transfer is not older than the payment itself,
//   - and auto-approval is on (back office → ตั้งค่า).
// Anything else stays "รอตรวจสอบ" for the shop, with the reasons shown in the back office.
// Needs the secret EASYSLIP_API_KEY; without it the function answers { result: "not_configured" }.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const norm = (s: unknown) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const { id, token, code } = await req.json().catch(() => ({}));
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // The caller must hold the payment's claim token or the account's access code
    const { data: payment } = await admin.from("furniture_payments").select("*").eq("id", String(id ?? "").trim().toUpperCase()).maybeSingle();
    if (!payment) return json({ error: "not_found" }, 404);
    let allowed = token && payment.claim_token.length === 20 && norm(token) === payment.claim_token;
    if (!allowed && code) {
      const { data: acc } = await admin.from("furniture_accounts").select("id").eq("code", norm(code)).maybeSingle();
      allowed = Boolean(acc && acc.id === payment.account_id);
    }
    if (!allowed) return json({ error: "not_allowed" }, 403);
    if (payment.status !== "Pending" || !payment.slip_path) return json({ result: "skipped", status: payment.status });

    const key = Deno.env.get("EASYSLIP_API_KEY");
    if (!key) return json({ result: "not_configured" });

    const { data: setRow } = await admin.from("furniture_settings").select("data").eq("id", 1).maybeSingle();
    const settings = setRow?.data ?? {};

    const { data: blob, error: dlErr } = await admin.storage.from("furniture-slips").download(payment.slip_path);
    if (dlErr || !blob) return json({ result: "review", reasons: ["read_slip_failed"] });

    const form = new FormData();
    form.append("file", new File([blob], "slip.jpg", { type: "image/jpeg" }));
    const res = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    const d = body?.data;
    const reasons: string[] = [];
    if (!res.ok || !d) {
      reasons.push(body?.message ? `provider:${body.message}` : `provider_http_${res.status}`);
    }

    const amount = Number(d?.amount?.amount ?? d?.amount ?? NaN);
    const transRef = String(d?.transRef ?? "");
    const receiverAcc = String(d?.receiver?.account?.proxy?.account ?? d?.receiver?.account?.bank?.account ?? "");
    const receiverName = String(d?.receiver?.account?.name?.th ?? d?.receiver?.account?.name?.en ?? "");
    const senderName = String(d?.sender?.account?.name?.th ?? d?.sender?.account?.name?.en ?? "");
    const slipDate = d?.date ? new Date(d.date) : null;

    if (d) {
      if (!(amount === Number(payment.amount))) reasons.push("amount_mismatch");
      const shop = digits(settings.promptPayId).slice(-4);
      const recv = digits(receiverAcc).slice(-4);
      if (!shop || !recv || shop !== recv) reasons.push("receiver_mismatch");
      if (!transRef) reasons.push("no_reference");
      if (slipDate && slipDate.getTime() < new Date(payment.created_at).getTime() - 10 * 60 * 1000) reasons.push("slip_older_than_order");
      if (transRef) {
        const { data: used } = await admin.from("furniture_slip_refs").select("payment_id").eq("trans_ref", transRef).maybeSingle();
        if (used && used.payment_id !== payment.id) reasons.push("duplicate_slip");
      }
    }

    const ok = reasons.length === 0;
    const check = {
      ok,
      provider: "easyslip",
      checkedAt: new Date().toISOString(),
      transRef,
      amount: Number.isFinite(amount) ? amount : null,
      receiver: [receiverName, receiverAcc].filter(Boolean).join(" · "),
      sender: senderName,
      slipDate: slipDate ? slipDate.toISOString() : null,
      reasons,
    };
    await admin.from("furniture_payments").update({ slip_check: check }).eq("id", payment.id);

    if (ok) {
      await admin.from("furniture_slip_refs").upsert({ trans_ref: transRef, payment_id: payment.id });
      if (settings.autoApproveSlip) {
        await admin.from("furniture_payments").update({ status: "Approved" }).eq("id", payment.id).eq("status", "Pending");
        return json({ result: "approved" });
      }
      return json({ result: "verified" });
    }
    return json({ result: "review", reasons });
  } catch (e) {
    return json({ error: "server_error", detail: String(e).slice(0, 200) }, 500);
  }
});
