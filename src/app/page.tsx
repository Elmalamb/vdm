
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, PlayCircle, MapPin, Mail, Search, CircleDollarSign } from 'lucide-react';
import { collection, onSnapshot, query, where, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
     <Card className="overflow-hidden relative aspect-square group bg-black">
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
         <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
           <span>Vidéo non disponible</span>
         </div>
       )}
       
       <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer" onClick={togglePlay}>
          {!isPlaying && <PlayCircle className="w-16 h-16 text-white" />}
       </div>

       {!isPlaying && (
         <>
           <div className="absolute top-0 left-0 p-4">
             <p className="text-lg font-bold text-primary-foreground bg-primary/80 rounded-full px-3 py-1">{ad.price}€</p>
           </div>
           <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-between items-end">
               <div>
                 <h3 className="text-sm font-normal text-white truncate">{ad.title}</h3>
                 <div className="flex items-center gap-1 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{ad.postalCode}</span>
                 </div>
               </div>
                <a
                  href={`mailto:${ad.userEmail}?subject=Réponse à votre annonce: ${encodeURIComponent(ad.title)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md text-white hover:bg-white/20"
                  aria-label="Contacter le vendeur"
                >
                  <Mail className="w-6 h-6" />
                </a>
             </div>
           </div>
         </>
       )}
     </Card>
  );
};


export default function HomePage() {
  const { user, isModerator, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [postalCodeFilter, setPostalCodeFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

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

  const filteredAds = ads.filter(ad => {
    const searchTermMatch = searchTerm.trim() === '' || 
                            ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const postalCodeMatch = postalCodeFilter.trim() === '' ||
                            ad.postalCode.startsWith(postalCodeFilter.trim());

    const maxPriceMatch = maxPriceFilter === '' ||
                          ad.price <= parseFloat(maxPriceFilter);

    return searchTermMatch && postalCodeMatch && maxPriceMatch;
  });
  
  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if(isModerator) return null;

  return (
    <>
      <div className="sticky top-14 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Mots-clés (ex: table, chaise)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Code postal..."
                value={postalCodeFilter}
                onChange={(e) => setPostalCodeFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <CircleDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="number"
                placeholder="Prix maximum..."
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-8">
        {filteredAds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Aucune annonce ne correspond à vos critères de recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
