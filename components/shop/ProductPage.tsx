"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Check, Eye } from "lucide-react";
import type { Product } from "@/types/product";
import MockupPreview from "./customizer/MockupPreview";
import MockupPreviewModal from "./customizer/MockupPreviewModal";
import { useCustomizer } from "./customizer/CustomizerContext";
import { buildPrintAreaPng, buildMockupThumbnail } from "./customizer/helpers";
import { getBlankMockupImage } from "./customizer/constants";

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
  const {
    setTshirtBaseImage, tshirtBaseImage, artworkUrl, compositeDataUrl,
    mockupPlacement, setProductType, setSelectedColorHex,
  } = useCustomizer();
  const [data, setData] = useState<PrintifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [showMockup, setShowMockup] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    setProductType(product.type);
  }, [product.type, setProductType]);

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

  // Use a per-color blank mockup when available; fall back to Printify's front image
  useEffect(() => {
    const blank = getBlankMockupImage(product.type, selectedColorObj?.title);
    setTshirtBaseImage(blank ?? currentImages?.front ?? null);
  }, [product.type, selectedColorObj?.title, currentImages?.front, setTshirtBaseImage]);

  // Push selected color hex into context for mockup tinting
  useEffect(() => {
    setSelectedColorHex(selectedColorObj?.hex ?? null);
  }, [selectedColorObj?.hex, setSelectedColorHex]);

  // Auto-show mockup when artwork is generated
  useEffect(() => {
    if (artworkUrl) setShowMockup(true);
  }, [artworkUrl]);

  const [uploading, setUploading] = useState(false);

  async function handleAddToCart() {
    if (!selectedVariant || !selectedSizeObj) return;

    let persistedArtworkUrl: string | undefined;
    let persistedThumbnailUrl: string | undefined;

    const printSource = compositeDataUrl ?? artworkUrl;
    if (printSource) {
      setUploading(true);
      try {
        const printBlob = buildPrintAreaPng(printSource, mockupPlacement, product.type);
        const thumbBlob = tshirtBaseImage
          ? buildMockupThumbnail(tshirtBaseImage, printSource, mockupPlacement, product.type)
          : null;

        const [printResult, thumbResult] = await Promise.all([
          printBlob.then(async (blob) => {
            const fd = new FormData();
            fd.append("file", blob, "print-area-artwork.png");
            fd.append("metadata", JSON.stringify({ kind: "print_area", placement: mockupPlacement }));
            const res = await fetch("/api/save-artwork", { method: "POST", body: fd });
            if (res.ok) return (await res.json()).publicUrl as string;
            return undefined;
          }),
          thumbBlob
            ? thumbBlob.then(async (blob) => {
                const fd = new FormData();
                fd.append("file", blob, "mockup-thumbnail.jpg");
                fd.append("metadata", JSON.stringify({ kind: "mockup_thumbnail" }));
                const res = await fetch("/api/save-artwork", { method: "POST", body: fd });
                if (res.ok) return (await res.json()).publicUrl as string;
                return undefined;
              })
            : Promise.resolve(undefined),
        ]);

        persistedArtworkUrl = printResult;
        persistedThumbnailUrl = thumbResult;
      } catch (err) {
        console.error("Failed to build artwork:", err);
      } finally {
        setUploading(false);
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      type: product.type,
      size: selectedSizeObj.title,
      color: selectedColorObj?.title ?? "",
      price: displayPrice,
      ...(persistedArtworkUrl ? { artworkUrl: persistedArtworkUrl } : {}),
      ...(persistedThumbnailUrl ? { thumbnailUrl: persistedThumbnailUrl } : {}),
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
        {/* Image Gallery + Mockup */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {/* View toggle tabs */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setShowMockup(false)}
              className={`px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border transition ${
                !showMockup
                  ? "border-ignition bg-ignition/10 text-white"
                  : "border-border text-muted hover:border-white/30 hover:text-white"
              }`}
            >
              Product Photos
            </button>
            <button
              onClick={() => setShowMockup(true)}
              className={`px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border transition ${
                showMockup
                  ? "border-ignition bg-ignition/10 text-white"
                  : "border-border text-muted hover:border-white/30 hover:text-white"
              }`}
            >
              Live Mockup
              {artworkUrl && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-ignition" />
              )}
            </button>
            {artworkUrl && (
              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border border-border text-muted hover:border-white/30 hover:text-white transition flex items-center gap-1.5"
              >
                <Eye size={14} />
                Preview
              </button>
            )}
          </div>

          {showMockup ? (
            <MockupPreview />
          ) : (
            <>
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
            </>
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
              disabled={!selectedVariant || uploading}
            >
              {uploading ? (
                "SAVING ARTWORK..."
              ) : added ? (
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

      <MockupPreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}
