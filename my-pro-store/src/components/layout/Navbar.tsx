"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  Search, ShoppingCart, User, Menu, X, LogOut, 
  LayoutDashboard, Package, Store 
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useStore } from "@/lib/store";

export default function Navbar() {
  const { user, loading } = useAuth();
  const { cart } = useStore();
  const router = useRouter();
  
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // New state for mobile search
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? cart.length : 0;

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${searchQuery}`);
      setIsMenuOpen(false);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
    router.push("/");
    setIsMenuOpen(false);
    setShowProfileMenu(false);
  };

  // Helper to close menus on navigation
  const closeMenus = () => {
    setIsMenuOpen(false);
    setShowProfileMenu(false);
    setIsSearchOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. Logo */}
          <Link href="/" onClick={closeMenus} className="flex-shrink-0 font-bold text-2xl text-gray-900 tracking-tight">
            rah<span className="text-blue-600">by rabanda</span>
          </Link>

          {/* 2. Desktop Search Bar (Hidden on Mobile) */}
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

          {/* 3. Desktop Navigation (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-blue-600">Shop</Link>
            
            <Link href="/cart" className="relative text-gray-700 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {!loading && (
              <div className="relative">
                {user ? (
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    {user.photoURL ? (
                      <Image src={user.photoURL} alt="Profile" width={32} height={32} className="rounded-full border border-gray-200" />
                    ) : (
                      <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </button>
                ) : (
                  <Link href="/login" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition">
                    Login
                  </Link>
                )}

                {/* Desktop Dropdown */}
                {showProfileMenu && user && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/admin" onClick={closeMenus} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LayoutDashboard className="h-4 w-4" /> Admin Panel
                    </Link>
                    <Link href="/profile" onClick={closeMenus} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Package className="h-4 w-4" /> My Profile & Orders
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Mobile Actions (Visible on Mobile) */}
          <div className="md:hidden flex items-center gap-3">
             {/* Search Toggle */}
             <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-gray-700 p-1">
                <Search className="h-6 w-6" />
             </button>

             {/* Shop Link */}
             <Link href="/products" onClick={closeMenus} className="text-gray-700 p-1">
                <Store className="h-6 w-6" />
             </Link>

             {/* Cart Link */}
             <Link href="/cart" onClick={closeMenus} className="relative text-gray-700 p-1">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
             </Link>

             {/* Menu Toggle */}
             <button 
                className="text-gray-700 p-1"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
             >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
             </button>
          </div>
        </div>
      </div>

      {/* 5. Mobile Search Bar (Expandable) */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
           <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-lg focus:outline-none focus:border-black"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
           </form>
        </div>
      )}

      {/* 6. Mobile Menu (Drawer) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg animate-in slide-in-from-top-5">
          <div className="p-4 space-y-2">
            
            {user && (
               <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-gray-100">
                  {user.photoURL ? (
                      <Image src={user.photoURL} alt="User" width={40} height={40} className="rounded-full" />
                  ) : (
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                  )}
                  <div>
                      <p className="font-semibold text-sm">{user.displayName || "User"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
               </div>
            )}

            <Link href="/" onClick={closeMenus} className="block px-2 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
               Home
            </Link>
            <Link href="/products" onClick={closeMenus} className="block px-2 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
               Shop All
            </Link>
            <Link href="/cart" onClick={closeMenus} className="block px-2 py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
               My Cart ({cartCount})
            </Link>
            
            {user ? (
              <>
                <Link href="/profile" onClick={closeMenus} className="flex items-center gap-2 px-2 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg">
                   <Package className="h-4 w-4" /> My Orders & Profile
                </Link>
                <Link href="/admin" onClick={closeMenus} className="flex items-center gap-2 px-2 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-lg">
                   <LayoutDashboard className="h-4 w-4" /> Admin Panel
                </Link>
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-2 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg mt-2">
                   <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={closeMenus} className="block w-full text-center bg-black text-white font-bold py-3 rounded-lg mt-4">
                 Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}