import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LOS NORMIES',
  description: 'Post anywhere on an infinite canvas. Completely anonymous.',
};

import CRTOverlay from '@/components/CRTOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <CRTOverlay />
        {children}
      </body>
    </html>
  );
}