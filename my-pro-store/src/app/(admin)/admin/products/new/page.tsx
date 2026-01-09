"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadProductImage } from "@/lib/services/product-service";
import { Loader2, X, Plus, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [variants, setVariants] = useState<{size: string, color: string, stock: number}[]>([]);
  
  // Real-time Margin Calculation State
  const [margin, setMargin] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);

  const { register, handleSubmit, watch } = useForm();
  
  // Watch inputs for calculations
  const sellingPrice = watch("price");
  const costPrice = watch("costPrice");

  useEffect(() => {
    if (sellingPrice && costPrice) {
      const price = parseFloat(sellingPrice);
      const cost = parseFloat(costPrice);
      const calculatedProfit = price - cost;
      const calculatedMargin = (calculatedProfit / price) * 100;
      
      setProfit(calculatedProfit);
      setMargin(calculatedMargin);
    } else {
      setProfit(null);
      setMargin(null);
    }
  }, [sellingPrice, costPrice]);

  const onSubmit = async (data: any) => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Images
      const imageUrls = await Promise.all(
        images.map(async (file) => await uploadProductImage(file))
      );

      // 2. Save Product
      await addDoc(collection(db, "products"), {
        name: data.name,
        sku: data.sku,
        description: data.description,
        
        // Pricing & Costs
        price: Number(data.price),
        mrp: Number(data.mrp),
        costPrice: Number(data.costPrice), // New
        taxRate: Number(data.taxRate),     // New
        shippingCost: Number(data.shippingCost), // New

        // Organization
        category: data.category,
        
        // Policies
        returnPolicy: data.returnPolicy, // "returnable", "replacement", "no_refund"

        stockCount: Number(data.stockCount),
        images: imageUrls,
        variants: variants,
        createdAt: serverTimestamp(),
        
        keywords: [
          ...data.name.toLowerCase().split(" "),
          data.category.toLowerCase(),
          data.sku.toLowerCase()
        ]
      });
      
      toast.success("Product Created Successfully!");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. General Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Product Name</label>
                  <input {...register("name")} className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" placeholder="e.g. Premium Cotton Shirt" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                  <textarea {...register("description")} className="w-full border border-gray-300 p-2 rounded h-32 bg-white text-gray-900" placeholder="Product details..." required></textarea>
                </div>
             </div>
          </div>

          {/* 2. Media */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Media</h3>
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center bg-gray-50">
                <div className="flex gap-4 mb-4 flex-wrap justify-center">
                    {images.map((file, i) => (
                        <div key={i} className="relative w-24 h-24 border rounded overflow-hidden shadow-sm">
                            <Image src={URL.createObjectURL(file)} alt="preview" fill className="object-cover" />
                            <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <input type="file" multiple onChange={(e) => e.target.files && setImages([...images, ...Array.from(e.target.files)])} className="hidden" id="img-upload" />
                <label htmlFor="img-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Plus className="h-6 w-6" /></div>
                    <span className="text-blue-600 font-medium hover:underline">Upload Images</span>
                </label>
            </div>
          </div>

          {/* 3. Pricing & Inventory */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Selling Price (₹)</label>
                 <input {...register("price")} type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" required />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">MRP (₹)</label>
                 <input {...register("mrp")} type="number" className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Cost per item (₹)</label>
                 <input {...register("costPrice")} type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" placeholder="0.00" />
                 <p className="text-xs text-gray-500 mt-1">Customers won't see this</p>
               </div>
               <div className="flex items-center gap-4 pt-6">
                 <div>
                    <span className="block text-xs text-gray-500">Margin</span>
                    <span className="block font-medium text-gray-900">{margin ? margin.toFixed(1) + "%" : "-"}</span>
                 </div>
                 <div>
                    <span className="block text-xs text-gray-500">Profit</span>
                    <span className="block font-medium text-gray-900">{profit ? "₹" + profit.toFixed(2) : "-"}</span>
                 </div>
               </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Tax Rate (%)</label>
                 <input {...register("taxRate")} type="number" defaultValue={18} className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Shipping Cost (₹)</label>
                 <input {...register("shippingCost")} type="number" defaultValue={0} className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" />
               </div>
            </div>
          </div>
          
           {/* 4. Variants */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-gray-900">Variants (Size & Color)</h3>
               <button type="button" onClick={() => setVariants([...variants, { size: "", color: "", stock: 0 }])} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded">
                 + Add Variant
               </button>
             </div>
             {variants.map((v, index) => (
               <div key={index} className="flex gap-2 mb-2">
                 <input placeholder="Size (S, M, L)" value={v.size} onChange={(e) => { const newV = [...variants]; newV[index].size = e.target.value; setVariants(newV); }} className="flex-1 border border-gray-300 p-2 rounded text-sm text-gray-900" />
                 <input placeholder="Color (Red, Blue)" value={v.color} onChange={(e) => { const newV = [...variants]; newV[index].color = e.target.value; setVariants(newV); }} className="flex-1 border border-gray-300 p-2 rounded text-sm text-gray-900" />
                 <input type="number" placeholder="Qty" value={v.stock} onChange={(e) => { const newV = [...variants]; newV[index].stock = Number(e.target.value); setVariants(newV); }} className="w-20 border border-gray-300 p-2 rounded text-sm text-gray-900" />
                 <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="text-red-500 p-2"><X className="h-4 w-4" /></button>
               </div>
             ))}
           </div>
        </div>

        {/* RIGHT COLUMN (Organization) */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-semibold text-gray-900 mb-4">Organization</h3>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Category</label>
                  <select {...register("category")} className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900">
                    <option value="Fabric">Fabric</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Polyester">Polyester</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">SKU (Code)</label>
                  <input {...register("sku")} className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" required />
                </div>
                
                <div>
                   <label className="block text-sm font-medium mb-1 text-gray-700">Total Stock</label>
                   <input {...register("stockCount")} type="number" className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" required />
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-semibold text-gray-900 mb-4">Policies</h3>
             
             <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Return Policy</label>
                <select {...register("returnPolicy")} className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900">
                  <option value="returnable">Returnable (7 Days)</option>
                  <option value="replacement">Replacement Only</option>
                  <option value="no_refund">Not Refundable</option>
                </select>
                <div className="mt-3 p-3 bg-blue-50 text-blue-700 text-xs rounded flex items-start gap-2">
                   <AlertCircle className="h-4 w-4 shrink-0" />
                   <p>Selected policy will be displayed on the product page.</p>
                </div>
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-200">
            {loading ? <Loader2 className="animate-spin" /> : "Create Product"}
          </button>

        </div>
      </form>
    </div>
  );
}