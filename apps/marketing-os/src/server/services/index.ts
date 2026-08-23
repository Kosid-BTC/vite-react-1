import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MarketingRepository } from '@/server/repositories/marketing.repository';
import { MarketingService } from '@/server/services/marketing.service';

export async function getMarketingService() {
  const db = await createSupabaseServerClient();
  return new MarketingService(new MarketingRepository(db));
}
