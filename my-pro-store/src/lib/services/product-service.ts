import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Product } from "@/types";

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
  }
};

// Upload Product Image to Firebase Storage
export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};