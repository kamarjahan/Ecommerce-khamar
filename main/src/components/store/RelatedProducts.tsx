"use client";

import { Product } from "@/types";
import ProductCard from "@/components/store/ProductCard";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">You Might Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}