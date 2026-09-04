import { ExecutiveGrowthDashboard } from '@/components/executive-growth-dashboard';
import { getMarketingService } from '@/server/services';

export default async function HomePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const service = await getMarketingService();
  const data = await service.getHome(workspaceSlug);
  const actions = [data.primaryAction, ...data.actions.filter((action) => action.id !== data.primaryAction.id)].slice(0, 3);

  return <ExecutiveGrowthDashboard workspaceName={data.workspace.name} actions={actions} />;
}
