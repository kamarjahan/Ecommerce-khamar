import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import { Product } from "@/types";
import ProductView from "@/components/store/ProductView";

// Helper to fetch data
async function getProduct(id: string) {
  try {
    const docRef = doc(db, "products", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// The Page Component (Server Side)
// FIXED: params is now a Promise in Next.js 15
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Await params to get the ID
  const { id } = await params;

  // 2. Fetch the product using the ID
  const product = await getProduct(id);

  // 3. If no product found, show 404 page
  if (!product) {
    return notFound();
  }

  // 4. Pass the valid product data to the client view
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <ProductView product={product} />
    </div>
  );
}