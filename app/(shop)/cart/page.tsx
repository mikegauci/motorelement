"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, Trash2 } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, totalItems, totalPrice } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="font-heading text-display text-white">YOUR CART</h1>
        <p className="mt-8 text-muted">Your cart is empty.</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-display text-white">YOUR CART</h1>
        <button
          onClick={clear}
          className="font-sub text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-redline"
        >
          Clear All
        </button>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex items-center gap-6 border border-border bg-obsidian p-6"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-carbon">
                <span className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  {item.type}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-xl text-white truncate">
                  {item.name}
                </h3>
                <p className="mt-1 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Size: {item.size}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.size, item.quantity - 1)
                  }
                  className="flex h-8 w-8 items-center justify-center border border-border text-muted transition-colors hover:text-white"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-mono text-sm text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.size, item.quantity + 1)
                  }
                  className="flex h-8 w-8 items-center justify-center border border-border text-muted transition-colors hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>

              <p className="w-20 text-right font-mono text-sm text-white">
                {formatPrice(item.price * item.quantity)}
              </p>

              <button
                onClick={() => removeItem(item.productId, item.size)}
                className="text-muted transition-colors hover:text-redline"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="border border-border bg-obsidian p-8 h-fit">
          <h2 className="font-heading text-2xl text-white">ORDER SUMMARY</h2>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted">
                Items ({totalItems})
              </span>
              <span className="text-white">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted">Shipping</span>
              <span className="text-white">Calculated at checkout</span>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <div className="flex justify-between font-heading text-xl">
              <span className="text-white">TOTAL</span>
              <span className="text-white">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <Link href="/checkout" className="mt-8 block">
            <Button variant="primary" size="lg" className="w-full">
              Proceed to Checkout
            </Button>
          </Link>

          <Link
            href="/products"
            className="mt-4 block text-center font-sub text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
