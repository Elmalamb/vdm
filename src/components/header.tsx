import Link from 'next/link';
import { Package2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <Package2 className="h-6 w-6" />
        <span className="font-bold">Black Void</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </nav>
    </header>
  );
}
