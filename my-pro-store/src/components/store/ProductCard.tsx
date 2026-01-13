"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/lib/store";
import { ShoppingCart } from "lucide-react"; 
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useStore(); 

  // FIX: Calculate availability based on stockCount number
  // (Since 'inStock' boolean might be missing or false in DB)
  const hasStock = (product.stockCount || 0) > 0;

  // Handle Add to Cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!hasStock) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
    });
    toast.success("Added to Cart");
  };

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <Link 
      href={`/product/${product.id}`} 
      className="group block bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full bg-gray-50">
        <Image
          src={product.images[0] || "/placeholder.png"}
          alt={product.name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* FIX: Use hasStock here */}
        {!hasStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && (
            <>
              <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
              <span className="text-xs font-medium text-green-600">{discount}% OFF</span>
            </>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!hasStock}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors",
            hasStock 
              ? "bg-gray-900 text-white hover:bg-gray-800" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {hasStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </Link>
  );
}