'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LoginState = { error?: string; email?: string };

/** ปลายทางหลังล็อกอิน — รับเฉพาะ path ภายใน (กัน open redirect) */
function safeNext(raw: FormDataEntryValue | null) {
  const v = typeof raw === 'string' ? raw : '';
  return v.startsWith('/') && !v.startsWith('//') ? v : '/ceo-ai-thailand/home';
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'กรอกอีเมลและรหัสผ่านให้ครบ', email };

  const db = await createSupabaseServerClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  // Postel: บอกปัญหาที่หน้าเดิม ไม่ล้างอีเมลที่พิมพ์ไว้ · ไม่บอกว่าอีเมลมีอยู่หรือไม่ (กันการเดาบัญชี)
  if (error) return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', email };

  redirect(safeNext(formData.get('next')));
}

export async function logoutAction() {
  const db = await createSupabaseServerClient();
  await db.auth.signOut();
  redirect('/login');
}
