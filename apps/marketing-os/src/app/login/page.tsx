import { signIn, signUp } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const errorMessages: Record<string, string> = {
  missing_credentials: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบ',
  invalid_credentials: 'ยังไม่พบบัญชีนี้ หรือรหัสผ่านไม่ถูกต้อง',
  signup_requirements: 'การสร้างบัญชีต้องใช้อีเมลและรหัสผ่านอย่างน้อย 8 ตัวอักษร',
  account_exists: 'อีเมลนี้มีบัญชีแล้ว กรุณาใช้ปุ่มเข้าสู่ระบบ',
  signup_failed: 'ยังสร้างบัญชีไม่ได้ กรุณาลองอีกครั้ง',
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = first(params.next) ?? '/';
  const error = first(params.error);
  const registered = first(params.registered);

  return (
    <main className="shell" style={{ maxWidth: 520, paddingTop: 72 }}>
      <section className="card stack" aria-labelledby="login-title">
        <header>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 id="login-title">เข้าสู่ระบบ</h1>
          <p className="muted">บัญชีใหม่สามารถสร้างจากหน้านี้ได้ ระบบจะสร้าง Owner Workspace ให้หลังเข้าสู่ระบบครั้งแรก</p>
        </header>

        {registered === 'check_email' && (
          <p role="status" className="badge">สร้างบัญชีแล้ว กรุณาตรวจอีเมลยืนยัน จากนั้นกลับมาเข้าสู่ระบบ</p>
        )}

        {error && (
          <p role="alert" className="muted">{errorMessages[error] ?? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'}</p>
        )}

        <form className="stack">
          <input type="hidden" name="next" value={next} />
          <label className="stack" style={{ gap: 6 }}>
            <span>อีเมล</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span>รหัสผ่าน</span>
            <input name="password" type="password" autoComplete="current-password" minLength={8} required />
          </label>
          <button className="primary" type="submit" formAction={signIn}>เข้าสู่ระบบ</button>
          <button className="secondary" type="submit" formAction={signUp}>สร้างบัญชีใหม่</button>
        </form>
      </section>
    </main>
  );
}
