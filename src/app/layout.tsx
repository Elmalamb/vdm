import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Black Void',
  description: 'A pure black screen for ultimate focus and immersion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
