"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useStore } from "@/lib/store";
import { Star, ShoppingCart, Heart, Share2, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductView({ product }: { product: Product }) {
  const { addToCart, addToWishlist, wishlist } = useStore();
  
  // SAFEGUARD: Ensure images exist before accessing [0]
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || "/placeholder.png");
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<null | string>(null);

  const isWishlisted = wishlist.some(item => item.id === product.id);

  const handleAddToCart = () => {
    if (product.variants?.length && !selectedVariant) {
      toast.error("Please select a size/color");
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      variant: selectedVariant ? `${selectedVariant.color}-${selectedVariant.size}` : undefined,
      quantity: 1,
    });
    toast.success("Added to Cart!");
  };

  const checkPincode = () => {
    if (pincode.length !== 6) {
      setDeliveryStatus("Invalid Pincode");
      return;
    }
    // Mock Logic
    if (["110001", "400001", "560001"].includes(pincode)) {
      setDeliveryStatus("Delivered by Tomorrow");
    } else {
      setDeliveryStatus("Delivery in 3-5 Days");
    }
  };

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      {/* Left Column: Images */}
      <div className="space-y-4">
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border">
          <Image src={selectedImage} alt={product.name} fill className="object-cover" />
          <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {product.images?.map((img, i) => (
            <button key={i} onClick={() => setSelectedImage(img)} className={cn("relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2", selectedImage === img ? "border-blue-600" : "border-transparent")}>
              <Image src={img} alt="thumbnail" fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Info */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-sm text-gray-500 uppercase tracking-wide">{product.category}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">SKU: {product.sku}</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
        <div className="flex items-center gap-2 mb-6">
          <div className="flex text-yellow-400"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
          <span className="text-sm text-blue-600 font-medium">(12 Verified Reviews)</span>
        </div>

        <div className="flex items-end gap-3 mb-8 bg-gray-50 p-4 rounded-lg">
          <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && (
            <>
              <span className="text-xl text-gray-400 line-through mb-1">₹{product.mrp.toLocaleString()}</span>
              <span className="text-sm font-bold text-green-600 mb-2 bg-green-100 px-2 py-0.5 rounded">{discount}% OFF</span>
            </>
          )}
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-8 space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Select Variant</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, i) => (
                  <button key={i} onClick={() => setSelectedVariant(variant)} className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all", selectedVariant === variant ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-gray-200")}>
                    {variant.size} - {variant.color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pincode Checker */}
        <div className="mb-8">
           <p className="text-sm font-medium text-gray-700 mb-2">Delivery Availability</p>
           <div className="flex gap-2 max-w-xs">
              <input 
                placeholder="Enter Pincode" 
                className="border rounded-lg px-3 py-2 w-full text-sm"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
              />
              <button onClick={checkPincode} className="bg-gray-900 text-white px-4 rounded-lg text-sm font-bold">Check</button>
           </div>
           {deliveryStatus && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><Truck className="h-4 w-4"/> {deliveryStatus}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button onClick={handleAddToCart} className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Add to Cart
          </button>
          <button 
            onClick={() => { addToWishlist({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || "" }); toast.success("Added to Wishlist"); }}
            className={cn("p-4 border border-gray-300 rounded-xl hover:bg-gray-50", isWishlisted ? "text-red-500 fill-current" : "text-gray-600")}
          >
            <Heart className={cn("h-6 w-6", isWishlisted && "fill-red-500 text-red-500")} />
          </button>
        </div>

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-bold mb-4">Product Description</h3>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      </div>
    </div>
  );
}