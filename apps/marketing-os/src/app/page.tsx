import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOut } from './login/actions';

export default async function IndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id,slug,name')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (workspace?.slug) redirect(`/${workspace.slug}/home`);

  const { data: workspaceId, error: createError } = await supabase.rpc('create_workspace', {
    p_name: 'CEO AI Thailand',
  });

  if (!createError && workspaceId) {
    await supabase.rpc('seed_ceo_ai_marketing_strategy', { p_workspace: workspaceId });
    const { data: createdWorkspace } = await supabase
      .from('workspaces')
      .select('slug')
      .eq('id', workspaceId)
      .single();

    if (createdWorkspace?.slug) redirect(`/${createdWorkspace.slug}/home`);
  }

  return (
    <main className="shell" style={{ maxWidth: 720, paddingTop: 72 }}>
      <section className="card stack">
        <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
        <h1>กำลังเตรียม Workspace</h1>
        <p className="muted">เข้าสู่ระบบสำเร็จแล้ว แต่ยังสร้าง Owner Workspace ไม่สำเร็จ กรุณาลองออกและเข้าสู่ระบบใหม่อีกครั้ง</p>
        <form action={signOut}>
          <button type="submit" className="secondary">ออกจากระบบ</button>
        </form>
      </section>
    </main>
  );
}
