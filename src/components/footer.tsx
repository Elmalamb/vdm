
"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { CircleHelp } from 'lucide-react';

export const Footer = () => {
  const { user, isModerator } = useAuth();

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-background border-t py-4 text-center text-sm text-muted-foreground z-20">
      <div className="container mx-auto flex justify-center items-center relative">
        <p>&copy; {new Date().getFullYear()} VenteDémo. Tous droits réservés.</p>
        {user && !isModerator && (
          <Link href="/support" aria-label="Contacter le support" className="absolute right-4">
            <CircleHelp className="h-6 w-6 text-sky-400 hover:text-sky-300 transition-colors" />
          </Link>
        )}
      </div>
    </footer>
  );
};
