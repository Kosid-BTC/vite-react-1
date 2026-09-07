import {
  buildConsumerBehaviorFinancialLoop,
  type ConsumerBehaviorFinancialLoopModel,
  type FinancialScalePolicy,
} from '@/server/domain/consumer-behavior-financial-loop';
import { trustedEvidenceToActivationSnapshot } from '@/server/domain/consumer-financial-evidence';
import type { ConsumerFinancialRepository } from '@/server/repositories/consumer-financial.repository';

type EvidenceReader = Pick<ConsumerFinancialRepository, 'listTrustedEvidence'>;

export class ConsumerFinancialService {
  constructor(private readonly repo: EvidenceReader) {}

  async getCohortModel(params: {
    workspaceId: string;
    businessId: string;
    cohortId: string;
    policy?: FinancialScalePolicy | null;
  }): Promise<ConsumerBehaviorFinancialLoopModel> {
    const rows = await this.repo.listTrustedEvidence({
      workspaceId: params.workspaceId,
      businessId: params.businessId,
    });

    const snapshot = trustedEvidenceToActivationSnapshot({
      workspaceId: params.workspaceId,
      cohortId: params.cohortId,
      rows,
    });

    return buildConsumerBehaviorFinancialLoop(snapshot, params.policy ?? null);
  }
}
