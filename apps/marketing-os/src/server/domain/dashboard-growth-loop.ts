export const DASHBOARD_GROWTH_STAGES = [
  'MARKETING_HEALTH',
  'TOP_ISSUE',
  'NEXT_BEST_ACTION',
  'FUNNEL',
  'CAMPAIGN_LANDING',
  'EVIDENCE_HEALTH',
  'EXPERIMENT',
  'LEARNING',
] as const;

export type DashboardGrowthStage = (typeof DASHBOARD_GROWTH_STAGES)[number];

export const DASHBOARD_TRUTH_STATES = [
  'MEASURED',
  'DERIVED',
  'ASSUMED',
  'PLACEHOLDER',
  'UNAVAILABLE',
] as const;

export type DashboardTruthState = (typeof DASHBOARD_TRUTH_STATES)[number];
export type DashboardMeasurementHealth = 'HEALTHY' | 'CAUTION' | 'INSUFFICIENT_EVIDENCE' | 'UNAVAILABLE';

export interface DashboardEvidenceMeta {
  workspaceId: string;
  truthState: DashboardTruthState;
  measurementHealth: DashboardMeasurementHealth;
  evidenceIds: readonly string[];
  source: string | null;
  observedAt: string | null;
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
}

export interface DashboardGrowthStageState {
  stage: DashboardGrowthStage;
  title: string;
  summary: string;
  displayValue: string | null;
  evidence: DashboardEvidenceMeta;
}

export interface GovernedDashboardNba {
  id: string;
  title: string;
  summary: string;
  primary: true;
  humanApprovalRequired: true;
  executable: false;
  evidenceIds: readonly string[];
  status: 'COLLECT_MORE_EVIDENCE' | 'PROPOSAL_READY';
}

export interface DashboardGrowthLoopModel {
  workspaceId: string;
  stages: readonly DashboardGrowthStageState[];
  primaryNba: GovernedDashboardNba;
  experimentEvidenceIds: readonly string[];
  learningEvidenceIds: readonly string[];
}

const unavailableEvidence = (workspaceId: string): DashboardEvidenceMeta => ({
  workspaceId,
  truthState: 'UNAVAILABLE',
  measurementHealth: 'INSUFFICIENT_EVIDENCE',
  evidenceIds: [],
  source: null,
  observedAt: null,
  freshness: 'UNKNOWN',
});

/**
 * Fail-closed dashboard model used until trusted measurement read models are available.
 * It intentionally contains no fabricated numeric defaults or strategic conclusions.
 */
export function createInsufficientEvidenceDashboardModel(workspaceId: string): DashboardGrowthLoopModel {
  const evidence = () => unavailableEvidence(workspaceId);
  const stages: DashboardGrowthStageState[] = [
    {
      stage: 'MARKETING_HEALTH',
      title: 'Marketing Health',
      summary: 'ยังมีหลักฐานไม่เพียงพอสำหรับสรุปสุขภาพการตลาด',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'TOP_ISSUE',
      title: 'Top Issue',
      summary: 'ยังไม่ระบุปัญหาหลักจนกว่า Measurement Health จะพร้อม',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'NEXT_BEST_ACTION',
      title: 'Next Best Action',
      summary: 'เก็บหลักฐานเพิ่มก่อนสร้างคำแนะนำเชิงกลยุทธ์',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'FUNNEL',
      title: 'Funnel',
      summary: 'รอ first-party funnel evidence ที่ตรวจสอบย้อนกลับได้',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'CAMPAIGN_LANDING',
      title: 'Campaign / Landing',
      summary: 'รอ campaign และ landing lineage ที่เชื่อมกับหลักฐานจริง',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'EVIDENCE_HEALTH',
      title: 'Evidence Health',
      summary: 'INSUFFICIENT_EVIDENCE — ต้องเพิ่มข้อมูลที่เชื่อถือได้',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'EXPERIMENT',
      title: 'Experiment',
      summary: 'ยังไม่เสนอผู้ชนะหรือเริ่มการทดลองโดยอัตโนมัติ',
      displayValue: null,
      evidence: evidence(),
    },
    {
      stage: 'LEARNING',
      title: 'Learning',
      summary: 'การเรียนรู้ต้องเชื่อมกับ observed outcome evidence เท่านั้น',
      displayValue: null,
      evidence: evidence(),
    },
  ];

  return {
    workspaceId,
    stages,
    primaryNba: {
      id: 'collect-more-evidence',
      title: 'เก็บหลักฐานเพิ่ม',
      summary: 'Measurement Health ยังไม่พร้อม จึงยังไม่สร้างข้อสรุปเชิงกลยุทธ์',
      primary: true,
      humanApprovalRequired: true,
      executable: false,
      evidenceIds: [],
      status: 'COLLECT_MORE_EVIDENCE',
    },
    experimentEvidenceIds: [],
    learningEvidenceIds: [],
  };
}

export function hasValidExperimentLearningLink(model: DashboardGrowthLoopModel): boolean {
  const experiment = model.stages.find((item) => item.stage === 'EXPERIMENT');
  const learning = model.stages.find((item) => item.stage === 'LEARNING');
  if (!experiment || !learning) return false;

  const bothUnavailable =
    experiment.evidence.measurementHealth === 'INSUFFICIENT_EVIDENCE' &&
    learning.evidence.measurementHealth === 'INSUFFICIENT_EVIDENCE' &&
    model.experimentEvidenceIds.length === 0 &&
    model.learningEvidenceIds.length === 0;

  const linkedObservedEvidence =
    model.experimentEvidenceIds.length > 0 &&
    model.learningEvidenceIds.length > 0 &&
    model.learningEvidenceIds.some((id) => model.experimentEvidenceIds.includes(id));

  return bothUnavailable || linkedObservedEvidence;
}
