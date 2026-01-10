import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Product } from "@/types";

// --- CONFIGURATION ---
// ⚠️ Ensure these are in your .env.local file or replace strictly for testing
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your-upload-preset";

export const productService = {
  // Get Single Product by ID
  getById: async (id: string): Promise<Product | null> => {
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
  },

  // Get Latest Products
  getLatest: async (count: number = 8): Promise<Product[]> => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(count));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      return [];
    }
  },

  // Get All Products (for the products page)
  getAll: async (): Promise<Product[]> => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  }
};

// --- UPDATED: CLOUDINARY UPLOAD FUNCTION ---
export const uploadProductImage = async (file: File): Promise<string> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME === "your-cloud-name") {
    console.error("Cloudinary credentials missing. Check .env.local or product-service.ts");
    throw new Error("Cloudinary configuration missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "ecommerce-products"); // Optional: Folders in Cloudinary

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Image upload failed");
    }

    const data = await response.json();
    return data.secure_url; // Returns the Cloudinary URL
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};