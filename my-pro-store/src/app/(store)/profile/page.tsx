"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useStore } from "@/lib/store"; // Added store import
import { User, Package, MapPin, Heart, Loader2, MessageSquare, RefreshCw } from "lucide-react"; // Added Heart
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist } = useStore(); // Get wishlist from store
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    if (user) fetchOrders();
  }, [user]);

  const handleSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Support ticket created! We will contact you soon.");
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4 text-blue-600 overflow-hidden">
               {user.photoURL ? <Image src={user.photoURL} alt="User" width={80} height={80} /> : <User className="h-8 w-8" />}
            </div>
            <h2 className="font-bold text-xl">{user.displayName || "Customer"}</h2>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            <div className="space-y-1 text-left">
               {[
                 { id: "orders", icon: Package, label: "My Orders" },
                 { id: "wishlist", icon: Heart, label: `Wishlist (${wishlist.length})` }, // Restored
                 { id: "addresses", icon: MapPin, label: "Addresses" },
                 { id: "returns", icon: RefreshCw, label: "Returns & Refunds" },
                 { id: "support", icon: MessageSquare, label: "Support Tickets" },
               ].map((item) => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full p-3 rounded-lg flex items-center gap-3 font-medium transition ${activeTab === item.id ? "bg-black text-white" : "hover:bg-gray-100 text-gray-700"}`}>
                   <item.icon className="h-4 w-4" /> {item.label}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
           {activeTab === "orders" && (
             <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Order History</h2>
                {orders.length === 0 ? <p className="text-gray-500">No orders placed yet.</p> : orders.map(order => (
                   <div key={order.id} className="bg-white p-6 rounded-xl border shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-lg">Order #{order.payment?.orderId ? order.payment.orderId.slice(-8) : order.id.slice(0,8)}</p>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt.seconds * 1000).toDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase mb-1">{order.status}</span>
                          <span className="font-bold text-lg">₹{order.amount?.total || order.totalAmount}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded pr-4 min-w-[200px]">
                            <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden relative flex-shrink-0">
                                {item.image && <Image src={item.image} alt="" fill className="object-cover" />}
                            </div>
                            <div className="text-xs">
                                <p className="font-bold line-clamp-1">{item.name}</p>
                                <p>Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                ))}
             </div>
           )}

           {/* Restored Wishlist View */}
           {activeTab === "wishlist" && (
             <div className="space-y-4">
               <h2 className="text-2xl font-bold mb-4">My Wishlist</h2>
               {wishlist.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-xl border">
                    <Heart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Your wishlist is empty.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {wishlist.map(item => (
                     <div key={item.id} className="bg-white p-4 rounded-xl border relative group">
                        <button 
                          onClick={() => removeFromWishlist(item.id)} 
                          className="absolute top-2 right-2 z-10 text-red-500 bg-white p-1.5 rounded-full shadow-sm hover:bg-red-50 transition"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                        <Link href={`/product/${item.id}`}>
                            <div className="relative h-40 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition" />
                            </div>
                            <h3 className="font-bold text-sm line-clamp-1 text-gray-900">{item.name}</h3>
                            <p className="text-black font-bold mt-1">₹{item.price.toLocaleString()}</p>
                        </Link>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

           {activeTab === "support" && (
             <div className="bg-white p-8 rounded-xl border shadow-sm">
                <h2 className="text-2xl font-bold mb-2">Help & Support</h2>
                <p className="text-gray-500 mb-6">Raise a ticket for any issues with your orders.</p>
                <form onSubmit={handleSupportTicket} className="space-y-4">
                   <select className="w-full border p-3 rounded-lg bg-gray-50" required>
                      <option value="">Select Issue Type</option>
                      <option value="order">Order Delay</option>
                      <option value="payment">Payment Issue</option>
                      <option value="refund">Refund Status</option>
                   </select>
                   <textarea className="w-full border p-3 rounded-lg bg-gray-50 h-32" placeholder="Describe your issue..." required></textarea>
                   <button className="bg-black text-white px-6 py-3 rounded-lg font-bold">Submit Ticket</button>
                </form>
             </div>
           )}
           
           {activeTab === "returns" && (
             <div className="text-center py-12 bg-white rounded-xl border">
                <RefreshCw className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No active returns</h3>
                <p className="text-gray-500">You have no return requests in progress.</p>
             </div>
           )}

           {activeTab === "addresses" && (
             <div className="text-center py-12 bg-white rounded-xl border">
                <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Saved Addresses</h3>
                <p className="text-gray-500">Addresses will be saved automatically during checkout.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}