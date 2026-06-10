import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BoothBuddy — DJ Mixes & Sets',
  description: 'Discover and share DJ mixes, sets and tracks from the BoothBuddy community.',
  openGraph: {
    title: 'BoothBuddy',
    description: 'DJ mixes and sets from the BoothBuddy community',
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
