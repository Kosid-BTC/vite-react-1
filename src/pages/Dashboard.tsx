import type { AppData, PageId } from '../types';
import SearchGrowthDashboard from './SearchGrowthDashboard';

interface Props {
  data: AppData;
  onNavigate: (page: PageId) => void;
  onUpdate: (data: AppData) => void;
  wsId?: string | null;
}

/**
 * Primary CEO AI Thailand dashboard.
 *
 * The UX follows the Search Ownership continuous-improvement model:
 * Search Evidence -> Entity Health / ECI -> Diagnosis -> NBA -> Human Action -> Learning.
 *
 * onUpdate remains in the public contract because App.tsx and historical dashboard callers
 * still pass it. The Search Growth dashboard is intentionally read-first; mutations happen
 * through controlled destination modules (Actions, Marketing, Content) instead of hidden
 * dashboard side effects.
 */
export default function Dashboard({ data, onNavigate, wsId }: Props) {
  return <SearchGrowthDashboard data={data} onNavigate={onNavigate} wsId={wsId} />;
}
