import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  searchParams: Promise<{ visualQa?: string | string[] }>;
};

type FeatureStatus = 'LIVE' | 'EMPTY' | 'NEED SETUP' | 'UNAVAILABLE';

type FeatureRow = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  meta?: string;
};

type FeatureLoadResult = {
  status: FeatureStatus;
  source: string;
  note: string;
  rows: FeatureRow[];
  workspaceName?: string;
};

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function stateFromRows(rows: FeatureRow[], source: string, note: string, workspaceName: string): FeatureLoadResult {
  return {
    status: rows.length > 0 ? 'LIVE' : 'EMPTY',
    source,
    note,
    rows,
    workspaceName,
  };
}

async function loadFeature(workspaceSlug: string, featureKey: string): Promise<FeatureLoadResult> {
  const db = await createSupabaseServerClient();
  const workspaceResult = await db
    .from('workspaces')
    .select('id,name,slug')
    .eq('slug', workspaceSlug)
    .maybeSingle();

  if (workspaceResult.error) {
    return {
      status: 'UNAVAILABLE',
      source: 'Supabase',
      note: `Workspace query failed: ${workspaceResult.error.message}`,
      rows: [],
    };
  }

  const workspace = workspaceResult.data;
  if (!workspace) {
    return {
      status: 'UNAVAILABLE',
      source: 'Supabase',
      note: 'ไม่พบ Workspace ที่ผู้ใช้มีสิทธิ์เข้าถึง',
      rows: [],
    };
  }

  const workspaceId = workspace.id;
  const workspaceName = workspace.name;

  if (featureKey === 'audience') {
    const result = await db
      .from('marketing_audience_segments')
      .select('id,name,description,evidence_status,active,created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_audience_segments', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.description ?? 'ยังไม่มีคำอธิบาย',
      status: item.active ? 'ACTIVE' : 'INACTIVE',
      meta: `Evidence: ${item.evidence_status}`,
    }));
    return stateFromRows(rows, 'marketing_audience_segments', 'ข้อมูลกลุ่มเป้าหมายจาก Supabase ตามสิทธิ์ Workspace/RLS', workspaceName);
  }

  if (featureKey === 'message-pillars') {
    const result = await db
      .from('marketing_message_pillars')
      .select('id,name,problem,promise,proof,priority,active')
      .eq('workspace_id', workspaceId)
      .order('priority', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_message_pillars', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.promise ?? item.problem ?? 'ยังไม่มี Promise / Problem statement',
      status: item.active ? 'ACTIVE' : 'INACTIVE',
      meta: `Priority ${item.priority}${item.proof ? ` · Proof: ${item.proof}` : ''}`,
    }));
    return stateFromRows(rows, 'marketing_message_pillars', 'Message Pillars จริงของ Workspace', workspaceName);
  }

  if (featureKey === 'brand-guardrails') {
    const result = await db
      .from('marketing_brand_rules')
      .select('id,rule_type,severity,description,active,created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_brand_rules', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.description,
      subtitle: item.rule_type,
      status: item.active ? item.severity.toUpperCase() : 'INACTIVE',
    }));
    return stateFromRows(rows, 'marketing_brand_rules', 'กฎ Brand / Compliance ที่ใช้งานจริง', workspaceName);
  }

  if (['content-calendar', 'content-items', 'content-library'].includes(featureKey)) {
    const result = await db
      .from('marketing_content_items')
      .select('id,title,content_type,status,primary_channel,created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_content_items', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${item.content_type}${item.primary_channel ? ` · ${item.primary_channel}` : ''}`,
      status: item.status.toUpperCase(),
      meta: new Date(item.created_at).toLocaleString('th-TH'),
    }));
    const calendarNote = featureKey === 'content-calendar'
      ? 'แสดง Content จริงตามลำดับเวลา ปัจจุบัน schema ยังไม่มี scheduled_at จึงยังไม่อ้างว่าเป็น Publishing Calendar เต็มรูปแบบ'
      : 'รายการ Content จริงจาก Workspace';
    const base = stateFromRows(rows, 'marketing_content_items', calendarNote, workspaceName);
    return featureKey === 'content-calendar' && rows.length > 0 ? { ...base, status: 'NEED SETUP' } : base;
  }

  if (featureKey === 'review-approve') {
    const result = await db
      .from('marketing_approval_requests')
      .select('id,content_item_id,status,review_notes,created_at,reviewed_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_approval_requests', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: `Approval · ${item.content_item_id}`,
      subtitle: item.review_notes ?? 'ยังไม่มี Review note',
      status: item.status.toUpperCase(),
      meta: item.reviewed_at ? `Reviewed ${new Date(item.reviewed_at).toLocaleString('th-TH')}` : `Requested ${new Date(item.created_at).toLocaleString('th-TH')}`,
    }));
    return stateFromRows(rows, 'marketing_approval_requests', 'Approval queue จริง; หน้านี้เป็น read state และไม่อนุมัติแทนผู้ใช้', workspaceName);
  }

  if (featureKey === 'utm-tracking') {
    const result = await db
      .from('marketing_tracking_links')
      .select('id,final_url,utm_source,utm_medium,utm_campaign,segment_code,created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_tracking_links', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.utm_campaign,
      subtitle: `${item.utm_source} / ${item.utm_medium} · Segment ${item.segment_code}`,
      status: 'TRACKED',
      meta: item.final_url,
    }));
    return stateFromRows(rows, 'marketing_tracking_links', 'UTM/Tracking links จริงของ Workspace', workspaceName);
  }

  if (featureKey === 'next-best-actions') {
    const result = await db
      .from('marketing_action_items')
      .select('id,title,description,priority,status,action_href,due_at,created_at')
      .eq('workspace_id', workspaceId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_action_items', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description ?? 'ไม่มีคำอธิบายเพิ่มเติม',
      status: item.status.toUpperCase(),
      meta: `Priority ${item.priority}${item.due_at ? ` · Due ${new Date(item.due_at).toLocaleString('th-TH')}` : ''}${item.action_href ? ` · ${item.action_href}` : ''}`,
    }));
    return stateFromRows(rows, 'marketing_action_items', 'Next Best Actions จริงจากระบบ โดยยังคง Human approval สำหรับ mutation สำคัญ', workspaceName);
  }

  if (['text-to-image', 'text-to-video', 'image-to-video', 'create-content'].includes(featureKey)) {
    const result = await db
      .from('marketing_ai_jobs')
      .select('id,job_type,provider,model_name,status,progress,error_code,created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'marketing_ai_jobs', note: result.error.message, rows: [], workspaceName };
    const wanted = featureKey === 'create-content' ? null : featureKey.replaceAll('-', '_');
    const filtered = (result.data ?? []).filter((item) => !wanted || item.job_type.toLowerCase().includes(wanted.replace('to_', '')) || item.job_type.toLowerCase() === wanted);
    const rows = filtered.map((item) => ({
      id: item.id,
      title: item.job_type,
      subtitle: `${item.provider}${item.model_name ? ` · ${item.model_name}` : ''}`,
      status: `${item.status.toUpperCase()} · ${item.progress}%`,
      meta: item.error_code ? `Error: ${item.error_code}` : new Date(item.created_at).toLocaleString('th-TH'),
    }));
    return stateFromRows(rows, 'marketing_ai_jobs', 'แสดง AI generation jobs จริง; การสร้างงานใหม่ต้องผ่าน workflow/provider ที่รองรับ', workspaceName);
  }

  if (featureKey === 'channels') {
    const result = await db
      .from('channels')
      .select('id,name,niche,youtube_channel_id,created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (result.error) return { status: 'UNAVAILABLE', source: 'channels', note: result.error.message, rows: [], workspaceName };
    const rows = (result.data ?? []).map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.niche ?? 'ยังไม่ได้กำหนด niche',
      status: item.youtube_channel_id ? 'CONNECTED' : 'NEED SETUP',
      meta: item.youtube_channel_id ? `YouTube ${item.youtube_channel_id}` : undefined,
    }));
    return stateFromRows(rows, 'channels (RLS scoped)', 'สถานะ Channel จากฐานข้อมูลจริง ไม่สรุปว่าเชื่อมต่อหากไม่มี evidence field', workspaceName);
  }

  if (featureKey === 'publishing') {
    const [approvals, tracking] = await Promise.all([
      db.from('marketing_approval_requests').select('id,status,content_item_id,created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(30),
      db.from('marketing_tracking_links').select('id,content_item_id,final_url,created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(30),
    ]);
    if (approvals.error) return { status: 'UNAVAILABLE', source: 'marketing_approval_requests', note: approvals.error.message, rows: [], workspaceName };
    if (tracking.error) return { status: 'UNAVAILABLE', source: 'marketing_tracking_links', note: tracking.error.message, rows: [], workspaceName };
    const trackingByContent = new Set((tracking.data ?? []).map((item) => item.content_item_id).filter(Boolean));
    const rows = (approvals.data ?? []).map((item) => ({
      id: item.id,
      title: `Content ${item.content_item_id}`,
      subtitle: trackingByContent.has(item.content_item_id) ? 'มี Tracking link แล้ว' : 'ยังไม่มี Tracking link',
      status: item.status === 'approved' && trackingByContent.has(item.content_item_id) ? 'READY FOR MANUAL PUBLISH' : item.status.toUpperCase(),
      meta: new Date(item.created_at).toLocaleString('th-TH'),
    }));
    return stateFromRows(rows, 'approval + tracking evidence', 'หน้านี้ประเมิน readiness เท่านั้น ระบบจะไม่ publish ภายนอกอัตโนมัติ', workspaceName);
  }

  if (['business-genome', 'mit-24-steps'].includes(featureKey)) {
    const result = await db
      .from('workspace_state')
      .select('data,updated_at')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (result.error) return { status: 'UNAVAILABLE', source: 'workspace_state', note: result.error.message, rows: [], workspaceName };
    if (!result.data) return { status: 'EMPTY', source: 'workspace_state', note: 'ยังไม่มี Workspace state ที่บันทึกไว้', rows: [], workspaceName };
    const data = result.data.data;
    const keys = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data as Record<string, unknown>) : [];
    const rows = keys.slice(0, 50).map((key) => ({
      id: key,
      title: key,
      subtitle: text((data as Record<string, unknown>)[key]).slice(0, 320),
      status: 'SAVED',
    }));
    return {
      status: rows.length > 0 ? 'LIVE' : 'EMPTY',
      source: 'workspace_state',
      note: `${featureKey === 'business-genome' ? 'Business Genome' : 'MIT 24 Steps'} ใช้ state ที่ persist จริง; ไม่มีการสร้างคะแนนจำลอง`,
      rows,
      workspaceName,
    };
  }

  if (featureKey === 'production-readiness') {
    const [brands, audiences, pillars, offers, ctas, campaigns, content, approvals] = await Promise.all([
      db.from('marketing_brands').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      db.from('marketing_audience_segments').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('active', true),
      db.from('marketing_message_pillars').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('active', true),
      db.from('marketing_offers').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('active', true),
      db.from('marketing_ctas').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('active', true),
      db.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      db.from('marketing_content_items').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      db.from('marketing_approval_requests').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    ]);
    const results = [brands, audiences, pillars, offers, ctas, campaigns, content, approvals];
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) return { status: 'UNAVAILABLE', source: 'Supabase readiness checks', note: firstError.message, rows: [], workspaceName };
    const checks = [
      ['Brand', brands.count ?? 0],
      ['Active Audiences', audiences.count ?? 0],
      ['Active Message Pillars', pillars.count ?? 0],
      ['Active Offers', offers.count ?? 0],
      ['Active CTAs', ctas.count ?? 0],
      ['Campaigns', campaigns.count ?? 0],
      ['Content Items', content.count ?? 0],
      ['Approval Records', approvals.count ?? 0],
    ] as const;
    const rows = checks.map(([label, count]) => ({
      id: label,
      title: label,
      subtitle: `${count} record${count === 1 ? '' : 's'}`,
      status: count > 0 ? 'READY' : 'NEED SETUP',
    }));
    return {
      status: checks.every(([, count]) => count > 0) ? 'LIVE' : 'NEED SETUP',
      source: 'Supabase readiness checks',
      note: 'Readiness ใช้ record counts จริง ไม่ใช่คะแนนสมมติ',
      rows,
      workspaceName,
    };
  }

  if (['analytics-overview', 'content-performance', 'audience-insights', 'attribution', 'ab-tests'].includes(featureKey)) {
    return {
      status: 'UNAVAILABLE',
      source: 'Verified measurement source',
      note: 'ยังไม่พบ measurement source ที่ยืนยันแล้วสำหรับโมดูลนี้ จึงไม่แสดงตัวเลขตัวอย่างหรือ fabricated analytics',
      rows: [],
      workspaceName,
    };
  }

  return {
    status: 'UNAVAILABLE',
    source: 'Functional V5 registry',
    note: 'Feature นี้ยังไม่มี backend workflow ที่ตรวจยืนยันแล้วใน release candidate ปัจจุบัน',
    rows: [],
    workspaceName,
  };
}

export default async function FeaturePage({ params, searchParams }: FeaturePageProps) {
  const { workspaceSlug, featureKey } = await params;
  const query = await searchParams;
  const visualQaToken = Array.isArray(query.visualQa) ? query.visualQa[0] : query.visualQa;
  const isPreviewVisualQa =
    workspaceSlug === 'visual-qa' &&
    process.env.VERCEL_ENV === 'preview' &&
    Boolean(process.env.VERCEL_GIT_COMMIT_SHA) &&
    visualQaToken === process.env.VERCEL_GIT_COMMIT_SHA;
  const title = FEATURE_TITLES[featureKey] ?? featureKey.replaceAll('-', ' ');

  if (isPreviewVisualQa) {
    return (
      <main className="shell" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 56 }}>
        <section className="card stack" style={{ gap: 20 }}>
          <header className="stack" style={{ gap: 8 }}>
            <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
            <h1 style={{ margin: 0 }}>{title}</h1>
            <p className="muted" style={{ margin: 0 }}>Deterministic Preview fixture สำหรับ interaction / visual QA</p>
          </header>
          <div className="card" style={{ padding: 16 }}><strong>Interaction status: ACTIVE</strong></div>
          <div className="card" style={{ padding: 16 }}><strong>Backend execution status: UNVERIFIED</strong></div>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Feature actions">
            <Link className="primary" href={`/${workspaceSlug}/home?visualQa=${encodeURIComponent(visualQaToken ?? '')}`}>← กลับ Dashboard</Link>
            <Link href={`/${workspaceSlug}/campaigns?visualQa=${encodeURIComponent(visualQaToken ?? '')}`}>ดู Campaigns</Link>
          </nav>
        </section>
      </main>
    );
  }

  const feature = await loadFeature(workspaceSlug, featureKey);

  return (
    <main className="shell" style={{ maxWidth: 1040, paddingTop: 40, paddingBottom: 56 }}>
      <section className="card stack" style={{ gap: 20 }}>
        <header className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {feature.workspaceName ? `${feature.workspaceName} · ` : ''}Data source: {feature.source}
          </p>
        </header>

        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: {feature.status}</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{feature.note}</p>
        </div>

        {feature.rows.length > 0 ? (
          <div className="stack" style={{ gap: 10 }} aria-label={`${title} data`}>
            {feature.rows.map((row) => (
              <article key={row.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{row.title}</strong>
                    {row.subtitle && <span className="muted">{row.subtitle}</span>}
                    {row.meta && <small className="muted">{row.meta}</small>}
                  </div>
                  {row.status && <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>{row.status}</span>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <strong>{feature.status === 'UNAVAILABLE' ? 'ยังไม่พร้อมใช้งาน' : 'ยังไม่มีข้อมูล'}</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              ระบบจะไม่สร้างข้อมูลตัวอย่างเพื่อทำให้ Dashboard ดูเหมือนมีข้อมูลจริง
            </p>
          </div>
        )}

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Feature actions">
          <Link className="primary" href={`/${workspaceSlug}/home`}>← กลับ Dashboard</Link>
          <Link href={`/${workspaceSlug}/campaigns`}>ดู Campaigns</Link>
          <Link href={`/${workspaceSlug}/campaigns/new`}>สร้าง Campaign ใหม่</Link>
        </nav>
      </section>
    </main>
  );
}
