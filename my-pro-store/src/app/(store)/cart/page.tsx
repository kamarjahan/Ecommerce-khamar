"use client";

import { useStore } from "@/lib/store";
import { Trash2, Plus, Minus, ArrowRight, Truck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react"; // Added for hydration fix

 

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration fix: Prevent server/client mismatch
  if (!mounted) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const FREE_SHIPPING_THRESHOLD = 999;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShip = FREE_SHIPPING_THRESHOLD - subtotal;

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Looks like you haven't added anything yet. Explore our products to find something you love.</p>
        <Link href="/products" className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-xl">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Free Shipping Progress */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                    {remainingForFreeShip > 0 
                        ? `Add ₹${remainingForFreeShip.toLocaleString()} more for Free Shipping` 
                        : "You've unlocked Free Shipping!"}
                </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {cart.map((item) => (
            <div key={`${item.id}-${item.variant}`} className="flex gap-4 p-4 bg-white border rounded-xl shadow-sm transition hover:shadow-md">
              <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item.id, item.variant)}
                      className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 bg-gray-100 w-fit px-2 py-0.5 rounded text-xs font-medium mt-1">{item.variant || "Standard"}</p>
                </div>

                <div className="flex justify-between items-end mt-4">
                   <div className="flex items-center gap-3 border rounded-lg p-1 bg-gray-50">
                      <button 
                        onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                        className="p-1 hover:bg-white rounded shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-gray-500">Unit: ₹{item.price.toLocaleString()}</p>
                      <p className="font-bold text-lg">₹{(item.price * item.quantity).toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border shadow-sm sticky top-24">
            <h3 className="font-bold text-xl mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={subtotal > 999 ? "text-green-600 font-medium" : ""}>
                    {subtotal > 999 ? "Free" : "₹50"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total</span>
                <span>₹{(subtotal + (subtotal > 999 ? 0 : 50)).toLocaleString()}</span>
              </div>
            </div>
            
            <Link href="/checkout" className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Checkout <ArrowRight className="h-5 w-5" />
            </Link>
            
            <p className="text-xs text-center text-gray-500 mt-4">
                Secure Checkout • Free Returns • 24/7 Support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}