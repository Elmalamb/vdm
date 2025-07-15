
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

// Données statiques pour les annonces. Idéalement, elles proviendraient de Firestore.
const ads = [
  {
    id: "AD001",
    title: "Vélo de course vintage",
    price: 350,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "vintage bicycle",
  },
  {
    id: "AD002",
    title: "Appareil photo reflex",
    price: 450,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "reflex camera",
  },
   {
    id: "AD003",
    title: "Table basse en chêne",
    price: 120,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "oak coffee table",
  },
   {
    id: "AD004",
    title: "Collection de timbres rares",
    price: 800,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "stamp collection",
  },
  {
    id: "AD005",
    title: "Guitare électrique",
    price: 550,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "electric guitar",
  },
  {
    id: "AD006",
    title: "Fauteuil design scandinave",
    price: 280,
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "scandinavian armchair",
  },
];


export default function HomePage() {
  const { isModerator, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isModerator) {
      router.push('/moderation');
    }
  }, [isModerator, loading, router]);
  
  if (loading || isModerator) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dernières annonces</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {ads.map((ad) => (
          <Link key={ad.id} href={`/ad/${ad.id}`} legacyBehavior>
            <a className="group">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="p-0">
                  <div className="aspect-square relative">
                    <Image 
                      src={ad.imageUrl} 
                      alt={ad.title} 
                      layout="fill" 
                      objectFit="cover" 
                      data-ai-hint={ad.dataAiHint}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold leading-tight mb-1 truncate">{ad.title}</CardTitle>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <p className="text-lg font-bold text-primary">{ad.price}€</p>
                </CardFooter>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};
