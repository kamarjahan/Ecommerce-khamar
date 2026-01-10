"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script"; // Required for Razorpay
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { 
  ShieldCheck, CreditCard, Truck, MapPin, 
  Loader2, ArrowRight, ShoppingBag, Banknote, TicketPercent 
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online"); // Default to online

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", line1: "", city: "", state: "", zip: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
    
    if (user) {
      setFormData(prev => ({
        ...prev, name: user.displayName || "", email: user.email || ""
      }));
    }
    setLoading(false);
  }, [user, authLoading, router]);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 50;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const handleApplyCoupon = async () => {
    if(!couponCode) return;
    setVerifyingCoupon(true);
    try {
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase()), where("status", "==", "active"));
      const snap = await getDocs(q);
      
      if(snap.empty) {
        toast.error("Invalid coupon code");
        setAppliedCoupon(null);
      } else {
        const data = snap.docs[0].data();
        let disc = 0;
        if(data.type === 'percentage') {
          disc = (subtotal * data.value) / 100;
        } else {
          disc = data.value;
        }
        setAppliedCoupon({ code: data.code, discount: disc });
        toast.success(`Coupon ${data.code} applied!`);
      }
    } catch (error) {
      toast.error("Failed to apply coupon");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.zip || !formData.phone) {
      toast.error("Please fill in shipping details");
      return;
    }

    setProcessing(true);

    try {
      // 1. COD Flow
      if (paymentMethod === "cod") {
        const orderData = {
          userId: user?.uid,
          items: cart,
          address: formData,
          amount: { subtotal, shipping, discount, total },
          couponApplied: appliedCoupon?.code || null,
          status: "placed",
          payment: { method: "cod", status: "pending" },
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, "orders"), orderData);
        finishOrder();
        return;
      }

      // 2. Razorpay Flow
      // A. Create Order on Server
      const res = await fetch("/app/api/checkout", {
        method: "POST",
        body: JSON.stringify({ cartItems: cart, couponCode: appliedCoupon?.code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // B. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "My Pro Store",
        description: "Payment for order",
        order_id: data.orderId,
        handler: async function (response: any) {
          // C. Verify Payment
          const verifyRes = await fetch("/app/api/payment/verify", {
            method: "POST",
            body: JSON.stringify({
              ...response,
              cartItems: cart,
              userId: user?.uid,
              couponCode: appliedCoupon?.code,
              discountAmount: discount
            }),
          });
          
          if (verifyRes.ok) {
            finishOrder();
          } else {
            toast.error("Payment Verification Failed");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#000000" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
      setProcessing(false); // Stop processing state so user can interact with modal

    } catch (error) {
      console.error(error);
      toast.error("Checkout failed");
      setProcessing(false);
    }
  };

  const finishOrder = () => {
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("storage"));
    toast.success("Order placed successfully!");
    router.push("/profile");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-green-600" /> Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Address Form (Simplified for brevity) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
               <h2 className="text-xl font-bold mb-4">Shipping Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border p-3 rounded-lg w-full" required />
                  <input name="phone" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border p-3 rounded-lg w-full" required />
                  <input name="line1" placeholder="Address" value={formData.line1} onChange={(e) => setFormData({...formData, line1: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2" required />
                  <input name="city" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="border p-3 rounded-lg w-full" required />
                  <input name="zip" placeholder="Pincode" value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} className="border p-3 rounded-lg w-full" required />
               </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-bold mb-4">Payment</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer ${paymentMethod === 'online' ? 'ring-2 ring-black border-transparent' : ''}`}>
                   <input type="radio" name="pay" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 text-black" />
                   <div><span className="font-bold block">Pay Online</span><span className="text-sm text-gray-500">UPI, Cards, Netbanking</span></div>
                </label>
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer ${paymentMethod === 'cod' ? 'ring-2 ring-black border-transparent' : ''}`}>
                   <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-black" />
                   <div><span className="font-bold block">Cash on Delivery</span><span className="text-sm text-gray-500">Pay at doorstep</span></div>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit sticky top-24">
             <h3 className="font-bold text-lg mb-4">Order Summary</h3>
             <div className="space-y-3 text-sm border-b pb-4 mb-4">
               {cart.map(i => (
                 <div key={i.id + i.variant} className="flex justify-between">
                   <span className="text-gray-600">{i.quantity} x {i.name}</span>
                   <span className="font-medium">₹{i.price * i.quantity}</span>
                 </div>
               ))}
             </div>
             
             {/* Coupon Input */}
             <div className="flex gap-2 mb-6">
                <input 
                  placeholder="Coupon Code" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                  className="border p-2 rounded-lg w-full uppercase text-sm"
                />
                {appliedCoupon ? (
                  <button type="button" onClick={() => {setAppliedCoupon(null); setCouponCode("");}} className="bg-red-100 text-red-600 px-3 rounded-lg font-bold text-xs">remove</button>
                ) : (
                  <button type="button" onClick={handleApplyCoupon} disabled={verifyingCoupon} className="bg-black text-white px-4 rounded-lg font-bold text-sm">Apply</button>
                )}
             </div>

             <div className="space-y-2 text-gray-600 mb-6">
               <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
               <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
               {appliedCoupon && (
                 <div className="flex justify-between text-green-600 font-medium">
                   <span>Coupon ({appliedCoupon.code})</span>
                   <span>-₹{discount.toLocaleString()}</span>
                 </div>
               )}
               <div className="flex justify-between text-xl font-bold text-black pt-4 border-t">
                 <span>Total</span>
                 <span>₹{total.toLocaleString()}</span>
               </div>
             </div>

             <button type="submit" disabled={processing} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 disabled:opacity-50">
               {processing ? <Loader2 className="animate-spin" /> : <>{paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}</>}
             </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}