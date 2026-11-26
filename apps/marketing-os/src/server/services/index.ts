import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MarketingRepository } from '@/server/repositories/marketing.repository';
import { MarketingService } from '@/server/services/marketing.service';

// ADR-0016 (identity ทาง ข): อ่านในนามผู้ใช้ที่ล็อกอิน (anon key + cookie) บน schema marketing_os
// ⇒ RLS ในฐานบังคับเส้นแบ่ง workspace เอง · แอปไม่ถือ service key อีกต่อไป
export async function getMarketingRepository() {
  return new MarketingRepository(await createSupabaseServerClient());
}

export async function getMarketingService() {
  return new MarketingService(await getMarketingRepository());
}
