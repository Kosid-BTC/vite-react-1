// Generated from Supabase project waigsnxhrlwtiotspaim, schema marketing_os.
// Source: PostgreSQL information_schema + pg_catalog introspection.
// Regenerate after schema migrations; do not edit by hand.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MarketingOSDatabase = {
  marketing_os: {
    Tables: {
      "marketing_action_items": {
        Row: {
          "id": string;
          "workspace_id": string;
          "action_type": string;
          "title": string;
          "description": string | null;
          "priority": number;
          "entity_type": string | null;
          "entity_id": string | null;
          "action_href": string | null;
          "status": string;
          "due_at": string | null;
          "created_at": string;
          "completed_at": string | null;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "action_type": string;
          "title": string;
          "description"?: string | null;
          "priority"?: number;
          "entity_type"?: string | null;
          "entity_id"?: string | null;
          "action_href"?: string | null;
          "status"?: string;
          "due_at"?: string | null;
          "created_at"?: string;
          "completed_at"?: string | null;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "action_type"?: string;
          "title"?: string;
          "description"?: string | null;
          "priority"?: number;
          "entity_type"?: string | null;
          "entity_id"?: string | null;
          "action_href"?: string | null;
          "status"?: string;
          "due_at"?: string | null;
          "created_at"?: string;
          "completed_at"?: string | null;
        };
        Relationships: [
            { foreignKeyName: "marketing_action_items_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_ai_jobs": {
        Row: {
          "id": string;
          "workspace_id": string;
          "content_item_id": string | null;
          "job_type": string;
          "provider": string;
          "model_name": string | null;
          "status": string;
          "progress": number;
          "input": Json;
          "output": Json | null;
          "idempotency_key": string;
          "attempt_count": number;
          "max_attempts": number;
          "error_code": string | null;
          "error_message": string | null;
          "created_by": string | null;
          "created_at": string;
          "started_at": string | null;
          "completed_at": string | null;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "content_item_id"?: string | null;
          "job_type": string;
          "provider": string;
          "model_name"?: string | null;
          "status"?: string;
          "progress"?: number;
          "input"?: Json;
          "output"?: Json | null;
          "idempotency_key": string;
          "attempt_count"?: number;
          "max_attempts"?: number;
          "error_code"?: string | null;
          "error_message"?: string | null;
          "created_by"?: string | null;
          "created_at"?: string;
          "started_at"?: string | null;
          "completed_at"?: string | null;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "content_item_id"?: string | null;
          "job_type"?: string;
          "provider"?: string;
          "model_name"?: string | null;
          "status"?: string;
          "progress"?: number;
          "input"?: Json;
          "output"?: Json | null;
          "idempotency_key"?: string;
          "attempt_count"?: number;
          "max_attempts"?: number;
          "error_code"?: string | null;
          "error_message"?: string | null;
          "created_by"?: string | null;
          "created_at"?: string;
          "started_at"?: string | null;
          "completed_at"?: string | null;
        };
        Relationships: [
            { foreignKeyName: "marketing_ai_jobs_content_item_id_workspace_id_fkey"; columns: ["content_item_id", "content_item_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_items"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_ai_jobs_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_approval_requests": {
        Row: {
          "id": string;
          "workspace_id": string;
          "content_item_id": string;
          "content_version_id": string | null;
          "status": string;
          "requested_by": string;
          "reviewed_by": string | null;
          "review_notes": string | null;
          "created_at": string;
          "reviewed_at": string | null;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "content_item_id": string;
          "content_version_id"?: string | null;
          "status"?: string;
          "requested_by": string;
          "reviewed_by"?: string | null;
          "review_notes"?: string | null;
          "created_at"?: string;
          "reviewed_at"?: string | null;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "content_item_id"?: string;
          "content_version_id"?: string | null;
          "status"?: string;
          "requested_by"?: string;
          "reviewed_by"?: string | null;
          "review_notes"?: string | null;
          "created_at"?: string;
          "reviewed_at"?: string | null;
        };
        Relationships: [
            { foreignKeyName: "marketing_approval_requests_content_item_id_workspace_id_fkey"; columns: ["content_item_id", "content_item_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_items"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_approval_requests_content_version_id_workspace_i_fkey"; columns: ["content_version_id", "content_version_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_versions"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_approval_requests_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_audience_segments": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "name": string;
          "description": string | null;
          "jobs_to_be_done": Json;
          "pains": Json;
          "anxieties": Json;
          "desired_outcomes": Json;
          "buying_triggers": Json;
          "objections": Json;
          "search_intents": Json;
          "evidence_status": string;
          "evidence": Json;
          "active": boolean;
          "created_at": string;
          "updated_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "name": string;
          "description"?: string | null;
          "jobs_to_be_done"?: Json;
          "pains"?: Json;
          "anxieties"?: Json;
          "desired_outcomes"?: Json;
          "buying_triggers"?: Json;
          "objections"?: Json;
          "search_intents"?: Json;
          "evidence_status"?: string;
          "evidence"?: Json;
          "active"?: boolean;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "code"?: string;
          "name"?: string;
          "description"?: string | null;
          "jobs_to_be_done"?: Json;
          "pains"?: Json;
          "anxieties"?: Json;
          "desired_outcomes"?: Json;
          "buying_triggers"?: Json;
          "objections"?: Json;
          "search_intents"?: Json;
          "evidence_status"?: string;
          "evidence"?: Json;
          "active"?: boolean;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_audience_segments_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_audience_segments_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_behavior_batches": {
        Row: {
          "id": string;
          "workspace_id": string;
          "payload_hash": string;
          "payload": Json;
          "archive_path": string;
          "archived_at": string | null;
          "created_at": string;
        };
        Insert: {
          "id": string;
          "workspace_id": string;
          "payload_hash": string;
          "payload": Json;
          "archive_path": string;
          "archived_at"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "payload_hash"?: string;
          "payload"?: Json;
          "archive_path"?: string;
          "archived_at"?: string | null;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_behavior_batches_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_behavior_config": {
        Row: {
          "key": string;
          "value": string;
        };
        Insert: {
          "key": string;
          "value": string;
        };
        Update: {
          "key"?: string;
          "value"?: string;
        };
        Relationships: [

        ];
      };
      "marketing_behavior_events": {
        Row: {
          "id": string;
          "workspace_id": string;
          "batch_id": string;
          "session_id": string;
          "occurred_at": string;
          "source": string;
          "name": string;
          "topic": string;
          "format": string;
          "mode": string;
        };
        Insert: {
          "id": string;
          "workspace_id": string;
          "batch_id": string;
          "session_id": string;
          "occurred_at": string;
          "source": string;
          "name": string;
          "topic": string;
          "format": string;
          "mode": string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "batch_id"?: string;
          "session_id"?: string;
          "occurred_at"?: string;
          "source"?: string;
          "name"?: string;
          "topic"?: string;
          "format"?: string;
          "mode"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_behavior_events_batch_id_fkey"; columns: ["batch_id"]; isOneToOne: false; referencedRelation: "marketing_behavior_batches"; referencedColumns: ["id"] }
            { foreignKeyName: "marketing_behavior_events_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_behavior_limits": {
        Row: {
          "key": string;
          "count": number;
          "expires_at": string;
        };
        Insert: {
          "key": string;
          "count": number;
          "expires_at": string;
        };
        Update: {
          "key"?: string;
          "count"?: number;
          "expires_at"?: string;
        };
        Relationships: [

        ];
      };
      "marketing_brand_rules": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "rule_type": string;
          "severity": string;
          "pattern": string | null;
          "description": string;
          "active": boolean;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "rule_type": string;
          "severity"?: string;
          "pattern"?: string | null;
          "description": string;
          "active"?: boolean;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "rule_type"?: string;
          "severity"?: string;
          "pattern"?: string | null;
          "description"?: string;
          "active"?: boolean;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_brand_rules_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_brand_rules_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_brands": {
        Row: {
          "id": string;
          "workspace_id": string;
          "name": string;
          "website_url": string | null;
          "description": string | null;
          "positioning": string | null;
          "voice": Json;
          "created_at": string;
          "updated_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "name": string;
          "website_url"?: string | null;
          "description"?: string | null;
          "positioning"?: string | null;
          "voice"?: Json;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "name"?: string;
          "website_url"?: string | null;
          "description"?: string | null;
          "positioning"?: string | null;
          "voice"?: Json;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_brands_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_campaign_hypotheses": {
        Row: {
          "id": string;
          "workspace_id": string;
          "campaign_id": string;
          "hypothesis": string;
          "expected_signal": string | null;
          "decision_rule": string | null;
          "evidence_status": string;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "campaign_id": string;
          "hypothesis": string;
          "expected_signal"?: string | null;
          "decision_rule"?: string | null;
          "evidence_status"?: string;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "campaign_id"?: string;
          "hypothesis"?: string;
          "expected_signal"?: string | null;
          "decision_rule"?: string | null;
          "evidence_status"?: string;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_campaign_hypotheses_campaign_id_workspace_id_fkey"; columns: ["campaign_id", "campaign_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_campaigns"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_campaign_hypotheses_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_campaigns": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "name": string;
          "objective": string;
          "audience_segment_id": string | null;
          "message_pillar_id": string | null;
          "offer_id": string | null;
          "cta_id": string | null;
          "status": string;
          "starts_at": string | null;
          "ends_at": string | null;
          "created_by": string;
          "created_at": string;
          "updated_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "name": string;
          "objective": string;
          "audience_segment_id"?: string | null;
          "message_pillar_id"?: string | null;
          "offer_id"?: string | null;
          "cta_id"?: string | null;
          "status"?: string;
          "starts_at"?: string | null;
          "ends_at"?: string | null;
          "created_by": string;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "name"?: string;
          "objective"?: string;
          "audience_segment_id"?: string | null;
          "message_pillar_id"?: string | null;
          "offer_id"?: string | null;
          "cta_id"?: string | null;
          "status"?: string;
          "starts_at"?: string | null;
          "ends_at"?: string | null;
          "created_by"?: string;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_campaigns_audience_segment_id_workspace_id_fkey"; columns: ["audience_segment_id", "audience_segment_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_audience_segments"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_campaigns_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_campaigns_cta_id_workspace_id_fkey"; columns: ["cta_id", "cta_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_ctas"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_campaigns_message_pillar_id_workspace_id_fkey"; columns: ["message_pillar_id", "message_pillar_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_message_pillars"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_campaigns_offer_id_workspace_id_fkey"; columns: ["offer_id", "offer_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_offers"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_campaigns_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_compliance_findings": {
        Row: {
          "id": string;
          "workspace_id": string;
          "content_item_id": string;
          "brand_rule_id": string | null;
          "severity": string;
          "finding": string;
          "suggested_fix": string | null;
          "resolved": boolean;
          "resolved_by": string | null;
          "resolved_at": string | null;
          "created_at": string;
          "content_version_id": string | null;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "content_item_id": string;
          "brand_rule_id"?: string | null;
          "severity": string;
          "finding": string;
          "suggested_fix"?: string | null;
          "resolved"?: boolean;
          "resolved_by"?: string | null;
          "resolved_at"?: string | null;
          "created_at"?: string;
          "content_version_id"?: string | null;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "content_item_id"?: string;
          "brand_rule_id"?: string | null;
          "severity"?: string;
          "finding"?: string;
          "suggested_fix"?: string | null;
          "resolved"?: boolean;
          "resolved_by"?: string | null;
          "resolved_at"?: string | null;
          "created_at"?: string;
          "content_version_id"?: string | null;
        };
        Relationships: [
            { foreignKeyName: "marketing_compliance_findings_brand_rule_id_workspace_id_fkey"; columns: ["brand_rule_id", "brand_rule_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brand_rules"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_compliance_findings_content_item_id_workspace_id_fkey"; columns: ["content_item_id", "content_item_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_items"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_compliance_findings_content_version_id_workspace_fkey"; columns: ["content_version_id", "content_version_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_versions"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_compliance_findings_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_content_assets": {
        Row: {
          "id": string;
          "workspace_id": string;
          "content_item_id": string;
          "content_version_id": string | null;
          "generation_job_id": string | null;
          "asset_type": string;
          "storage_bucket": string;
          "storage_path": string;
          "mime_type": string | null;
          "width": number | null;
          "height": number | null;
          "duration_ms": number | null;
          "provider": string | null;
          "provider_asset_id": string | null;
          "metadata": Json;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "content_item_id": string;
          "content_version_id"?: string | null;
          "generation_job_id"?: string | null;
          "asset_type": string;
          "storage_bucket"?: string;
          "storage_path": string;
          "mime_type"?: string | null;
          "width"?: number | null;
          "height"?: number | null;
          "duration_ms"?: number | null;
          "provider"?: string | null;
          "provider_asset_id"?: string | null;
          "metadata"?: Json;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "content_item_id"?: string;
          "content_version_id"?: string | null;
          "generation_job_id"?: string | null;
          "asset_type"?: string;
          "storage_bucket"?: string;
          "storage_path"?: string;
          "mime_type"?: string | null;
          "width"?: number | null;
          "height"?: number | null;
          "duration_ms"?: number | null;
          "provider"?: string | null;
          "provider_asset_id"?: string | null;
          "metadata"?: Json;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_content_assets_content_item_id_workspace_id_fkey"; columns: ["content_item_id", "content_item_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_items"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_assets_content_version_id_workspace_id_fkey"; columns: ["content_version_id", "content_version_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_versions"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_assets_generation_job_id_workspace_id_fkey"; columns: ["generation_job_id", "generation_job_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_ai_jobs"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_assets_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_content_items": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "campaign_id": string | null;
          "audience_segment_id": string | null;
          "message_pillar_id": string | null;
          "offer_id": string | null;
          "cta_id": string | null;
          "title": string;
          "content_type": string;
          "funnel_stage": string | null;
          "primary_channel": string | null;
          "status": string;
          "created_by": string;
          "created_at": string;
          "updated_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "campaign_id"?: string | null;
          "audience_segment_id"?: string | null;
          "message_pillar_id"?: string | null;
          "offer_id"?: string | null;
          "cta_id"?: string | null;
          "title": string;
          "content_type": string;
          "funnel_stage"?: string | null;
          "primary_channel"?: string | null;
          "status"?: string;
          "created_by": string;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "campaign_id"?: string | null;
          "audience_segment_id"?: string | null;
          "message_pillar_id"?: string | null;
          "offer_id"?: string | null;
          "cta_id"?: string | null;
          "title"?: string;
          "content_type"?: string;
          "funnel_stage"?: string | null;
          "primary_channel"?: string | null;
          "status"?: string;
          "created_by"?: string;
          "created_at"?: string;
          "updated_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_content_items_audience_segment_id_workspace_id_fkey"; columns: ["audience_segment_id", "audience_segment_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_audience_segments"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_items_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_items_campaign_id_workspace_id_fkey"; columns: ["campaign_id", "campaign_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_campaigns"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_items_cta_id_workspace_id_fkey"; columns: ["cta_id", "cta_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_ctas"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_items_message_pillar_id_workspace_id_fkey"; columns: ["message_pillar_id", "message_pillar_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_message_pillars"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_items_offer_id_workspace_id_fkey"; columns: ["offer_id", "offer_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_offers"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_items_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_content_versions": {
        Row: {
          "id": string;
          "workspace_id": string;
          "content_item_id": string;
          "version_number": number;
          "hook": string | null;
          "body": string | null;
          "caption": string | null;
          "script": Json | null;
          "creative_brief": Json | null;
          "prompt_version": string | null;
          "model_provider": string | null;
          "model_name": string | null;
          "created_by": string | null;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "content_item_id": string;
          "version_number": number;
          "hook"?: string | null;
          "body"?: string | null;
          "caption"?: string | null;
          "script"?: Json | null;
          "creative_brief"?: Json | null;
          "prompt_version"?: string | null;
          "model_provider"?: string | null;
          "model_name"?: string | null;
          "created_by"?: string | null;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "content_item_id"?: string;
          "version_number"?: number;
          "hook"?: string | null;
          "body"?: string | null;
          "caption"?: string | null;
          "script"?: Json | null;
          "creative_brief"?: Json | null;
          "prompt_version"?: string | null;
          "model_provider"?: string | null;
          "model_name"?: string | null;
          "created_by"?: string | null;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_content_versions_content_item_id_workspace_id_fkey"; columns: ["content_item_id", "content_item_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_items"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_content_versions_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_ctas": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "label": string;
          "action_type": string;
          "destination_url": string | null;
          "active": boolean;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "label": string;
          "action_type": string;
          "destination_url"?: string | null;
          "active"?: boolean;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "code"?: string;
          "label"?: string;
          "action_type"?: string;
          "destination_url"?: string | null;
          "active"?: boolean;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_ctas_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_ctas_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_message_pillars": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "name": string;
          "problem": string | null;
          "promise": string | null;
          "proof": string | null;
          "priority": number;
          "active": boolean;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "name": string;
          "problem"?: string | null;
          "promise"?: string | null;
          "proof"?: string | null;
          "priority"?: number;
          "active"?: boolean;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "code"?: string;
          "name"?: string;
          "problem"?: string | null;
          "promise"?: string | null;
          "proof"?: string | null;
          "priority"?: number;
          "active"?: boolean;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_message_pillars_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_message_pillars_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_offers": {
        Row: {
          "id": string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "name": string;
          "description": string | null;
          "offer_type": string | null;
          "destination_url": string | null;
          "active": boolean;
          "created_at": string;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "brand_id": string;
          "code": string;
          "name": string;
          "description"?: string | null;
          "offer_type"?: string | null;
          "destination_url"?: string | null;
          "active"?: boolean;
          "created_at"?: string;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "brand_id"?: string;
          "code"?: string;
          "name"?: string;
          "description"?: string | null;
          "offer_type"?: string | null;
          "destination_url"?: string | null;
          "active"?: boolean;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "marketing_offers_brand_id_workspace_id_fkey"; columns: ["brand_id", "brand_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_brands"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_offers_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "marketing_tracking_links": {
        Row: {
          "id": string;
          "workspace_id": string;
          "campaign_id": string | null;
          "content_item_id": string | null;
          "destination_url": string;
          "short_code": string | null;
          "utm_source": string;
          "utm_medium": string;
          "utm_campaign": string;
          "utm_content": string | null;
          "utm_term": string | null;
          "segment_code": string;
          "final_url": string;
          "created_by": string;
          "created_at": string;
          "content_version_id": string | null;
          "audience_segment_id": string | null;
          "message_pillar_id": string | null;
          "offer_id": string | null;
          "cta_id": string | null;
        };
        Insert: {
          "id"?: string;
          "workspace_id": string;
          "campaign_id"?: string | null;
          "content_item_id"?: string | null;
          "destination_url": string;
          "short_code"?: string | null;
          "utm_source": string;
          "utm_medium": string;
          "utm_campaign": string;
          "utm_content"?: string | null;
          "utm_term"?: string | null;
          "segment_code": string;
          "final_url": string;
          "created_by": string;
          "created_at"?: string;
          "content_version_id"?: string | null;
          "audience_segment_id"?: string | null;
          "message_pillar_id"?: string | null;
          "offer_id"?: string | null;
          "cta_id"?: string | null;
        };
        Update: {
          "id"?: string;
          "workspace_id"?: string;
          "campaign_id"?: string | null;
          "content_item_id"?: string | null;
          "destination_url"?: string;
          "short_code"?: string | null;
          "utm_source"?: string;
          "utm_medium"?: string;
          "utm_campaign"?: string;
          "utm_content"?: string | null;
          "utm_term"?: string | null;
          "segment_code"?: string;
          "final_url"?: string;
          "created_by"?: string;
          "created_at"?: string;
          "content_version_id"?: string | null;
          "audience_segment_id"?: string | null;
          "message_pillar_id"?: string | null;
          "offer_id"?: string | null;
          "cta_id"?: string | null;
        };
        Relationships: [
            { foreignKeyName: "marketing_tracking_links_audience_segment_id_workspace_id_fkey"; columns: ["audience_segment_id", "audience_segment_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_audience_segments"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_campaign_id_workspace_id_fkey"; columns: ["campaign_id", "campaign_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_campaigns"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_content_item_id_workspace_id_fkey"; columns: ["content_item_id", "content_item_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_items"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_content_version_id_workspace_id_fkey"; columns: ["content_version_id", "content_version_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_content_versions"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_cta_id_workspace_id_fkey"; columns: ["cta_id", "cta_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_ctas"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_message_pillar_id_workspace_id_fkey"; columns: ["message_pillar_id", "message_pillar_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_message_pillars"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_offer_id_workspace_id_fkey"; columns: ["offer_id", "offer_id", "workspace_id", "workspace_id"]; isOneToOne: false; referencedRelation: "marketing_offers"; referencedColumns: ["id", "workspace_id", "id", "workspace_id"] }
            { foreignKeyName: "marketing_tracking_links_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "workspace_members": {
        Row: {
          "workspace_id": string;
          "user_id": string;
          "role": string;
          "created_at": string;
        };
        Insert: {
          "workspace_id": string;
          "user_id": string;
          "role"?: string;
          "created_at"?: string;
        };
        Update: {
          "workspace_id"?: string;
          "user_id"?: string;
          "role"?: string;
          "created_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "workspace_members_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "workspace_state": {
        Row: {
          "workspace_id": string;
          "data": Json;
          "updated_at": string;
        };
        Insert: {
          "workspace_id": string;
          "data"?: Json;
          "updated_at"?: string;
        };
        Update: {
          "workspace_id"?: string;
          "data"?: Json;
          "updated_at"?: string;
        };
        Relationships: [
            { foreignKeyName: "workspace_state_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }
        ];
      };
      "workspaces": {
        Row: {
          "id": string;
          "name": string;
          "owner_id": string;
          "created_at": string;
          "slug": string;
        };
        Insert: {
          "id"?: string;
          "name"?: string;
          "owner_id": string;
          "created_at"?: string;
          "slug": string;
        };
        Update: {
          "id"?: string;
          "name"?: string;
          "owner_id"?: string;
          "created_at"?: string;
          "slug"?: string;
        };
        Relationships: [

        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_workspace_member: { Args: { p_ws: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
