import { MarketingRepository } from '@/server/repositories/marketing.repository';

export class MarketingService {
  constructor(private readonly repo: MarketingRepository) {}

  async getHome(workspaceSlug: string) {
    const workspace = await this.repo.getWorkspaceBySlug(workspaceSlug);
    const actions = await this.repo.getOpenActions(workspace.id);

    return {
      workspace,
      actions,
      primaryAction: actions[0] ?? {
        id: 'primary-create-first-campaign',
        title: 'สร้าง Campaign แรก',
        description: 'เริ่มจากกลุ่มเป้าหมาย ปัญหา และสมมติฐานที่ต้องการทดสอบ',
        action_href: `/${workspace.slug}/campaigns/new`,
      },
    };
  }

  async getCampaignWizard(workspaceSlug: string) {
    const workspace = await this.repo.getWorkspaceBySlug(workspaceSlug);
    const strategy = await this.repo.getStrategyOptions(workspace.id);
    return { workspace, strategy };
  }

  async createCampaign(params: {
    workspaceSlug: string;
    userId: string;
    name: string;
    objective: 'awareness'|'interest'|'first_customer'|'sales';
    brandId: string;
    audienceSegmentId: string;
    messagePillarId?: string;
    offerId?: string;
    ctaId: string;
    hypothesis: string;
    expectedSignal?: string;
    decisionRule?: string;
  }) {
    const workspace = await this.repo.getWorkspaceBySlug(params.workspaceSlug);

    const campaign = await this.repo.createCampaign({
      workspace_id: workspace.id,
      brand_id: params.brandId,
      name: params.name,
      objective: params.objective,
      audience_segment_id: params.audienceSegmentId,
      message_pillar_id: params.messagePillarId ?? null,
      offer_id: params.offerId ?? null,
      cta_id: params.ctaId,
      status: 'draft',
      created_by: params.userId,
    });

    await this.repo.createHypothesis({
      workspace_id: workspace.id,
      campaign_id: campaign.id,
      hypothesis: params.hypothesis,
      expected_signal: params.expectedSignal ?? null,
      decision_rule: params.decisionRule ?? null,
      evidence_status: 'hypothesis',
    });

    return campaign;
  }

  async getContent(workspaceSlug: string, contentId: string) {
    const workspace = await this.repo.getWorkspaceBySlug(workspaceSlug);
    const detail = await this.repo.getContentDetail(workspace.id, contentId);

    const hasText = detail.versions.length > 0;
    const hasImage = detail.assets.some((asset) => asset.asset_type === 'image' || asset.asset_type === 'thumbnail');
    const blockingFindings = detail.findings.filter((f) => f.severity === 'blocking' && !f.resolved);
    const approved = detail.approvals.some((a) => a.status === 'approved');
    const hasTracking = detail.tracking.length > 0;

    const nextAction = !hasText
      ? { label: 'สร้างข้อความ', code: 'generate_text' }
      : !hasImage
        ? { label: 'สร้างภาพ', code: 'generate_image' }
        : blockingFindings.length > 0
          ? { label: 'แก้ Brand / Compliance', code: 'resolve_compliance' }
          : !approved
            ? { label: 'ส่งตรวจอนุมัติ', code: 'request_approval' }
            : !hasTracking
              ? { label: 'สร้าง Tracking Link', code: 'create_tracking' }
              : { label: 'พร้อมเผยแพร่แบบ Manual', code: 'ready' };

    return { workspace, ...detail, nextAction, blockingFindings };
  }
}
