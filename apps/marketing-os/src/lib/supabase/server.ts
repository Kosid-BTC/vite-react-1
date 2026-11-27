import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA?.trim() || 'marketing_os';
  if (schema !== 'marketing_os') {
    throw new Error('MARKETING_OS_SCHEMA_MISMATCH');
  }

  // Schema-specific Database types must be generated from the target schema
  // before strict table inference can be restored.
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot always mutate cookies. Middleware/route handlers refresh sessions.
          }
        },
      },
    },
  );
}
