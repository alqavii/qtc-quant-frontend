export const metadata = {
  title: 'QTC Quant Leaderboard',
  description: 'QTC Quant Leaderboard',
};

import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

