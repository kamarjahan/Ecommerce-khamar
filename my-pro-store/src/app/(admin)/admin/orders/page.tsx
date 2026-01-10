"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, orderBy } from "firebase/firestore";
import { 
  Loader2, Package, Truck, CheckCircle, Clock, XCircle, Star, X, 
  Search, ChevronRight, MapPin, CreditCard, ExternalLink, Copy, 
  ShoppingBag, MessageSquare, ArrowRight 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null); // For Detail View

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // 1. Fetch Orders
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // Indexing might be required for compound queries, so we sort client-side to be safe initially
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure date exists
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      // Sort desc
      ordersData.sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // 2. Filter Logic
  useEffect(() => {
    let result = orders;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.payment?.orderId?.toLowerCase().includes(q)
      );
    }

    // Tabs
    if (activeTab === "active") {
      result = result.filter(o => ['placed', 'shipped', 'processing'].includes(o.status));
    } else if (activeTab === "completed") {
      result = result.filter(o => ['delivered', 'cancelled', 'returned'].includes(o.status));
    }

    setFilteredOrders(result);
  }, [searchQuery, activeTab, orders]);

  // Review Handlers
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
        productId: selectedItem.id || selectedItem.productId, 
        userId: user?.uid,
        userName: user?.displayName || "Verified Customer",
        rating: rating,
        comment: comment,
        createdAt: Date.now(),
        verifiedPurchase: true
      });
      toast.success("Review submitted!");
      setReviewModalOpen(false);
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Orders</h1>
            <p className="text-gray-500 mt-1">Track, return, or buy things again.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search Order ID..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
               />
             </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b mb-6 overflow-x-auto">
           {['all', 'active', 'completed'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
                 activeTab === tab ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
               }`}
             >
               {tab === 'all' ? 'All Orders' : tab === 'active' ? 'On the way' : 'Completed'}
             </button>
           ))}
        </div>

        {/* ORDERS LIST */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No orders found</h3>
            <p className="text-gray-500 mb-6 mt-2">Looks like you haven't placed any orders yet.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
               Start Shopping <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer group"
              >
                {/* Order Header */}
                <div className="bg-gray-50/50 p-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Order Placed</p>
                      <p className="font-medium text-gray-900 text-sm mt-1">{format(order.createdAt, "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total</p>
                      <p className="font-medium text-gray-900 text-sm mt-1">₹{(order.totalAmount || order.amount?.total)?.toLocaleString()}</p>
                    </div>
                    <div className="hidden sm:block">
                       <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Order #</p>
                       <p className="font-mono text-gray-900 text-sm mt-1">
                         {order.payment?.orderId ? order.payment.orderId.split('_')[1] : order.id.slice(0,8).toUpperCase()}
                       </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                     </span>
                     <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-600 transition" />
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  
                  {/* Images Preview */}
                  <div className="flex -space-x-3 overflow-hidden py-2">
                     {order.items.slice(0, 4).map((item: any, i: number) => (
                       <div key={i} className="relative h-16 w-16 rounded-xl border-2 border-white shadow-sm bg-gray-100 overflow-hidden shrink-0">
                          {item.image ? (
                             <img src={item.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                             <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-6 w-6"/></div>
                          )}
                       </div>
                     ))}
                     {order.items.length > 4 && (
                       <div className="relative h-16 w-16 rounded-xl border-2 border-white shadow-sm bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600 z-10">
                          +{order.items.length - 4}
                       </div>
                     )}
                  </div>

                  {/* Tracking / Info Snippet */}
                  <div className="flex-1">
                     <h4 className="font-bold text-gray-900">
                        {order.status === 'delivered' ? 'Delivered' : order.status === 'cancelled' ? 'Order Cancelled' : `Arriving Soon`}
                     </h4>
                     <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {order.items.map((i:any) => i.name).join(", ")}
                     </p>
                     
                     {order.tracking?.id && order.status === 'shipped' && (
                       <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                         <Truck className="h-3 w-3" /> Track: {order.tracking.id}
                       </p>
                     )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 w-full md:w-auto">
                    {order.status === 'delivered' ? (
                       <button className="flex-1 md:flex-none border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                          Buy Again
                       </button>
                    ) : (
                       <button className="flex-1 md:flex-none border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                          View Order
                       </button>
                    )}
                    {order.tracking?.id && (
                       <a 
                          href={`https://www.google.com/search?q=${order.tracking.id}`} 
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                        >
                          Track Package
                       </a>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SLIDE OVER ORDER DETAILS --- */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[500px] bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
             
             {/* Header */}
             <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b p-6 flex justify-between items-center z-10">
                <div>
                   <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                   <p className="text-xs text-gray-500 font-mono">#{selectedOrder.payment?.orderId || selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                   <X className="h-5 w-5" />
                </button>
             </div>

             <div className="p-6 space-y-8">
                
                {/* 1. Status Timeline */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                   <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600"/> Order Status
                   </h3>
                   <div className="relative flex justify-between items-center text-xs font-medium text-gray-500 z-0">
                      {/* Line */}
                      <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full">
                         <div 
                           className={`h-full bg-blue-600 rounded-full transition-all duration-1000`} 
                           style={{ width: selectedOrder.status === 'placed' ? '10%' : selectedOrder.status === 'shipped' ? '50%' : selectedOrder.status === 'delivered' ? '100%' : '0%' }}
                         />
                      </div>

                      {/* Steps */}
                      <div className="flex flex-col items-center gap-2">
                         <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${['placed','shipped','delivered'].includes(selectedOrder.status) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                            <CheckCircle className="h-3 w-3" />
                         </div>
                         <span>Placed</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${['shipped','delivered'].includes(selectedOrder.status) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                            <Truck className="h-3 w-3" />
                         </div>
                         <span>Shipped</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${selectedOrder.status === 'delivered' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300'}`}>
                            <Package className="h-3 w-3" />
                         </div>
                         <span>Delivered</span>
                      </div>
                   </div>

                   {/* Display Tracking if available */}
                   {selectedOrder.tracking?.id && (
                     <div className="mt-6 bg-white p-3 rounded-lg border flex items-center justify-between">
                        <div>
                           <p className="text-xs text-gray-500 uppercase">Tracking Number</p>
                           <p className="font-mono font-bold text-gray-800 flex items-center gap-2">
                             {selectedOrder.tracking.id}
                             <button onClick={() => copyToClipboard(selectedOrder.tracking.id)}><Copy className="h-3 w-3 text-gray-400 hover:text-black"/></button>
                           </p>
                           <p className="text-xs text-gray-400 capitalize">{selectedOrder.tracking.courier}</p>
                        </div>
                        <a href={`https://www.google.com/search?q=${selectedOrder.tracking.id}`} target="_blank" className="text-blue-600 hover:underline text-sm font-bold flex items-center gap-1">
                           Track <ExternalLink className="h-3 w-3" />
                        </a>
                     </div>
                   )}
                </div>
                
                {/* 2. Messages / Notes */}
                {(selectedOrder.adminNote || selectedOrder.notes) && (
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                      <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                         <MessageSquare className="h-4 w-4" /> Updates & Notes
                      </h3>
                      {selectedOrder.adminNote && (
                        <div className="mb-3">
                           <p className="text-xs font-bold text-amber-700 uppercase mb-1">Message from Store</p>
                           <p className="text-sm text-amber-900 bg-white/50 p-3 rounded-lg border border-amber-100">{selectedOrder.adminNote}</p>
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div>
                           <p className="text-xs font-bold text-amber-700 uppercase mb-1">Your Instructions</p>
                           <p className="text-sm text-amber-900 italic">"{selectedOrder.notes}"</p>
                        </div>
                      )}
                  </div>
                )}

                {/* 3. Order Items */}
                <div>
                   <h3 className="font-bold text-gray-900 mb-4">Items ({selectedOrder.items.length})</h3>
                   <div className="space-y-4">
                      {selectedOrder.items.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                           <div className="relative h-20 w-20 bg-gray-100 rounded-lg border overflow-hidden shrink-0">
                              {item.image && <img src={item.image} alt="" className="object-cover w-full h-full" />}
                           </div>
                           <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.variant ? `Variant: ${item.variant}` : ''} • Qty: {item.quantity}
                              </p>
                              
                              <div className="flex justify-between items-center mt-2">
                                <p className="font-bold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                                {selectedOrder.status === 'delivered' && (
                                   <button 
                                     onClick={() => {
                                        setSelectedItem(item);
                                        setReviewModalOpen(true);
                                     }}
                                     className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition"
                                   >
                                      Write Review
                                   </button>
                                )}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* 4. Order Summary & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                   <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><MapPin className="h-3 w-3"/> Delivery Address</h4>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border">
                         <p className="font-bold text-gray-900">{selectedOrder.address?.name || user?.displayName}</p>
                         <p>{selectedOrder.address?.line1}</p>
                         <p>{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                         <p>{selectedOrder.address?.zip}</p>
                         <p className="mt-2 text-gray-500 text-xs">{selectedOrder.address?.phone}</p>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><CreditCard className="h-3 w-3"/> Payment Info</h4>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border">
                         <div className="flex justify-between mb-1">
                            <span>Subtotal</span>
                            <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between mb-1">
                            <span>Shipping</span>
                            <span className="text-green-600">Free</span>
                         </div>
                         <div className="flex justify-between border-t border-dashed border-gray-300 pt-2 mt-2 font-bold text-gray-900">
                            <span>Total</span>
                            <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                         </div>
                         <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Paid via Online
                         </div>
                      </div>
                   </div>
                </div>

             </div>
             
             {/* Sticky Action Footer */}
             <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
                <button className="flex-1 border border-gray-300 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                  Need Help?
                </button>
                <button className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition">
                   Download Invoice
                </button>
             </div>
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
              <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded-full transition"><X className="h-5 w-5" /></button>
              
              <div className="text-center mb-6">
                 <h3 className="text-xl font-bold mb-1">Rate this Product</h3>
                 <p className="text-sm text-gray-500 line-clamp-1">{selectedItem?.name}</p>
              </div>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="transition hover:scale-110 focus:outline-none">
                    <Star className={`h-8 w-8 transition-colors ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">Write a Review</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike?"
                  className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                />
              </div>

              <button 
                onClick={handleSubmitReview} 
                disabled={submittingReview}
                className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 mt-6 transition transform active:scale-95"
              >
                {submittingReview ? "Posting..." : "Submit Review"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

// Helpers
const getStatusColor = (status: string) => {
  switch (status) {
    case "placed": return "bg-blue-100 text-blue-700";
    case "shipped": return "bg-amber-100 text-amber-700";
    case "delivered": return "bg-green-100 text-green-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "placed": return <Package className="h-3.5 w-3.5" />;
    case "shipped": return <Truck className="h-3.5 w-3.5" />;
    case "delivered": return <CheckCircle className="h-3.5 w-3.5" />;
    case "cancelled": return <XCircle className="h-3.5 w-3.5" />;
    default: return <Clock className="h-3.5 w-3.5" />;
  }
};