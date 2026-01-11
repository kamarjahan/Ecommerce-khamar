"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  ShieldCheck, Loader2, CreditCard, Truck, 
  MapPin, Gift, ChevronDown, ChevronUp, Lock
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export const runtime = "edge";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { cart, clearCart } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [saveAddress, setSaveAddress] = useState(true); 
  const [showSummary, setShowSummary] = useState(false); 
  
  // FIX 1: Add state to track if order is successfully placed
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", line1: "", city: "", state: "", zip: "",
  });

  useEffect(() => {
    const init = async () => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/checkout");
            return;
        }

        if (user) {
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const savedData = userDoc.data();
                    setFormData(prev => ({
                        ...prev,
                        name: savedData.displayName || user.displayName || "",
                        email: user.email || "",
                        phone: savedData.phone || "",
                        line1: savedData.address?.line1 || "",
                        city: savedData.address?.city || "",
                        state: savedData.address?.state || "",
                        zip: savedData.address?.zip || "",
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev, name: user.displayName || "", email: user.email || ""
                    }));
                }
            } catch (e) {
                console.error("Error loading address", e);
            }
        }
        setLoading(false);
    };

    init();
  }, [user, authLoading, router]);

  // FIX 2: Only redirect if cart is empty AND order is NOT placed
  useEffect(() => {
    if (!loading && !isOrderPlaced && cart.length === 0) {
        toast.error("Your cart is empty");
        router.push("/"); // Changed to "/" (Home) to ensure the page exists
    }
  }, [cart, loading, router, isOrderPlaced]);


  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 50;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  
  const isCodAllowed = cart.length > 0 && cart.every(item => item.isCodAvailable !== false);
  
  useEffect(() => {
      if (!isCodAllowed && paymentMethod === "cod") {
          setPaymentMethod("online");
      }
  }, [isCodAllowed, paymentMethod]);


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
    if (!formData.name || !formData.zip || !formData.phone || !formData.line1) {
      toast.error("Please fill in all shipping details");
      return;
    }

    setProcessing(true);

    try {
      if (user && saveAddress) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            displayName: formData.name,
            phone: formData.phone,
            address: {
                line1: formData.line1,
                city: formData.city,
                state: formData.state || "",
                zip: formData.zip
            }
        }, { merge: true });
      }

      // 1. COD Flow
      if (paymentMethod === "cod") {
        if (!isCodAllowed) throw new Error("COD not available");

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
        const docRef = await addDoc(collection(db, "orders"), orderData);
        finishOrder(docRef.id);
        return;
      }

      // 2. Razorpay Flow
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ cartItems: cart, couponCode: appliedCoupon?.code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "My Pro Store",
        description: "Payment for order",
        order_id: data.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            body: JSON.stringify({
              ...response,
              cartItems: cart,
              userId: user?.uid,
              couponCode: appliedCoupon?.code,
              discountAmount: discount
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            finishOrder(verifyData.orderId);
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
      setProcessing(false);

    } catch (error) {
      console.error(error);
      toast.error("Checkout failed");
      setProcessing(false);
    }
  };

  const finishOrder = (orderId: string) => {
    // FIX 3: Set flag to true BEFORE clearing cart to prevent redirect loop
    setIsOrderPlaced(true); 
    
    clearCart();
    toast.success("Order placed successfully!");
    router.push(`/order-success/${orderId}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-green-600" /> Secure Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5"/> Shipping Details</h2>
                   {user && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Logged in as {user.email}</span>}
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none transition" required />
                  <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none transition" required />
                  <input name="line1" placeholder="Address Line 1" value={formData.line1} onChange={(e) => setFormData({...formData, line1: e.target.value})} className="border p-3 rounded-lg w-full md:col-span-2 focus:ring-2 focus:ring-black outline-none transition" required />
                  <div className="grid grid-cols-2 gap-4">
                    <input name="city" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none transition" required />
                    <input name="zip" placeholder="Pincode" value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-black outline-none transition" required />
                  </div>
               </div>

               {user && (
                   <label className="flex items-center gap-2 mt-4 cursor-pointer">
                       <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="rounded text-black focus:ring-black" />
                       <span className="text-sm text-gray-600">Save this address for future orders</span>
                   </label>
               )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'online' ? 'ring-2 ring-black border-transparent bg-gray-50' : 'hover:bg-gray-50'}`}>
                   <input type="radio" name="pay" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 text-black" />
                   <div className="flex-1">
                       <span className="font-bold block">Pay Online</span>
                       <span className="text-sm text-gray-500">Credit Card, Debit Card, UPI, Netbanking</span>
                   </div>
                   <div className="flex gap-1">
                       <div className="w-8 h-5 bg-gray-200 rounded"></div>
                       <div className="w-8 h-5 bg-gray-200 rounded"></div>
                   </div>
                </label>
                
                <label className={`flex items-center gap-4 p-4 border rounded-xl transition ${!isCodAllowed ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'} ${paymentMethod === 'cod' ? 'ring-2 ring-black border-transparent' : ''}`}>
                   <input 
                      type="radio" 
                      name="pay" 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => isCodAllowed && setPaymentMethod('cod')} 
                      disabled={!isCodAllowed}
                      className="w-5 h-5 text-black" 
                   />
                   <div>
                      <span className="font-bold block">Cash on Delivery</span>
                      {isCodAllowed ? (
                        <span className="text-sm text-gray-500">Pay cash upon delivery</span>
                      ) : (
                        <span className="text-sm text-red-500 font-medium">Not available for items in cart</span>
                      )}
                   </div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center">
                      <Lock className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 font-medium uppercase">SSL Secure</p>
                  </div>
                  <div className="text-center">
                      <Truck className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 font-medium uppercase">Fast Delivery</p>
                  </div>
                  <div className="text-center">
                      <ShieldCheck className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                      <p className="text-[10px] text-gray-500 font-medium uppercase">Money Back</p>
                  </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-xl shadow-sm border h-fit sticky top-24">
                 
                 <div 
                    className="flex justify-between items-center lg:hidden mb-4 cursor-pointer"
                    onClick={() => setShowSummary(!showSummary)}
                 >
                     <h3 className="font-bold text-lg">Order Summary</h3>
                     {showSummary ? <ChevronUp /> : <ChevronDown />}
                 </div>

                 <div className={`space-y-4 mb-6 ${showSummary ? 'block' : 'hidden lg:block'}`}>
                    <h3 className="font-bold text-lg hidden lg:block mb-4">Order Summary</h3>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {cart.map(i => (
                            <div key={`${i.id}-${i.variant}`} className="flex gap-3 text-sm">
                                <div className="relative w-12 h-12 bg-gray-100 rounded border shrink-0">
                                    <img src={i.image} className="w-full h-full object-cover rounded" alt="" />
                                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{i.quantity}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium line-clamp-1">{i.name}</p>
                                    <p className="text-gray-500 text-xs">{i.variant}</p>
                                </div>
                                <div className="font-medium">₹{(i.price * i.quantity).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                 </div>
                 
                 <div className="flex gap-2 mb-6">
                    <div className="relative w-full">
                        <Gift className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                        placeholder="Coupon Code" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        className="border p-2 pl-9 rounded-lg w-full uppercase text-sm outline-none focus:border-black transition"
                        />
                    </div>
                    {appliedCoupon ? (
                    <button type="button" onClick={() => {setAppliedCoupon(null); setCouponCode("");}} className="bg-red-50 text-red-600 px-3 rounded-lg font-bold text-xs hover:bg-red-100">remove</button>
                    ) : (
                    <button type="button" onClick={handleApplyCoupon} disabled={verifyingCoupon} className="bg-black text-white px-4 rounded-lg font-bold text-sm hover:bg-gray-800">Apply</button>
                    )}
                 </div>

                 <div className="space-y-2 text-gray-600 mb-6 border-t pt-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
                    {appliedCoupon && (
                        <div className="flex justify-between text-green-600 font-medium">
                        <span>Coupon ({appliedCoupon.code})</span>
                        <span>-₹{discount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-black pt-4 border-t mt-4">
                        <span>Total</span>
                        <span>₹{total.toLocaleString()}</span>
                    </div>
                 </div>

                 <button type="submit" disabled={processing} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition shadow-lg transform hover:-translate-y-0.5">
                    {processing ? <Loader2 className="animate-spin" /> : <>{paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}</>}
                 </button>
             </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}