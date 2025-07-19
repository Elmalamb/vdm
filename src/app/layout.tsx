import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { FloatingSupportButton } from '@/components/floating-support-button';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VenteDémo - Annonces',
  description: 'Une plateforme de démonstration pour vendre et acheter des articles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
            <FloatingSupportButton />
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
