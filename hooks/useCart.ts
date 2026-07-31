import { createContext, useContext } from "react";

export interface CartItem {
  productId: string;
  name: string;
  type: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  artworkUrl?: string;
  thumbnailUrl?: string;
  artworkSide?: "front" | "back";
  textArtworkUrl?: string;
  textArtworkSide?: "front" | "back";
  downloadArtwork?: boolean;
  downloadFullUrl?: string;
  downloadCarOnlyUrl?: string;
  downloadTextUrl?: string;
  illustrationMode?: "ai" | "designer";
  customerPhotoUrl?: string;
  customerNotes?: string;
  aiArtworkUrl?: string;
  backgroundUrl?: string;
  requestedText?: string;
  textPlacement?: "same" | "opposite";
  textCorner?: string;
  cornerImageUrl?: string;
  cornerImageLabel?: string;
  includeSourceFiles?: boolean;
  designerPriority?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, color?: string) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
