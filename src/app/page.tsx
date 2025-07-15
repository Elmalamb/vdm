
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, PauseCircle } from 'lucide-react';
import { collection, onSnapshot, query, where, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const AdCard = ({ ad }: { ad: DocumentData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
     if(videoRef.current){
      videoRef.current.currentTime = 0;
    }
  }

  return (
     <Card className="overflow-hidden flex flex-col">
        <CardHeader className="p-0">
           <div className="aspect-square relative bg-black cursor-pointer group" onClick={togglePlay}>
             {ad.videoUrl ? (
               <>
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
                 >
                   Votre navigateur ne supporte pas la balise vidéo.
                 </video>
                 <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {!isPlaying ? (
                       <PlayCircle className="w-16 h-16 text-white" />
                    ) : (
                       <PauseCircle className="w-16 h-16 text-white" />
                    )}
                 </div>
               </>
             ) : (
               <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                 <span>Vidéo non disponible</span>
               </div>
             )}
           </div>
        </CardHeader>
       <CardContent className="p-4 flex-grow">
          <CardTitle className="text-sm font-normal text-muted-foreground mb-1 truncate">{ad.title}</CardTitle>
          <CardDescription>Code Postal: {ad.postalCode}</CardDescription>
       </CardContent>
       <CardFooter className="p-4 pt-0">
          <p className="text-lg font-bold text-primary">{ad.price}€</p>
       </CardFooter>
     </Card>
  );
};


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
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
};
