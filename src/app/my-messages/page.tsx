
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, serverTimestamp } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, type DocumentData, type Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface Conversation {
  id: string;
  adTitle: string;
  otherUserEmail: string;
  lastMessage: string;
  unread: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

const ChatInterface = ({ conversationId, onBack }: { conversationId: string, onBack: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    setLoadingMessages(true);
    const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !conversationId) return;
    
    const conversationRef = doc(db, 'conversations', conversationId);
    const messagesRef = collection(conversationRef, 'messages');

    await addDoc(messagesRef, {
      text: newMessage,
      senderId: user.uid,
      timestamp: serverTimestamp()
    });

    const conversationSnap = await doc(db, 'conversations', conversationId).get();
    const conversationData = conversationSnap.data();
    const isSeller = user.uid === conversationData.sellerId;

    await updateDoc(conversationRef, {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
      sellerUnread: !isSeller,
      buyerUnread: isSeller
    });

    setNewMessage('');
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] md:h-[584px]">
       <CardHeader className="flex flex-row items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>Conversation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 bg-muted/50 rounded-md mb-4 relative min-h-0">
          {loadingMessages ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            disabled={loadingMessages}
          />
          <Button type="submit" size="icon" disabled={loadingMessages}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};


export default function MyMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => {
        const data = doc.data();
        const isSeller = data.sellerId === user.uid;
        const otherUserEmail = isSeller ? data.buyerEmail : data.sellerEmail;
        const unread = isSeller ? data.sellerUnread : data.buyerUnread;
        return {
          id: doc.id,
          adTitle: data.adTitle,
          otherUserEmail,
          lastMessage: data.lastMessage,
          unread,
        }
      });
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    if (!user) return;

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await conversationRef.get();
    const conversationData = conversationSnap.data();
    
    const isSeller = user.uid === conversationData.sellerId;
    
    if (isSeller && conversationData.sellerUnread) {
      await updateDoc(conversationRef, { sellerUnread: false });
    } else if (!isSeller && conversationData.buyerUnread) {
      await updateDoc(conversationRef, { buyerUnread: false });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const ConversationList = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mes Messages</CardTitle>
        <CardDescription>Consultez vos conversations avec les acheteurs et les vendeurs.</CardDescription>
      </CardHeader>
      <CardContent>
        {conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map(conv => (
              <button 
                key={conv.id} 
                className="w-full text-left p-4 rounded-lg hover:bg-muted flex items-start gap-4"
                onClick={() => handleConversationSelect(conv.id)}
              >
                <Avatar>
                    <AvatarFallback>{conv.otherUserEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className={cn("font-semibold", conv.unread && "text-primary")}>{conv.otherUserEmail}</p>
                        {conv.unread && <Badge>Nouveau</Badge>}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground truncate">Annonce: {conv.adTitle}</p>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Vous n'avez aucune conversation.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-1 gap-8">
        {selectedConversationId ? (
          <ChatInterface conversationId={selectedConversationId} onBack={() => setSelectedConversationId(null)} />
        ) : (
          <ConversationList />
        )}
      </div>
    </div>
  );
}
