import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loginActions = read('src/app/login/actions.ts');
const loginPage = read('src/app/login/page.tsx');
const confirmRoute = read('src/app/auth/confirm/route.ts');
const updatePasswordActions = read('src/app/account/update-password/actions.ts');
const middleware = read('src/middleware.ts');

const checks = [
  ['reset request uses Supabase recovery API', loginActions.includes('resetPasswordForEmail')],
  ['reset redirect targets auth callback', loginActions.includes('/auth/confirm?next=')],
  ['reset redirect ultimately targets update-password page', loginActions.includes('/account/update-password')],
  ['reset response is account-enumeration safe', loginActions.includes('Do not reveal whether the account exists')],
  ['login UI exposes Reset Password action', loginPage.includes('ส่งลิงก์ Reset Password')],
  ['login UI does not display a temporary password', loginPage.includes('ระบบจะไม่สร้างหรือแสดงรหัสผ่านชั่วคราว')],
  ['auth callback supports PKCE code exchange', confirmRoute.includes('exchangeCodeForSession(code)')],
  ['auth callback supports token-hash OTP verification', confirmRoute.includes('verifyOtp({ token_hash: tokenHash, type })')],
  ['auth callback rejects external next URLs', confirmRoute.includes("value.startsWith('//')")],
  ['password update requires at least 12 characters', updatePasswordActions.includes('password.length < 12')],
  ['password update requires confirmation match', updatePasswordActions.includes('password !== confirmPassword')],
  ['password update requires an authenticated recovery session', updatePasswordActions.includes('supabase.auth.getUser()')],
  ['password update calls Supabase updateUser', updatePasswordActions.includes('supabase.auth.updateUser({ password })')],
  ['successful password update signs out before next login', updatePasswordActions.includes('supabase.auth.signOut()')],
  ['auth callback is public through middleware', middleware.includes("'/auth/confirm'")],
  ['update-password page is not public through middleware', !middleware.includes("'/account/update-password'")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}

if (failed.length > 0) {
  console.error(`AUTH_RECOVERY_CONTRACT = FAIL (${failed.length} checks failed)`);
  process.exit(1);
}

console.log('AUTH_RECOVERY_CONTRACT = VERIFIED PASS');
