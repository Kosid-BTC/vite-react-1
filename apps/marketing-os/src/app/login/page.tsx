import { requestPasswordReset, resendConfirmation, signIn } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = first(params.next) ?? '/';
  const error = first(params.error);
  const email = first(params.email) ?? '';
  const confirmation = first(params.confirmation);
  const confirmed = first(params.confirmed);
  const recovery = first(params.recovery);
  const password = first(params.password);

  const message = error === 'missing_credentials'
    ? 'กรุณากรอกอีเมลและรหัสผ่านให้ครบ'
    : error === 'email_not_confirmed'
      ? 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณาส่งอีเมลยืนยันใหม่ด้านล่าง'
      : error === 'missing_email'
        ? 'กรุณากรอกอีเมลก่อนดำเนินการ'
        : error === 'resend_failed'
          ? 'ส่งอีเมลยืนยันใหม่ไม่สำเร็จ กรุณาลองอีกครั้งภายหลัง'
          : error === 'reset_failed'
            ? 'ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้งภายหลัง'
            : error === 'reset_unavailable'
              ? 'ระบบรีเซ็ตรหัสผ่านยังไม่พร้อมในสภาพแวดล้อมนี้'
              : error === 'recovery_session_missing'
                ? 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่'
                : error
                  ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
                  : confirmation === 'sent'
                    ? 'ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมายและกดลิงก์ล่าสุดเท่านั้น'
                    : recovery === 'sent'
                      ? 'หากอีเมลนี้มีบัญชีอยู่ ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว กรุณาใช้ลิงก์ฉบับล่าสุด'
                      : password === 'updated'
                        ? 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
                        : confirmed === '1'
                          ? 'ยืนยันอีเมลแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ'
                          : null;

  return (
    <main className="shell" style={{ maxWidth: 520, paddingTop: 72 }}>
      <section className="card stack" aria-labelledby="login-title">
        <header>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 id="login-title">เข้าสู่ระบบ</h1>
          <p className="muted">ใช้บัญชีที่ได้รับสิทธิ์ใน Workspace ของคุณ</p>
        </header>

        {message && (
          <p role="status" className="muted">
            {message}
          </p>
        )}

        <form action={signIn} className="stack">
          <input type="hidden" name="next" value={next} />
          <label className="stack" style={{ gap: 6 }}>
            <span>อีเมล</span>
            <input name="email" type="email" autoComplete="email" defaultValue={email} required />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <span>รหัสผ่าน</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary" type="submit">เข้าสู่ระบบ</button>
        </form>

        <form action={requestPasswordReset} className="stack" aria-label="รีเซ็ตรหัสผ่าน">
          <label className="stack" style={{ gap: 6 }}>
            <span>ลืมรหัสผ่าน?</span>
            <input name="email" type="email" autoComplete="email" defaultValue={email} placeholder="support@b-tctraining.com" required />
          </label>
          <button type="submit">ส่งลิงก์ Reset Password</button>
          <p className="muted" style={{ margin: 0 }}>
            เพื่อความปลอดภัย ระบบจะไม่สร้างหรือแสดงรหัสผ่านชั่วคราว แต่จะให้คุณตั้งรหัสผ่านใหม่ด้วยลิงก์แบบใช้ครั้งเดียว
          </p>
        </form>

        {(error === 'email_not_confirmed' || confirmation === 'sent' || error === 'resend_failed') && (
          <form action={resendConfirmation} className="stack" aria-label="ส่งอีเมลยืนยันใหม่">
            <input type="hidden" name="next" value={next} />
            <label className="stack" style={{ gap: 6 }}>
              <span>อีเมลสำหรับยืนยัน</span>
              <input name="email" type="email" autoComplete="email" defaultValue={email} required />
            </label>
            <button type="submit">ส่งอีเมลยืนยันใหม่</button>
            <p className="muted" style={{ margin: 0 }}>
              ใช้ลิงก์จากอีเมลฉบับล่าสุดเท่านั้น ลิงก์เก่าอาจหมดอายุหรือถูกใช้ไปแล้ว
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
