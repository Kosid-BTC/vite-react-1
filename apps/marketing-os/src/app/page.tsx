import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOut } from './login/actions';

function NoWorkspace() {
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

export default async function IndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) redirect('/login');

  // Resolve only workspaces explicitly owned by or assigned to this user.
  // Never choose the oldest/first workspace from the database.
  const [membershipResult, ownedResult] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id),
    supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id),
  ]);

  if (membershipResult.error) throw membershipResult.error;
  if (ownedResult.error) throw ownedResult.error;

  const workspaceIds = Array.from(new Set([
    ...(membershipResult.data ?? []).map((membership) => membership.workspace_id),
    ...(ownedResult.data ?? []).map((workspace) => workspace.id),
  ]));

  if (workspaceIds.length === 0) return <NoWorkspace />;

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id,slug,name')
    .in('id', workspaceIds)
    .order('name', { ascending: true });

  if (workspaceError) throw workspaceError;

  const accessibleWorkspaces = workspaces ?? [];

  // A single explicit membership is unambiguous. Multiple memberships require
  // a user choice; ordering is presentation-only and never selects a tenant.
  if (accessibleWorkspaces.length === 1) {
    redirect(`/${accessibleWorkspaces[0].slug}/home`);
  }

  if (accessibleWorkspaces.length > 1) {
    return (
      <main className="shell" style={{ maxWidth: 720, paddingTop: 72 }}>
        <section className="card stack">
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1>เลือก Workspace</h1>
          <p className="muted">บัญชีนี้มีสิทธิ์เข้าถึงหลาย Workspace กรุณาเลือก Workspace ที่ต้องการเปิด</p>
          <ul>
            {accessibleWorkspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link href={`/${workspace.slug}/home`}>{workspace.name}</Link>
              </li>
            ))}
          </ul>
          <form action={signOut}>
            <button type="submit" className="secondary">ออกจากระบบ</button>
          </form>
        </section>
      </main>
    );
  }

  return <NoWorkspace />;
}
