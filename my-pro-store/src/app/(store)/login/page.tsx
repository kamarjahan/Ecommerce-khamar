"use client";

import { useState } from "react";
import { auth, provider, db } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login/Signup

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists, if not create in DB
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "customer",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      }

      toast.success(`Welcome back, ${user.displayName}!`);
      router.push("/profile");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Email Login / Signup
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      let user;
      
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        
        // Update Profile Name
        await updateProfile(user, { displayName: name });
        
        // Save to Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          displayName: name,
          role: "customer",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
        toast.success("Account created successfully!");
      } else {
        // --- LOGIN LOGIC ---
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
        
        // Update Last Login
        await setDoc(doc(db, "users", user.uid), { lastLogin: serverTimestamp() }, { merge: true });
        toast.success("Logged in successfully");
      }

      router.push("/profile");
    } catch (error: any) {
      // Friendly Error Messages
      let msg = "Authentication failed";
      if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (error.code === 'auth/email-already-in-use') msg = "Email already in use. Try logging in.";
      if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isSignUp ? "Join us to start shopping" : "Enter your details to access your account"}
          </p>
        </div>

        {/* Google Button */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition mb-6"
        >
          {loading ? (
             <Loader2 className="animate-spin h-5 w-5" />
          ) : (
             <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
          )}
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with email</span></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="email" 
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>{isSignUp ? "Sign Up" : "Sign In"} <ArrowRight className="h-5 w-5" /></>}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-bold text-black hover:underline"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>

        {/* Terms */}
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
                By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
            </p>
        </div>

      </div>
    </div>
  );
}