"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Loader2, ArrowRight, Package } from "lucide-react";
import { useRouter } from "next/navigation";

 

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // Next.js 15: Unwrap params
  const orderId = resolvedParams.id;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          // If order not found, redirect to home after 3s
          setTimeout(() => router.push("/"), 3000);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, router]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>;

  if (!order) return <div className="h-screen flex items-center justify-center text-red-500">Order not found. Redirecting...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Successfully Placed!</h1>
          <p className="text-gray-500 mb-6">Thank you for your purchase. Your order ID is <span className="font-mono font-medium text-black">#{orderId.slice(0, 8).toUpperCase()}</span></p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link href="/orders" className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                <Package className="h-5 w-5" /> Go to My Orders
             </Link>
             <Link href="/" className="px-8 py-3 rounded-xl font-bold border hover:bg-gray-50 transition text-gray-700">
                Continue Shopping
             </Link>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
           <div className="p-6 border-b bg-gray-50">
              <h2 className="font-bold text-lg">Order Summary</h2>
           </div>
           <div className="p-6 space-y-6">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-4">
                   <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border shrink-0">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                   </div>
                   <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.variant} • Qty: {item.quantity}</p>
                   </div>
                   <div className="text-right font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                   </div>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                 <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.amount?.subtotal?.toLocaleString()}</span></div>
                 <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.amount?.shipping === 0 ? "Free" : `₹${order.amount?.shipping}`}</span></div>
                 {order.amount?.discount > 0 && (
                   <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.amount?.discount?.toLocaleString()}</span></div>
                 )}
                 <div className="flex justify-between text-xl font-bold text-black pt-2">
                    <span>Total Paid</span>
                    <span>₹{order.amount?.total?.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}