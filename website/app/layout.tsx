import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/top-nav';

export const metadata: Metadata = {
  metadataBase: new URL('https://android-skill.vercel.app'),
  title: {
    default: 'ANDROID-SKILL',
    template: '%s | ANDROID-SKILL'
  },
  description: 'Production-ready Android skills for AI coding agents.',
  openGraph: {
    title: 'ANDROID-SKILL',
    description: 'Install Android-focused agent skills with one command.',
    images: ['/opengraph-image']
  },
  alternates: { canonical: '/' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
