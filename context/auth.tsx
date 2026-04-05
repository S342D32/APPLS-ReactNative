import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { store } from '@/store';
import { setSession, clearSession, setLoading } from '@/store/slices/authSlice';
import { BASE_URL } from '@/services/api';

type AuthContextType = {
  user: User | null;   // Firebase user object
  isLoading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoadingLocal] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      store.dispatch(setLoading(true));

      if (firebaseUser) {
        await syncWithBackend(firebaseUser);
      } else {
        // Logged out — wipe Redux auth state (redux-persist clears AsyncStorage too)
        store.dispatch(clearSession());
      }

      setIsLoadingLocal(false);
    });

    return unsubscribe;
  }, []);

  // Exchange Firebase ID token for backend JWT, store result in Redux
  const syncWithBackend = async (firebaseUser: User) => {
    try {
      const firebaseToken = await firebaseUser.getIdToken();

      const res = await fetch(`${BASE_URL}/api/auth/firebase-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseToken}`,
        },
      });

      if (!res.ok) throw new Error('firebase-sync failed');

      const data = await res.json();

      // Dispatch to Redux — redux-persist will save this to AsyncStorage automatically
      store.dispatch(
        setSession({
          jwtToken: data.accessToken,
          backendUser: data.user,
        })
      );
    } catch (e) {
      console.error('[Auth] firebase-sync error:', e);
      store.dispatch(clearSession());
    }
  };

  const logout = async () => {
    await signOut(auth);
    // clearSession dispatched automatically via onAuthStateChanged above
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
