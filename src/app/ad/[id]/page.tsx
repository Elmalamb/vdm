
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { doc, getDoc, DocumentData, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';

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
      <div className="w-full max-w-2xl">
        <Card className="overflow-hidden">
          {adDetails.videoUrl && (
             <CardHeader className="p-0">
               <AspectRatio ratio={16 / 9}>
                 <video
                   src={adDetails.videoUrl}
                   controls
                   className="w-full h-full object-cover bg-black"
                 >
                   Votre navigateur ne supporte pas la balise vidéo.
                 </video>
               </AspectRatio>
            </CardHeader>
          )}
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
               <div className="aspect-square relative">
                 <Image
                    src={adDetails.imageUrl || 'https://placehold.co/400x400.png'}
                    alt={adDetails.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                    data-ai-hint={adDetails.dataAiHint || 'image produit'}
                  />
               </div>
            </div>
            <div className="md:col-span-2">
              <CardTitle className="text-2xl font-bold leading-tight mb-2">{adDetails.title}</CardTitle>
              <CardDescription>Code Postal: {adDetails.postalCode}</CardDescription>
              <p className="text-3xl font-extrabold mt-4">{adDetails.price}€</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
