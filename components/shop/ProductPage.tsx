"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Check } from "lucide-react";
import type { Product } from "@/types/product";

interface PrintifyColor {
  id: number;
  title: string;
  hex: string;
}

interface PrintifySize {
  id: number;
  title: string;
}

interface PrintifyVariant {
  id: number;
  title: string;
  price: number;
  sizeId: number;
  colorId: number;
}

interface PrintifyImages {
  front: string | null;
  back: string | null;
  other: string[];
}

interface PrintifyData {
  id: string;
  title: string;
  description: string;
  colors: PrintifyColor[];
  sizes: PrintifySize[];
  variants: PrintifyVariant[];
  images: Record<number, PrintifyImages>;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductPage({
  product,
  printifyProductId,
  children,
}: {
  product: Product;
  printifyProductId: string;
  children?: React.ReactNode;
}) {
  const { addItem } = useCart();
  const [data, setData] = useState<PrintifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/printify/product/${printifyProductId}`);
        if (!res.ok) throw new Error("Failed to load");
        const json: PrintifyData = await res.json();
        setData(json);
        if (json.colors.length > 0) setSelectedColor(json.colors[0].id);
        if (json.sizes.length > 0) setSelectedSize(json.sizes[2]?.id ?? json.sizes[0].id);
      } catch {
        console.error("Failed to load Printify data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [printifyProductId]);

  const selectedVariant =
    data?.variants.find(
      (v) => v.colorId === selectedColor && v.sizeId === selectedSize
    ) ?? null;

  const currentImages = selectedColor ? data?.images[selectedColor] : null;
  const allImages = currentImages
    ? [currentImages.front, currentImages.back, ...currentImages.other].filter(
        Boolean
      ) as string[]
    : [];

  const selectedColorObj = data?.colors.find((c) => c.id === selectedColor);
  const selectedSizeObj = data?.sizes.find((s) => s.id === selectedSize);
  const displayPrice = selectedVariant?.price ?? product.basePrice;

  function handleAddToCart() {
    if (!selectedVariant || !selectedSizeObj) return;
    addItem({
      productId: product.id,
      name: product.name,
      type: product.type,
      size: selectedSizeObj.title,
      price: displayPrice,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // Sizes available for the selected color
  const availableSizeIds = new Set(
    data?.variants
      .filter((v) => v.colorId === selectedColor)
      .map((v) => v.sizeId) ?? []
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-carbon rounded mb-8" />
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-square bg-carbon rounded" />
            <div className="space-y-4">
              <div className="h-6 w-32 bg-carbon rounded" />
              <div className="h-10 w-24 bg-carbon rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden bg-obsidian border border-border">
            {allImages[activeImageIdx] ? (
              <Image
                src={allImages[activeImageIdx]}
                alt={`${product.name} - ${selectedColorObj?.title ?? ""}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-sub text-sm text-muted">No image</span>
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="mt-4 flex gap-3">
              {allImages.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-16 w-16 overflow-hidden border transition ${
                    idx === activeImageIdx
                      ? "border-ignition"
                      : "border-border hover:border-white/30"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`View ${idx + 1}`}
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="font-sub text-xs font-bold uppercase tracking-widest text-ignition">
            {product.type}
          </p>

          <h1 className="mt-2 font-heading text-display text-white">
            {product.name}
          </h1>

          <p className="mt-4 font-heading text-4xl text-white">
            {formatPrice(displayPrice)}
          </p>

          {/* Color Picker */}
          {data && data.colors.length > 0 && (
            <div className="mt-8">
              <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Color: {selectedColorObj?.title ?? ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setSelectedColor(color.id);
                      setActiveImageIdx(0);
                    }}
                    title={color.title}
                    className={`relative h-9 w-9 rounded-full border-2 transition ${
                      color.id === selectedColor
                        ? "border-ignition scale-110"
                        : "border-border hover:border-white/40"
                    }`}
                  >
                    <span
                      className="absolute inset-1 rounded-full"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.id === selectedColor && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check
                          size={14}
                          className={
                            color.hex === "#000000" || color.hex === "#1a2237"
                              ? "text-white"
                              : "text-black"
                          }
                        />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Picker */}
          {data && data.sizes.length > 0 && (
            <div className="mt-8">
              <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Size: {selectedSizeObj?.title ?? ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.sizes.map((size) => {
                  const available = availableSizeIds.has(size.id);
                  return (
                    <button
                      key={size.id}
                      onClick={() => available && setSelectedSize(size.id)}
                      disabled={!available}
                      className={`min-w-[3rem] px-3 py-2 font-sub text-xs font-bold uppercase tracking-widest border transition ${
                        size.id === selectedSize
                          ? "border-ignition bg-ignition/10 text-white"
                          : available
                            ? "border-border text-muted hover:border-white/40 hover:text-white"
                            : "border-border/50 text-muted/30 cursor-not-allowed"
                      }`}
                    >
                      {size.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mt-10">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
            >
              {added ? (
                <>
                  <Check size={18} /> ADDED TO CART
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> ADD TO CART
                </>
              )}
            </Button>

            {!selectedVariant && selectedColor && selectedSize && (
              <p className="mt-3 font-body text-xs text-redline">
                This color/size combination is not available.
              </p>
            )}
          </div>

          {/* Description */}
          {data?.description && (
            <div className="mt-10 border-t border-border pt-8">
              <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted mb-3">
                Description
              </p>
              <div
                className="font-body text-sm text-muted leading-relaxed [&_strong]:text-white [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
