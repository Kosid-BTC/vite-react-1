import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://bjozpwdtqbpwcxnqguka.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqb3pwd2R0cWJwd2N4bnFndWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDk1MDAsImV4cCI6MjEwMjY4NTUwMH0.Peq5vB5N5kgYIg68QVhJ8VvRr2mo9xEoZ5BqA6_Gp5U';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
