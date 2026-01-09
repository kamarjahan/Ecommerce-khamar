"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Trash2, Tag, Percent, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage"); // or 'fixed'
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const snap = await getDocs(collection(db, "coupons"));
    setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "coupons"), {
        code: code.toUpperCase(),
        type: discountType,
        value: Number(value),
        status: "active",
        createdAt: serverTimestamp()
      });
      toast.success("Coupon created");
      setShowModal(false);
      setCode("");
      setValue(0);
      fetchCoupons();
    } catch (e) {
      toast.error("Error creating coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this coupon?")) return;
    await deleteDoc(doc(db, "coupons", id));
    setCoupons(coupons.filter(c => c.id !== id));
    toast.success("Coupon deleted");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500">Create discount codes for your customers.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleDelete(coupon.id)} className="text-red-500 bg-red-50 p-2 rounded-full"><Trash2 className="h-4 w-4"/></button>
             </div>
             
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 text-green-700 p-3 rounded-lg">
                   <Tag className="h-6 w-6" />
                </div>
                <div>
                   <h3 className="font-bold text-xl text-gray-900">{coupon.code}</h3>
                   <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                </div>
             </div>
             
             <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-gray-500 text-sm">Discount</span>
                <span className="font-bold text-gray-900 text-lg">
                  {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                </span>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm m-4">
            <h3 className="text-xl font-bold mb-4">New Coupon</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  required 
                  value={code} 
                  onChange={e => setCode(e.target.value)}
                  className="w-full border p-2 rounded uppercase" 
                  placeholder="SUMMER2025" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-full border p-2 rounded">
                      <option value="percentage">Percent (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Value</label>
                    <input type="number" required value={value} onChange={e => setValue(Number(e.target.value))} className="w-full border p-2 rounded" />
                 </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-2 rounded mt-4 font-bold">Create Code</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-gray-500 py-2 text-sm">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}