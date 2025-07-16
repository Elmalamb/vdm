
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, MapPin, Eye, Pencil } from 'lucide-react';
import { collection, onSnapshot, query, where, type DocumentData, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdCard = ({ ad, onEdit }: { ad: DocumentData, onEdit: (adId: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleCardClick = () => {
    router.push(`/ad/${ad.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(ad.id);
  };

  return (
    <Card className="overflow-hidden relative aspect-square group bg-black cursor-pointer" onClick={handleCardClick}>
      {ad.videoUrl ? (
        <video
          ref={videoRef}
          src={ad.videoUrl}
          playsInline
          loop={false}
          className="w-full h-full object-cover"
          poster={ad.imageUrl}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        >
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      ) : (
        <img
          src={ad.imageUrl || 'https://placehold.co/400x400.png'}
          alt={ad.title}
          className="w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={togglePlay}>
        {!isPlaying && ad.videoUrl && <PlayCircle className="w-16 h-16 text-white hidden md:block" />}
      </div>
      
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 left-2 z-10 h-8 w-8"
        onClick={handleEditClick}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Modifier l'annonce</span>
      </Button>

      {!isPlaying && (
        <>
          <div className="absolute top-0 right-0 m-2 z-10">
            <div className="flex items-center gap-2 text-primary-foreground bg-primary/80 rounded-full px-3 py-1 text-sm">
                <Eye className="w-4 h-4" />
                <span>{ad.views || 0}</span>
              </div>
           </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-between items-end">
              <div className="min-w-0">
                 <p className="text-lg font-bold text-primary-foreground">{ad.price}€</p>
                <h3 className="text-sm font-normal text-white">{ad.title}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{ad.postalCode}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default function MyAdsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (user) {
      setLoading(true);
      const q = query(
        collection(db, "ads"),
        where("userId", "==", user.uid),
        where("status", "==", "approved")
      );
      unsubscribe = onSnapshot(q, (querySnapshot) => {
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
    } else {
      setAds([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleEdit = (adId: string) => {
    router.push(`/my-ads/edit/${adId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
       <h1 className="text-2xl font-semibold tracking-tight mb-8">{user?.email}</h1>

      {ads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Vous n'avez aucune annonce active pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
