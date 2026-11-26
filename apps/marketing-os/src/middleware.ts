import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ADR-0016 (identity ทาง ข): ผู้ใช้ล็อกอินด้วยบัญชีใน auth.users ของ production แล้ว RLS ใน marketing_os
// บังคับเส้นแบ่ง workspace เอง ⇒ middleware มีหน้าที่แค่ ① ต่ออายุ session ② พาคนที่ยังไม่ล็อกอินไป /login
const RETIRED_PROJECT_REF = 'bjozpwdtqbpwcxnqguka';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes(RETIRED_PROJECT_REF)) {
    return new NextResponse('Supabase env ไม่ถูกต้อง (ดู .env.example) — ห้ามชี้ project เดิม', { status: 500 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() ตรวจกับ Auth server จริง (ไม่เชื่อ cookie เปล่า ๆ)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && !pathname.startsWith('/login')) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
