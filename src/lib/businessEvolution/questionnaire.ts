import type { DimensionId } from './index';
export interface AssessmentQuestion {
  id: string;
  dimension: DimensionId;
  promptTh: string;
  evidenceHintTh: string;
}
/** Discovery questions only; user answers must not automatically become scores. */
export const BUSINESS_ASSESSMENT_QUESTIONS: readonly AssessmentQuestion[] = [
  { id: 'identity_01', dimension: 'identity_vrio', promptTh: 'ลูกค้าเลือกธุรกิจคุณแทนคู่แข่งเพราะอะไร?', evidenceHintTh: 'หลักฐานการซื้อซ้ำหรือเหตุผลที่ลูกค้าเลือก' },
  { id: 'finance_01', dimension: 'financial_resilience', promptTh: 'เงินสดสำรองเพียงพอต่อค่าใช้จ่ายกี่เดือน?', evidenceHintTh: 'กระแสเงินสดและต้นทุนคงที่ล่าสุด' },
  { id: 'pmf_01', dimension: 'product_market_fit', promptTh: 'ลูกค้ากลุ่มเดิมกลับมาซื้อหรือใช้งานต่อมากน้อยเพียงใด?', evidenceHintTh: 'Cohort retention และยอดขายที่ชำระเงินจริง' },
  { id: 'growth_01', dimension: 'growth_economics', promptTh: 'ต้นทุนหาลูกค้าและกำไรต่อหนึ่งลูกค้าเป็นเท่าไร?', evidenceHintTh: 'ต้นทุนการตลาด ยอดลูกค้าใหม่ และกำไรขั้นต้น' },
  { id: 'adapt_01', dimension: 'adaptability_plc', promptTh: 'ครั้งล่าสุดที่ทดลองปรับผลิตภัณฑ์จากข้อมูลลูกค้าคือเมื่อไร?', evidenceHintTh: 'สมมติฐานการทดลองและผลลัพธ์ก่อน/หลัง' },
  { id: 'ops_01', dimension: 'operational_excellence', promptTh: 'ปัญหาที่เกิดซ้ำได้รับการแก้ไขและตรวจประสิทธิผลอย่างไร?', evidenceHintTh: 'NCR/CAPA และหลักฐานการติดตามผล' },
];
