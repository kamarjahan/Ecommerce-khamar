"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load Cart from LocalStorage
  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Update Cart Helper
  const updateCart = (newCart: any[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    // Dispatch event to update Navbar count
    window.dispatchEvent(new Event("storage"));
  };

  const increaseQty = (index: number) => {
    const newCart = [...cart];
    newCart[index].quantity += 1;
    updateCart(newCart);
  };

  const decreaseQty = (index: number) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
      updateCart(newCart);
    }
  };

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 499 ? 0 : 40; // Free shipping over 499 logic
  const total = subtotal + shipping;

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8" /> Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link 
              href="/products" 
              className="inline-flex items-center justify-center px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CART ITEMS LIST */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">{item.variant}</p>
                      <p className="font-bold text-gray-900 mt-1">₹{item.price}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center border rounded-lg h-8">
                          <button onClick={() => decreaseQty(index)} className="px-2 h-full hover:bg-gray-100 disabled:opacity-50"><Minus className="h-3 w-3"/></button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => increaseQty(index)} className="px-2 h-full hover:bg-gray-100"><Plus className="h-3 w-3"/></button>
                       </div>
                       <p className="text-sm font-bold ml-auto">Total: ₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border sticky top-24">
                <h3 className="font-bold text-lg text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (Included)</span>
                    <span>₹0</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-between items-center mb-6">
                   <span className="font-bold text-xl text-gray-900">Total</span>
                   <span className="font-bold text-xl text-gray-900">₹{total.toLocaleString()}</span>
                </div>

                <button 
                  onClick={() => router.push("/checkout")}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg"
                >
                  Proceed to Checkout <ArrowRight className="h-5 w-5" />
                </button>
                
                <p className="text-xs text-center text-gray-500 mt-4">
                  Secure Checkout powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}