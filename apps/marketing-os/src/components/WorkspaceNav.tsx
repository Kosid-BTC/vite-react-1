'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/login/actions';

// Jakob's Law: แถบเมนูบนสุดแบบที่ผู้ใช้คุ้น · ไฮไลต์หน้าปัจจุบัน (aria-current) ให้รู้ว่าอยู่ตรงไหน
const ITEMS = [
  { href: 'home', label: 'หน้าหลัก', match: ['home'] },
  { href: 'campaigns/new', label: 'สร้างแคมเปญ', match: ['campaigns'] },
  { href: 'studio', label: 'สร้างสื่อ', match: ['studio', 'content'] },
  { href: 'results', label: 'ผลลัพธ์', match: ['results'] },
  { href: 'brand-rules', label: 'กฎแบรนด์', match: ['brand-rules'] },
] as const;

export function WorkspaceNav({ workspaceSlug, workspaceName }: { workspaceSlug: string; workspaceName?: string }) {
  const pathname = usePathname() ?? '';
  const section = pathname.split('/')[2] ?? '';

  return (
    <nav className="topnav" aria-label="เมนูหลัก">
      <div className="topnav-inner">
        <Link href={`/${workspaceSlug}/home`} className="topnav-brand">
          Marketing OS{workspaceName ? <span className="topnav-ws"> · {workspaceName}</span> : null}
        </Link>
        <ul className="topnav-links">
          {ITEMS.map((item) => {
            const active = (item.match as readonly string[]).includes(section);
            return (
              <li key={item.href}>
                <Link
                  href={`/${workspaceSlug}/${item.href}`}
                  className={active ? 'topnav-link active' : 'topnav-link'}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <form action={logoutAction}>
              <button type="submit" className="topnav-link" style={{ border: 0, background: 'none', font: 'inherit', cursor: 'pointer' }}>
                ออกจากระบบ
              </button>
            </form>
          </li>
        </ul>
      </div>
    </nav>
  );
}
