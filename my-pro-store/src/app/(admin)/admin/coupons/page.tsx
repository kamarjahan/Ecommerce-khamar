"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { 
  Trash2, Tag, Percent, Plus, Calendar, Users, 
  ShoppingBag, CheckCircle, AlertCircle, X, Search 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data for Selectors
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "percentage", // percentage, fixed, free_shipping
    value: 0,
    minOrderValue: 0,
    appliesTo: "all", // all, category, specific_products
    targetIds: [] as string[], // Store IDs of products/categories
    usageLimit: 0, // 0 = unlimited
    limitOnePerUser: false,
    isNewUsersOnly: false,
    startDate: "",
    endDate: "",
    status: "active"
  });

  // 1. Fetch Data
  useEffect(() => {
    fetchCoupons();
    fetchResources();
  }, []);

  const fetchCoupons = async () => {
    try {
      const snap = await getDocs(collection(db, "coupons"));
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    // Fetch Products & Extract Categories
    const snap = await getDocs(collection(db, "products"));
    const prods = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name, category: doc.data().category }));
    setProducts(prods);
    
    // Unique Categories
    const cats = Array.from(new Set(prods.map(p => p.category).filter(Boolean)));
    setCategories(cats as string[]);
  };

  // 2. Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await addDoc(collection(db, "coupons"), {
        ...formData,
        code: formData.code.toUpperCase(),
        value: Number(formData.value),
        minOrderValue: Number(formData.minOrderValue),
        usageLimit: Number(formData.usageLimit),
        targetIds: formData.targetIds, // Array of IDs
        createdAt: serverTimestamp(),
        usedCount: 0 // Track usage
      });
      
      toast.success("Coupon created successfully");
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (e) {
      toast.error("Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Coupon deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      await updateDoc(doc(db, "coupons", id), { status: newStatus });
      setCoupons(coupons.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Coupon ${newStatus}`);
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "", description: "", type: "percentage", value: 0,
      minOrderValue: 0, appliesTo: "all", targetIds: [],
      usageLimit: 0, limitOnePerUser: false, isNewUsersOnly: false,
      startDate: "", endDate: "", status: "active"
    });
  };

  // Helper to toggle items in array
  const handleTargetSelection = (id: string) => {
    setFormData(prev => {
      const exists = prev.targetIds.includes(id);
      return {
        ...prev,
        targetIds: exists 
          ? prev.targetIds.filter(x => x !== id)
          : [...prev.targetIds, id]
      };
    });
  };

  if (loading) return <div className="p-10 text-center">Loading coupons...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discounts</h1>
          <p className="text-gray-500">Manage coupons and promotional codes.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"
        >
          <Plus className="h-5 w-5" /> Create Discount
        </button>
      </div>

      {/* COUPONS LIST */}
      <div className="grid grid-cols-1 gap-4">
        {coupons.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-xl border border-dashed">
              <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No active coupons found.</p>
           </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
               
               {/* Left: Info */}
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${coupon.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                     {coupon.type === 'free_shipping' ? <ShoppingBag className="h-6 w-6"/> : <Percent className="h-6 w-6" />}
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-900 tracking-wide">{coupon.code}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${coupon.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {coupon.status}
                        </span>
                     </div>
                     <p className="text-sm text-gray-500">
                        {coupon.type === 'percentage' && `${coupon.value}% Off`}
                        {coupon.type === 'fixed' && `₹${coupon.value} Off`}
                        {coupon.type === 'free_shipping' && `Free Shipping`}
                        {coupon.minOrderValue > 0 && ` • Min purchase ₹${coupon.minOrderValue}`}
                        {coupon.appliesTo !== 'all' && ` • Specific ${coupon.appliesTo}`}
                     </p>
                     <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                        {coupon.usageLimit > 0 && (
                          <span className="flex items-center gap-1"><Tag className="h-3 w-3"/> {coupon.usedCount} / {coupon.usageLimit} used</span>
                        )}
                        {coupon.endDate && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> Expires {new Date(coupon.endDate).toLocaleDateString()}</span>
                        )}
                        {coupon.isNewUsersOnly && (
                           <span className="flex items-center gap-1 text-blue-500"><Users className="h-3 w-3"/> New customers only</span>
                        )}
                     </div>
                  </div>
               </div>

               {/* Right: Actions */}
               <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => toggleStatus(coupon.id, coupon.status)}
                    className="text-sm font-medium text-gray-600 hover:text-black border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    {coupon.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    onClick={() => handleDelete(coupon.id)}
                    className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
               <h2 className="text-xl font-bold">Create Discount</h2>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5"/></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-8">
              
              {/* 1. General Info */}
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-1">Coupon Code</label>
                      <input 
                        required 
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className="w-full border-2 border-gray-200 p-3 rounded-lg font-mono font-bold text-lg uppercase focus:border-black outline-none" 
                        placeholder="SUMMER25" 
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-500">Description (Optional)</label>
                    <input 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full border p-2 rounded-lg text-sm" 
                      placeholder="e.g. Summer sale for VIP customers" 
                    />
                 </div>
              </div>

              {/* 2. Value */}
              <div className="space-y-4 border-t pt-6">
                 <h3 className="font-bold text-sm uppercase text-gray-500">Discount Value</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className={`border p-4 rounded-xl cursor-pointer transition ${formData.type === 'percentage' ? 'ring-2 ring-black bg-gray-50' : 'hover:bg-gray-50'}`}>
                       <input type="radio" name="type" className="hidden" checked={formData.type === 'percentage'} onChange={() => setFormData({...formData, type: 'percentage', value: 0})} />
                       <span className="font-bold block mb-1">Percentage</span>
                       <span className="text-xs text-gray-500">% off products</span>
                    </label>
                    <label className={`border p-4 rounded-xl cursor-pointer transition ${formData.type === 'fixed' ? 'ring-2 ring-black bg-gray-50' : 'hover:bg-gray-50'}`}>
                       <input type="radio" name="type" className="hidden" checked={formData.type === 'fixed'} onChange={() => setFormData({...formData, type: 'fixed', value: 0})} />
                       <span className="font-bold block mb-1">Fixed Amount</span>
                       <span className="text-xs text-gray-500">₹ off total</span>
                    </label>
                    <label className={`border p-4 rounded-xl cursor-pointer transition ${formData.type === 'free_shipping' ? 'ring-2 ring-black bg-gray-50' : 'hover:bg-gray-50'}`}>
                       <input type="radio" name="type" className="hidden" checked={formData.type === 'free_shipping'} onChange={() => setFormData({...formData, type: 'free_shipping', value: 0})} />
                       <span className="font-bold block mb-1">Free Shipping</span>
                       <span className="text-xs text-gray-500">Off shipping cost</span>
                    </label>
                 </div>

                 {/* Value Input (Hidden for Free Shipping) */}
                 {formData.type !== 'free_shipping' && (
                   <div>
                      <label className="block text-sm font-bold mb-1">Discount Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                          {formData.type === 'percentage' ? '%' : '₹'}
                        </span>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          value={formData.value} 
                          onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                          className="w-full border p-2 pl-8 rounded-lg font-bold" 
                        />
                      </div>
                   </div>
                 )}
              </div>

              {/* 3. Applies To */}
              <div className="space-y-4 border-t pt-6">
                 <h3 className="font-bold text-sm uppercase text-gray-500">Applies To</h3>
                 <div className="flex gap-4">
                    <select 
                       value={formData.appliesTo}
                       onChange={e => setFormData({...formData, appliesTo: e.target.value, targetIds: []})}
                       className="border p-2 rounded-lg bg-white w-full"
                    >
                       <option value="all">All Products</option>
                       <option value="category">Specific Categories</option>
                       <option value="specific_products">Specific Products</option>
                    </select>
                 </div>

                 {/* Dynamic Selection UI */}
                 {formData.appliesTo === 'category' && (
                    <div className="p-4 bg-gray-50 rounded-xl border max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                       {categories.map(cat => (
                          <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={formData.targetIds.includes(cat)} 
                               onChange={() => handleTargetSelection(cat)}
                               className="rounded border-gray-300"
                             />
                             {cat}
                          </label>
                       ))}
                    </div>
                 )}

                 {formData.appliesTo === 'specific_products' && (
                    <div className="p-4 bg-gray-50 rounded-xl border max-h-60 overflow-y-auto space-y-2">
                       <input placeholder="Search products..." className="w-full border p-1 rounded text-sm mb-2" />
                       {products.map(p => (
                          <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                             <input 
                               type="checkbox" 
                               checked={formData.targetIds.includes(p.id)} 
                               onChange={() => handleTargetSelection(p.id)}
                               className="rounded border-gray-300"
                             />
                             {p.name}
                          </label>
                       ))}
                    </div>
                 )}
              </div>

              {/* 4. Minimum Requirements */}
              <div className="space-y-4 border-t pt-6">
                 <h3 className="font-bold text-sm uppercase text-gray-500">Minimum Requirements</h3>
                 <div>
                    <label className="block text-sm font-medium mb-1">Min. Purchase Amount (₹)</label>
                    <input 
                       type="number" 
                       value={formData.minOrderValue} 
                       onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                       className="w-full border p-2 rounded-lg" 
                       placeholder="0 for none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave 0 to apply to all orders.</p>
                 </div>
              </div>

              {/* 5. Eligibility & Usage */}
              <div className="space-y-4 border-t pt-6">
                 <h3 className="font-bold text-sm uppercase text-gray-500">Customer Eligibility</h3>
                 <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                       <input 
                         type="checkbox" 
                         checked={formData.isNewUsersOnly} 
                         onChange={e => setFormData({...formData, isNewUsersOnly: e.target.checked})}
                         className="h-4 w-4"
                       />
                       <div>
                          <span className="block font-bold text-sm">Limit to New Customers</span>
                          <span className="text-xs text-gray-500">Customers who haven't placed an order yet</span>
                       </div>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                       <input 
                         type="checkbox" 
                         checked={formData.limitOnePerUser} 
                         onChange={e => setFormData({...formData, limitOnePerUser: e.target.checked})}
                         className="h-4 w-4"
                       />
                       <div>
                          <span className="block font-bold text-sm">Limit to one use per customer</span>
                          <span className="text-xs text-gray-500">Tracked by user email/ID</span>
                       </div>
                    </label>
                 </div>

                 <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Max Total Uses</label>
                    <input 
                       type="number" 
                       value={formData.usageLimit} 
                       onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                       className="w-full border p-2 rounded-lg" 
                       placeholder="e.g. 100"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave 0 for unlimited uses.</p>
                 </div>
              </div>

              {/* 6. Active Dates */}
              <div className="space-y-4 border-t pt-6">
                 <h3 className="font-bold text-sm uppercase text-gray-500">Active Dates</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium mb-1">Start Date</label>
                       <input 
                         type="date" 
                         required
                         value={formData.startDate}
                         onChange={e => setFormData({...formData, startDate: e.target.value})}
                         className="w-full border p-2 rounded-lg" 
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                       <input 
                         type="date" 
                         value={formData.endDate}
                         onChange={e => setFormData({...formData, endDate: e.target.value})}
                         className="w-full border p-2 rounded-lg" 
                       />
                    </div>
                 </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t pt-6 flex gap-3 sticky bottom-0 bg-white pb-4">
                 <button 
                   type="button" 
                   onClick={() => setShowModal(false)}
                   className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-lg transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={submitting}
                   className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
                 >
                   {submitting ? "Creating..." : "Create Discount"}
                 </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}