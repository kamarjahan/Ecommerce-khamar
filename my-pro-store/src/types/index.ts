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
  isCodAvailable?: boolean; // <--- ADDED THIS
  shippingCostOverride?: number;
  keywords: string[];
  variants?: {
    size: string;
    color: string;
    stock: number;
  }[];
  createdAt: string;
};

export type Order = {
  id: string;
  userId: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'cancellation_requested';
  totalAmount: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    pincode: string;
    phone: string;
  };
  tracking?: {
    courier: string;
    id: string;
  };
  createdAt: Date;
};