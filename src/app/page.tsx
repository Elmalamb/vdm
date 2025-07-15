
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Loader2, PlayCircle, MapPin, Mail } from 'lucide-react';
import { collection, onSnapshot, query, where, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { forwardVisitorMessage } from '@/ai/flows/visitor-message-flow';


const contactSchema = z.object({
  visitorEmail: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  message: z.string().min(10, { message: "Votre message doit contenir au moins 10 caractères." }),
});


const AdCard = ({ ad }: { ad: DocumentData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      visitorEmail: "",
      message: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleSendMessage = async (values: z.infer<typeof contactSchema>) => {
    try {
      const result = await forwardVisitorMessage({
        visitorEmail: values.visitorEmail,
        visitorMessage: values.message,
        adTitle: ad.title,
        sellerEmail: ad.userEmail,
      });

      if (result.success) {
        toast({
          title: "Message envoyé !",
          description: "Votre message a été transmis au vendeur.",
        });
        setIsDialogOpen(false);
        form.reset();
      } else {
        throw new Error("L'envoi a échoué");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };


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
           <div className="absolute top-0 right-0 p-4">
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-6 h-6" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Contacter le vendeur</DialogTitle>
                      <DialogDescription>
                        Envoyez un message au vendeur pour l'annonce "{ad.title}". Votre email ne sera pas partagé, il recevra votre message et pourra vous répondre.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSendMessage)} className="grid gap-4 py-4">
                        <FormField
                          control={form.control}
                          name="visitorEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="email" placeholder="Votre email pour la réponse" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea placeholder="Votre message..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Envoyer
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
      {ads.length === 0 ? (
        <p>Aucune annonce à afficher pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
};
