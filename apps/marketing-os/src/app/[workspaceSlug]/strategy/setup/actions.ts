'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const slugCode = z.string().min(2).max(64).regex(/^[a-z0-9][a-z0-9-]*$/, 'code ต้องเป็น a-z, 0-9 และ - เท่านั้น');
const workspaceSlugSchema = z.string().min(3).max(64);
const uuidSchema = z.string().uuid();

async function context(workspaceSlug: string) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/${workspaceSlug}/strategy/setup`)}`);

  const workspace = await db
    .from('workspaces')
    .select('id,slug')
    .eq('slug', workspaceSlug)
    .single();
  if (workspace.error) throw new Error(workspace.error.message);

  return { db, workspace: workspace.data, user };
}

function optional(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function done(workspaceSlug: string) {
  revalidatePath(`/${workspaceSlug}/strategy/setup`);
  revalidatePath(`/${workspaceSlug}/home`);
  revalidatePath(`/${workspaceSlug}/campaigns/new`);
}

export async function createBrandAction(formData: FormData) {
  const parsed = z.object({
    workspaceSlug: workspaceSlugSchema,
    name: z.string().min(2).max(120),
    websiteUrl: z.string().url().optional().or(z.literal('')),
    description: z.string().max(1200).optional(),
    positioning: z.string().max(1200).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Brand ไม่ถูกต้อง');

  const { db, workspace } = await context(parsed.data.workspaceSlug);
  const result = await db.from('marketing_brands').insert({
    workspace_id: workspace.id,
    name: parsed.data.name.trim(),
    website_url: optional(formData.get('websiteUrl')),
    description: optional(formData.get('description')),
    positioning: optional(formData.get('positioning')),
  });
  if (result.error) throw new Error(result.error.message);
  done(parsed.data.workspaceSlug);
}

export async function createAudienceAction(formData: FormData) {
  const parsed = z.object({
    workspaceSlug: workspaceSlugSchema,
    brandId: uuidSchema,
    code: slugCode,
    name: z.string().min(2).max(120),
    description: z.string().max(1200).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Audience ไม่ถูกต้อง');

  const { db, workspace } = await context(parsed.data.workspaceSlug);
  const result = await db.from('marketing_audience_segments').insert({
    workspace_id: workspace.id,
    brand_id: parsed.data.brandId,
    code: parsed.data.code,
    name: parsed.data.name.trim(),
    description: optional(formData.get('description')),
  });
  if (result.error) throw new Error(result.error.message);
  done(parsed.data.workspaceSlug);
}

export async function createMessagePillarAction(formData: FormData) {
  const parsed = z.object({
    workspaceSlug: workspaceSlugSchema,
    brandId: uuidSchema,
    code: slugCode,
    name: z.string().min(2).max(120),
    priority: z.coerce.number().int().min(0).max(100).default(0),
    problem: z.string().max(1200).optional(),
    promise: z.string().max(1200).optional(),
    proof: z.string().max(1200).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Message Pillar ไม่ถูกต้อง');

  const { db, workspace } = await context(parsed.data.workspaceSlug);
  const result = await db.from('marketing_message_pillars').insert({
    workspace_id: workspace.id,
    brand_id: parsed.data.brandId,
    code: parsed.data.code,
    name: parsed.data.name.trim(),
    priority: parsed.data.priority,
    problem: optional(formData.get('problem')),
    promise: optional(formData.get('promise')),
    proof: optional(formData.get('proof')),
  });
  if (result.error) throw new Error(result.error.message);
  done(parsed.data.workspaceSlug);
}

export async function createOfferAction(formData: FormData) {
  const parsed = z.object({
    workspaceSlug: workspaceSlugSchema,
    brandId: uuidSchema,
    code: slugCode,
    name: z.string().min(2).max(120),
    description: z.string().max(1200).optional(),
    offerType: z.string().max(80).optional(),
    destinationUrl: z.string().url().optional().or(z.literal('')),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Offer ไม่ถูกต้อง');

  const { db, workspace } = await context(parsed.data.workspaceSlug);
  const result = await db.from('marketing_offers').insert({
    workspace_id: workspace.id,
    brand_id: parsed.data.brandId,
    code: parsed.data.code,
    name: parsed.data.name.trim(),
    description: optional(formData.get('description')),
    offer_type: optional(formData.get('offerType')),
    destination_url: optional(formData.get('destinationUrl')),
  });
  if (result.error) throw new Error(result.error.message);
  done(parsed.data.workspaceSlug);
}

export async function createCtaAction(formData: FormData) {
  const parsed = z.object({
    workspaceSlug: workspaceSlugSchema,
    brandId: uuidSchema,
    code: slugCode,
    label: z.string().min(2).max(160),
    actionType: z.string().min(2).max(80),
    destinationUrl: z.string().url().optional().or(z.literal('')),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล CTA ไม่ถูกต้อง');

  const { db, workspace } = await context(parsed.data.workspaceSlug);
  const result = await db.from('marketing_ctas').insert({
    workspace_id: workspace.id,
    brand_id: parsed.data.brandId,
    code: parsed.data.code,
    label: parsed.data.label.trim(),
    action_type: parsed.data.actionType.trim(),
    destination_url: optional(formData.get('destinationUrl')),
  });
  if (result.error) throw new Error(result.error.message);
  done(parsed.data.workspaceSlug);
}

export async function createBrandRuleAction(formData: FormData) {
  const parsed = z.object({
    workspaceSlug: workspaceSlugSchema,
    brandId: uuidSchema,
    ruleType: z.string().min(2).max(80),
    severity: z.enum(['info', 'warning', 'blocking']),
    description: z.string().min(4).max(1200),
    pattern: z.string().max(500).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Brand Rule ไม่ถูกต้อง');

  const { db, workspace } = await context(parsed.data.workspaceSlug);
  const result = await db.from('marketing_brand_rules').insert({
    workspace_id: workspace.id,
    brand_id: parsed.data.brandId,
    rule_type: parsed.data.ruleType.trim(),
    severity: parsed.data.severity,
    description: parsed.data.description.trim(),
    pattern: optional(formData.get('pattern')),
  });
  if (result.error) throw new Error(result.error.message);
  done(parsed.data.workspaceSlug);
}
