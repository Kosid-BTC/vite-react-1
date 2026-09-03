import { updatePassword } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UpdatePasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = first(params.error);

  const message = error === 'weak_password'
    ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษร'
    : error === 'password_mismatch'
      ? 'รหัสผ่านทั้งสองช่องไม่ตรงกัน'
      : error === 'update_failed'
        ? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาขอลิงก์ Reset Password ใหม่'
        : null;

  return (
    <main className="shell" style={{ maxWidth: 520, paddingTop: 72 }}>
      <section className="card stack" aria-labelledby="update-password-title">
        <header>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 id="update-password-title">ตั้งรหัสผ่านใหม่</h1>
          <p className="muted">กำหนดรหัสผ่านของคุณเอง ระบบจะไม่แสดงหรือจัดเก็บรหัสผ่านในหน้าจอ</p>
        </header>

        {message && (
          <p role="alert" className="muted">
            {message}
          </p>
        )}

        <form action={updatePassword} className="stack">
          <label className="stack" style={{ gap: 6 }}>
            <span>รหัสผ่านใหม่</span>
            <input name="password" type="password" autoComplete="new-password" minLength={12} required />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span>ยืนยันรหัสผ่านใหม่</span>
            <input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required />
          </label>
          <button className="primary" type="submit">บันทึกรหัสผ่านใหม่</button>
        </form>
      </section>
    </main>
  );
}
