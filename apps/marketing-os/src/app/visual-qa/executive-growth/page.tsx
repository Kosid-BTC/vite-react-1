import { notFound } from 'next/navigation';
import { ExecutiveGrowthDashboard, type ExecutiveGrowthAction } from '@/components/executive-growth-dashboard';

const qaActions: ExecutiveGrowthAction[] = [
  { id: 'qa-1', title: 'เก็บหลักฐาน Growth Baseline', description: 'ยืนยัน Traffic, Leads และ Conversion ก่อนตัดสินใจ' },
  { id: 'qa-2', title: 'ตรวจ Measurement Health', description: 'เชื่อมแหล่งข้อมูลที่จำเป็นและตรวจ freshness' },
  { id: 'qa-3', title: 'กำหนด Experiment ถัดไป', description: 'Human approval required before execution' },
];

export default function ExecutiveGrowthVisualQaPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();

  return <ExecutiveGrowthDashboard workspaceName="CEO AI Thailand" actions={qaActions} />;
}
