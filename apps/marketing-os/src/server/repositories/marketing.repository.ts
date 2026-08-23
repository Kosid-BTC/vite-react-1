import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

export class MarketingRepository {
  constructor(private readonly db: Client) {}

  async getWorkspaceBySlug(slug: string) {
    const { data, error } = await this.db
      .from('workspaces')
      .select('id,name,owner_id,slug')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  }

  async getStrategyOptions(workspaceId: string) {
    const [brands, audiences, pillars, offers, ctas] = await Promise.all([
      this.db.from('marketing_brands').select('*').eq('workspace_id', workspaceId).limit(10),
      this.db.from('marketing_audience_segments').select('*').eq('workspace_id', workspaceId).eq('active', true).order('created_at'),
      this.db.from('marketing_message_pillars').select('*').eq('workspace_id', workspaceId).eq('active', true).order('priority', { ascending: false }),
      this.db.from('marketing_offers').select('*').eq('workspace_id', workspaceId).eq('active', true).order('created_at'),
      this.db.from('marketing_ctas').select('*').eq('workspace_id', workspaceId).eq('active', true).order('created_at'),
    ]);

    for (const result of [brands, audiences, pillars, offers, ctas]) {
      if (result.error) throw result.error;
    }

    return {
      brands: brands.data ?? [],
      audiences: audiences.data ?? [],
      pillars: pillars.data ?? [],
      offers: offers.data ?? [],
      ctas: ctas.data ?? [],
    };
  }

  async createCampaign(input: Database['public']['Tables']['marketing_campaigns']['Insert']) {
    const { data, error } = await this.db
      .from('marketing_campaigns')
      .insert(input)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async createHypothesis(input: Database['public']['Tables']['marketing_campaign_hypotheses']['Insert']) {
    const { data, error } = await this.db
      .from('marketing_campaign_hypotheses')
      .insert(input)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async getOpenActions(workspaceId: string) {
    const { data, error } = await this.db
      .from('marketing_action_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'open')
      .order('priority', { ascending: false })
      .limit(3);
    if (error) throw error;
    return data ?? [];
  }

  async getContentDetail(workspaceId: string, contentId: string) {
    const content = await this.db
      .from('marketing_content_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', contentId)
      .single();
    if (content.error) throw content.error;

    const [versions, assets, findings, approvals, tracking] = await Promise.all([
      this.db.from('marketing_content_versions').select('*').eq('workspace_id', workspaceId).eq('content_item_id', contentId).order('version_number', { ascending: false }),
      this.db.from('marketing_content_assets').select('*').eq('workspace_id', workspaceId).eq('content_item_id', contentId).order('created_at', { ascending: false }),
      this.db.from('marketing_compliance_findings').select('*').eq('workspace_id', workspaceId).eq('content_item_id', contentId).order('created_at', { ascending: false }),
      this.db.from('marketing_approval_requests').select('*').eq('workspace_id', workspaceId).eq('content_item_id', contentId).order('created_at', { ascending: false }),
      this.db.from('marketing_tracking_links').select('*').eq('workspace_id', workspaceId).eq('content_item_id', contentId).order('created_at', { ascending: false }),
    ]);

    for (const result of [versions, assets, findings, approvals, tracking]) {
      if (result.error) throw result.error;
    }

    return {
      content: content.data,
      versions: versions.data ?? [],
      assets: assets.data ?? [],
      findings: findings.data ?? [],
      approvals: approvals.data ?? [],
      tracking: tracking.data ?? [],
    };
  }
}
