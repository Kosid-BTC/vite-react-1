'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (password.length < 12) {
    redirect('/account/update-password?error=weak_password');
  }

  if (password !== confirmPassword) {
    redirect('/account/update-password?error=password_mismatch');
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=recovery_session_missing');
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect('/account/update-password?error=update_failed');
  }

  await supabase.auth.signOut();
  redirect('/login?password=updated');
}
