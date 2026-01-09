"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useStore } from "@/lib/store";
import { Star, ShoppingCart, Heart, Share2, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductView({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  
  // Default to first variant if available
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const handleAddToCart = () => {
    // 1. Validation: If product has variants, user MUST select one
    if (product.variants?.length && !selectedVariant) {
      toast.error("Please select a size/color");
      return;
    }

    // 2. Check Stock
    const currentStock = selectedVariant ? selectedVariant.stock : product.stockCount;
    if (currentStock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }

    // 3. Add to Cart
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      variant: selectedVariant ? `${selectedVariant.color}-${selectedVariant.size}` : null,
      quantity: 1,
    });
    toast.success("Added to Cart!");
  };

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      
      {/* LEFT: Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border">
          <Image
            src={selectedImage || "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {/* Share Button */}
          <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        {/* Thumbnails */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(img)}
              className={cn(
                "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2",
                selectedImage === img ? "border-blue-600" : "border-transparent"
              )}
            >
              <Image src={img} alt="thumbnail" fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Product Details */}
      <div>
        {/* Breadcrumb & SKU */}
        <div className="flex justify-between items-start mb-4">
          <span className="text-sm text-gray-500 uppercase tracking-wide">{product.category}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">SKU: {product.sku}</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

        {/* Rating Mockup */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
          </div>
          <span className="text-sm text-blue-600 font-medium">(12 Verified Reviews)</span>
        </div>

        {/* Price Block */}
        <div className="flex items-end gap-3 mb-8 bg-gray-50 p-4 rounded-lg">
          <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && (
            <>
              <span className="text-xl text-gray-400 line-through mb-1">₹{product.mrp.toLocaleString()}</span>
              <span className="text-sm font-bold text-green-600 mb-2 bg-green-100 px-2 py-0.5 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        {/* Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-8 space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Select Variant</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-all min-w-[80px]",
                      selectedVariant === variant
                        ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    {variant.size} - {variant.color}
                    <span className="block text-[10px] text-gray-400">
                      {variant.stock > 0 ? `${variant.stock} left` : "Out of Stock"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </button>
          <button className="p-4 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600">
            <Heart className="h-6 w-6" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-600 border-t pt-6">
          <div className="flex flex-col items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span>Fast Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Secure Payment</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RotateCcw className="h-6 w-6 text-blue-600" />
            <span>{product.isReturnable ? "7 Day Returns" : "No Returns"}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-bold mb-4">Product Description</h3>
          <div className="prose prose-sm text-gray-600">
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}