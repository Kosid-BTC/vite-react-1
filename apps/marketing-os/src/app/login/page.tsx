import { signIn } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = first(params.next) ?? '/';
  const error = first(params.error);

  return (
    <main className="shell" style={{ maxWidth: 520, paddingTop: 72 }}>
      <section className="card stack" aria-labelledby="login-title">
        <header>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 id="login-title">เข้าสู่ระบบ</h1>
          <p className="muted">ใช้บัญชีที่ได้รับสิทธิ์ใน Workspace ของคุณ</p>
        </header>

        {error && (
          <p role="alert" className="muted">
            {error === 'missing_credentials'
              ? 'กรุณากรอกอีเมลและรหัสผ่านให้ครบ'
              : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'}
          </p>
        )}

        <form action={signIn} className="stack">
          <input type="hidden" name="next" value={next} />
          <label className="stack" style={{ gap: 6 }}>
            <span>อีเมล</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span>รหัสผ่าน</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary" type="submit">เข้าสู่ระบบ</button>
        </form>
      </section>
    </main>
  );
}
