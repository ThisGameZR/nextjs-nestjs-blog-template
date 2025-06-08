import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import { Noto_Sans_Newa } from 'next/font/google';

const notoSansNewa = Noto_Sans_Newa({
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Next.js Frontend Template',
  description: 'A modern Next.js frontend template with authentication and user management',
  keywords: ['Next.js', 'React', 'TypeScript', 'Authentication', 'Template'],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={notoSansNewa.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
