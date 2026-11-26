// content-video — Text→Video แบบ async สำหรับ Content Factory (fal.ai queue API) · verify_jwt = true
// ฝั่ง server เท่านั้น: FAL_KEY อยู่ใน Supabase secrets · จำกัดโควตาต่อผู้ใช้ต่อวัน (ตาราง content_video_jobs)
// ⚠️ ยังไม่ได้ยืนยันกับ fal.ai จริง (ไม่มี key ตอนพัฒนา) — ต้องตั้ง secret + smoke test ก่อนเปิด flag
//    ฝั่ง client เปิดด้วย INTEGRATIONS.videoGenLive (src/config.ts) — ปิดเป็นค่าเริ่มต้น
//
// Deploy:  supabase functions deploy content-video --project-ref waigsnxhrlwtiotspaim
// Secrets: FAL_KEY · (ออปชัน) VIDEO_MODEL (default fal-ai/ltx-video) · VIDEO_DAILY_LIMIT (default 3)
// Migration: 20261126000000_content_video_jobs.sql ต้อง apply ก่อน
//
// Body:   { action: "start", prompt: string }
//      |  { action: "poll", statusUrl: string, responseUrl: string }
// Return: start → { ok: true, statusUrl, responseUrl, remaining }
//         poll  → { ok: true, status: "IN_QUEUE"|"IN_PROGRESS"|"COMPLETED", videoUrl?: string }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";
const MODEL = Deno.env.get("VIDEO_MODEL") ?? "fal-ai/ltx-video";
const DAILY_LIMIT = Math.max(0, Number(Deno.env.get("VIDEO_DAILY_LIMIT") ?? "3") || 3);
const MAX_PROMPT = 800;
const FAL_QUEUE = "https://queue.fal.run/";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...cors } });

/** กัน SSRF: รับเฉพาะ URL ของ fal queue (https) เท่านั้น */
const isFalUrl = (u: unknown): u is string => typeof u === "string" && u.startsWith(FAL_QUEUE) && u.length < 500;

function findVideoUrl(o: unknown): string | null {
  if (!o || typeof o !== "object") return null;
  const rec = o as Record<string, unknown>;
  const v = rec.video as Record<string, unknown> | undefined;
  if (v && typeof v.url === "string" && v.url.startsWith("https://")) return v.url;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!FAL_KEY) return json({ error: "video_provider_not_configured" }, 503);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: authErr } = await admin.auth.getUser(jwt);
  if (authErr || !userData?.user) return json({ error: "unauthorized" }, 401);
  const userId = userData.user.id;

  let body: { action?: string; prompt?: string; statusUrl?: string; responseUrl?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const headers = { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` };

  if (body.action === "start") {
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt || prompt.length > MAX_PROMPT) return json({ error: "invalid_prompt" }, 400);

    // โควตาต่อวัน (UTC) — นับก่อนสั่งงาน
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const { count, error: cntErr } = await admin.from("content_video_jobs")
      .select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since.toISOString());
    if (cntErr) { console.error("content-video quota read failed"); return json({ error: "quota_unavailable" }, 503); }
    if ((count ?? 0) >= DAILY_LIMIT) return json({ error: "daily_limit_reached", limit: DAILY_LIMIT }, 429);

    let r: Response;
    try {
      r = await fetch(`${FAL_QUEUE}${MODEL}`, { method: "POST", headers, body: JSON.stringify({ prompt }), signal: AbortSignal.timeout(20_000) });
    } catch { return json({ error: "provider_unreachable" }, 502); }
    const j = await r.json().catch(() => ({})) as Record<string, unknown>;
    if (!r.ok || typeof j.request_id !== "string" || !isFalUrl(j.status_url) || !isFalUrl(j.response_url)) {
      console.error("content-video submit failed", r.status);
      return json({ error: "provider_error", status: r.status }, 502);
    }
    const { error: insErr } = await admin.from("content_video_jobs").insert({ user_id: userId, request_id: j.request_id, model: MODEL });
    if (insErr) console.error("content-video job log failed");
    return json({ ok: true, statusUrl: j.status_url, responseUrl: j.response_url, remaining: Math.max(0, DAILY_LIMIT - (count ?? 0) - 1) });
  }

  if (body.action === "poll") {
    if (!isFalUrl(body.statusUrl) || !isFalUrl(body.responseUrl)) return json({ error: "invalid_url" }, 400);
    let s: Response;
    try { s = await fetch(body.statusUrl, { headers, signal: AbortSignal.timeout(15_000) }); } catch { return json({ error: "provider_unreachable" }, 502); }
    const sj = await s.json().catch(() => ({})) as Record<string, unknown>;
    if (!s.ok) return json({ error: "provider_error", status: s.status }, 502);
    const status = String(sj.status ?? "");
    if (status !== "COMPLETED") return json({ ok: true, status: status === "IN_PROGRESS" ? "IN_PROGRESS" : "IN_QUEUE" });
    let rr: Response;
    try { rr = await fetch(body.responseUrl, { headers, signal: AbortSignal.timeout(20_000) }); } catch { return json({ error: "provider_unreachable" }, 502); }
    const out = await rr.json().catch(() => null);
    const videoUrl = rr.ok ? findVideoUrl(out) : null;
    if (!videoUrl) return json({ error: "no_video_in_result" }, 502);
    return json({ ok: true, status: "COMPLETED", videoUrl });
  }

  return json({ error: "unknown_action" }, 400);
});
