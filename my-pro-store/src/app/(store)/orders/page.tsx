"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Package, Truck, CheckCircle, Clock, XCircle, Star, X } from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort in memory to avoid index requirement
      ordersData.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleOpenReview = (item: any) => {
    setSelectedItem(item);
    setRating(5);
    setComment("");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId: selectedItem.id || selectedItem.productId, // Handle both structures
        userId: user?.uid,
        userName: user?.displayName || "Verified Customer",
        rating: rating,
        comment: comment,
        createdAt: Date.now(),
        verifiedPurchase: true
      });
      toast.success("Review submitted successfully!");
      setReviewModalOpen(false);
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ... (Helper functions getStatusColor, getStatusIcon same as before)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed": return "bg-blue-100 text-blue-700";
      case "shipped": return "bg-yellow-100 text-yellow-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed": return <Package className="h-4 w-4" />;
      case "shipped": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No orders yet</h3>
            <Link href="/" className="inline-block mt-4 bg-black text-white px-6 py-2 rounded-lg font-medium">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Order ID</p>
                    <p className="font-mono text-sm font-medium">#{order.payment?.orderId?.slice(-8).toUpperCase() || order.id.slice(0,8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                    <p className="text-sm font-bold">₹{order.amount?.total?.toLocaleString() || order.totalAmount}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </div>
                </div>

                <div className="p-6">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 mb-4 last:mb-0">
                      <div className="relative h-16 w-16 bg-gray-100 rounded-lg overflow-hidden border">
                         {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} {item.variant && `• ${item.variant}`}</p>
                      </div>
                      {/* Add Review Button only for Delivered Items */}
                      {order.status === 'delivered' && (
                        <button 
                          onClick={() => handleOpenReview(item)}
                          className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" /> Write Review
                        </button>
                      )}
                      <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
              <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="h-5 w-5" /></button>
              <h3 className="text-xl font-bold mb-2">Rate Product</h3>
              <p className="text-sm text-gray-500 mb-6">{selectedItem?.name}</p>
              
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="transition hover:scale-110">
                    <Star className={`h-8 w-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>

              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your experience..."
                className="w-full border rounded-xl p-4 min-h-[120px] mb-4 focus:outline-none focus:ring-2 focus:ring-black"
              />

              <button 
                onClick={handleSubmitReview} 
                disabled={submittingReview}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}