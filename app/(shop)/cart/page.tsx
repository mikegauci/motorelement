"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  DOWNLOAD_ARTWORK_LABEL,
  DOWNLOAD_ARTWORK_PRICE_CENTS,
  downloadArtworkFeeCents,
} from "@/lib/shop/downloadArtwork";
import {
  DESIGNER_SOURCE_FILES_LABEL,
  DESIGNER_SOURCE_FILES_PRICE_CENTS,
  DESIGNER_PRIORITY_LABEL,
  DESIGNER_PRIORITY_PRICE_CENTS,
  designerSourceFilesFeeCents,
  designerPriorityFeeCents,
} from "@/lib/shop/designerAddons";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, totalItems, totalPrice } =
    useCart();

  const downloadFee = downloadArtworkFeeCents(items);
  const downloadLines = items.filter((item) => item.downloadArtwork).length;
  const sourceFilesFee = designerSourceFilesFeeCents(items);
  const sourceFilesLines = items.filter((item) => item.includeSourceFiles).length;
  const priorityFee = designerPriorityFeeCents(items);
  const priorityLines = items.filter((item) => item.designerPriority).length;
  const itemsSubtotal = totalPrice - downloadFee - sourceFilesFee - priorityFee;

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
              key={`${item.productId}-${item.size}-${item.color}`}
              className="flex flex-col gap-4 border border-border bg-obsidian p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
            >
              <div className="flex items-start gap-4 sm:contents">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-carbon sm:h-20 sm:w-20">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-sub text-xs font-bold uppercase tracking-widest text-muted">
                      {item.type}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-base text-white truncate sm:text-xl">
                    {item.name}
                  </h3>
                  <p className="mt-1 font-sub text-[10px] font-bold uppercase tracking-widest text-muted sm:text-xs">
                    {item.color && `${item.color} · `}Size: {item.size}
                    {item.illustrationMode === "designer"
                      ? item.designerPriority
                        ? " · Designer Priority"
                        : " · Designer"
                      : ""}
                    {item.includeSourceFiles ? " · Source files" : ""}
                    {item.downloadArtwork ? " · Download" : ""}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.productId, item.size, item.color)}
                  className="shrink-0 text-muted transition-colors hover:text-redline sm:hidden"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4 sm:contents sm:border-0 sm:pt-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.size, item.quantity - 1, item.color)
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
                      updateQuantity(item.productId, item.size, item.quantity + 1, item.color)
                    }
                    className="flex h-8 w-8 items-center justify-center border border-border text-muted transition-colors hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="font-mono text-sm text-white sm:w-20 sm:text-right">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>

              <button
                onClick={() => removeItem(item.productId, item.size, item.color)}
                className="hidden shrink-0 text-muted transition-colors hover:text-redline sm:block"
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="border border-border bg-obsidian p-6 sm:p-8 h-fit">
          <h2 className="font-heading text-2xl text-white">ORDER SUMMARY</h2>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted">
                Items ({totalItems})
              </span>
              <span className="text-white">
                {formatPrice(itemsSubtotal)}
              </span>
            </div>
            {downloadFee > 0 && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted">
                  {DOWNLOAD_ARTWORK_LABEL}
                  {downloadLines > 1 ? ` × ${downloadLines}` : ""}
                </span>
                <span className="text-white">
                  {formatPrice(downloadLines * DOWNLOAD_ARTWORK_PRICE_CENTS)}
                </span>
              </div>
            )}
            {sourceFilesFee > 0 && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted">
                  {DESIGNER_SOURCE_FILES_LABEL}
                  {sourceFilesLines > 1 ? ` × ${sourceFilesLines}` : ""}
                </span>
                <span className="text-white">
                  {formatPrice(sourceFilesLines * DESIGNER_SOURCE_FILES_PRICE_CENTS)}
                </span>
              </div>
            )}
            {priorityFee > 0 && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted">
                  {DESIGNER_PRIORITY_LABEL}
                  {priorityLines > 1 ? ` × ${priorityLines}` : ""}
                </span>
                <span className="text-white">
                  {formatPrice(priorityLines * DESIGNER_PRIORITY_PRICE_CENTS)}
                </span>
              </div>
            )}
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
