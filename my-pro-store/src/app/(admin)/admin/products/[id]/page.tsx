"use client";

import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadProductImage } from "@/lib/services/product-service";
import { Loader2, X, Save, ArrowLeft, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

const CATEGORY_PRESETS = ["Mens", "Womens", "Kids", "Teens"];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [variants, setVariants] = useState<{size: string, color: string, stock: number}[]>([]);
  
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Profit Calcs
  const [margin, setMargin] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  
  const sellingPrice = watch("price");
  const costPrice = watch("costPrice");
  const currentCategory = watch("category");

  useEffect(() => {
    if (sellingPrice && costPrice) {
      const price = parseFloat(sellingPrice);
      const cost = parseFloat(costPrice);
      setProfit(price - cost);
      setMargin(((price - cost) / price) * 100);
    }
  }, [sellingPrice, costPrice]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          reset({
            name: data.name,
            sku: data.sku,
            price: data.price,
            mrp: data.mrp,
            costPrice: data.costPrice || 0,
            taxRate: data.taxRate || 18,
            shippingCost: data.shippingCost || 0,
            stockCount: data.stockCount,
            category: data.category,
            description: data.description,
            returnPolicy: data.returnPolicy || "returnable",
            isCodAvailable: data.isCodAvailable !== false,
          });
          
          // Check if category is custom
          if (data.category && !CATEGORY_PRESETS.includes(data.category)) {
            setIsCustomCategory(true);
          } else {
            setIsCustomCategory(false);
          }

          setExistingImages(data.images || []);
          setVariants(data.variants || []);
        } else {
          toast.error("Product not found");
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, reset, router]);

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustomCategory(true);
      setValue("category", ""); // Clear for input
    } else {
      setIsCustomCategory(false);
      setValue("category", val);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const newImageUrls = await Promise.all(
        newImages.map(async (file) => await uploadProductImage(file))
      );

      const finalImages = [...existingImages, ...newImageUrls];

      await updateDoc(doc(db, "products", productId), {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: Number(data.price),
        mrp: Number(data.mrp),
        costPrice: Number(data.costPrice),
        taxRate: Number(data.taxRate),
        shippingCost: Number(data.shippingCost),
        category: data.category,
        returnPolicy: data.returnPolicy,
        isCodAvailable: data.isCodAvailable,
        stockCount: Number(data.stockCount),
        images: finalImages,
        variants: variants,
        keywords: [
          ...data.name.toLowerCase().split(" "),
          data.category.toLowerCase(),
          data.sku ? data.sku.toLowerCase() : ""
        ].filter(Boolean)
      });
      
      toast.success("Product Updated!");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const removeExistingImage = (urlToRemove: string) => {
    setExistingImages(existingImages.filter(url => url !== urlToRemove));
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input {...register("name")} className="w-full border p-2 rounded bg-white text-gray-900" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea {...register("description")} className="w-full border p-2 rounded h-32 bg-white text-gray-900" required></textarea>
                </div>
             </div>
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-4">Media</h3>
            <div className="flex gap-4 mb-4 flex-wrap">
                {existingImages.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 border rounded overflow-hidden">
                        <Image src={url} alt="product" fill className="object-cover" />
                        <button type="button" onClick={() => removeExistingImage(url)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"><X className="h-3 w-3" /></button>
                    </div>
                ))}
            </div>
            <div className="border-2 border-dashed p-4 rounded-lg text-center">
                <input type="file" multiple onChange={(e) => e.target.files && setNewImages(Array.from(e.target.files))} className="hidden" id="edit-img-upload" />
                <label htmlFor="edit-img-upload" className="cursor-pointer text-blue-600 font-medium">Upload New Images</label>
                <div className="mt-2 text-xs text-gray-500">{newImages.length > 0 && `${newImages.length} new files selected`}</div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-4">Pricing</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Price (₹)</label>
                 <input {...register("price")} type="number" className="w-full border p-2 rounded bg-white text-gray-900" required />
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
               <div className="flex items-center gap-4 pt-6">
                 <div><span className="block text-xs text-gray-500">Margin</span><span className="block font-medium">{margin ? margin.toFixed(1) + "%" : "-"}</span></div>
                 <div><span className="block text-xs text-gray-500">Profit</span><span className="block font-medium">{profit ? "₹" + profit.toFixed(2) : "-"}</span></div>
               </div>
            </div>
          </div>

           {/* Variants */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Variants</h3>
                <button type="button" onClick={() => setVariants([...variants, { size: "", color: "", stock: 0 }])} className="text-xs bg-black text-white px-3 py-1 rounded">+ Add Variant</button>
              </div>
              {variants.map((v, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input placeholder="Size" value={v.size} onChange={(e) => { const newV = [...variants]; newV[index].size = e.target.value; setVariants(newV); }} className="w-20 border p-1 rounded text-sm bg-white text-gray-900" />
                  <input placeholder="Color" value={v.color} onChange={(e) => { const newV = [...variants]; newV[index].color = e.target.value; setVariants(newV); }} className="w-24 border p-1 rounded text-sm bg-white text-gray-900" />
                  <input type="number" placeholder="Qty" value={v.stock} onChange={(e) => { const newV = [...variants]; newV[index].stock = Number(e.target.value); setVariants(newV); }} className="w-20 border p-1 rounded text-sm bg-white text-gray-900" />
                  <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="text-red-500"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-semibold mb-4">Organization</h3>
             <div className="space-y-4">
                {/* MODIFIED CATEGORY SECTION */}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full border p-2 rounded bg-white text-gray-900 mb-2"
                    value={isCustomCategory ? "custom" : (CATEGORY_PRESETS.includes(currentCategory) ? currentCategory : "custom")}
                    onChange={handleCategorySelect}
                  >
                    {CATEGORY_PRESETS.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="custom">Custom / Other</option>
                  </select>
                  
                  <input 
                    {...register("category")} 
                    placeholder="Enter Custom Category" 
                    className={`w-full border p-2 rounded bg-white text-gray-900 ${isCustomCategory ? 'block' : 'hidden'}`} 
                  />
                </div>

                <div><label className="block text-sm font-medium mb-1">SKU</label><input {...register("sku")} className="w-full border p-2 rounded bg-white text-gray-900" /></div>
                <div><label className="block text-sm font-medium mb-1">Stock</label><input {...register("stockCount")} type="number" className="w-full border p-2 rounded bg-white text-gray-900" /></div>
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
               <div className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50">
                  <input type="checkbox" {...register("isCodAvailable")} id="cod" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="cod" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Cash on Delivery Available</label>
               </div>
             </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
            {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}