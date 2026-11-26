import { useMemo, useState } from 'react';
import {
  calculateAssessment, DIMENSIONS, type AssessmentInput,
  type DimensionId, type EvidenceLevel, type EvidenceRecord, type EvidenceSource,
} from '../lib/businessEvolution';
import { BUSINESS_ASSESSMENT_QUESTIONS } from '../lib/businessEvolution/questionnaire';

/**
 * Qualification-only component. Not mounted in production routing.
 * No localStorage, network calls, PII upload, or AI-generated numeric scores.
 * Pass the authenticated workspace ID after the persistence/RLS gate is approved.
 */
export default function BusinessEvolutionAssessment({ organizationId }: { organizationId: string }) {
  const [scores, setScores] = useState<Partial<Record<DimensionId, string>>>({});
  const [references, setReferences] = useState<Partial<Record<DimensionId, string>>>({});
  const [notes, setNotes] = useState<Partial<Record<DimensionId, string>>>({});
  const [sources, setSources] = useState<Partial<Record<DimensionId, EvidenceSource>>>({});
  const [levels, setLevels] = useState<Partial<Record<DimensionId, EvidenceLevel>>>({});
  const [consents, setConsents] = useState<Partial<Record<DimensionId, boolean>>>({});
  const [criticalLiquidityRisk, setCriticalLiquidityRisk] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const assessment = useMemo((): AssessmentInput => {
    const evidence: EvidenceRecord[] = [];
    const ratings: AssessmentInput['ratings'][number][] = [];
    for (const dimension of DIMENSIONS) {
      const id = dimension.id;
      const scoreText = scores[id]?.trim() ?? '';
      const score = Number(scoreText);
      const evidenceId = 'draft-' + id;
      if (references[id]?.trim() && notes[id]?.trim() && consents[id]) {
        evidence.push({
          id: evidenceId, organizationId, dimension: id,
          source: sources[id] ?? 'survey', level: levels[id] ?? 'self_reported',
          capturedAt: new Date().toISOString(), reference: references[id]!.trim(),
          description: notes[id]!.trim(), consentRecorded: true,
        });
      }
      if (scoreText !== '' && Number.isFinite(score) && score >= 0 && score <= 100) {
        ratings.push({ dimension: id, score, evidenceIds: [evidenceId] });
      }
    }
    return { organizationId, evidence, ratings, criticalLiquidityRisk };
  }, [organizationId, scores, references, notes, sources, levels, consents, criticalLiquidityRisk]);

  const result = useMemo(() => organizationId.trim() ? calculateAssessment(assessment) : null, [assessment, organizationId]);
  const questionFor = (id: DimensionId) => BUSINESS_ASSESSMENT_QUESTIONS.find(q => q.dimension === id);

  return (
    <section aria-labelledby="bei-title" style={{ maxWidth: 850, margin: '0 auto', padding: 24 }}>
      <h1 id="bei-title">วินิจฉัยวิวัฒนาการธุรกิจ</h1>
      <p>ต้นแบบเพื่อการทดสอบเท่านั้น — ไม่บันทึกข้อมูลลงเซิร์ฟเวอร์ และไม่ใช่การพยากรณ์โอกาสรอดของธุรกิจ</p>
      <p>กรอกคะแนนจากการประเมินโดยมนุษย์ (0–100) และระบุหลักฐานของแต่ละด้าน คะแนนรวมจะไม่แสดงจนกว่าหลักฐานครบทั้ง 6 ด้าน</p>
      {!organizationId.trim() && <p role="alert">ยังไม่มี Workspace ที่ยืนยันตัวตน — ไม่สามารถประเมินได้</p>}
      <form onSubmit={event => { event.preventDefault(); setSubmitted(true); }}>
        {DIMENSIONS.map(dimension => {
          const id = dimension.id;
          const question = questionFor(id);
          return (
            <fieldset key={id} style={{ border: '1px solid #ccd5df', borderRadius: 12, margin: '16px 0', padding: 16 }}>
              <legend><strong>{dimension.labelTh} ({Math.round(dimension.weight * 100)}%)</strong></legend>
              <p>{question?.promptTh}</p>
              <p style={{ color: '#536171' }}>หลักฐานที่ควรใช้: {question?.evidenceHintTh}</p>
              <label htmlFor={'bei-score-' + id}>คะแนนจากผู้ประเมิน (0–100)</label>
              <input id={'bei-score-' + id} type="number" min={0} max={100} step={1}
                value={scores[id] ?? ''} onChange={e => { setScores(p => ({ ...p, [id]: e.target.value })); setSubmitted(false); }}
                style={{ display: 'block', width: '100%', marginBottom: 12 }} />
              <label htmlFor={'bei-reference-' + id}>รหัสอ้างอิงหลักฐานภายใน (ไม่ใส่ข้อมูลส่วนบุคคล)</label>
              <input id={'bei-reference-' + id} type="text" maxLength={120}
                value={references[id] ?? ''} onChange={e => { setReferences(p => ({ ...p, [id]: e.target.value })); setSubmitted(false); }}
                style={{ display: 'block', width: '100%', marginBottom: 12 }} />
              <label htmlFor={'bei-note-' + id}>คำอธิบายหลักฐาน</label>
              <textarea id={'bei-note-' + id} maxLength={500} rows={2}
                value={notes[id] ?? ''} onChange={e => { setNotes(p => ({ ...p, [id]: e.target.value })); setSubmitted(false); }}
                style={{ display: 'block', width: '100%', marginBottom: 12 }} />
              <label htmlFor={'bei-source-' + id}>แหล่งที่มา</label>
              <select id={'bei-source-' + id} value={sources[id] ?? 'survey'}
                onChange={e => { setSources(p => ({ ...p, [id]: e.target.value as EvidenceSource })); setSubmitted(false); }}
                style={{ display: 'block', marginBottom: 12 }}>
                <option value="survey">แบบสอบถาม</option>
                <option value="financial_record">ข้อมูลการเงิน</option>
                <option value="product_analytics">ข้อมูลการใช้ผลิตภัณฑ์</option>
                <option value="crm">CRM</option>
                <option value="qms">QMS</option>
                <option value="other">อื่น ๆ</option>
              </select>
              <label htmlFor={'bei-level-' + id}>ระดับการยืนยัน</label>
              <select id={'bei-level-' + id} value={levels[id] ?? 'self_reported'}
                onChange={e => { setLevels(p => ({ ...p, [id]: e.target.value as EvidenceLevel })); setSubmitted(false); }}
                style={{ display: 'block', marginBottom: 12 }}>
                <option value="self_reported">ผู้ประเมินแจ้งเอง</option>
                <option value="observed">มีการสังเกต</option>
                <option value="verified">ตรวจหลักฐานแล้ว (ต้องยืนยันจริง)</option>
              </select>
              <label><input type="checkbox" checked={consents[id] ?? false}
                onChange={e => { setConsents(p => ({ ...p, [id]: e.target.checked })); setSubmitted(false); }} />
                {' '}ยืนยันว่ามีสิทธิใช้ข้อมูลนี้เพื่อการประเมิน และได้บันทึกการยินยอมหรือฐานกฎหมายที่เกี่ยวข้องแล้ว
              </label>
            </fieldset>
          );
        })}
        <label><input type="checkbox" checked={criticalLiquidityRisk}
          onChange={e => { setCriticalLiquidityRisk(e.target.checked); setSubmitted(false); }} />
          {' '}พบความเสี่ยงสภาพคล่องวิกฤต (ต้องตรวจทันที ไม่ว่าคะแนนรวมเท่าใด)
        </label>
        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={!organizationId.trim()}>ประมวลผลคะแนนจากหลักฐาน</button>
        </div>
      </form>
      {submitted && result && (
        <section aria-live="polite" aria-label="ผลประเมิน" style={{ marginTop: 24 }}>
          <h2>ผลการประเมิน</h2>
          <p>ความครบถ้วนของหลักฐาน: {Math.round(result.evidenceCoverage * 100)}%</p>
          <p>สถานะ: {result.status === 'complete' ? 'ครบทั้ง 6 มิติ' : 'ข้อมูลยังไม่ครบ'}</p>
          <p><strong>BES: {result.score === null ? 'ยังคำนวณไม่ได้' : result.score.toFixed(2) + ' / 100'}</strong></p>
          {result.missingDimensions.length > 0 && (
            <p>ยังขาด: {result.missingDimensions.map(id => DIMENSIONS.find(d => d.id === id)?.labelTh).join(', ')}</p>
          )}
          {result.warnings.includes('critical_liquidity_risk_requires_immediate_review') && (
            <p role="alert" style={{ fontWeight: 'bold' }}>ตรวจสอบความเสี่ยงสภาพคล่องโดยเร่งด่วน</p>
          )}
          <p>ข้อจำกัด: คะแนนเป็นเกณฑ์วินิจฉัยเบื้องต้น ยังไม่ผ่านการสอบเทียบกับผลลัพธ์ธุรกิจจริง</p>
        </section>
      )}
    </section>
  );
}
