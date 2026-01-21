"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; // <--- Import your spinner

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Don't set loading false yet, wait for role check
      
      if (currentUser) {
        setUser(currentUser);
        // 1. Sync User to Firestore
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: "customer",
              createdAt: serverTimestamp(),
            });
          } else {
            // Check Admin Role
            if (userSnap.data().role === "admin") {
              setIsAdmin(true);
            }
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- GLOBAL LOADING STATE ---
  // If we are checking auth, block the entire app and show the branded spinner
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
         <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <LoadingSpinner size="xl" />
         </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);