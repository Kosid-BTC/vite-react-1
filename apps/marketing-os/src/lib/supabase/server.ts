import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MARKETING_SCHEMA, type Database } from '@/types/database.types';

// ADR-0011: Marketing OS reads schema `marketing_os` on waigsnxhrlwtiotspaim.
// The old project bjozpwdtqbpwcxnqguka is retired — refuse it so a stale env can't silently point back.
const RETIRED_PROJECT_REF = 'bjozpwdtqbpwcxnqguka';

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set (see .env.example)');
  }
  if (url.includes(RETIRED_PROJECT_REF)) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL points at retired project ${RETIRED_PROJECT_REF}; use waigsnxhrlwtiotspaim`);
  }
  return { url, key };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient<Database, typeof MARKETING_SCHEMA>(url, key, {
    db: { schema: MARKETING_SCHEMA },
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
  });
}
