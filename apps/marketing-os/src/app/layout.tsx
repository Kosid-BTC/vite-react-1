import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';
import './reference-ui-v2.css';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300','400','500','600','700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CEO AI Marketing OS',
  description: 'วางแผน สร้าง ทดสอบ และพัฒนาการตลาดอย่างเป็นระบบ',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={kanit.className}>{children}</body>
    </html>
  );
}
