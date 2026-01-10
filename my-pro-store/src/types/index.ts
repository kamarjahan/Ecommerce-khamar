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
  createdAt: string;
};

export type Address = {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
};

export type TicketMessage = {
  id?: string;
  senderId: string; // 'admin' or userId
  senderName: string;
  text: string;
  createdAt: number;
};

export type Ticket = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  createdAt: any;
  lastMessage?: string;
  lastMessageAt?: number;
};

export type Order = {
  id: string;
  userId: string;
  status: 'pending' | 'placed' | 'shipped' | 'delivered' | 'cancelled' | 'cancellation_requested';
  totalAmount: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    variant?: string;
  }>;
  shippingAddress: Address;
  payment: any;
  createdAt: any;
};