import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/login', '/auth/confirm']);
const VISUAL_QA_PREFIX = '/visual-qa/';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Visual-QA pages contain no customer data and are rendered from safe fixture data.
  // The route itself returns notFound() in production; bypassing auth here lets CI
  // screenshot the exact presentational component without requiring user credentials.
  if (pathname.startsWith(VISUAL_QA_PREFIX)) {
    return NextResponse.next({ request });
  }

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

  if (!user && !PUBLIC_PATHS.has(pathname)) {
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
