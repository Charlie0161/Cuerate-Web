import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cuerate — DJ Mixes & Sets',
  description: 'Discover and share DJ mixes, sets and tracks from the Cuerate community.',
  openGraph: {
    title: 'Cuerate',
    description: 'DJ mixes and sets from the Cuerate community',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
