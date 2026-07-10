import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AssetFlow AI - Enterprise RWA Tokenization',
  description: 'Tokenize, manage, and trade real-world assets with AI-powered compliance',
  keywords: 'RWA, Tokenization, Blockchain, AI, Compliance, Asset Management',
  authors: [{ name: 'AssetFlow AI' }],
  openGraph: {
    title: 'AssetFlow AI - Enterprise RWA Tokenization',
    description: 'Tokenize, manage, and trade real-world assets with AI-powered compliance',
    url: 'https://assetflow.ai',
    siteName: 'AssetFlow AI',
    images: [
      {
        url: 'https://assetflow.ai/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
