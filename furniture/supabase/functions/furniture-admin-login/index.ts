// Password-only login for the back office.
// The page sends only the password; this function (server side, so no admin email is exposed in the
// website) tries it against the accounts listed in public.furniture_admins and returns a normal
// Supabase session for the one that matches. Wrong passwords get a short delay to slow guessing.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const { password } = await req.json().catch(() => ({}));
    if (typeof password !== "string" || password.length < 1 || password.length > 200) {
      return json({ error: "Invalid login credentials" }, 401);
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: rows, error } = await admin.from("furniture_admins").select("user_id");
    if (error) return json({ error: "server_error" }, 500);

    for (const row of rows ?? []) {
      const { data: u } = await admin.auth.admin.getUserById(row.user_id);
      const email = u?.user?.email;
      if (!email) continue;
      const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data } = await client.auth.signInWithPassword({ email, password });
      if (data?.session) {
        return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    return json({ error: "Invalid login credentials" }, 401);
  } catch {
    return json({ error: "server_error" }, 500);
  }
});
