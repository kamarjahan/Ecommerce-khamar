"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, setDoc, getDoc, limit } from "firebase/firestore";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { useStore } from "@/lib/store";
import { 
  User, Package, MapPin, Heart, Loader2, MessageSquare, 
  RefreshCw, LogOut, Settings, Send, CheckCircle, AlertCircle, ChevronRight, ExternalLink 
} from "lucide-react"; // Added ExternalLink
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Address, Ticket, TicketMessage } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, removeFromWishlist } = useStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Profile Settings State
  const [formData, setFormData] = useState({ displayName: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  
  // Address State
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>({
    name: "", phone: "", line1: "", city: "", state: "", zip: ""
  });

  // Support Ticket State
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!user) return;

    // Load Profile Data
    setFormData({
      displayName: user.displayName || "",
      phone: "" 
    });

    // Fetch User Doc for extra details (phone, address)
    const fetchUserDoc = async () => {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData(prev => ({ ...prev, phone: data.phone || "" }));
        if (data.address) {
          setSavedAddress(data.address);
          setAddressForm(data.address);
        }
      }
    };
    fetchUserDoc();

    // Fetch Orders (Live Listener)
    const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingOrders(false);
    });

    // Fetch Active Support Ticket
    const ticketQ = query(
      collection(db, "tickets"), 
      where("userId", "==", user.uid), 
      where("status", "==", "open"),
      limit(1)
    );
    const unsubTicket = onSnapshot(ticketQ, (snapshot) => {
      if (!snapshot.empty) {
        const ticketData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Ticket;
        setActiveTicket(ticketData);
      } else {
        setActiveTicket(null);
      }
    });

    return () => { unsubOrders(); unsubTicket(); };
  }, [user]);

  // 2. Fetch Chat Messages when ticket is active
  useEffect(() => {
    if (!activeTicket) {
      setTicketMessages([]);
      return;
    }
    const q = query(
      collection(db, "tickets", activeTicket.id, "messages"), 
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setTicketMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage)));
      // Scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [activeTicket]);

  // --- Handlers ---

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: formData.displayName });
      await setDoc(doc(db, "users", user.uid), { phone: formData.phone }, { merge: true });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (e) {
      toast.error("Error sending reset email");
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), { address: addressForm }, { merge: true });
      setSavedAddress(addressForm);
      setIsEditingAddress(false);
      toast.success("Address saved!");
    } catch (e) {
      toast.error("Failed to save address");
    }
  };

  const handleCreateTicket = async () => {
    if (!user || !newTicketTitle || !newTicketDesc) {
        toast.error("Please fill in all fields");
        return;
    }
    try {
      await addDoc(collection(db, "tickets"), {
        userId: user.uid,
        userName: user.displayName || "User",
        userEmail: user.email,
        title: newTicketTitle,
        description: newTicketDesc,
        status: "open",
        createdAt: serverTimestamp(),
        lastMessage: newTicketDesc,
        lastMessageAt: Date.now()
      });
      // Add initial message
      toast.success("Ticket created! Support will connect shortly.");
      setNewTicketTitle("");
      setNewTicketDesc("");
    } catch (e) {
      toast.error("Failed to create ticket");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket || !user) return;
    try {
      await addDoc(collection(db, "tickets", activeTicket.id, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || "User",
        text: newMessage,
        createdAt: Date.now()
      });
      await updateDoc(doc(db, "tickets", activeTicket.id), {
        lastMessage: newMessage,
        lastMessageAt: Date.now()
      });
      setNewMessage("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send");
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-center sticky top-24">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4 text-blue-600 overflow-hidden border-4 border-white shadow-sm">
               {user.photoURL ? <Image src={user.photoURL} alt="User" width={80} height={80} /> : <User className="h-8 w-8" />}
            </div>
            <h2 className="font-bold text-xl">{user.displayName || "Customer"}</h2>
            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
            
            <div className="space-y-1 text-left">
               {[
                 { id: "dashboard", icon: Package, label: "Dashboard" },
                 { id: "orders", icon: Package, label: "My Orders" },
                 { id: "wishlist", icon: Heart, label: `Wishlist (${wishlist.length})` },
                 { id: "settings", icon: Settings, label: "Profile Settings" },
                 { id: "addresses", icon: MapPin, label: "Addresses" },
                 { id: "support", icon: MessageSquare, label: "Help & Support" },
               ].map((item) => (
                 <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)} 
                    className={`w-full p-3 rounded-lg flex items-center gap-3 font-medium transition ${activeTab === item.id ? "bg-black text-white shadow-md" : "hover:bg-gray-100 text-gray-700"}`}
                 >
                   <item.icon className="h-4 w-4" /> {item.label}
                 </button>
               ))}
               <button onClick={() => auth.signOut()} className="w-full p-3 rounded-lg flex items-center gap-3 font-medium text-red-600 hover:bg-red-50 transition">
                  <LogOut className="h-4 w-4" /> Logout
               </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
           
           {/* DASHBOARD TAB */}
           {activeTab === "dashboard" && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-medium opacity-90">Total Orders</h3>
                        <p className="text-4xl font-bold mt-2">{orders.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="text-gray-500 font-medium mb-2">Default Address</h3>
                        {savedAddress ? (
                            <div>
                                <p className="font-bold">{savedAddress.name}</p>
                                <p className="text-sm text-gray-600">{savedAddress.line1}, {savedAddress.city}</p>
                                <p className="text-sm text-gray-600">{savedAddress.state} - {savedAddress.zip}</p>
                            </div>
                        ) : (
                            <button onClick={() => setActiveTab("addresses")} className="text-blue-600 text-sm font-bold">+ Add Address</button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Latest Order</h2>
                        <button onClick={() => setActiveTab("orders")} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                            View All Orders <ChevronRight className="h-4 w-4"/>
                        </button>
                    </div>
                    {orders.length > 0 ? (
                        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl border">
                            <div className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                {orders[0].items?.[0]?.image && <Image src={orders[0].items[0].image} alt="" width={64} height={64} className="object-cover h-full w-full"/>}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">Order #{orders[0].payment?.orderId?.slice(-8) || orders[0].id.slice(0,8)}</p>
                                <p className="text-sm text-gray-500">{new Date(orders[0].createdAt?.seconds * 1000).toDateString()}</p>
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded mt-1 uppercase">{orders[0].status}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">₹{orders[0].amount?.total || orders[0].totalAmount}</p>
                                <p className="text-xs text-gray-500">{orders[0].items?.length} Items</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No orders yet.</p>
                    )}
                </div>
             </div>
           )}

           {/* ORDERS TAB */}
           {activeTab === "orders" && (
             <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Order History</h2>
                    <Link 
                      href="/orders" 
                      className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                    >
                       Go to Full Orders Page <ExternalLink className="h-4 w-4" />
                    </Link>
                </div>

                {orders.length === 0 ? <p className="text-gray-500 bg-white p-8 rounded-xl text-center">No orders placed yet.</p> : orders.map(order => (
                   <div key={order.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                        <div>
                          <p className="font-bold text-lg">Order #{order.payment?.orderId ? order.payment.orderId.slice(-8) : order.id.slice(0,8)}</p>
                          <p className="text-sm text-gray-500">{new Date(order.createdAt?.seconds * 1000).toDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`block px-3 py-1 rounded-full text-xs font-bold uppercase mb-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                          <span className="font-bold text-lg">₹{order.amount?.total || order.totalAmount}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border min-w-[200px]">
                            <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden relative flex-shrink-0">
                                {item.image && <Image src={item.image} alt="" fill className="object-cover" />}
                            </div>
                            <div className="text-xs">
                                <p className="font-bold line-clamp-1">{item.name}</p>
                                <p className="text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                ))}
             </div>
           )}

           {/* SETTINGS TAB */}
           {activeTab === "settings" && (
               <div className="bg-white p-8 rounded-xl border shadow-sm max-w-2xl">
                   <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="h-6 w-6"/> Profile Settings</h2>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium mb-1">Display Name</label>
                           <input 
                            disabled={!isEditing}
                            value={formData.displayName}
                            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                            className="w-full border p-3 rounded-lg bg-gray-50 disabled:text-gray-500"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium mb-1">Email Address</label>
                           <input 
                            disabled
                            value={user.email || ""}
                            className="w-full border p-3 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium mb-1">Phone Number</label>
                           <input 
                            disabled={!isEditing}
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="+91..."
                            className="w-full border p-3 rounded-lg bg-gray-50 disabled:text-gray-500"
                           />
                       </div>

                       <div className="pt-4 flex gap-3">
                           {isEditing ? (
                               <>
                                <button onClick={handleUpdateProfile} className="bg-black text-white px-6 py-2 rounded-lg font-bold">Save Changes</button>
                                <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-bold">Cancel</button>
                               </>
                           ) : (
                               <button onClick={() => setIsEditing(true)} className="bg-black text-white px-6 py-2 rounded-lg font-bold">Edit Profile</button>
                           )}
                       </div>

                       <div className="border-t pt-6 mt-6">
                           <h3 className="font-bold text-red-600 mb-2">Danger Zone</h3>
                           <button onClick={handleResetPassword} className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded border border-red-200 transition">
                               Send Password Reset Email
                           </button>
                       </div>
                   </div>
               </div>
           )}

           {/* ADDRESSES TAB */}
           {activeTab === "addresses" && (
               <div className="bg-white p-8 rounded-xl border shadow-sm">
                   <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="h-6 w-6"/> Saved Addresses</h2>
                   
                   {!isEditingAddress ? (
                       <div className="p-6 border rounded-xl bg-gray-50 flex justify-between items-center">
                           {savedAddress ? (
                               <div>
                                   <p className="font-bold text-lg">{savedAddress.name}</p>
                                   <p>{savedAddress.line1}</p>
                                   <p>{savedAddress.city}, {savedAddress.state} - {savedAddress.zip}</p>
                                   <p className="text-sm text-gray-500 mt-1">Phone: {savedAddress.phone}</p>
                               </div>
                           ) : (
                               <p className="text-gray-500">No address saved yet.</p>
                           )}
                           <button onClick={() => setIsEditingAddress(true)} className="text-blue-600 font-bold hover:underline">
                               {savedAddress ? "Edit" : "Add New"}
                           </button>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                           <input placeholder="Full Name" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="border p-3 rounded-lg" />
                           <input placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="border p-3 rounded-lg" />
                           <input placeholder="Address Line 1" value={addressForm.line1} onChange={e => setAddressForm({...addressForm, line1: e.target.value})} className="border p-3 rounded-lg md:col-span-2" />
                           <input placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="border p-3 rounded-lg" />
                           <input placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="border p-3 rounded-lg" />
                           <input placeholder="Zip Code" value={addressForm.zip} onChange={e => setAddressForm({...addressForm, zip: e.target.value})} className="border p-3 rounded-lg" />
                           
                           <div className="md:col-span-2 flex gap-3 mt-2">
                               <button onClick={handleSaveAddress} className="bg-black text-white px-6 py-2 rounded-lg font-bold">Save Address</button>
                               <button onClick={() => setIsEditingAddress(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-bold">Cancel</button>
                           </div>
                       </div>
                   )}
               </div>
           )}

           {/* SUPPORT TAB */}
           {activeTab === "support" && (
               <div className="bg-white rounded-xl border shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                   <div className="bg-black text-white p-6">
                       <h2 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6"/> Help & Support</h2>
                       <p className="opacity-80 text-sm">We are here to help you 24/7</p>
                   </div>

                   <div className="flex-1 p-6 bg-gray-50">
                       {!activeTicket ? (
                           <div className="max-w-md mx-auto text-center py-10">
                               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <AlertCircle className="h-8 w-8" />
                               </div>
                               <h3 className="font-bold text-xl mb-2">No Active Tickets</h3>
                               <p className="text-gray-500 mb-6">Describe your issue below to start a conversation with our support team.</p>
                               
                               <div className="text-left space-y-4 bg-white p-6 rounded-xl shadow-sm">
                                   <div>
                                       <label className="text-sm font-bold block mb-1">Subject</label>
                                       <input 
                                        className="w-full border p-3 rounded-lg" 
                                        placeholder="e.g. Order #1234 Delayed"
                                        value={newTicketTitle}
                                        onChange={e => setNewTicketTitle(e.target.value)}
                                       />
                                   </div>
                                   <div>
                                       <label className="text-sm font-bold block mb-1">Description</label>
                                       <textarea 
                                        className="w-full border p-3 rounded-lg h-24" 
                                        placeholder="Please tell us more about your issue..."
                                        value={newTicketDesc}
                                        onChange={e => setNewTicketDesc(e.target.value)}
                                       />
                                   </div>
                                   <button onClick={handleCreateTicket} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                                       Raise Ticket
                                   </button>
                               </div>
                           </div>
                       ) : (
                           <div className="flex flex-col h-[500px]">
                               <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
                                   <div>
                                       <p className="font-bold text-lg text-blue-600">#{activeTicket.id.slice(-5).toUpperCase()} - {activeTicket.title}</p>
                                       <p className="text-xs text-gray-500">Status: <span className="uppercase font-bold text-green-600">{activeTicket.status}</span></p>
                                   </div>
                                   <div className="text-xs text-gray-400">One ticket at a time</div>
                               </div>
                               
                               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
                                   <div className="text-center text-xs text-gray-400 my-2">Ticket Created: {new Date(activeTicket.createdAt?.seconds * 1000).toLocaleString()}</div>
                                   {/* Initial Description */}
                                   <div className="flex justify-end">
                                      <div className="bg-blue-600 text-white p-3 rounded-l-xl rounded-tr-xl max-w-[80%] text-sm">
                                         <p className="font-bold text-xs opacity-70 mb-1">You</p>
                                         {activeTicket.description}
                                      </div>
                                   </div>

                                   {/* Chat Messages */}
                                   {ticketMessages.map((msg) => {
                                       const isMe = msg.senderId === user.uid;
                                       return (
                                           <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                               <div className={`p-3 rounded-xl max-w-[80%] text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                                   <p className="font-bold text-xs opacity-70 mb-1">{isMe ? 'You' : 'Support'}</p>
                                                   {msg.text}
                                               </div>
                                           </div>
                                       );
                                   })}
                                   <div ref={chatEndRef} />
                               </div>

                               <div className="p-4 bg-white border-t flex gap-2">
                                   <input 
                                    className="flex-1 border bg-gray-50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none" 
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                   />
                                   <button onClick={handleSendMessage} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                                       <Send className="h-5 w-5" />
                                   </button>
                               </div>
                           </div>
                       )}
                   </div>
               </div>
           )}

           {/* WISHLIST TAB */}
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
                                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition" />}
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

        </div>
      </div>
    </div>
  );
}