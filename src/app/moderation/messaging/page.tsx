
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db, serverTimestamp } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, type DocumentData, type Timestamp, getDocs } from 'firebase/firestore';

interface Conversation {
  userId: string;
  userEmail: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

const ChatInterface = ({ userId, onSendMessage }: { userId: string, onSendMessage: (userId: string, message: string) => Promise<void> }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, `supportChats/${userId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !userId) return;
    await onSendMessage(userId, newMessage);
    setNewMessage('');
  };
  
  if (!userId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
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


export default function MessagingPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      const supportChatsRef = collection(db, 'supportChats');
      const supportChatsSnapshot = await getDocs(supportChatsRef);
      const convos: Conversation[] = [];
      
      for (const chatDoc of supportChatsSnapshot.docs) {
          const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", chatDoc.id)));
          const userEmail = chatDoc.data().userEmail || "Email inconnu";
          
          convos.push({
              userId: chatDoc.id,
              userEmail: userEmail
          });
      }

      setConversations(convos);
      setLoading(false);
    };

    fetchConversations();
  }, []);

  const handleSendMessage = async (userId: string, message: string) => {
    if (!user) return;
    await addDoc(collection(db, `supportChats/${userId}/messages`), {
      text: message,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
  };

  if(loading){
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  return (
     <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conv) => (
              <TableRow 
                key={conv.userId} 
                onClick={() => setSelectedUserId(conv.userId)}
                className="cursor-pointer"
              >
                <TableCell>{conv.userEmail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <div>
        {selectedUserId ? (
          <ChatInterface userId={selectedUserId} onSendMessage={handleSendMessage}/>
        ) : (
          <Card className="flex items-center justify-center h-[500px]">
            <CardContent>
              <p className="text-muted-foreground">Sélectionnez une conversation pour voir les messages.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
