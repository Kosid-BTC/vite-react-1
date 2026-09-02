'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MarketingRepository } from '@/server/repositories/marketing.repository';
import { MarketingService } from '@/server/services/marketing.service';

const schema = z.object({
  workspaceSlug: z.string().min(3).max(64),
  name: z.string().min(3).max(120),
  objective: z.enum(['awareness','interest','first_customer','sales']),
  brandId: z.string().uuid(),
  audienceSegmentId: z.string().uuid(),
  messagePillarId: z.string().uuid().optional().or(z.literal('')),
  offerId: z.string().uuid().optional().or(z.literal('')),
  ctaId: z.string().uuid(),
  hypothesis: z.string().min(12).max(1200),
  expectedSignal: z.string().max(600).optional(),
  decisionRule: z.string().max(600).optional(),
});

export async function createCampaignAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูล Campaign ไม่ครบหรือรูปแบบไม่ถูกต้อง');

  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  const service = new MarketingService(new MarketingRepository(db));
  const campaign = await service.createCampaign({
    workspaceSlug: parsed.data.workspaceSlug,
    userId: user.id,
    name: parsed.data.name,
    objective: parsed.data.objective,
    brandId: parsed.data.brandId,
    audienceSegmentId: parsed.data.audienceSegmentId,
    messagePillarId: parsed.data.messagePillarId || undefined,
    offerId: parsed.data.offerId || undefined,
    ctaId: parsed.data.ctaId,
    hypothesis: parsed.data.hypothesis,
    expectedSignal: parsed.data.expectedSignal,
    decisionRule: parsed.data.decisionRule,
  });

  redirect(`/${parsed.data.workspaceSlug}/campaigns/${campaign.id}`);
}
