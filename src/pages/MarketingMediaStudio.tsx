import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  listMarketingGenerationJobs,
  queueMarketingGeneration,
  type MarketingGenerationJob,
  type MediaProviderId,
} from '../lib/marketingGenerationClient';
import type { AspectRatio } from '../lib/mediaGeneration';

interface WorkspaceRow { id: string; name: string }
interface ContentRow { id: string; title: string; channel: string | null; format: string | null }
interface AssetRow { id: string; kind: string; storage_path: string; provider: string | null; model: string | null }

type GenType = 'text_to_image' | 'text_to_video' | 'image_to_video';

const C = {
  bg: '#020617', panel: '#0f172a', panel2: '#111827', border: '#1e293b',
  text: '#f8fafc', muted: '#94a3b8', cyan: '#22d3ee', green: '#22c55e',
  amber: '#f59e0b', red: '#ef4444', violet: '#a78bfa',
};

const PROVIDER_OPTIONS: Array<{ id: MediaProviderId; label: string; types: GenType[] }> = [
  { id: 'openai_image', label: 'OpenAI Image', types: ['text_to_image'] },
  { id: 'google_veo', label: 'Google Veo', types: ['text_to_video', 'image_to_video'] },
  { id: 'runway', label: 'Runway', types: ['text_to_video', 'image_to_video'] },
];

const STATUS_LABEL: Record<string, string> = {
  queued: 'รอประมวลผล', processing: 'กำลังสร้าง', completed: 'เสร็จแล้ว', failed: 'ล้มเหลว', cancelled: 'ยกเลิก',
};

function statusColor(status: string) {
  if (status === 'completed') return C.green;
  if (status === 'failed' || status === 'cancelled') return C.red;
  if (status === 'processing') return C.cyan;
  return C.amber;
}

