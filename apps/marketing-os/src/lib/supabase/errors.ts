/** 42501 = ฐานปฏิเสธสิทธิ์ (ตั้งใจ) — แยกจาก error จริง เพื่อแสดงข้อความแทนการพังทั้งหน้า
 *  ADR-0016 ข้อ 6: บางตาราง/rpc ยังเปิดให้ service_role เท่านั้นโดยเจตนา */
export function isPermissionDenied(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === '42501';
}

export async function readOrDenied<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; denied: true }> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (isPermissionDenied(e)) return { ok: false, denied: true };
    throw e;
  }
}
