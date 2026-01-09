"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Navbar() {
  const { cart, openLoginModal } = useStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(""); // FIXED: Added missing state

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl text-slate-900">
          <span>MyProStore</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 items-center max-w-sm mx-8">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-9 py-2 text-sm outline-none focus:border-blue-500 transition-colors text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {user ? (
            <Link href="/orders" className="flex items-center gap-2 hover:opacity-80 transition">
               {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
               ) : (
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                     {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
               )}
            </Link>
          ) : (
            <button onClick={openLoginModal} className="text-sm font-medium text-slate-700 hover:text-black">
              Login
            </button>
          )}

          <Link href="/cart" className="relative text-slate-700 hover:text-black transition">
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}