// Generated-style contract for Phase 1. Regenerate from Supabase after applying migrations:
// npm run db:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type WSRow = { id: string; name: string; owner_id: string; created_at: string };
type MemberRow = { workspace_id: string; user_id: string; role: 'owner'|'admin'|'editor'|'reviewer'|'viewer'; created_at: string };
type BrandRow = { id:string; workspace_id:string; name:string; website_url:string|null; description:string|null; positioning:string|null; voice:Json; created_at:string; updated_at:string };
type AudienceRow = { id:string; workspace_id:string; brand_id:string; code:string; name:string; description:string|null; jobs_to_be_done:Json; pains:Json; anxieties:Json; desired_outcomes:Json; buying_triggers:Json; objections:Json; search_intents:Json; evidence_status:'hypothesis'|'research'|'observed'|'validated'; evidence:Json; active:boolean; created_at:string; updated_at:string };
type PillarRow = { id:string; workspace_id:string; brand_id:string; code:string; name:string; problem:string|null; promise:string|null; proof:string|null; priority:number; active:boolean; created_at:string };
type OfferRow = { id:string; workspace_id:string; brand_id:string; code:string; name:string; description:string|null; offer_type:string|null; destination_url:string|null; active:boolean; created_at:string };
type CtaRow = { id:string; workspace_id:string; brand_id:string; code:string; label:string; action_type:string; destination_url:string|null; active:boolean; created_at:string };
type CampaignRow = { id:string; workspace_id:string; brand_id:string; name:string; objective:'awareness'|'interest'|'first_customer'|'sales'; audience_segment_id:string|null; message_pillar_id:string|null; offer_id:string|null; cta_id:string|null; status:string; starts_at:string|null; ends_at:string|null; created_by:string; created_at:string; updated_at:string };
type HypothesisRow = { id:string; workspace_id:string; campaign_id:string; hypothesis:string; expected_signal:string|null; decision_rule:string|null; evidence_status:'hypothesis'|'research'|'observed'|'validated'; created_at:string };
type ContentRow = { id:string; workspace_id:string; brand_id:string; campaign_id:string|null; audience_segment_id:string|null; message_pillar_id:string|null; offer_id:string|null; cta_id:string|null; title:string; content_type:string; funnel_stage:string|null; primary_channel:string|null; status:string; created_by:string; created_at:string; updated_at:string };
type VersionRow = { id:string; workspace_id:string; content_item_id:string; version_number:number; hook:string|null; body:string|null; caption:string|null; script:Json|null; creative_brief:Json|null; prompt_version:string|null; model_provider:string|null; model_name:string|null; created_by:string|null; created_at:string };
type JobRow = { id:string; workspace_id:string; content_item_id:string|null; job_type:'text.generate'|'image.generate'|'compliance.check'; provider:string; model_name:string|null; status:string; progress:number; input:Json; output:Json|null; idempotency_key:string; attempt_count:number; max_attempts:number; error_code:string|null; error_message:string|null; created_by:string|null; created_at:string; started_at:string|null; completed_at:string|null };
type AssetRow = { id:string; workspace_id:string; content_item_id:string; content_version_id:string|null; generation_job_id:string|null; asset_type:string; storage_bucket:string; storage_path:string; mime_type:string|null; width:number|null; height:number|null; duration_ms:number|null; provider:string|null; provider_asset_id:string|null; metadata:Json; created_at:string };
type FindingRow = { id:string; workspace_id:string; content_item_id:string; brand_rule_id:string|null; severity:'info'|'warning'|'blocking'; finding:string; suggested_fix:string|null; resolved:boolean; resolved_by:string|null; resolved_at:string|null; created_at:string };
type ApprovalRow = { id:string; workspace_id:string; content_item_id:string; content_version_id:string|null; status:'pending'|'approved'|'rejected'|'changes_requested'; requested_by:string; reviewed_by:string|null; review_notes:string|null; created_at:string; reviewed_at:string|null };
type TrackingRow = { id:string; workspace_id:string; campaign_id:string|null; content_item_id:string|null; destination_url:string; short_code:string|null; utm_source:string; utm_medium:string; utm_campaign:string; utm_content:string|null; utm_term:string|null; segment_code:string; final_url:string; created_by:string; created_at:string };
type ActionRow = { id:string; workspace_id:string; action_type:string; title:string; description:string|null; priority:number; entity_type:string|null; entity_id:string|null; action_href:string|null; status:'open'|'done'|'dismissed'; due_at:string|null; created_at:string; completed_at:string|null };

export type Database = {
  public: {
    Tables: {
      workspaces: Table<WSRow>;
      workspace_members: Table<MemberRow>;
      marketing_brands: Table<BrandRow>;
      marketing_audience_segments: Table<AudienceRow>;
      marketing_message_pillars: Table<PillarRow>;
      marketing_offers: Table<OfferRow>;
      marketing_ctas: Table<CtaRow>;
      marketing_campaigns: Table<CampaignRow>;
      marketing_campaign_hypotheses: Table<HypothesisRow>;
      marketing_content_items: Table<ContentRow>;
      marketing_content_versions: Table<VersionRow>;
      marketing_ai_jobs: Table<JobRow>;
      marketing_content_assets: Table<AssetRow>;
      marketing_compliance_findings: Table<FindingRow>;
      marketing_approval_requests: Table<ApprovalRow>;
      marketing_tracking_links: Table<TrackingRow>;
      marketing_action_items: Table<ActionRow>;
    };
    Views: Record<string, never>;
    Functions: {
      marketing_content_ready: { Args: { p_content: string; p_workspace: string }; Returns: boolean };
      seed_ceo_ai_marketing_strategy: { Args: { p_workspace: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
