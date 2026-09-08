'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  workspaceSlug: z.string().min(3).max(64),
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional().or(z.literal('')),
  audienceSegmentId: z.string().uuid().optional().or(z.literal('')),
  messagePillarId: z.string().uuid().optional().or(z.literal('')),
  offerId: z.string().uuid().optional().or(z.literal('')),
  ctaId: z.string().uuid().optional().or(z.literal('')),
  title: z.string().min(3).max(180),
  contentType: z.enum(['short_video', 'long_video', 'image', 'carousel', 'post', 'article', 'email', 'ad']),
  funnelStage: z.enum(['awareness', 'consideration', 'intent', 'conversion', 'retention']).optional().or(z.literal('')),
  primaryChannel: z.string().max(80).optional(),
});

export async function createContentAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Content ไม่ครบหรือรูปแบบไม่ถูกต้อง');

  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  const workspace = await db
    .from('workspaces')
    .select('id,slug')
    .eq('slug', parsed.data.workspaceSlug)
    .single();
  if (workspace.error) throw new Error(workspace.error.message);

  const result = await db
    .from('marketing_content_items')
    .insert({
      workspace_id: workspace.data.id,
      brand_id: parsed.data.brandId,
      campaign_id: parsed.data.campaignId || null,
      audience_segment_id: parsed.data.audienceSegmentId || null,
      message_pillar_id: parsed.data.messagePillarId || null,
      offer_id: parsed.data.offerId || null,
      cta_id: parsed.data.ctaId || null,
      title: parsed.data.title.trim(),
      content_type: parsed.data.contentType,
      funnel_stage: parsed.data.funnelStage || null,
      primary_channel: parsed.data.primaryChannel?.trim() || null,
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single();
  if (result.error) throw new Error(result.error.message);

  redirect(`/${parsed.data.workspaceSlug}/content/${result.data.id}`);
}
