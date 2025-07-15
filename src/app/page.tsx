
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Loader2, PlayCircle, MapPin, Mail, Send } from 'lucide-react';
import { collection, onSnapshot, query, where, type DocumentData, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const AdCard = ({ ad }: { ad: DocumentData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
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
    if(videoRef.current){
      videoRef.current.currentTime = 0;
    }
  }

  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    
    setIsSending(true);

    if (user) {
      // Logged-in user logic
      if(user.uid === ad.userId) {
        toast({ title: "Action impossible", description: "Vous ne pouvez pas vous envoyer de message.", variant: "destructive" });
        setIsSending(false);
        return;
      }
      try {
        const conversationId = `${ad.id}_${user.uid}`;
        const conversationRef = doc(db, 'conversations', conversationId);
        
        await setDoc(conversationRef, {
          adId: ad.id,
          adTitle: ad.title,
          sellerId: ad.userId,
          sellerEmail: ad.userEmail,
          buyerId: user.uid,
          buyerEmail: user.email,
          participants: [ad.userId, user.uid],
          lastMessage: message,
          lastMessageTimestamp: serverTimestamp(),
          sellerUnread: true,
          buyerUnread: false,
        }, { merge: true });

        await addDoc(collection(conversationRef, 'messages'), {
          text: message,
          senderId: user.uid,
          timestamp: serverTimestamp(),
        });
        
        toast({ title: "Message envoyé !", description: "Votre message a été envoyé au vendeur." });
        setMessage('');
        setIsDialogOpen(false);
        router.push('/my-messages');
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
      }
    } else {
      // Visitor logic
       if (visitorEmail.trim() === '') {
        toast({ title: "Email requis", description: "Veuillez entrer votre adresse e-mail.", variant: "destructive" });
        setIsSending(false);
        return;
      }
      try {
        // We use a support chat as an intermediary for non-logged-in users.
        // We can create a unique ID for this visitor based on their email for grouping messages.
        const supportChatId = `visitor_${visitorEmail.replace(/[^a-zA-Z0-9]/g, '_')}_ad_${ad.id}`;
        const supportChatRef = doc(db, 'supportChats', supportChatId);

        const initialMessage = `
          Nouveau message d'un visiteur pour l'annonce : "${ad.title}" (ID: ${ad.id})
          Vendeur: ${ad.userEmail}
          Email du visiteur: ${visitorEmail}
          
          Message:
          ${message}
        `;

        await setDoc(supportChatRef, {
            userEmail: `Visiteur: ${visitorEmail}`,
            createdAt: serverTimestamp(),
        }, { merge: true });

        await addDoc(collection(supportChatRef, 'messages'), {
            text: initialMessage,
            senderId: 'visitor',
            timestamp: serverTimestamp(),
        });

        toast({ title: "Message transmis !", description: "Votre message a été transmis au support qui contactera le vendeur." });
        setMessage('');
        setVisitorEmail('');
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Erreur lors de la transmission du message:", error);
        toast({ title: "Erreur", description: "Une erreur est survenue lors de la transmission.", variant: "destructive" });
      }
    }
    setIsSending(false);
  };

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
                    <button onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }} className="p-2 -m-2">
                       <Mail className="w-6 h-6 text-white" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Contacter le vendeur</DialogTitle>
                      <DialogDescription>
                        {user ? `Envoyer un message à propos de l'annonce "${ad.title}".` : "Votre message sera transmis au vendeur par notre équipe."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {!user && (
                         <Input 
                            placeholder="Votre adresse e-mail"
                            type="email"
                            value={visitorEmail}
                            onChange={(e) => setVisitorEmail(e.target.value)}
                         />
                      )}
                      <Textarea 
                        placeholder="Votre message ici..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                          <Button variant="outline">Annuler</Button>
                      </DialogClose>
                      <Button onClick={handleSendMessage} disabled={isSending}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Envoyer
                      </Button>
                    </DialogFooter>
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
      <h1 className="text-3xl font-bold mb-6">Dernières annonces</h1>
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
