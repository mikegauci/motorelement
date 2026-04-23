"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CartContext, type CartItem } from "@/hooks/useCart";

const STORAGE_KEY = "motorelement-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function itemKey(productId: string, size: string, color?: string) {
  return `${productId}::${size}::${color ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const key = itemKey(item.productId, item.size, item.color);
      const idx = prev.findIndex(
        (i) => itemKey(i.productId, i.size, i.color) === key
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string, color?: string) => {
    const key = itemKey(productId, size, color);
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.size, i.color) !== key));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, quantity: number, color?: string) => {
      if (quantity < 1) {
        removeItem(productId, size, color);
        return;
      }
      const key = itemKey(productId, size, color);
      setItems((prev) =>
        prev.map((i) =>
          itemKey(i.productId, i.size, i.color) === key ? { ...i, quantity } : i
        )
      );
    },
    [removeItem]
  );

  const clear = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalItems,
      totalPrice,
      isOpen,
      openCart,
      closeCart,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalItems,
      totalPrice,
      isOpen,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
