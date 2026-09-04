import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';
import './executive-growth.css';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300','400','500','600','700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CEO AI Thailand — Executive Growth Dashboard',
  description: 'ภาพรวมธุรกิจและ Next Best Actions สำหรับ CEO AI Thailand',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={kanit.className}>{children}</body>
    </html>
  );
}
