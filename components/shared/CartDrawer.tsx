"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    totalItems,
    totalPrice,
    isOpen,
    closeCart,
  } = useCart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-carbon shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-heading text-2xl text-white">
            YOUR CART{totalItems > 0 && ` (${totalItems})`}
          </h2>
          <button
            onClick={closeCart}
            className="text-muted transition-colors hover:text-white"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
              <p className="font-body text-sm text-muted">Your cart is empty.</p>
              <Button variant="outline" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-4 p-4"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-obsidian">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-sub text-[10px] font-bold uppercase tracking-widest text-muted">
                        {item.type}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-heading text-base text-white truncate">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 font-sub text-[10px] font-bold uppercase tracking-widest text-muted">
                          {item.color && `${item.color} · `}Size: {item.size}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          removeItem(item.productId, item.size, item.color)
                        }
                        className="shrink-0 text-muted transition-colors hover:text-redline"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.quantity - 1,
                              item.color
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center border border-border text-muted transition-colors hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center font-mono text-sm text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.quantity + 1,
                              item.color
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center border border-border text-muted transition-colors hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="font-mono text-sm text-white">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="flex items-center justify-between font-body text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-mono text-white">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="font-body text-xs text-muted">
              Shipping and taxes calculated at checkout.
            </p>
            <Link href="/checkout" onClick={closeCart} className="block">
              <Button
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center"
              >
                Proceed to Checkout
              </Button>
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center font-sub text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
