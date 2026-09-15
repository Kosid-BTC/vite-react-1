import Image from 'next/image';
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
    : error === 'configuration_unavailable'
      ? 'ระบบยืนยันตัวตนยังไม่พร้อม กรุณาลองใหม่อีกครั้งภายหลัง'
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
    <main className="approved-login-shell">
      <section className="approved-login-panel" aria-labelledby="login-title">
        <div className="approved-login-brand">
          <Image src="/ceo-ai-reference-logo.svg" alt="CEO AI Thailand" width={162} height={64} priority />
          <span className="approved-login-badge">Marketing OS</span>
        </div>

        <div className="approved-login-copy">
          <p className="approved-login-kicker">CEO AI THAILAND · MARKETING OPERATING SYSTEM</p>
          <h1 id="login-title">เข้าสู่ระบบ</h1>
          <p>จัดการ Strategy, Content, Distribution, Analytics และ AI Recommendations จาก Workspace เดียว</p>
        </div>

        {message && <p role="status" className="approved-login-status">{message}</p>}

        <form action={signIn} className="approved-login-form">
          <input type="hidden" name="next" value={next} />
          <label>
            <span>อีเมล</span>
            <input name="email" type="email" autoComplete="email" defaultValue={email} placeholder="you@company.com" required />
          </label>
          <label>
            <span>รหัสผ่าน</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="approved-login-primary" type="submit">เข้าสู่ระบบ →</button>
        </form>

        <div className="approved-login-assist">
          <form action={requestPasswordReset}>
            <input name="email" type="email" autoComplete="email" defaultValue={email} placeholder="อีเมลสำหรับ Reset Password" required />
            <button type="submit">ส่งลิงก์ Reset Password</button>
          </form>
          <p>ระบบจะไม่สร้างหรือแสดงรหัสผ่านชั่วคราว และใช้ลิงก์รีเซ็ตแบบใช้ครั้งเดียว</p>
        </div>

        {(error === 'email_not_confirmed' || confirmation === 'sent' || error === 'resend_failed') && (
          <form action={resendConfirmation} className="approved-login-resend" aria-label="ส่งอีเมลยืนยันใหม่">
            <input type="hidden" name="next" value={next} />
            <input name="email" type="email" autoComplete="email" defaultValue={email} placeholder="อีเมลสำหรับยืนยัน" required />
            <button type="submit">ส่งอีเมลยืนยันใหม่</button>
          </form>
        )}

        <footer className="approved-login-footer">
          <span>CEO AI Thailand</span>
          <span>Production access · Secure workspace</span>
        </footer>
      </section>

      <aside className="approved-login-preview" aria-label="Approved Marketing OS dashboard preview">
        <div className="login-preview-topbar">
          <span className="login-preview-search">⌕ ค้นหาแคมเปญ, คอนเทนต์, หรือสิ่งที่ต้องการ...</span>
          <span className="login-preview-pill">AI Insight</span>
          <span className="login-preview-avatar">TC</span>
        </div>
        <div className="login-preview-heading">
          <div>
            <strong>CEO AI Thailand</strong>
            <span>Marketing OS</span>
          </div>
          <span className="login-preview-cta">+ สร้างแคมเปญใหม่</span>
        </div>
        <div className="login-preview-connections">
          <span>● Website · UNVERIFIED</span>
          <span>● Facebook · UNVERIFIED</span>
          <span>● YouTube · UNVERIFIED</span>
          <span>● Business Genome · UNAVAILABLE</span>
        </div>
        <div className="login-preview-kpis">
          {['Impressions','Reach','Video Views','CTR (All)','Conversions','Revenue'].map((label) => (
            <div key={label}><span>{label}</span><strong>—</strong><small>UNAVAILABLE</small></div>
          ))}
        </div>
        <div className="login-preview-grid">
          <div className="login-preview-card login-preview-performance">
            <div className="login-preview-card-head"><strong>Performance Overview</strong><span>30 วันล่าสุด</span></div>
            <div className="login-preview-chart"><span>Measurement data unavailable</span></div>
          </div>
          <div className="login-preview-card">
            <div className="login-preview-card-head"><strong>AI Recommendations</strong><span>Evidence first</span></div>
            <div className="login-preview-lines"><i/><i/><i/></div>
          </div>
          <div className="login-preview-card">
            <div className="login-preview-card-head"><strong>Business Genome</strong><span>UNAVAILABLE</span></div>
            <div className="login-preview-genome">DNA</div>
          </div>
          <div className="login-preview-card">
            <div className="login-preview-card-head"><strong>MIT 24 Steps</strong><span>— / 24</span></div>
            <div className="login-preview-lines"><i/><i/><i/><i/></div>
          </div>
        </div>
        <p className="login-preview-note">Approved UX/UI V4 · ตัวเลขจะแสดงเมื่อมีหลักฐานจริงเท่านั้น</p>
      </aside>
    </main>
  );
}
