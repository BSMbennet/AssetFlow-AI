import type { Metadata } from 'next';
import './globals.css';
import './mobile-institutional.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AssetFlow AI — Sovereign Rail OS',
  description: 'Institutional infrastructure for real-world asset intelligence, tokenization, compliance, trading and multi-rail settlement.',
  keywords: 'RWA, private credit, tokenization, settlement, compliance, asset intelligence',
  authors: [{ name: 'AssetFlow AI' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
