import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/login', '/auth/confirm']);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() verifies the session with Supabase Auth and also refreshes stale cookies.
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const visualQaToken = request.nextUrl.searchParams.get('visualQa');
  const expectedVisualQaSha = process.env.VISUAL_QA_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  const isPreviewVisualQaPath = pathname.endsWith('/home') || pathname.includes('/feature/');
  const isPreviewVisualQa =
    process.env.VERCEL_ENV === 'preview' &&
    isPreviewVisualQaPath &&
    Boolean(expectedVisualQaSha) &&
    visualQaToken === expectedVisualQaSha;

  // Preview visual QA may bypass user auth only when the request proves the exact
  // deployed commit SHA and remains inside the deterministic QA home/feature routes.
  // Production auth behavior is unchanged because VERCEL_ENV must be "preview".
  if (!user && !PUBLIC_PATHS.has(pathname) && !isPreviewVisualQa) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.search = '';
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
