// content-image — Text→Image สำหรับ Content Factory (Fireworks FLUX) · verify_jwt = true
// ฝั่ง server เท่านั้น: FIREWORKS_API_KEY อยู่ใน Supabase secrets (ไม่ส่งลง client)
// ⚠️ ยังไม่ได้ยืนยันกับ API จริง (ไม่มี key ตอนพัฒนา) — ต้องรัน smoke test หลังตั้ง secret ก่อนเปิด flag
//    ฝั่ง client เปิดใช้ด้วย INTEGRATIONS.imageGenLive (src/config.ts) — ปิดเป็นค่าเริ่มต้น
//
// Deploy:  supabase functions deploy content-image --project-ref waigsnxhrlwtiotspaim
// Secrets: FIREWORKS_API_KEY (ใช้ร่วมกับ _shared/llm.ts) · (ออปชัน) IMAGE_MODEL
//          default IMAGE_MODEL = accounts/fireworks/models/flux-1-schnell-fp8
//
// Body:   { prompt: string, aspect?: "1:1" | "16:9" | "9:16" }
// Return: { ok: true, mime: string, base64: string } | { error: string }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KEY = Deno.env.get("FIREWORKS_API_KEY") ?? "";
const MODEL = Deno.env.get("IMAGE_MODEL") ?? "accounts/fireworks/models/flux-1-schnell-fp8";
const MAX_PROMPT = 1000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...cors } });

const ASPECTS = new Set(["1:1", "16:9", "9:16"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!KEY) return json({ error: "image_provider_not_configured" }, 503);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: authErr } = await admin.auth.getUser(jwt);
  if (authErr || !userData?.user) return json({ error: "unauthorized" }, 401);

  let body: { prompt?: string; aspect?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const prompt = String(body.prompt ?? "").trim();
  const aspect = ASPECTS.has(String(body.aspect)) ? String(body.aspect) : "1:1";
  if (!prompt || prompt.length > MAX_PROMPT) return json({ error: "invalid_prompt" }, 400);

  const url = `https://api.fireworks.ai/inference/v1/image_generation/${MODEL}`;
  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "image/jpeg", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ prompt, aspect_ratio: aspect }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return json({ error: "provider_unreachable" }, 502);
  }
  if (!r.ok) {
    console.error("content-image provider error", r.status);
    return json({ error: "provider_error", status: r.status }, 502);
  }
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length === 0 || buf.length > 6_000_000) return json({ error: "bad_image" }, 502);
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return json({ ok: true, mime: r.headers.get("content-type") ?? "image/jpeg", base64: btoa(bin) });
});
