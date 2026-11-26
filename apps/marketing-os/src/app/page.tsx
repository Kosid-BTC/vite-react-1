import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOut } from './login/actions';

// ADR-0016 (identity ทาง ข): workspace + สมาชิกถูกกำหนดในฐาน (RLS อิงการเป็นสมาชิก)
// แอปไม่สร้าง workspace เอง — rpc create_workspace ไม่มีใน schema marketing_os และการเพิ่มสมาชิกปิดไว้โดยตั้งใจ
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

  return (
    <main className="shell" style={{ maxWidth: 720, paddingTop: 72 }}>
      <section className="card stack">
        <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
        <h1>บัญชีนี้ยังไม่ได้อยู่ใน workspace การตลาด</h1>
        <p className="muted">
          เข้าสู่ระบบสำเร็จแล้ว แต่บัญชีนี้ยังไม่ใช่สมาชิกของ workspace ใด — การเพิ่มสมาชิกต้องทำโดยผู้ดูแลระบบ
        </p>
        <form action={signOut}>
          <button type="submit" className="secondary">ออกจากระบบ</button>
        </form>
      </section>
    </main>
  );
}
