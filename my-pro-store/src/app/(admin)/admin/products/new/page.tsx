"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { uploadProductImage, createProduct } from "@/lib/services/product-service";
import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming you installed sonner

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<{size: string, color: string, stock: number}[]>([]);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1. Upload Images First
      const imageUrls = await Promise.all(
        imageFiles.map(file => uploadProductImage(file))
      );

      // 2. Prepare Product Object
      const productData = {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: Number(data.price),
        mrp: Number(data.mrp),
        category: data.category,
        isReturnable: data.isReturnable,
        stockCount: Number(data.stockCount),
        images: imageUrls,
        variants: variants,
      };

      // 3. Save to DB
      await createProduct(productData);
      
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { size: "M", color: "Black", stock: 10 }]);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input {...register("name")} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU (Code)</label>
            <input {...register("sku")} className="w-full border p-2 rounded" placeholder="NK-SHO-001" required />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Selling Price (₹)</label>
            <input {...register("price")} type="number" className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">MRP (₹)</label>
            <input {...register("mrp")} type="number" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock Count (Global)</label>
            <input {...register("stockCount")} type="number" className="w-full border p-2 rounded" required />
          </div>
        </div>

        {/* Category & Logic */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select {...register("category")} className="w-full border p-2 rounded">
              <option value="clothing">Clothing</option>
              <option value="electronics">Electronics</option>
              <option value="footwear">Footwear</option>
            </select>
          </div>
          <div className="flex items-center space-x-3 mt-6">
            <input {...register("isReturnable")} type="checkbox" className="h-5 w-5" />
            <span className="text-sm font-medium">Is Returnable?</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea {...register("description")} className="w-full border p-2 rounded h-32" required></textarea>
        </div>

        {/* Image Upload */}
        <div className="border-2 border-dashed p-6 rounded-lg text-center">
          <input 
            type="file" 
            multiple 
            onChange={(e) => e.target.files && setImageFiles(Array.from(e.target.files))} 
            className="hidden" 
            id="img-upload"
          />
          <label htmlFor="img-upload" className="cursor-pointer text-blue-600 font-medium">
            Click to Upload Images
          </label>
          <div className="mt-2 flex gap-2 justify-center">
            {imageFiles.map((file, i) => (
              <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{file.name}</span>
            ))}
          </div>
        </div>

        {/* Variants Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Variants (Size/Color)</h3>
            <button type="button" onClick={addVariant} className="text-xs flex items-center bg-black text-white px-3 py-1 rounded">
              <Plus className="h-3 w-3 mr-1" /> Add Variant
            </button>
          </div>
          
          {variants.map((v, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input 
                placeholder="Size" 
                value={v.size} 
                onChange={(e) => {
                  const newV = [...variants];
                  newV[index].size = e.target.value;
                  setVariants(newV);
                }}
                className="w-20 border p-1 rounded text-sm" 
              />
              <input 
                placeholder="Color" 
                value={v.color} 
                onChange={(e) => {
                  const newV = [...variants];
                  newV[index].color = e.target.value;
                  setVariants(newV);
                }}
                className="w-24 border p-1 rounded text-sm" 
              />
              <input 
                type="number" 
                placeholder="Qty" 
                value={v.stock} 
                onChange={(e) => {
                  const newV = [...variants];
                  newV[index].stock = Number(e.target.value);
                  setVariants(newV);
                }}
                className="w-20 border p-1 rounded text-sm" 
              />
              <button 
                type="button" 
                onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Create Product"}
        </button>
      </form>
    </div>
  );
}