"use client";
import Link from "next/link";
import { ShoppingCart, User, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Navbar() {
  const { cart, openLoginModal } = useStore();
  const { user } = useAuth(); // <--- Get Real User Statu

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
          <span>MyProStore</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 items-center max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
    {user ? (
      <Link href="/orders" className="flex items-center gap-2">
         {/* Show User Avatar or Initials */}
         {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border" />
         ) : (
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
               {user.email?.charAt(0).toUpperCase()}
            </div>
         )}
      </Link>
      
    ) : (
      <button onClick={openLoginModal} className="text-sm font-medium">
        Login
      </button>
    )}

          <Link href="/cart" className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}