
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      dataAiHint: "vintage bicycle",
      sellerId: "SELLER_ID_123", // L'UID du vendeur
    },
    "AD002": {
      title: "Appareil photo reflex",
      price: 450,
      postalCode: "69002",
      imageUrl: "https://placehold.co/600x400.png",
      dataAiHint: "reflex camera",
      sellerId: "SELLER_ID_456",
    },
     "AD003": {
      title: "Table basse en chêne",
      price: 120,
      postalCode: "33000",
      imageUrl: "https://placehold.co/600x400.png",
      dataAiHint: "oak coffee table",
      sellerId: "SELLER_ID_789",
    },
     "AD004": {
      title: "Collection de timbres rares",
      price: 800,
      postalCode: "75001",
      imageUrl: "https://placehold.co/600x400.png",
      dataAiHint: "stamp collection",
      sellerId: "SELLER_ID_101",
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
    if (!adId) return;
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
    if (newMessage.trim() === '' || !user || !adId) return;
    
    await addDoc(collection(db, `chats/${adId}/messages`), {
        text: newMessage,
        senderId: user.uid,
        timestamp: serverTimestamp(),
    });

    setNewMessage('');
  };
  
  if (!adId) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Conversation avec un modérateur</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
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
      </CardContent>
    </Card>
  );
};


export default function AdDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adId = typeof params.id === 'string' ? params.id : '';
  const adDetails = getAdDetails(adId);
  
  useEffect(() => {
    if (!loading && !user) {
       router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !adDetails) {
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
                      src={adDetails.imageUrl} 
                      alt={adDetails.title} 
                      layout="fill" 
                      objectFit="cover" 
                      data-ai-hint={adDetails.dataAiHint}
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

              {user && <ChatInterface adId={adId} />}
        </div>
    </div>
  );
}
