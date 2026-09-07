import type { SupabaseClient } from '@supabase/supabase-js';
import { CONSUMER_FINANCIAL_OUTCOME_KEY_LIST } from '@/server/domain/consumer-financial-evidence';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

export class ConsumerFinancialRepository {
  constructor(private readonly db: Client) {}

  async listTrustedEvidence(params: {
    workspaceId: string;
    businessId: string;
  }): Promise<Database['public']['Tables']['marketing_evidence']['Row'][]> {
    const { data, error } = await this.db
      .from('marketing_evidence')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .eq('business_id', params.businessId)
      .in('outcome_key', [...CONSUMER_FINANCIAL_OUTCOME_KEY_LIST])
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return data ?? [];
  }
}
