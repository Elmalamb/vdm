
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
import { collection, query, orderBy, onSnapshot, addDoc, type DocumentData, type Timestamp, getDocs, where, doc, updateDoc, getDoc } from 'firebase/firestore';

interface Conversation {
  userId: string;
  userEmail: string;
  hasUnread?: boolean;
  assignedModeratorId?: string;
  assignedModeratorEmail?: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

const ChatInterface = ({ userId, conversation, onSendMessage }: { userId: string, conversation: Conversation | null, onSendMessage: (userId: string, message: string, isAssigning: boolean) => Promise<void> }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAssignedToCurrentUser = conversation?.assignedModeratorId === user?.uid;
  const isUnassigned = !conversation?.assignedModeratorId;
  const canInteract = isUnassigned || isAssignedToCurrentUser;

  useEffect(() => {
    if (!userId) return;
    setLoadingMessages(true);
    const q = query(collection(db, `supportChats/${userId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !userId || !canInteract) return;
    const isAssigning = isUnassigned;
    await onSendMessage(userId, newMessage, isAssigning);
    setNewMessage('');
  };
  
  if (!userId || !conversation) return null;

  return (
    <Card className="flex flex-col h-[584px]">
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
        <CardDescription>
          {isUnassigned && "Cette conversation n'est pas encore assignée."}
          {conversation.assignedModeratorId && `Assignée à: ${conversation.assignedModeratorEmail}`}
        </CardDescription>
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
            placeholder={canInteract ? "Écrire un message..." : "Conversation assignée à un autre modérateur."}
            disabled={loadingMessages || !canInteract}
          />
          <Button type="submit" size="icon" disabled={loadingMessages || !canInteract}>
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
  const moderatorEmails = useRef<Map<string, string>>(new Map());

  const fetchModeratorEmail = async (uid: string) => {
    if (moderatorEmails.current.has(uid)) {
      return moderatorEmails.current.get(uid);
    }
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const email = userDoc.data().email || "Modérateur inconnu";
      moderatorEmails.current.set(uid, email);
      return email;
    }
    return "Modérateur inconnu";
  };

  useEffect(() => {
    if (!user) return;
  
    const supportChatsRef = collection(db, 'supportChats');
    const unsubscribe = onSnapshot(query(supportChatsRef), async (snapshot) => {
      setLoading(true);
      const convos: Conversation[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        const userEmail = chatData.userEmail || "Email inconnu";
        const moderatorLastRead = chatData.moderatorLastRead?.toMillis() || 0;
        
        const messagesRef = collection(db, `supportChats/${chatDoc.id}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'desc'));
        const messagesSnapshot = await getDocs(q);
        
        let hasUnread = false;
        if (!messagesSnapshot.empty) {
            const lastMessage = messagesSnapshot.docs[0].data();
            if (lastMessage.senderId !== user.uid) {
                const lastMessageTimestamp = lastMessage.timestamp?.toMillis() || 0;
                if (lastMessageTimestamp > moderatorLastRead) {
                    hasUnread = true;
                }
            }
        }
        
        let assignedModeratorEmail = undefined;
        if (chatData.assignedModeratorId) {
          assignedModeratorEmail = await fetchModeratorEmail(chatData.assignedModeratorId);
        }
  
        convos.push({
          userId: chatDoc.id,
          userEmail: userEmail,
          hasUnread: hasUnread,
          assignedModeratorId: chatData.assignedModeratorId,
          assignedModeratorEmail: assignedModeratorEmail,
        });
      }
      
      setConversations(convos.sort((a, b) => (b.hasUnread ? 1 : 0) - (a.hasUnread ? 1 : 0)));
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (userId: string, message: string, isAssigning: boolean) => {
    if (!user) return;
    const chatDocRef = doc(db, 'supportChats', userId);
    
    await addDoc(collection(db, `supportChats/${userId}/messages`), {
      text: message,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
    
    const updateData: DocumentData = {
      moderatorLastRead: serverTimestamp(),
    };

    if (isAssigning) {
      updateData.assignedModeratorId = user.uid;
    }

    await updateDoc(chatDocRef, updateData);
  };

  const handleConversationOpened = async (userId: string) => {
    if (!user) return;
    setSelectedUserId(userId);
    
    const chatDocRef = doc(db, 'supportChats', userId);
    await updateDoc(chatDocRef, {
      moderatorLastRead: serverTimestamp(),
    }).catch(e => console.error("Could not update moderator last read timestamp", e));

    setConversations(prev => prev.map(c => c.userId === userId ? {...c, hasUnread: false} : c));
  };
  
  const selectedConversation = conversations.find(c => c.userId === selectedUserId) || null;

  if(loading){
     return (
      <div className="flex h-[584px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
     <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Modérateur</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conv) => (
              <TableRow 
                key={conv.userId} 
                onClick={() => handleConversationOpened(conv.userId)}
                className="cursor-pointer"
              >
                <TableCell className={conv.hasUnread ? 'font-bold' : ''}>{conv.userEmail}</TableCell>
                <TableCell>{conv.assignedModeratorEmail || 'Non assignée'}</TableCell>
                 <TableCell>
                  {conv.hasUnread && <Badge variant="destructive">Nouveau message</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <div>
        {selectedUserId ? (
          <ChatInterface 
            userId={selectedUserId} 
            conversation={selectedConversation}
            onSendMessage={handleSendMessage} 
          />
        ) : (
          <Card className="flex items-center justify-center h-[584px]">
            <CardContent>
              <p className="text-muted-foreground">Sélectionnez une conversation pour voir les messages.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
