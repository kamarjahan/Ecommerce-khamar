"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ShieldCheck, CreditCard, Truck, MapPin, 
  Loader2, ArrowRight, ShoppingBag, Banknote 
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' or 'online'

  // Address Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
  });

  // 1. Load Cart & User Data
  useEffect(() => {
    // Check Auth
    if (!authLoading && !user) {
      toast.error("Please login to checkout");
      router.push("/login?redirect=/checkout");
      return;
    }

    // Load Cart
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (parsedCart.length === 0) {
        router.push("/cart");
      } else {
        setCart(parsedCart);
      }
    } else {
      router.push("/cart");
    }

    // Prefill Form if User exists
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
      }));
    }
    
    setLoading(false);
  }, [user, authLoading, router]);

  // 2. Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 499 ? 0 : 40;
  const total = subtotal + shipping;

  // 3. Handle Form Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. PLACE ORDER LOGIC
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.name || !formData.line1 || !formData.city || !formData.zip || !formData.phone) {
      toast.error("Please fill in all shipping details");
      return;
    }

    setProcessing(true);

    try {
      // A. Create Order Object
      const orderData = {
        userId: user?.uid,
        userEmail: user?.email,
        items: cart,
        address: formData,
        amount: {
          subtotal,
          shipping,
          total
        },
        totalAmount: total, // Simplified for queries
        status: "placed", // Initial status
        payment: {
          method: paymentMethod,
          status: paymentMethod === "online" ? "paid" : "pending", // Simulating success for online
          transactionId: paymentMethod === "online" ? `TXN_${Date.now()}` : null
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // B. Save to Firebase
      const docRef = await addDoc(collection(db, "orders"), orderData);

      // C. Clear Cart & Redirect
      localStorage.removeItem("cart");
      // Trigger storage event to update Navbar badge
      window.dispatchEvent(new Event("storage"));
      
      toast.success("Order placed successfully!");
      
      // Redirect to Profile/Orders page to see the new order
      router.push("/profile");

    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-green-600" /> Secure Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Shipping Address */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Shipping Address
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none" 
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none" 
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input 
                    name="zip" 
                    value={formData.zip} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none" 
                    placeholder="110001"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input 
                    name="line1" 
                    value={formData.line1} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none" 
                    placeholder="Flat No, Building, Street"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none" 
                    placeholder="New Delhi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input 
                    name="state" 
                    value={formData.state} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black outline-none" 
                    placeholder="Delhi"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment Method
              </h2>
              
              <div className="space-y-3">
                {/* Online Payment Option */}
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'online' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                   <input 
                     type="radio" 
                     name="payment" 
                     value="online" 
                     checked={paymentMethod === 'online'} 
                     onChange={() => setPaymentMethod('online')}
                     className="h-5 w-5 text-black focus:ring-black"
                   />
                   <div className="flex-1">
                      <span className="font-bold block text-gray-900">Pay Online (Razorpay)</span>
                      <span className="text-sm text-gray-500">Credit Card, Debit Card, UPI, Netbanking</span>
                   </div>
                   <CreditCard className="h-6 w-6 text-gray-400" />
                </label>

                {/* COD Option */}
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'cod' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}>
                   <input 
                     type="radio" 
                     name="payment" 
                     value="cod" 
                     checked={paymentMethod === 'cod'} 
                     onChange={() => setPaymentMethod('cod')}
                     className="h-5 w-5 text-black focus:ring-black"
                   />
                   <div className="flex-1">
                      <span className="font-bold block text-gray-900">Cash on Delivery</span>
                      <span className="text-sm text-gray-500">Pay conveniently at your doorstep</span>
                   </div>
                   <Banknote className="h-6 w-6 text-gray-400" />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Order Summary
              </h3>

              {/* Items List (Collapsed) */}
              <div className="max-h-60 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-3">
                     <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        {item.image && <Image src={item.image} alt="product" fill className="object-cover" />}
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.variant}</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">Qty: {item.quantity} x ₹{item.price}</p>
                     </div>
                     <div className="text-sm font-bold text-gray-900">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-bold">Free</span> : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-3 mt-3">
                   <span>Total Payable</span>
                   <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 mt-6 mb-6">
                 <div className="bg-gray-50 p-2 rounded text-center text-xs text-gray-600">
                    <Truck className="h-4 w-4 mx-auto mb-1" /> Fast Delivery
                 </div>
                 <div className="bg-gray-50 p-2 rounded text-center text-xs text-gray-600">
                    <ShieldCheck className="h-4 w-4 mx-auto mb-1" /> Secure Payment
                 </div>
              </div>

              <button 
                type="submit"
                disabled={processing}
                className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <><Loader2 className="animate-spin h-5 w-5" /> Processing...</>
                ) : (
                  <>Place Order <ArrowRight className="h-5 w-5" /></>
                )}
              </button>

              <p className="text-xs text-center text-gray-400 mt-4">
                 By placing an order, you agree to our <Link href="/terms" className="underline">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}