'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function safeInternalPath(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'https';
  if (!host) return null;
  return `${proto}://${host}`;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeInternalPath(formData.get('next'));

  if (!email || !password) {
    redirect(`/login?error=missing_credentials&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const code = error.code === 'email_not_confirmed' ? 'email_not_confirmed' : 'invalid_credentials';
    redirect(`/login?error=${code}&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const next = safeInternalPath(formData.get('next'));

  if (!email) {
    redirect(`/login?error=missing_email&next=${encodeURIComponent(next)}`);
  }

  const origin = await requestOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: origin
      ? { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/login?confirmed=1')}` }
      : undefined,
  });

  if (error) {
    redirect(`/login?error=resend_failed&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  }

  redirect(`/login?confirmation=sent&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    redirect('/login?error=missing_email');
  }

  const origin = await requestOrigin();
  if (!origin) {
    redirect(`/login?error=reset_unavailable&email=${encodeURIComponent(email)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/account/update-password')}`,
  });

  if (error) {
    redirect(`/login?error=reset_failed&email=${encodeURIComponent(email)}`);
  }

  // Do not reveal whether the account exists.
  redirect(`/login?recovery=sent&email=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
