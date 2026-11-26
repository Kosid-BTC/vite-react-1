// Von Restorff: ระดับความรุนแรงต้องต่างกันทั้งสี + ไอคอน + คำ (ไม่พึ่งสีอย่างเดียว เพื่อคนตาบอดสี)
export type Severity = 'info' | 'warning' | 'blocking';

const SEVERITY: Record<Severity, { label: string; icon: string; className: string; rank: number }> = {
  blocking: { label: 'ห้ามเด็ดขาด', icon: '⛔', className: 'badge sev-blocking', rank: 0 },
  warning: { label: 'ควรระวัง', icon: '⚠️', className: 'badge sev-warning', rank: 1 },
  info: { label: 'ข้อมูล', icon: 'ℹ️', className: 'badge sev-info', rank: 2 },
};

export function severityMeta(value: string) {
  return SEVERITY[(value as Severity)] ?? SEVERITY.info;
}

const RULE_TYPE_LABEL: Record<string, string> = {
  forbidden_claim: 'คำกล่าวอ้างต้องห้าม',
  testimonial: 'รีวิว / เคสลูกค้า',
  dark_pattern: 'กลยุทธ์หลอกล่อ',
  message: 'การวางสาร',
  evidence: 'หลักฐาน / สถิติ',
};

export function ruleTypeLabel(value: string) {
  return RULE_TYPE_LABEL[value] ?? value;
}
