// src/types/index.ts

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  images: string[];
  inStock: boolean;
  stockCount: number;
  isReturnable: boolean;
  isCodAvailable?: boolean;
  shippingCostOverride?: number;
  keywords: string[];
  variants?: {
    size: string;
    color: string;
    stock: number;
  }[];
  createdAt: string; // or Date/Timestamp depending on how you handle it
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number; // Storing as ms timestamp for easier serialization
  verifiedPurchase: boolean;
};

export type Order = {
  id: string;
  userId: string;
  status: 'pending' | 'placed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    variant?: string;
  }>;
  shippingAddress: any;
  payment: any;
  createdAt: any;
};