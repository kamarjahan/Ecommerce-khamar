// src/lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  cart: any[]; // We will type this properly later
  addToCart: (item: any) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isLoginModalOpen: false,
      openLoginModal: () => set({ isLoginModalOpen: true }),
      closeLoginModal: () => set({ isLoginModalOpen: false }),
      cart: [],
      addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
    }),
    { name: 'shopping-cart' } // Saves to localStorage automatically
  )
);