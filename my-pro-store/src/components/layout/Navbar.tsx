"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  Search, ShoppingCart, User, Menu, X, LogOut, 
  LayoutDashboard, Package, Heart 
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${searchQuery}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-2xl text-gray-900 tracking-tight">
            MY<span className="text-blue-600">STORE</span>
          </Link>

          {/* 2. Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-auto">
            <form onSubmit={handleSearch} className="relative w-full">
              <input 
                type="text" 
                placeholder="Search for products..." 
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* 3. Navigation Icons */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-blue-600">Shop</Link>
            
            {/* Cart */}
            <Link href="/cart" className="relative text-gray-700 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {/* Badge (Static for now, connect to CartContext later) */}
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                0
              </span>
            </Link>

            {/* User Profile / Login */}
            {!loading && (
              <div className="relative">
                {user ? (
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    {user.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt="Profile" 
                        width={32} 
                        height={32} 
                        className="rounded-full border border-gray-200" 
                      />
                    ) : (
                      <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </button>
                ) : (
                  <Link 
                    href="/login" 
                    className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Login
                  </Link>
                )}

                {/* Dropdown Menu */}
                {showProfileMenu && user && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    {/* Admin Link (Only visible if you want to hardcode check or use custom claims) */}
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LayoutDashboard className="h-4 w-4" /> Admin Panel
                    </Link>

                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
  <Package className="h-4 w-4" /> My Profile & Orders
</Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Expanded) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t p-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
             <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-gray-50 border p-2 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
             <button type="submit" className="absolute right-3 top-2.5 text-gray-500"><Search className="h-4 w-4" /></button>
          </form>
          
          <Link href="/products" className="block font-medium text-gray-900 py-2 border-b">Shop All</Link>
          <Link href="/cart" className="block font-medium text-gray-900 py-2 border-b">Cart (0)</Link>
          
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
  <Package className="h-4 w-4" /> My Profile & Orders
</Link>
              <Link href="/admin" className="block font-medium text-gray-900 py-2">Admin Panel</Link>
              <button onClick={handleLogout} className="block w-full text-left font-medium text-red-600 py-2">Logout</button>
            </>
          ) : (
            <Link href="/login" className="block font-medium text-blue-600 py-2">Login / Sign Up</Link>
          )}
        </div>
      )}
    </nav>
  );
}