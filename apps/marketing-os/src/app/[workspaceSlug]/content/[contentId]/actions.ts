'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  workspaceSlug: z.string().min(3).max(64),
  contentId: z.string().uuid(),
});

const manualVersionSchema = requestSchema.extend({
  hook: z.string().max(500).optional(),
  body: z.string().max(10000).optional(),
  caption: z.string().max(5000).optional(),
}).refine((value) => Boolean(value.hook?.trim() || value.body?.trim() || value.caption?.trim()), {
  message: 'ต้องกรอก Hook, Body หรือ Caption อย่างน้อยหนึ่งช่อง',
});

const trackingSchema = requestSchema.extend({
  destinationUrl: z.string().url(),
  utmSource: z.string().min(1).max(120),
  utmMedium: z.string().min(1).max(120),
  utmCampaign: z.string().min(1).max(160),
  utmContent: z.string().max(160).optional(),
  utmTerm: z.string().max(160).optional(),
  segmentCode: z.string().min(1).max(120),
});

async function getContext(workspaceSlug: string) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  const workspace = await db.from('workspaces').select('id,slug').eq('slug', workspaceSlug).single();
  if (workspace.error) throw new Error(workspace.error.message);
  return { db, user, workspace: workspace.data };
}

export async function createManualContentVersionAction(formData: FormData) {
  const parsed = manualVersionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Content Version ไม่ถูกต้อง');

  const { db, user, workspace } = await getContext(parsed.data.workspaceSlug);
  const content = await db
    .from('marketing_content_items')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('id', parsed.data.contentId)
    .single();
  if (content.error) throw new Error(content.error.message);

  const latest = await db
    .from('marketing_content_versions')
    .select('version_number')
    .eq('workspace_id', workspace.id)
    .eq('content_item_id', parsed.data.contentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw new Error(latest.error.message);

  const inserted = await db.from('marketing_content_versions').insert({
    workspace_id: workspace.id,
    content_item_id: parsed.data.contentId,
    version_number: (latest.data?.version_number ?? 0) + 1,
    hook: parsed.data.hook?.trim() || null,
    body: parsed.data.body?.trim() || null,
    caption: parsed.data.caption?.trim() || null,
    created_by: user.id,
  });
  if (inserted.error) throw new Error(inserted.error.message);

  revalidatePath(`/${parsed.data.workspaceSlug}/content/${parsed.data.contentId}`);
  revalidatePath(`/${parsed.data.workspaceSlug}/feature/content-items`);
}

export async function requestApprovalAction(formData: FormData) {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูลคำขออนุมัติไม่ถูกต้อง');

  const { db, user, workspace } = await getContext(parsed.data.workspaceSlug);
  const content = await db
    .from('marketing_content_items')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('id', parsed.data.contentId)
    .single();
  if (content.error) throw new Error(content.error.message);

  const existing = await db
    .from('marketing_approval_requests')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('content_item_id', parsed.data.contentId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  if (!existing.data) {
    const latestVersion = await db
      .from('marketing_content_versions')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('content_item_id', parsed.data.contentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestVersion.error) throw new Error(latestVersion.error.message);

    const inserted = await db.from('marketing_approval_requests').insert({
      workspace_id: workspace.id,
      content_item_id: parsed.data.contentId,
      content_version_id: latestVersion.data?.id ?? null,
      status: 'pending',
      requested_by: user.id,
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }

  revalidatePath(`/${parsed.data.workspaceSlug}/content/${parsed.data.contentId}`);
  revalidatePath(`/${parsed.data.workspaceSlug}/approvals`);
}

export async function createTrackingLinkAction(formData: FormData) {
  const parsed = trackingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Tracking Link ไม่ถูกต้อง');

  const { db, user, workspace } = await getContext(parsed.data.workspaceSlug);
  const content = await db
    .from('marketing_content_items')
    .select('id,campaign_id,audience_segment_id,message_pillar_id,offer_id,cta_id')
    .eq('workspace_id', workspace.id)
    .eq('id', parsed.data.contentId)
    .single();
  if (content.error) throw new Error(content.error.message);

  const latestVersion = await db
    .from('marketing_content_versions')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('content_item_id', parsed.data.contentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestVersion.error) throw new Error(latestVersion.error.message);

  const url = new URL(parsed.data.destinationUrl);
  url.searchParams.set('utm_source', parsed.data.utmSource);
  url.searchParams.set('utm_medium', parsed.data.utmMedium);
  url.searchParams.set('utm_campaign', parsed.data.utmCampaign);
  if (parsed.data.utmContent?.trim()) url.searchParams.set('utm_content', parsed.data.utmContent.trim());
  if (parsed.data.utmTerm?.trim()) url.searchParams.set('utm_term', parsed.data.utmTerm.trim());
  url.searchParams.set('seg', parsed.data.segmentCode);

  const inserted = await db.from('marketing_tracking_links').insert({
    workspace_id: workspace.id,
    campaign_id: content.data.campaign_id,
    content_item_id: parsed.data.contentId,
    content_version_id: latestVersion.data?.id ?? null,
    audience_segment_id: content.data.audience_segment_id,
    message_pillar_id: content.data.message_pillar_id,
    offer_id: content.data.offer_id,
    cta_id: content.data.cta_id,
    destination_url: parsed.data.destinationUrl,
    utm_source: parsed.data.utmSource,
    utm_medium: parsed.data.utmMedium,
    utm_campaign: parsed.data.utmCampaign,
    utm_content: parsed.data.utmContent?.trim() || null,
    utm_term: parsed.data.utmTerm?.trim() || null,
    segment_code: parsed.data.segmentCode,
    final_url: url.toString(),
    created_by: user.id,
  });
  if (inserted.error) throw new Error(inserted.error.message);

  revalidatePath(`/${parsed.data.workspaceSlug}/content/${parsed.data.contentId}`);
  revalidatePath(`/${parsed.data.workspaceSlug}/feature/utm-tracking`);
}
