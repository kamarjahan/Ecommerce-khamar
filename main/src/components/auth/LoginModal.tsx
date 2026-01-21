"use client";

import { useStore } from "@/lib/store";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { toast } from "sonner";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Logged in successfully!");
      closeLoginModal();
    } catch (error) {
      toast.error("Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      }
      closeLoginModal();
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isSignUp ? "Join us to start shopping" : "Login to access your orders & wishlist"}
          </p>
        </div>

        {/* Google Login */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 py-2.5 rounded-lg font-medium text-gray-700 transition"
        >
          {/* Use a proper Google Icon SVG here */}
          <span className="font-bold text-blue-500">G</span> 
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Sign Up" : "Login")}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}