import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '우리반 학급홈페이지',
  description: '우리의 꿈과 추억이 자라나는 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
