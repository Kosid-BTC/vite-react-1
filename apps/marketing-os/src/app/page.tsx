import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOut } from './login/actions';

export default async function IndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('slug,name')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (workspace?.slug) redirect(`/${workspace.slug}/home`);

  return (
    <main className="shell" style={{ maxWidth: 720, paddingTop: 72 }}>
      <section className="card stack">
        <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
        <h1>ยังไม่พบ Workspace</h1>
        <p className="muted">บัญชีนี้เข้าสู่ระบบแล้ว แต่ยังไม่ได้รับสิทธิ์ใน Workspace ใด</p>
        <form action={signOut}>
          <button type="submit" className="secondary">ออกจากระบบ</button>
        </form>
      </section>
    </main>
  );
}
