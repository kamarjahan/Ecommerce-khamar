"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, where } from "firebase/firestore";
import { Ticket, TicketMessage } from "@/types";
import { MessageSquare, CheckCircle, Send, User, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch All Open Tickets
  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("lastMessageAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    });
    return () => unsub();
  }, []);

  // 2. Fetch Messages for Selected Ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const q = query(
      collection(db, "tickets", selectedTicket.id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [selectedTicket]);

  const handleSendMessage = async () => {
    if (!reply.trim() || !selectedTicket) return;
    try {
      await addDoc(collection(db, "tickets", selectedTicket.id, "messages"), {
        senderId: "admin",
        senderName: "Support Team",
        text: reply,
        createdAt: Date.now()
      });
      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        lastMessage: reply,
        lastMessageAt: Date.now()
      });
      setReply("");
    } catch (e) {
      toast.error("Failed to send");
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    if (confirm("Are you sure you want to resolve and close this ticket?")) {
      try {
        await updateDoc(doc(db, "tickets", selectedTicket.id), { status: "closed" });
        toast.success("Ticket Resolved");
        setSelectedTicket(null);
      } catch (e) {
        toast.error("Failed to resolve");
      }
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-6">
      
      {/* Sidebar List */}
      <div className="w-1/3 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5"/> Support Tickets</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tickets.length === 0 && <p className="text-gray-500 text-center py-4">No tickets found.</p>}
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition hover:bg-gray-50",
                selectedTicket?.id === ticket.id ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300" : "bg-white"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm truncate">{ticket.userName}</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{ticket.status}</span>
              </div>
              <p className="font-medium text-sm text-gray-900 truncate">{ticket.title}</p>
              <p className="text-xs text-gray-500 truncate mt-1">{ticket.lastMessage}</p>
              <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(ticket.lastMessageAt || ticket.createdAt?.seconds * 1000).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg">{selectedTicket.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                   <User className="h-3 w-3" /> {selectedTicket.userName} ({selectedTicket.userEmail})
                </p>
              </div>
              {selectedTicket.status === 'open' && (
                <button 
                  onClick={handleResolveTicket}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" /> Mark Resolved
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
               {/* Original Issue */}
               <div className="flex justify-start">
                   <div className="bg-white border p-4 rounded-xl rounded-tl-none max-w-[80%] shadow-sm">
                       <p className="text-xs font-bold text-blue-600 mb-1">Original Issue</p>
                       <p className="text-sm text-gray-800">{selectedTicket.description}</p>
                   </div>
               </div>

               {/* Chat Flow */}
               {messages.map((msg) => {
                 const isAdmin = msg.senderId === 'admin';
                 return (
                   <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={cn("p-3 rounded-xl max-w-[80%] text-sm shadow-sm", isAdmin ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-gray-800 rounded-tl-none")}>
                          <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>
                          {msg.text}
                          <p className="text-[10px] opacity-50 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                   </div>
                 );
               })}
               <div ref={chatEndRef} />
            </div>

            {selectedTicket.status === 'open' ? (
              <div className="p-4 border-t bg-white flex gap-3">
                 <input 
                   className="flex-1 border bg-gray-50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none transition"
                   placeholder="Type your reply..."
                   value={reply}
                   onChange={e => setReply(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                 />
                 <button onClick={handleSendMessage} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition shadow-lg">
                    <Send className="h-5 w-5" />
                 </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 text-center text-gray-500 font-medium border-t">
                 This ticket has been resolved and closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
             <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
             <p>Select a ticket to view details</p>
          </div>
        )}
      </div>

    </div>
  );
}