
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, serverTimestamp } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, type DocumentData, type Timestamp } from 'firebase/firestore';
import Image from 'next/image';

// Pour l'instant, nous utilisons des données statiques pour l'annonce.
// Idéalement, celles-ci seraient récupérées de Firestore.
const getAdDetails = (adId: string) => {
  const ads: {[key: string]: any} = {
    "AD001": {
      title: "Vélo de course vintage",
      price: 350,
      postalCode: "75010",
      imageUrl: "https://placehold.co/600x400.png",
      videoUrl: "https://placehold.co/600x400.png", // Remplacer par une vraie URL de vidéo si disponible
      sellerId: "SELLER_ID_123", // L'UID du vendeur
    },
  };
  return ads[adId];
};


interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

const ChatInterface = ({ adId }: { adId: string }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, `chats/${adId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [adId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    await addDoc(collection(db, `chats/${adId}/messages`), {
      text: newMessage,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[500px]">
      <CardTitle className="mb-4">Messagerie</CardTitle>
      <div className="flex-1 overflow-y-auto p-4 bg-muted/50 rounded-md mb-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};


export default function AdDetailPage() {
  const { user, isModerator, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adId = typeof params.id === 'string' ? params.id : '';
  const adDetails = getAdDetails(adId);
  
  // Dans un cas réel, nous vérifierions ici si `user.uid === adDetails.sellerId`
  const isOwner = user?.email?.startsWith('john.doe'); 

  useEffect(() => {
    if (!loading && !isModerator && !isOwner) {
      router.push("/");
    }
  }, [user, isModerator, isOwner, loading, router]);


  if (loading || !adDetails) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isModerator && !isOwner) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{adDetails.title}</CardTitle>
              <CardDescription>
                Prix: {adDetails.price}€ - Code Postal: {adDetails.postalCode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Image de présentation</h3>
                  <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                    <Image src={adDetails.imageUrl} alt={adDetails.title} layout="fill" objectFit="cover" data-ai-hint="vintage bicycle" />
                  </div>
                </div>
                 <div>
                  <h3 className="font-semibold mb-2">Vidéo</h3>
                   <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                    {/* Pour la vidéo, un composant vidéo serait plus approprié */}
                    <Image src={adDetails.videoUrl} alt="Vidéo de l'annonce" layout="fill" objectFit="cover" data-ai-hint="bicycle video" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <ChatInterface adId={adId} />
        </div>
      </div>
    </div>
  );
}
