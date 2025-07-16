
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
      className="fixed bottom-20 right-4 h-14 w-14 bg-sky-500 rounded-full flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors z-30"
    >
      <svg
        className="h-8 w-8 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.09 9.00002C9.3251 8.33168 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15848 13.7588 7.52153 14.2151 8.06353C14.6714 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 17H12.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
};
