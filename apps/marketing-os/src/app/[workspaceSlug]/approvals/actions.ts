'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  workspaceSlug: z.string().min(3).max(64),
  approvalId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  reviewNotes: z.string().max(1200).optional(),
});

export async function reviewApprovalAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('ข้อมูลการอนุมัติไม่ถูกต้อง');

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
    .from('marketing_approval_requests')
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: parsed.data.reviewNotes?.trim() || null,
    })
    .eq('workspace_id', workspace.data.id)
    .eq('id', parsed.data.approvalId)
    .eq('status', 'pending')
    .select('id,content_item_id,status')
    .single();

  if (result.error) throw new Error(result.error.message);

  revalidatePath(`/${parsed.data.workspaceSlug}/approvals`);
  revalidatePath(`/${parsed.data.workspaceSlug}/feature/review-approve`);
  revalidatePath(`/${parsed.data.workspaceSlug}/content/${result.data.content_item_id}`);
}
