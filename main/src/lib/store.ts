import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  variant?: string;
  quantity: number;
  isCodAvailable?: boolean; // <--- ADDED THIS
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface AppState {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, variant: string | undefined, quantity: number) => void;
  clearCart: () => void;

  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isLoginModalOpen: false,
      openLoginModal: () => set({ isLoginModalOpen: true }),
      closeLoginModal: () => set({ isLoginModalOpen: false }),
      
      cart: [],
      addToCart: (item) => set((state) => {
        const existingItem = state.cart.find(
          (i) => i.id === item.id && i.variant === item.variant
        );
        if (existingItem) {
          return {
            cart: state.cart.map((i) =>
              i.id === item.id && i.variant === item.variant
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          };
        }
        return { cart: [...state.cart, item] };
      }),
      removeFromCart: (id, variant) => set((state) => ({
        cart: state.cart.filter((i) => !(i.id === id && i.variant === variant))
      })),
      updateQuantity: (id, variant, quantity) => set((state) => ({
        cart: state.cart.map((i) => 
          i.id === id && i.variant === variant 
            ? { ...i, quantity: Math.max(1, quantity) }
            : i
        )
      })),
      clearCart: () => set({ cart: [] }),

      wishlist: [],
      addToWishlist: (item) => set((state) => {
        if (state.wishlist.some(i => i.id === item.id)) return state;
        return { wishlist: [...state.wishlist, item] };
      }),
      removeFromWishlist: (id) => set((state) => ({
        wishlist: state.wishlist.filter((i) => i.id !== id)
      })),
    }),
    { name: 'shopping-store' }
  )
);