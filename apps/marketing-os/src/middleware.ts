import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/login', '/auth/confirm']);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const visualQaToken = request.nextUrl.searchParams.get('visualQa');
  const expectedVisualQaSha = process.env.VISUAL_QA_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  const isPreviewVisualQaPath =
    pathname.endsWith('/home') ||
    pathname.includes('/feature/') ||
    pathname.includes('/campaigns') ||
    pathname.endsWith('/content/new') ||
    pathname.endsWith('/approvals');
  const isPreviewVisualQa =
    process.env.VERCEL_ENV === 'preview' &&
    isPreviewVisualQaPath &&
    Boolean(expectedVisualQaSha) &&
    visualQaToken === expectedVisualQaSha;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Missing public configuration must never crash Edge Middleware. Public routes
  // remain renderable, while protected Production routes fail closed at /login.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('MARKETING_OS_AUTH_CONFIG=UNAVAILABLE');
    if (PUBLIC_PATHS.has(pathname) || isPreviewVisualQa) return response;

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('error', 'configuration_unavailable');
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  // Preview visual QA may bypass user auth only when the request proves the exact
  // deployed commit SHA and remains inside the explicitly allowlisted deterministic
  // QA routes. Production auth behavior is unchanged because VERCEL_ENV must be "preview".
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
