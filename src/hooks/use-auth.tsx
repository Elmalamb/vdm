
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isModerator: boolean;
  hasUnreadSupportMessages: boolean;
  hasUnreadMessages: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  const [hasUnreadSupportMessages, setHasUnreadSupportMessages] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        setIsModerator(false);
        setHasUnreadSupportMessages(false);
        setHasUnreadMessages(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;

    if (user) {
      setLoading(true);
      const userDocRef = doc(db, "users", user.uid);
      unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const moderatorStatus = userData.role === 'moderateur';
          setIsModerator(moderatorStatus);
        } else {
          setIsModerator(false);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user role:", error);
        setIsModerator(false);
        setLoading(false);
      });
    } else {
      setIsModerator(false);
      setLoading(false);
    }
    
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHasUnreadSupportMessages(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    if (isModerator) {
      // Logic for moderators (messaging with users)
      const supportChatsRef = collection(db, 'supportChats');
      unsubscribe = onSnapshot(supportChatsRef, async (snapshot) => {
        let hasUnread = false;
        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data();
          const moderatorLastRead = chatData.moderatorLastRead?.toMillis() || 0;
          
          const messagesRef = collection(db, `supportChats/${chatDoc.id}/messages`);
          const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
          const messagesSnapshot = await getDocs(q);

          if (!messagesSnapshot.empty) {
            const lastMessage = messagesSnapshot.docs[0].data();
            if (lastMessage.senderId !== user.uid) {
              const lastMessageTimestamp = lastMessage.timestamp?.toMillis() || 0;
              if (lastMessageTimestamp > moderatorLastRead) {
                hasUnread = true;
                break; 
              }
            }
          }
        }
        setHasUnreadSupportMessages(hasUnread);
      });

    } else {
       // Logic for regular users (support page) - we don't need this listener here as there's no badge for support
       // We'll keep this empty for now, or you could add logic if you decide to show a badge for support messages to users too.
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, isModerator]);

  useEffect(() => {
    if (!user || isModerator) {
        setHasUnreadMessages(false);
        return;
    }

    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        let hasUnread = false;
        for(const doc of snapshot.docs) {
            const data = doc.data();
            const isSeller = data.sellerId === user.uid;
            if (isSeller && data.sellerUnread) {
                hasUnread = true;
                break;
            }
            const isBuyer = data.buyerId === user.uid;
            if (isBuyer && data.buyerUnread) {
                hasUnread = true;
                break;
            }
        };
        setHasUnreadMessages(hasUnread);
    }, (error) => {
        console.error("Error in conversations listener:", error);
        setHasUnreadMessages(false);
    });

    return () => unsubscribe();
  }, [user, isModerator]);


  return (
    <AuthContext.Provider value={{ user, loading, isModerator, hasUnreadSupportMessages, hasUnreadMessages }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
