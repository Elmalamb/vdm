
"use client";

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isModerator: boolean;
  userData: DocumentData | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isModerator: false,
  userData: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setIsModerator(data.role === 'moderateur');
        } else {
            setUserData(null);
            setIsModerator(false);
        }
      } else {
        setUserData(null);
        setIsModerator(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userData, isModerator, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
