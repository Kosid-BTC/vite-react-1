// แปลค่าภายในระบบเป็นคำที่ผู้ใช้เข้าใจ (Mental Model) — หน้าจอห้ามโชว์ค่าดิบจากฐานข้อมูล

const APPROVAL: Record<string, { label: string; className: string }> = {
  pending: { label: 'รอตรวจ', className: 'badge sev-warning' },
  approved: { label: 'อนุมัติแล้ว', className: 'badge' },
  rejected: { label: 'ไม่อนุมัติ', className: 'badge sev-blocking' },
  changes_requested: { label: 'ขอให้แก้ไข', className: 'badge sev-warning' },
};
export function approvalMeta(status: string) {
  return APPROVAL[status] ?? { label: 'ไม่ทราบสถานะ', className: 'badge sev-info' };
}

const ASSET_TYPE: Record<string, string> = {
  image: 'ภาพ',
  thumbnail: 'ภาพปก',
  video: 'วิดีโอ',
  audio: 'เสียง',
  subtitle: 'คำบรรยาย',
};
export function assetTypeLabel(type: string) {
  return ASSET_TYPE[type] ?? 'ไฟล์';
}

/** ชื่อไฟล์อย่างเดียว ไม่โชว์ path ภายใน storage */
export function fileName(path: string) {
  return path.split('/').filter(Boolean).pop() ?? path;
}

const CHANNEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  line: 'LINE',
  youtube: 'YouTube',
  google: 'Google',
  linkedin: 'LinkedIn',
  email: 'อีเมล',
};
const MEDIUM: Record<string, string> = {
  social: 'โพสต์ปกติ',
  organic: 'โพสต์ปกติ',
  paid_social: 'โฆษณา',
  cpc: 'โฆษณา',
  paid: 'โฆษณา',
  email: 'อีเมล',
  referral: 'ลิงก์แนะนำ',
};
export function channelLabel(source: string, medium: string) {
  const s = CHANNEL[source.toLowerCase()] ?? source;
  const m = MEDIUM[medium.toLowerCase()] ?? medium;
  return `${s} · ${m}`;
}
