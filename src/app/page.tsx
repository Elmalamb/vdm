
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, where, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CardDescription } from '@/components/ui/card';

export default function HomePage() {
  const { user, isModerator, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && isModerator) {
      router.push('/moderation');
    }
  }, [isModerator, authLoading, router]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "ads"), where("status", "==", "approved"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const adsData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        adsData.push({ id: doc.id, ...doc.data() });
      });
      setAds(adsData);
      setLoading(false);
    }, (error) => {
      console.error("Erreur Firestore:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if(isModerator) return null;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dernières annonces</h1>
      {ads.length === 0 ? (
        <p>Aucune annonce à afficher pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="aspect-square relative bg-black">
                  {ad.videoUrl ? (
                    <video
                      src={ad.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster={ad.imageUrl}
                    >
                      Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      <span>Vidéo non disponible</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg font-semibold leading-tight mb-1 truncate">{ad.title}</CardTitle>
                <CardDescription>Code Postal: {ad.postalCode}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <p className="text-lg font-bold text-primary">{ad.price}€</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
