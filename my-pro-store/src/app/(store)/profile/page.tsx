"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { User, Package, MapPin, Heart, Loader2, ShoppingBag, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist } = useStore();
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

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4 text-blue-600">
               {user.photoURL ? <Image src={user.photoURL} alt="User" width={80} height={80} className="rounded-full" /> : <User className="h-8 w-8" />}
            </div>
            <h2 className="font-bold text-xl">{user.displayName || "Customer"}</h2>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            <div className="space-y-2 text-left">
               <button onClick={() => setActiveTab("orders")} className={`w-full p-2 rounded flex items-center gap-3 ${activeTab === "orders" ? "bg-black text-white" : "hover:bg-gray-100"}`}>
                 <Package className="h-4 w-4" /> My Orders
               </button>
               <button onClick={() => setActiveTab("wishlist")} className={`w-full p-2 rounded flex items-center gap-3 ${activeTab === "wishlist" ? "bg-black text-white" : "hover:bg-gray-100"}`}>
                 <Heart className="h-4 w-4" /> Wishlist ({wishlist.length})
               </button>
               <button onClick={() => setActiveTab("addresses")} className={`w-full p-2 rounded flex items-center gap-3 ${activeTab === "addresses" ? "bg-black text-white" : "hover:bg-gray-100"}`}>
                 <MapPin className="h-4 w-4" /> Addresses
               </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
           {activeTab === "orders" && (
             <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Order History</h2>
                {orders.length === 0 ? <p className="text-gray-500">No orders placed yet.</p> : orders.map(order => (
                   <div key={order.id} className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold">Order #{order.payment.orderId.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">{order.status}</span>
                      <span className="font-bold">₹{order.totalAmount}</span>
                   </div>
                ))}
             </div>
           )}

           {activeTab === "wishlist" && (
             <div className="space-y-4">
               <h2 className="text-2xl font-bold mb-4">My Wishlist</h2>
               {wishlist.length === 0 ? <p>Your wishlist is empty.</p> : (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {wishlist.map(item => (
                     <div key={item.id} className="bg-white p-4 rounded-xl border relative">
                        <button onClick={() => removeFromWishlist(item.id)} className="absolute top-2 right-2 text-red-500 bg-white p-1 rounded-full shadow-sm">X</button>
                        <div className="relative h-32 w-full bg-gray-100 rounded mb-2"><Image src={item.image} alt={item.name} fill className="object-cover" /></div>
                        <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                        <p className="text-blue-600 font-bold">₹{item.price}</p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

           {activeTab === "addresses" && (
             <div>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Saved Addresses</h2>
                 <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold"><Plus className="h-4 w-4"/> Add New</button>
               </div>
               <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center py-12 text-gray-400">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p>No addresses saved. Addresses are saved automatically at checkout.</p>
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}