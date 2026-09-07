import Link from 'next/link';

const FEATURE_TITLES: Record<string, string> = {
  audience: 'Audience',
  'message-pillars': 'Message Pillars',
  'brand-guardrails': 'Brand Guardrails',
  'content-calendar': 'Content Calendar',
  'content-items': 'Content Items',
  'create-content': 'Create Content',
  'text-to-image': 'Text to Image',
  'text-to-video': 'Text to Video',
  'image-to-video': 'Image to Video',
  'review-approve': 'Review & Approve',
  'content-library': 'Content Library',
  channels: 'Channels',
  publishing: 'Publishing',
  'utm-tracking': 'UTM & Tracking',
  'analytics-overview': 'Analytics Overview',
  'content-performance': 'Content Performance',
  'audience-insights': 'Audience Insights',
  attribution: 'Attribution',
  'ab-tests': 'A/B Tests',
  'business-genome': 'Business Genome',
  'next-best-actions': 'Next Best Actions',
  environment: 'Environment',
  migration: 'Migration',
  'rls-security': 'RLS / Security',
  'supabase-staging': 'Supabase Staging',
  'production-readiness': 'Production Readiness',
  'system-settings': 'System Settings',
  'mit-24-steps': 'MIT 24 Steps',
  search: 'Global Search',
  notifications: 'Notifications',
  overview: 'Feature Overview',
};

type FeaturePageProps = {
  params: Promise<{ workspaceSlug: string; featureKey: string }>;
};

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { workspaceSlug, featureKey } = await params;
  const title = FEATURE_TITLES[featureKey] ?? featureKey.replaceAll('-', ' ');

  return (
    <main className="shell" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 56 }}>
      <section className="card stack" style={{ gap: 20 }}>
        <header className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            เส้นทาง Feature พร้อมใช้งานแล้ว และสามารถกลับไป Dashboard หรือไป Campaign workflow ได้จากหน้านี้
          </p>
        </header>

        <div className="stack" style={{ gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <strong>Interaction status: ACTIVE</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              การคลิกและ keyboard activation ถูกเปิดใช้งานแล้วสำหรับ Feature navigation บน Dashboard
            </p>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <strong>Backend execution status: UNVERIFIED</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              หน้านี้ไม่สร้างข้อมูลหรือเรียก external mutation อัตโนมัติจนกว่าจะมี workflow ของ Feature นั้นรองรับ
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Feature actions">
          <Link className="primary" href={`/${workspaceSlug}/home`}>← กลับ Dashboard</Link>
          <Link href={`/${workspaceSlug}/campaigns`}>ดู Campaigns</Link>
          <Link href={`/${workspaceSlug}/campaigns/new`}>สร้าง Campaign ใหม่</Link>
        </nav>
      </section>
    </main>
  );
}
