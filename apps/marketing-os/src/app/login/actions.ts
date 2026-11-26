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

// ADR-0016 (identity ทาง ข): บัญชีอยู่ใน auth.users ของ production ร่วมกับ ceoaithailand.org
// และการเพิ่มสมาชิก workspace ปิดไว้โดยตั้งใจ ⇒ ไม่มีการสมัครจากแอปนี้
// (สมัครที่นี่ = สร้างบัญชีในฐานของ SaaS โดยไม่เห็นข้อมูลอะไรเลย)

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
