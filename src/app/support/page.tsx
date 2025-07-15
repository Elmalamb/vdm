
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, serverTimestamp } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, type Timestamp, doc, setDoc } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

export default function SupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!user) return;

    const messagesCollectionRef = collection(db, `supportChats/${user.uid}/messages`);
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user]);
  
  useEffect(() => {
    if (user && messages.length > 0) {
      const chatDocRef = doc(db, 'supportChats', user.uid);
      setDoc(chatDocRef, { userLastRead: serverTimestamp() }, { merge: true });
    }
  }, [user, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || isSending) return;

    setIsSending(true);
    const chatDocRef = doc(db, 'supportChats', user.uid);
    
    try {
      await setDoc(chatDocRef, { 
        userEmail: user.email,
        userLastRead: serverTimestamp(),
      }, { merge: true });
      
      await addDoc(collection(db, `supportChats/${user.uid}/messages`), {
        text: newMessage,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });
    
      setNewMessage('');
    } catch(error) {
        console.error("Erreur détaillée lors de l'envoi du message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center flex-1">
      <Card className="w-full max-w-2xl flex flex-col h-full">
        <CardHeader>
          <CardTitle>Contacter le support</CardTitle>
          <CardDescription>Envoyez un message à notre équipe de modération.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 bg-muted/50 rounded-md mb-4 space-y-4">
            {messages.map((msg) => (
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
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
