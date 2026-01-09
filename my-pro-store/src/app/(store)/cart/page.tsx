"use client";

import { useState } from "react"; // Added this
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider"; // Real Auth Hook
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  // FIXED: Removed the "..." and listed actual functions
  const { cart, removeFromCart, updateQuantity, openLoginModal } = useStore(); 
  const { user } = useAuth(); // Get Real User
  const [loading, setLoading] = useState(false);

  // Calculate Totals
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 50; 
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    // 1. Check if user is logged in
    if (!user) {
      toast.error("Please login to checkout");
      openLoginModal();
      return;
    }

    setLoading(true);

    try {
      // 2. Call our API to get an Order ID
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems: cart }),
      });
      
      const data = await response.json();

      // 3. Open Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: data.amount,
        currency: data.currency,
        name: "My Pro Store",
        description: "Transaction for Order",
        order_id: data.orderId,
        handler: async function (response: any) {
          toast.success("Payment Successful! Verifying...");
          await verifyPayment(response, data.orderId);
        },
        prefill: {
          name: user.displayName || "User", // Use real name if available
          email: user.email || "",
          contact: "", // You can add phone number field to profile later
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();

    } catch (error) {
      toast.error("Checkout failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Verification Function
  const verifyPayment = async (rzpResponse: any, orderId: string) => {
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: rzpResponse.razorpay_order_id,
          razorpay_payment_id: rzpResponse.razorpay_payment_id,
          razorpay_signature: rzpResponse.razorpay_signature,
          cartItems: cart, 
          userId: user?.uid, // SEND REAL USER ID
        }),
      });

      if (res.ok) {
        toast.success("Order Placed Successfully!");
        // window.location.href = "/orders"; // Redirect to orders page
      } else {
        toast.error("Payment verification failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-gray-400 text-4xl">🛒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 mt-2">Looks like you haven't added anything yet.</p>
        <Link 
          href="/" 
          className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      {/* Script for Razorpay */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="container px-4 mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Shopping Cart ({cart.length})</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.id}-${item.variant}`} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 md:gap-6">
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id, item.variant)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    {item.variant && (
                      <p className="text-sm text-gray-500 mt-1">Variant: {item.variant}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border">
                      <button 
                        onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded-md transition disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button 
                         onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                         className="p-1 hover:bg-white rounded-md transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-lg">₹{(item.price * item.quantity).toLocaleString()}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-gray-500">₹{item.price}/each</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
              <h2 className="text-lg font-bold mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {shipping === 0 ? <span className="text-green-600">Free</span> : <span>₹{shipping}</span>}
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18% GST included)</span>
                  <span>-</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold mt-8 hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? "Processing..." : "Proceed to Checkout"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="bg-gray-100 px-2 py-1 rounded">Secure Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}