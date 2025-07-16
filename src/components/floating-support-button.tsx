
"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { CircleHelp } from 'lucide-react';

export const FloatingSupportButton = () => {
  const { user, isModerator } = useAuth();

  if (!user || isModerator) {
    return null;
  }

  return (
    <Link 
      href="/support" 
      aria-label="Contacter le support" 
      className="fixed bottom-6 right-6 z-30"
    >
      <CircleHelp className="h-12 w-12 text-sky-500 transition-transform hover:scale-110" />
    </Link>
  );
};
