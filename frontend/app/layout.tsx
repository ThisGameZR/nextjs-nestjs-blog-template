import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import { Castoro } from 'next/font/google';

const castoro = Castoro({
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Board App',
  description: 'Datawow interview project',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={castoro.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
