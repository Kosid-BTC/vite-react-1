import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOut } from '../login/actions';

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=%2Faccount');

  return (
    <main className="shell" style={{ maxWidth: 720, paddingTop: 72 }}>
      <section className="card stack" aria-labelledby="account-title">
        <header>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 id="account-title">Account</h1>
          <p className="muted">ข้อมูลบัญชีที่ยืนยันจาก Supabase Auth</p>
        </header>

        <dl className="stack" style={{ gap: 6 }}>
          <dt>อีเมล</dt>
          <dd style={{ margin: 0 }}>{user.email ?? 'ไม่พบอีเมลในบัญชีนี้'}</dd>
        </dl>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Account actions">
          <Link href="/">กลับ Dashboard</Link>
          <form action={signOut}>
            <button type="submit" className="secondary">ออกจากระบบ</button>
          </form>
        </nav>
      </section>
    </main>
  );
}
