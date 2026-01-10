"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    mrp: "",
    category: "fashion",
    stockCount: "",
  });

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
      
      // Generate Previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return toast.error("Please upload at least one image");

    setLoading(true);
    try {
      // 1. Upload Images
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      // 2. Save to Firestore
      await addDoc(collection(db, "products"), {
        name: formData.name,
        sku: formData.sku || `SKU-${Date.now()}`,
        description: formData.description,
        price: Number(formData.price),
        mrp: Number(formData.mrp),
        category: formData.category,
        stockCount: Number(formData.stockCount),
        images: imageUrls,
        searchKeywords: formData.name.toLowerCase().split(" "),
        createdAt: serverTimestamp(),
        variants: [] // Simplified for now
      });

      toast.success("Product Created!");
      router.push("/admin/products");

    } catch (error) {
      console.error(error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
             <label className="block text-sm font-medium mb-1">Product Name</label>
             <input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nike Air Max..." />
          </div>
          
          <div>
             <label className="block text-sm font-medium mb-1">Selling Price (₹)</label>
             <input required type="number" className="w-full border p-2 rounded-lg" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">MRP (₹)</label>
             <input required type="number" className="w-full border p-2 rounded-lg" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} />
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Category</label>
             <select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
               <option value="fashion">Fashion</option>
               <option value="electronics">Electronics</option>
               <option value="mobiles">Mobiles</option>
               <option value="home">Home</option>
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Stock Quantity</label>
             <input required type="number" className="w-full border p-2 rounded-lg" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} />
          </div>

          <div className="col-span-2">
             <label className="block text-sm font-medium mb-1">Description</label>
             <textarea required rows={4} className="w-full border p-2 rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>

        {/* Image Upload */}
        <div>
           <label className="block text-sm font-medium mb-2">Product Images</label>
           <div className="grid grid-cols-4 gap-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                   <Image src={src} alt="preview" fill className="object-cover" />
                   <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3"/></button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                 <Upload className="h-6 w-6 text-gray-400 mb-2" />
                 <span className="text-xs text-gray-500">Upload Image</span>
                 <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
           </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
           <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
           <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
              {loading && <Loader2 className="animate-spin h-4 w-4" />} Create Product
           </button>
        </div>

      </form>
    </div>
  );
}