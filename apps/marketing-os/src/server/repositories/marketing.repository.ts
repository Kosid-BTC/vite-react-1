import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database, 'marketing_os'>;

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

  // Service-role reads bypass RLS: every query below MUST keep its workspace_id filter.
  async getBrandRules(workspaceId: string) {
    const { data, error } = await this.db
      .from('marketing_brand_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  }

  async getAudienceSegments(workspaceId: string) {
    const { data, error } = await this.db
      .from('marketing_audience_segments')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  }

  // ข้อ ค — event พฤติกรรมที่ท่อ ingest (ADR-0009/0012) เขียนเข้า marketing_os แล้ว · ไม่ส่ง session_id ออกหน้าจอ
  async getBehaviorEvents(workspaceId: string, limit = 50) {
    const { data, error } = await this.db
      .from('marketing_behavior_events')
      .select('id,occurred_at,source,name,topic,format,mode') // ตรงกับคอลัมน์ที่ 0075 grant (ไม่มี session_id)
      .eq('workspace_id', workspaceId)
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  // ข้อ ข — ผลบนหน้าเว็บ SaaS (public) ผ่าน rpc 0075 ที่ตรวจการเป็นสมาชิกก่อน · ตัวเลขรวมเท่านั้น ไม่มีข้อมูลส่วนบุคคล
  async getSaasFunnelSummary(workspaceId: string, sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
    const { data, error } = await this.db
      .schema('public')
      .rpc('os_member_funnel_summary', { p_workspace: workspaceId, p_since: since });
    if (error) throw error;
    return data ?? [];
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
