
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdDetailPage() {
  const { user, loading: authLoading } = useAuth();
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
          setAdDetails(adSnap.data());
        } else {
          setAdDetails(null);
        }
        setLoading(false);
      };
      fetchAdDetails();
    }
  }, [adId]);

  if (authLoading || loading || !adDetails) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex justify-center">
      <div className="w-full max-w-sm">
        <Card className="overflow-hidden bg-black text-white">
          <CardHeader className="p-0">
            <div className="aspect-w-3 aspect-h-2 relative">
              <Image
                src={adDetails.imageUrl || 'https://placehold.co/600x400.png'}
                alt={adDetails.title}
                layout="fill"
                objectFit="cover"
                data-ai-hint={adDetails.dataAiHint || 'image produit'}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold leading-tight mb-1 truncate">{adDetails.title}</h2>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <p className="text-xl font-bold">{adDetails.price}€</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
