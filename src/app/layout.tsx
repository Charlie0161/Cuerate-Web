import type { Metadata } from 'next';
import './globals.css';

const BASE_URL = 'https://cuerate.co.uk';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Cuerate — DJ Mixes, Sets & Community',
    template: '%s | Cuerate',
  },
  description: 'Discover and share DJ mixes, sets and tracks. Find DJs, browse venues, post gig slots and build better sets with the Cuerate community.',
  keywords: ['DJ', 'mixes', 'sets', 'house music', 'techno', 'drum and bass', 'DJ directory', 'gig booking'],
  openGraph: {
    type: 'website',
    siteName: 'Cuerate',
    title: 'Cuerate — DJ Mixes, Sets & Community',
    description: 'Discover and share DJ mixes, sets and tracks. Find DJs, browse venues and book gigs.',
    url: BASE_URL,
    images: [
      {
        url: '/api/og?type=default',
        width: 1200,
        height: 630,
        alt: 'Cuerate — DJ Companion App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cuerate — DJ Mixes, Sets & Community',
    description: 'Discover and share DJ mixes, sets and tracks. Find DJs, browse venues and book gigs.',
    images: ['/api/og?type=default'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
