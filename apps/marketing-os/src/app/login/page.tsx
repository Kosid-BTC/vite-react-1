import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '/ceo-ai-thailand/home';
  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">Marketing OS</p>
        <h1>เข้าสู่ระบบ</h1>
      </header>
      <LoginForm next={safe} />
    </main>
  );
}
