
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, getDoc, DocumentData, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function AdDetailPage() {
  const { user, isModerator, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adId = typeof params.id === 'string' ? params.id : '';
  const [adDetails, setAdDetails] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (adId) {
      const fetchAdDetails = async () => {
        setLoading(true);
        const adRef = doc(db, 'ads', adId);
        const adSnap = await getDoc(adRef);
        if (adSnap.exists()) {
          const adData = adSnap.data();
          if (adData.status !== 'approved' && !isModerator) {
             setAdDetails(null);
          } else {
            setAdDetails(adData);
            if(adData.status === 'approved') {
                 await updateDoc(adRef, { views: increment(1) });
            }
          }
        } else {
          setAdDetails(null);
        }
        setLoading(false);
      };
      fetchAdDetails();
    }
  }, [adId, isModerator]);

  if (authLoading || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!adDetails) {
    return (
       <div className="flex h-full w-full items-center justify-center">
         <p>Annonce non trouvée ou non disponible.</p>
       </div>
    )
  }

  return (
    <div className="container mx-auto py-8 flex justify-center">
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden">
          {adDetails.videoUrl ? (
            <div className="relative">
              <AspectRatio ratio={16 / 9}>
                <video
                  src={adDetails.videoUrl}
                  controls
                  className="w-full h-full object-cover bg-black"
                  poster={adDetails.imageUrl}
                >
                  Votre navigateur ne supporte pas la balise vidéo.
                </video>
              </AspectRatio>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <CardTitle className="text-3xl font-bold leading-tight text-white shadow-lg">{adDetails.title}</CardTitle>
                <CardDescription className="text-gray-200 shadow-lg">Code Postal: {adDetails.postalCode}</CardDescription>
                <p className="text-4xl font-extrabold mt-4 text-white shadow-lg">{adDetails.price}€</p>
              </div>
            </div>
          ) : (
             <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                   <AspectRatio ratio={1 / 1}>
                     <img
                        src={adDetails.imageUrl || 'https://placehold.co/400x400.png'}
                        alt={adDetails.title}
                        className="rounded-md object-cover w-full h-full"
                        data-ai-hint={adDetails.dataAiHint || 'image produit'}
                      />
                   </AspectRatio>
                </div>
                <div className="md:col-span-1 flex flex-col justify-center">
                  <CardTitle className="text-2xl font-bold leading-tight mb-2">{adDetails.title}</CardTitle>
                  <CardDescription>Code Postal: {adDetails.postalCode}</CardDescription>
                  <p className="text-3xl font-extrabold mt-4">{adDetails.price}€</p>
                </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
