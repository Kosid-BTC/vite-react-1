'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function safeInternalPath(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function credentials(formData: FormData) {
  return {
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
    next: safeInternalPath(formData.get('next')),
  };
}

export async function signIn(formData: FormData) {
  const { email, password, next } = credentials(formData);

  if (!email || !password) {
    redirect(`/login?error=missing_credentials&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(next)}`);
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signUp(formData: FormData) {
  const { email, password, next } = credentials(formData);

  if (!email || password.length < 8) {
    redirect(`/login?error=signup_requirements&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    const code = error.message.toLowerCase().includes('already') ? 'account_exists' : 'signup_failed';
    redirect(`/login?error=${code}&next=${encodeURIComponent(next)}`);
  }

  if (data.session) {
    revalidatePath('/', 'layout');
    redirect(next);
  }

  redirect(`/login?registered=check_email&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
