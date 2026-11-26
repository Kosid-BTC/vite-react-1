'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BrainError, callBrain, type AdsResult, type AnalyzeResult, type ComplianceResult } from '@/server/brain';

export type StudioState = { error?: string; ok?: string };

const SITE = 'https://ceoaithailand.org/';
const PROMPT_VERSION = 'os-marketing-brain@1';
const CHANNELS = ['facebook', 'instagram', 'tiktok', 'line', 'youtube'] as const;
const OBJECTIVES = ['awareness', 'interest', 'first_customer', 'sales'] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function context(slug: string) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');
  // RLS: แถวเหล่านี้เห็นได้เฉพาะสมาชิก workspace — ไม่ใช่สมาชิก = ไม่เจอ workspace เลย
  const { data: ws, error } = await db.from('workspaces').select('id,slug').eq('slug', slug).single();
  if (error || !ws) throw new BrainError('not_a_member');
  return { db, user, ws };
}

function fail(e: unknown): StudioState {
  if (e instanceof BrainError) return { error: e.message };
  console.error('[studio]', e);
  return { error: 'บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง' };
}

/** ① วิเคราะห์ข้อมูลที่ไหลจากเว็บ แล้วเก็บผลไว้ใน ai_jobs (ดูย้อนหลังได้) */
export async function analyzeAction(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const slug = String(formData.get('workspaceSlug') ?? '');
  try {
    const { db, user, ws } = await context(slug);
    const [segs, pils, evs] = await Promise.all([
      db.from('marketing_audience_segments').select('code,name,description,evidence_status').eq('workspace_id', ws.id).eq('active', true),
      db.from('marketing_message_pillars').select('code,name,problem,promise').eq('workspace_id', ws.id).eq('active', true),
      db.from('marketing_behavior_events').select('name').eq('workspace_id', ws.id),
    ]);
    for (const r of [segs, pils, evs]) if (r.error) throw r.error;
    const eventCounts = (evs.data ?? []).reduce<Record<string, number>>((a, e) => ({ ...a, [e.name]: (a[e.name] ?? 0) + 1 }), {});

    const started = new Date().toISOString();
    const res = await callBrain<AnalyzeResult>(db, {
      task: 'analyze', workspaceId: ws.id, segments: segs.data, pillars: pils.data, eventCounts,
    });
    const { error } = await db.from('marketing_ai_jobs').insert({
      workspace_id: ws.id, job_type: 'text.generate', provider: 'anthropic', model_name: res.model,
      status: 'succeeded', progress: 100, input: { task: 'analyze', eventCounts }, output: res.result,
      idempotency_key: randomUUID(), created_by: user.id, started_at: started, completed_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/${slug}/studio`);
  return { ok: 'วิเคราะห์เสร็จแล้ว' };
}

/** ② ร่างโฆษณา 3 แบบ → ตรวจกฎแบรนด์ (ผู้ตรวจอิสระ) → บันทึกเป็นร่าง "รออนุมัติ" พร้อมลิงก์ติดตามผล */
export async function generateAdsAction(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const slug = String(formData.get('workspaceSlug') ?? '');
  const segmentId = String(formData.get('segmentId') ?? '');
  const pillarId = String(formData.get('pillarId') ?? '');
  const channel = String(formData.get('channel') ?? '') as (typeof CHANNELS)[number];
  const objective = String(formData.get('objective') ?? '') as (typeof OBJECTIVES)[number];
  if (!UUID.test(segmentId) || !UUID.test(pillarId)) return { error: 'เลือกกลุ่มเป้าหมายและสารหลักก่อน' };
  if (!CHANNELS.includes(channel) || !OBJECTIVES.includes(objective)) return { error: 'เลือกช่องทางและเป้าหมายก่อน' };

  let created = 0;
  try {
    const { db, user, ws } = await context(slug);
    const [brand, seg, pil, rules, lastAnalysis] = await Promise.all([
      db.from('marketing_brands').select('id').eq('workspace_id', ws.id).limit(1).single(),
      db.from('marketing_audience_segments').select('id,code,name,description,evidence_status').eq('id', segmentId).eq('workspace_id', ws.id).single(),
      db.from('marketing_message_pillars').select('id,code,name,problem,promise').eq('id', pillarId).eq('workspace_id', ws.id).single(),
      db.from('marketing_brand_rules').select('id,rule_type,severity,description').eq('workspace_id', ws.id).eq('active', true),
      db.from('marketing_ai_jobs').select('output').eq('workspace_id', ws.id).eq('status', 'succeeded')
        .eq('input->>task', 'analyze').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    for (const r of [brand, seg, pil, rules, lastAnalysis]) if (r.error) throw r.error;
    const segment = seg.data!;
    const pillar = pil.data!;
    const brandRules = rules.data ?? [];

    const started = new Date().toISOString();
    const ads = await callBrain<AdsResult>(db, {
      task: 'ads', workspaceId: ws.id, channel, objective, brandRules,
      segment: { code: segment.code, name: segment.name, description: segment.description, evidence_status: segment.evidence_status },
      pillar: { code: pillar.code, name: pillar.name, problem: pillar.problem, promise: pillar.promise },
      analysisSummary: (lastAnalysis.data?.output as AnalyzeResult | null)?.summary ?? '',
    });
    const variants = ads.result.variants.slice(0, 5);

    // ผู้ตรวจอิสระ — คนละคำขอกับผู้เขียน
    const check = await callBrain<ComplianceResult>(db, {
      task: 'compliance', workspaceId: ws.id, brandRules,
      variants: variants.map((v) => ({ hook: v.recommended_hook, body: v.body, caption: v.caption, cta: v.cta })),
    });

    const { data: job, error: jobErr } = await db.from('marketing_ai_jobs').insert({
      workspace_id: ws.id, job_type: 'text.generate', provider: 'anthropic', model_name: ads.model,
      status: 'succeeded', progress: 100,
      input: { task: 'ads', segment: segment.code, pillar: pillar.code, channel, objective },
      output: { ads: ads.result, compliance: check.result },
      idempotency_key: randomUUID(), created_by: user.id, started_at: started, completed_at: new Date().toISOString(),
    }).select('id').single();
    if (jobErr) throw jobErr;

    const ruleIds = new Set(brandRules.map((r) => r.id));
    const campaignTag = `os-${segment.code}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;

    for (const [i, v] of variants.entries()) {
      const { data: item, error: itemErr } = await db.from('marketing_content_items').insert({
        workspace_id: ws.id, brand_id: brand.data!.id, audience_segment_id: segment.id, message_pillar_id: pillar.id,
        title: `${segment.name} · ${v.angle}`.slice(0, 200), content_type: 'ad', funnel_stage: v.funnel_stage,
        primary_channel: channel, status: 'in_review', created_by: user.id,
      }).select('id').single();
      if (itemErr) throw itemErr;

      const { data: version, error: verErr } = await db.from('marketing_content_versions').insert({
        workspace_id: ws.id, content_item_id: item.id, version_number: 1,
        hook: v.recommended_hook, body: v.body, caption: v.caption,
        script: { hooks: v.hooks, cta: v.cta, story_model: v.story_model, writing_style: v.writing_style, angle: v.angle, ai_job_id: job.id },
        creative_brief: v.image_brief, prompt_version: PROMPT_VERSION, model_provider: 'anthropic', model_name: ads.model,
        created_by: user.id,
      }).select('id').single();
      if (verErr) throw verErr;

      const findings = check.result.results.find((r) => r.variant_index === i)?.findings ?? [];
      if (findings.length) {
        const { error } = await db.from('marketing_compliance_findings').insert(findings.map((f) => ({
          workspace_id: ws.id, content_item_id: item.id, content_version_id: version.id,
          brand_rule_id: f.brand_rule_id && ruleIds.has(f.brand_rule_id) ? f.brand_rule_id : null,
          severity: f.severity, finding: f.finding, suggested_fix: f.suggested_fix,
        })));
        if (error) throw error;
      }

      // ลิงก์ติดตามผล: ?seg= ใช้รหัสของ OS ตรง ๆ — หน้าเว็บ SaaS มี alias รองรับ (heroVariant.ts)
      const params = new URLSearchParams({
        seg: segment.code, utm_source: channel, utm_medium: 'paid_social', utm_campaign: campaignTag, utm_content: item.id.slice(0, 8),
      });
      const { error: linkErr } = await db.from('marketing_tracking_links').insert({
        workspace_id: ws.id, content_item_id: item.id, content_version_id: version.id,
        audience_segment_id: segment.id, message_pillar_id: pillar.id,
        destination_url: SITE, utm_source: channel, utm_medium: 'paid_social', utm_campaign: campaignTag,
        utm_content: item.id.slice(0, 8), segment_code: segment.code, final_url: `${SITE}?${params}`, created_by: user.id,
      });
      if (linkErr) throw linkErr;

      const { error: apprErr } = await db.from('marketing_approval_requests').insert({
        workspace_id: ws.id, content_item_id: item.id, content_version_id: version.id, status: 'pending', requested_by: user.id,
      });
      if (apprErr) throw apprErr;
      created += 1;
    }
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/${slug}/studio`);
  return { ok: `สร้างร่างโฆษณา ${created} ชิ้นแล้ว — รอคุณตรวจและอนุมัติ` };
}

/** ③ คนตัดสิน — อนุมัติไม่ได้ถ้ายังมีข้อห้ามเด็ดขาดที่ยังไม่แก้ */
export async function decideAction(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const slug = String(formData.get('workspaceSlug') ?? '');
  const contentId = String(formData.get('contentId') ?? '');
  const approvalId = String(formData.get('approvalId') ?? '');
  const decision = String(formData.get('decision') ?? '') as 'approved' | 'rejected' | 'changes_requested';
  const notes = String(formData.get('notes') ?? '').slice(0, 1000) || null;
  if (!UUID.test(contentId) || !UUID.test(approvalId)) return { error: 'ไม่พบรายการ' };
  if (!['approved', 'rejected', 'changes_requested'].includes(decision)) return { error: 'เลือกผลการตรวจก่อน' };

  try {
    const { db, user, ws } = await context(slug);
    if (decision === 'approved') {
      const { count, error } = await db.from('marketing_compliance_findings').select('id', { count: 'exact', head: true })
        .eq('workspace_id', ws.id).eq('content_item_id', contentId).eq('severity', 'blocking').eq('resolved', false);
      if (error) throw error;
      if ((count ?? 0) > 0) return { error: `ยังมีข้อห้ามเด็ดขาด ${count} ข้อที่ยังไม่แก้ — อนุมัติไม่ได้` };
    }
    const now = new Date().toISOString();
    const { error: aErr } = await db.from('marketing_approval_requests')
      .update({ status: decision, reviewed_by: user.id, reviewed_at: now, review_notes: notes })
      .eq('id', approvalId).eq('workspace_id', ws.id);
    if (aErr) throw aErr;
    const status = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'archived' : 'draft';
    const { error: cErr } = await db.from('marketing_content_items').update({ status, updated_at: now })
      .eq('id', contentId).eq('workspace_id', ws.id);
    if (cErr) throw cErr;
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/${slug}/content/${contentId}`);
  revalidatePath(`/${slug}/studio`);
  return { ok: decision === 'approved' ? 'อนุมัติแล้ว — นำไปโพสต์เองได้' : 'บันทึกผลการตรวจแล้ว' };
}

/** ทำเครื่องหมายว่าแก้ข้อสังเกตแล้ว (คนยืนยัน) */
export async function resolveFindingAction(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const slug = String(formData.get('workspaceSlug') ?? '');
  const contentId = String(formData.get('contentId') ?? '');
  const findingId = String(formData.get('findingId') ?? '');
  if (!UUID.test(findingId) || !UUID.test(contentId)) return { error: 'ไม่พบรายการ' };
  try {
    const { db, user, ws } = await context(slug);
    const { error } = await db.from('marketing_compliance_findings')
      .update({ resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() })
      .eq('id', findingId).eq('workspace_id', ws.id);
    if (error) throw error;
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/${slug}/content/${contentId}`);
  return { ok: 'บันทึกว่าแก้แล้ว' };
}
