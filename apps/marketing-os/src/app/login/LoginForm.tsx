'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="card stack" style={{ maxWidth: 420 }}>
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span className="field-label">อีเมล</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={state.email} />
      </label>
      <label className="field">
        <span className="field-label">รหัสผ่าน</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {state.error && <p className="notice" role="alert">{state.error}</p>}
      <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
      <p className="help">ใช้บัญชีเดียวกับ CEO AI Thailand (ceoaithailand.org)</p>
    </form>
  );
}