export default function MarketingMediaStudio() {
  const [status, setStatus] = useState<'loading' | 'signed_out' | 'ready' | 'error'>('loading');
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [contentItems, setContentItems] = useState<ContentRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [jobs, setJobs] = useState<MarketingGenerationJob[]>([]);
  const [generationType, setGenerationType] = useState<GenType>('text_to_image');
  const [provider, setProvider] = useState<MediaProviderId>('openai_image');
  const [contentItemId, setContentItemId] = useState('');
  const [sourceAssetId, setSourceAssetId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!supabase) throw new Error('supabase_not_available');
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (!cancelled) setStatus('signed_out');
        return;
      }
      const { data, error } = await supabase.from('workspaces').select('id,name').order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []).map(row => ({ id: String(row.id), name: String(row.name) }));
      if (!cancelled) {
        setWorkspaces(rows);
        const requested = new URL(window.location.href).searchParams.get('workspace');
        setWorkspaceId(requested && rows.some(row => row.id === requested) ? requested : rows[0]?.id ?? '');
        setStatus('ready');
      }
    }
    bootstrap().catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId || !supabase) return;

    Promise.all([
      supabase.from('marketing_content_items').select('id,title,channel,format').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(30),
      supabase.from('marketing_assets').select('id,kind,storage_path,provider,model').eq('workspace_id', workspaceId).eq('kind', 'image').order('created_at', { ascending: false }).limit(30),
      listMarketingGenerationJobs(workspaceId, 30),
    ]).then(([contentResult, assetResult, jobRows]) => {
      if (contentResult.error) throw contentResult.error;
      if (assetResult.error) throw assetResult.error;
      if (cancelled) return;
      setContentItems((contentResult.data ?? []).map(row => ({
        id: String(row.id), title: String(row.title), channel: row.channel ? String(row.channel) : null, format: row.format ? String(row.format) : null,
      })));
      setAssets((assetResult.data ?? []).map(row => ({
        id: String(row.id), kind: String(row.kind), storage_path: String(row.storage_path), provider: row.provider ? String(row.provider) : null, model: row.model ? String(row.model) : null,
      })));
      setJobs(jobRows);
    }).catch(() => {
      if (!cancelled) setMessage('อ่าน Content/Asset/Queue ไม่สำเร็จ');
    });

    return () => { cancelled = true; };
  }, [workspaceId]);

  const availableProviders = useMemo(
    () => PROVIDER_OPTIONS.filter(item => item.types.includes(generationType)),
    [generationType],
  );

  useEffect(() => {
    if (!availableProviders.some(item => item.id === provider)) {
      setProvider(availableProviders[0]?.id ?? 'openai_image');
    }
  }, [availableProviders, provider]);

  async function refreshJobs() {
    if (!workspaceId) return;
    setJobs(await listMarketingGenerationJobs(workspaceId, 30));
  }

  async function submit() {
    if (!workspaceId || !prompt.trim()) return;
    setSubmitting(true);
    setMessage('');
    try {
      const result = await queueMarketingGeneration({
        workspaceId,
        contentItemId: contentItemId || undefined,
        generationType,
        provider,
        sourceAssetId: generationType === 'image_to_video' ? sourceAssetId || undefined : undefined,
        prompt: prompt.trim(),
        motionPrompt: motionPrompt.trim() || undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        durationSeconds: generationType === 'text_to_image' ? undefined : durationSeconds,
        resolution: resolution.trim() || undefined,
        idempotencyKey: crypto.randomUUID(),
      });
      setMessage(result.duplicate ? 'พบงานเดิมจาก idempotency key' : 'สร้างงานใน Queue แล้ว');
      setPrompt('');
      setMotionPrompt('');
      setNegativePrompt('');
      await refreshJobs();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'queue_failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') return <Shell><Panel title="Media Studio">กำลังโหลดระบบสร้างสื่อ…</Panel></Shell>;
  if (status === 'signed_out') return <Shell><Panel title="Media Studio"><p style={{ color: C.muted }}>ต้องเข้าสู่ระบบก่อน เพื่อให้ RLS ตรวจสิทธิ์ Workspace</p><a href="/" style={primaryLink}>กลับไปเข้าสู่ระบบ</a></Panel></Shell>;
  if (status === 'error') return <Shell><Panel title="Media Studio"><span style={{ color: C.red }}>เชื่อมต่อระบบสร้างสื่อไม่สำเร็จ</span></Panel></Shell>;

  return (
    <Shell>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ color: C.violet, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>CEO AI Content Factory</div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 30 }}>Media Generation Queue</h1>
          <p style={{ margin: 0, color: C.muted }}>Provider-neutral architecture · Text→Image · Text→Video · Image→Video</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/marketing-health" style={secondaryLink}>Measurement Health</a>
          <a href="/" style={secondaryLink}>← ระบบหลัก</a>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, .8fr)', gap: 16, alignItems: 'start' }}>
        <Panel title="สร้าง Generation Job">
          <Field label="Workspace">
            <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} style={inputStyle}>
              {workspaces.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </Field>

          <div style={twoCol}>
            <Field label="Generation Type">
              <select value={generationType} onChange={e => setGenerationType(e.target.value as GenType)} style={inputStyle}>
                <option value="text_to_image">Text → Image</option>
                <option value="text_to_video">Text → Video</option>
                <option value="image_to_video">Image → Video</option>
              </select>
            </Field>
            <Field label="Provider">
              <select value={provider} onChange={e => setProvider(e.target.value as MediaProviderId)} style={inputStyle}>
                {availableProviders.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Content Item (ไม่บังคับ)">
            <select value={contentItemId} onChange={e => setContentItemId(e.target.value)} style={inputStyle}>
              <option value="">— ไม่ผูก Content Item —</option>
              {contentItems.map(item => <option key={item.id} value={item.id}>{item.title}{item.channel ? ` · ${item.channel}` : ''}</option>)}
            </select>
          </Field>

          {generationType === 'image_to_video' && (
            <Field label="Source Image Asset">
              <select value={sourceAssetId} onChange={e => setSourceAssetId(e.target.value)} style={inputStyle}>
                <option value="">— เลือกรูปต้นทาง —</option>
                {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.storage_path}</option>)}
              </select>
            </Field>
          )}

          <Field label="Prompt">
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} maxLength={8000} placeholder="อธิบายภาพหรือฉากที่ต้องการสร้าง…" style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          {generationType !== 'text_to_image' && (
            <Field label="Motion Prompt (ไม่บังคับ)">
              <textarea value={motionPrompt} onChange={e => setMotionPrompt(e.target.value)} rows={3} maxLength={4000} placeholder="เช่น slow push-in, natural hand movement, stable camera…" style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
          )}

          <Field label="Negative Prompt (ไม่บังคับ)">
            <textarea value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} rows={2} maxLength={4000} placeholder="สิ่งที่ไม่ต้องการให้เกิดในผลลัพธ์" style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <div style={twoCol}>
            <Field label="Aspect Ratio">
              <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} style={inputStyle}>
                <option value="9:16">9:16 · Short video</option>
                <option value="1:1">1:1 · Square</option>
                <option value="16:9">16:9 · Landscape</option>
              </select>
            </Field>
            {generationType !== 'text_to_image' ? (
              <Field label="Duration (sec)">
                <input type="number" min={1} max={120} value={durationSeconds} onChange={e => setDurationSeconds(Number(e.target.value))} style={inputStyle} />
              </Field>
            ) : (
              <Field label="Resolution (ไม่บังคับ)">
                <input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="เช่น 1024x1536" style={inputStyle} />
              </Field>
            )}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting || !workspaceId || !prompt.trim() || (generationType === 'image_to_video' && !sourceAssetId)}
            style={{ width: '100%', marginTop: 8, border: 0, borderRadius: 12, padding: '12px 16px', fontFamily: 'inherit', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', background: C.violet, color: '#fff', opacity: submitting || !prompt.trim() ? .6 : 1 }}
          >
            {submitting ? 'กำลังเข้าคิว…' : 'เพิ่มงานเข้า Generation Queue →'}
          </button>

          {message && <div style={{ marginTop: 12, color: message.includes('แล้ว') ? C.green : C.amber, fontSize: 13 }}>{message}</div>}

          <div style={{ marginTop: 16, padding: 12, border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, fontSize: 12.5, lineHeight: 1.7 }}>
            ขณะนี้ Queue + RLS + Provider contract พร้อมแล้ว งานจะถูกเก็บแบบ traceable ใน Supabase ส่วน worker ที่เรียก API ของแต่ละ provider จะต่อเป็นขั้นถัดไป จึงไม่แสดงสถานะ “เสร็จแล้ว” จนกว่าจะมี provider response จริง
          </div>
        </Panel>

        <Panel title="Generation Queue">
          <button type="button" onClick={() => void refreshJobs()} style={{ ...secondaryButton, marginBottom: 12 }}>รีเฟรชสถานะ</button>
          <div style={{ display: 'grid', gap: 10 }}>
            {jobs.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13 }}>ยังไม่มีงานสร้างสื่อใน Workspace นี้</div>
            ) : jobs.map(job => {
              const color = statusColor(job.status);
              return (
                <article key={job.id} style={{ border: `1px solid ${C.border}`, background: C.panel2, borderRadius: 12, padding: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{job.generation_type.replaceAll('_', ' → ')}</div>
                    <span style={{ color, border: `1px solid ${color}55`, background: `${color}10`, borderRadius: 999, padding: '3px 8px', fontSize: 10.5 }}>{STATUS_LABEL[job.status] ?? job.status}</span>
                  </div>
                  <div style={{ color: C.violet, fontSize: 11.5, marginTop: 6 }}>{job.provider}{job.model ? ` · ${job.model}` : ''}</div>
                  <div style={{ color: C.muted, fontSize: 12.5, marginTop: 7, lineHeight: 1.55 }}>{job.prompt?.slice(0, 180) || '—'}{(job.prompt?.length ?? 0) > 180 ? '…' : ''}</div>
                  <div style={{ color: C.muted, fontSize: 10.5, marginTop: 8 }}>{new Date(job.created_at).toLocaleString('th-TH')}</div>
                  {job.error_message && <div style={{ color: C.red, fontSize: 11.5, marginTop: 6 }}>{job.error_message}</div>}
                </article>
              );
            })}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Kanit', system-ui, sans-serif", padding: '28px 18px 64px' }}><div style={{ width: 'min(1120px, 100%)', margin: '0 auto' }}>{children}</div></main>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ border: `1px solid ${C.border}`, background: C.panel, borderRadius: 16, padding: 20 }}><div style={{ color: C.violet, fontWeight: 800, marginBottom: 14 }}>{title}</div>{children}</section>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 5 }}>{label}</span>{children}</label>;
}

const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: 10, background: C.panel2, color: C.text, padding: '10px 12px', fontFamily: 'inherit', outline: 'none' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 };
const primaryLink: React.CSSProperties = { display: 'inline-block', background: C.violet, color: '#fff', textDecoration: 'none', fontWeight: 800, borderRadius: 10, padding: '10px 16px' };
const secondaryLink: React.CSSProperties = { display: 'inline-block', border: `1px solid ${C.border}`, color: C.text, textDecoration: 'none', fontWeight: 700, borderRadius: 10, padding: '9px 14px' };
const secondaryButton: React.CSSProperties = { border: `1px solid ${C.border}`, background: C.panel2, color: C.text, borderRadius: 9, padding: '7px 10px', fontFamily: 'inherit', cursor: 'pointer' };
