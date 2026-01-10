"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadProductImage } from "@/lib/services/product-service";
import { Loader2, Save, ArrowLeft, X, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<{size: string, color: string, stock: number}[]>([]);
  
  // Profit Calcs
  const [margin, setMargin] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: "",
      mrp: "",
      costPrice: "",
      taxRate: "18",
      shippingCost: "0",
      category: "Fabric",
      returnPolicy: "returnable",
      stockCount: "",
      isCodAvailable: true // <--- Default to True
    }
  });
  
  const sellingPrice = watch("price");
  const costPrice = watch("costPrice");

  useEffect(() => {
    if (sellingPrice && costPrice) {
      const price = parseFloat(sellingPrice);
      const cost = parseFloat(costPrice);
      if (!isNaN(price) && !isNaN(cost)) {
        setProfit(price - cost);
        setMargin(((price - cost) / price) * 100);
      }
    }
  }, [sellingPrice, costPrice]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    if (newImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await Promise.all(
        newImages.map(async (file) => await uploadProductImage(file))
      );

      const keywords = [
        ...data.name.toLowerCase().split(" "),
        data.category.toLowerCase(),
        data.sku ? data.sku.toLowerCase() : ""
      ].filter(k => k);

      await addDoc(collection(db, "products"), {
        name: data.name,
        sku: data.sku || `SKU-${Date.now()}`,
        description: data.description,
        price: Number(data.price),
        mrp: Number(data.mrp),
        costPrice: Number(data.costPrice),
        taxRate: Number(data.taxRate),
        shippingCost: Number(data.shippingCost),
        category: data.category,
        returnPolicy: data.returnPolicy,
        isCodAvailable: data.isCodAvailable, // <--- SAVED HERE
        stockCount: Number(data.stockCount),
        images: imageUrls,
        variants: variants,
        keywords: keywords,
        createdAt: serverTimestamp(),
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
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input {...register("name", { required: true })} placeholder="e.g. Cotton T-Shirt" className="w-full border p-2 rounded bg-white text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea {...register("description", { required: true })} placeholder="Product details..." className="w-full border p-2 rounded h-32 bg-white text-gray-900"></textarea>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-4">Media</h3>
            <div className="flex gap-4 mb-4 flex-wrap">
                {previews.map((src, i) => (
                    <div key={i} className="relative w-24 h-24 border rounded overflow-hidden bg-gray-50">
                        <img src={src} alt="preview" className="object-cover w-full h-full" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl hover:bg-red-600 transition"><X className="h-3 w-3" /></button>
                    </div>
                ))}
            </div>
            <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg text-center hover:bg-gray-50 transition">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" id="new-img-upload" />
                <label htmlFor="new-img-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-blue-600 font-medium">Click to Upload Images</span>
                </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-4">Pricing</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Selling Price (₹)</label>
                 <input {...register("price", { required: true })} type="number" className="w-full border p-2 rounded bg-white text-gray-900" />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1">MRP (₹)</label>
                 <input {...register("mrp")} type="number" className="w-full border p-2 rounded bg-white text-gray-900" />
               </div>
            </div>
             <div className="grid grid-cols-2 gap-4 border-t pt-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Cost per item (₹)</label>
                 <input {...register("costPrice")} type="number" className="w-full border p-2 rounded bg-white text-gray-900" />
               </div>
               <div className="flex items-center gap-4 pt-4">
                 <div className="bg-gray-50 p-2 rounded border">
                    <span className="block text-xs text-gray-500">Margin</span>
                    <span className={`block font-bold ${margin && margin > 0 ? 'text-green-600' : ''}`}>
                      {margin ? margin.toFixed(1) + "%" : "-"}
                    </span>
                 </div>
                 <div className="bg-gray-50 p-2 rounded border">
                    <span className="block text-xs text-gray-500">Profit</span>
                    <span className={`block font-bold ${profit && profit > 0 ? 'text-green-600' : ''}`}>
                       {profit ? "₹" + profit.toFixed(2) : "-"}
                    </span>
                 </div>
               </div>
            </div>
          </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Variants</h3>
                <button type="button" onClick={() => setVariants([...variants, { size: "", color: "", stock: 0 }])} className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition">+ Add Variant</button>
              </div>
              
              {variants.map((v, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <input placeholder="Size" value={v.size} onChange={(e) => { const newV = [...variants]; newV[index].size = e.target.value; setVariants(newV); }} className="flex-1 border p-2 rounded text-sm bg-white text-gray-900" />
                  <input placeholder="Color" value={v.color} onChange={(e) => { const newV = [...variants]; newV[index].color = e.target.value; setVariants(newV); }} className="flex-1 border p-2 rounded text-sm bg-white text-gray-900" />
                  <input type="number" placeholder="Qty" value={v.stock} onChange={(e) => { const newV = [...variants]; newV[index].stock = Number(e.target.value); setVariants(newV); }} className="w-24 border p-2 rounded text-sm bg-white text-gray-900" />
                  <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="text-red-500 p-2 hover:bg-red-50 rounded"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-semibold mb-4">Organization</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select {...register("category")} className="w-full border p-2 rounded bg-white text-gray-900">
                    <option value="Fabric">Fabric</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Polyester">Polyester</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mobiles">Mobiles</option>
                    <option value="Home">Home</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">SKU (Optional)</label><input {...register("sku")} placeholder="Auto-generated if empty" className="w-full border p-2 rounded bg-white text-gray-900" /></div>
                <div><label className="block text-sm font-medium mb-1">Total Stock</label><input {...register("stockCount", { required: true })} type="number" className="w-full border p-2 rounded bg-white text-gray-900" /></div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-semibold mb-4">Policies</h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1">Return Policy</label>
                  <select {...register("returnPolicy")} className="w-full border p-2 rounded bg-white text-gray-900">
                    <option value="returnable">Returnable (7 Days)</option>
                    <option value="replacement">Replacement Only</option>
                    <option value="no_refund">Not Refundable</option>
                  </select>
               </div>
               {/* COD CHECKBOX */}
               <div className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50">
                  <input type="checkbox" {...register("isCodAvailable")} id="cod" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="cod" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Cash on Delivery Available</label>
               </div>
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Create Product</>}
          </button>
        </div>
      </form>
    </div>
  );
}