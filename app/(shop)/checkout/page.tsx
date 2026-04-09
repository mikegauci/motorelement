"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="font-heading text-display text-white">CHECKOUT</h1>

      <div className="mt-12 border border-border bg-obsidian p-8">
        <h2 className="font-heading text-2xl text-white">ORDER REVIEW</h2>

        <div className="mt-6 divide-y divide-border">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="font-body text-sm text-white">{item.name}</p>
                <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  {item.type} &middot; Size {item.size} &middot; Qty{" "}
                  {item.quantity}
                </p>
              </div>
              <p className="font-mono text-sm text-white">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <div className="flex justify-between font-heading text-xl">
            <span className="text-white">
              TOTAL ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
            <span className="text-white">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 font-body text-sm text-redline">{error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          className="mt-8 w-full"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "REDIRECTING TO STRIPE..." : "PAY WITH STRIPE"}
        </Button>

        <p className="mt-4 text-center font-body text-xs text-muted">
          You will be redirected to Stripe&apos;s secure checkout.
        </p>
      </div>
    </div>
  );
}
