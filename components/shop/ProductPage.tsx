"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Check, Eye } from "lucide-react";
import type { Product } from "@/types/product";
import MockupPreview from "./customizer/MockupPreview";
import MockupPreviewModal from "./customizer/MockupPreviewModal";
import { useCustomizer } from "./customizer/CustomizerContext";
import { buildPrintAreaPng, buildMockupThumbnail } from "./customizer/helpers";
import { getBlankMockupImage, type PrintExportMultiplierOverrides } from "./customizer/constants";

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

interface PrintifyMockupItem {
  src: string;
  position: string;
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
  const { addItem, openCart } = useCart();
  const {
    setTshirtBaseImage, tshirtBaseImage, artworkUrl, compositeDataUrl,
    artworkOnlyDataUrl, textOnlyDataUrl, cornersOnlyDataUrl,
    mockupPlacement, setProductType, setSelectedColorHex, setSelectedColorTitle, generationStatus,
    artworkSide, textPlacement, mockupViewSide,
  } = useCustomizer();
  const [data, setData] = useState<PrintifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [showMockup, setShowMockup] = useState(true);
  const prevGenerationStatusRef = useRef(generationStatus);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [printifyMockups, setPrintifyMockups] = useState<PrintifyMockupItem[]>([]);
  const [printifyMocksLoading, setPrintifyMocksLoading] = useState(false);
  const [printifyMocksError, setPrintifyMocksError] = useState<string | null>(null);

  useEffect(() => {
    setProductType(product.type);
  }, [product.type, setProductType]);

  const printMultiplierOverrides = useMemo((): PrintExportMultiplierOverrides | null => {
    const o: PrintExportMultiplierOverrides = {};
    if (product.printExportMultiplierFront != null)
      o.front = product.printExportMultiplierFront;
    if (product.printExportMultiplierBack != null)
      o.back = product.printExportMultiplierBack;
    return Object.keys(o).length ? o : null;
  }, [product.printExportMultiplierFront, product.printExportMultiplierBack]);

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

  const selectedColorObj = data?.colors.find((c) => c.id === selectedColor);

  const allImages = useMemo(() => {
    const front = getBlankMockupImage(product.type, selectedColorObj?.title, "front");
    const back = getBlankMockupImage(product.type, selectedColorObj?.title, "back");
    return [front, back].filter(Boolean) as string[];
  }, [product.type, selectedColorObj?.title]);

  const selectedSizeObj = data?.sizes.find((s) => s.id === selectedSize);
  const displayPrice = selectedVariant?.price ?? product.basePrice;
  const hasGeneratedImage = Boolean(artworkUrl);
  const generationRunning = generationStatus === "running";
  const canFinalizeCart =
    !!selectedVariant &&
    !!artworkUrl &&
    !uploading &&
    !generationRunning;

  useEffect(() => {
    const blank = getBlankMockupImage(product.type, selectedColorObj?.title, mockupViewSide);
    setTshirtBaseImage(blank ?? null);
  }, [product.type, selectedColorObj?.title, mockupViewSide, setTshirtBaseImage]);

  useEffect(() => {
    setSelectedColorHex(selectedColorObj?.hex ?? null);
  }, [selectedColorObj?.hex, setSelectedColorHex]);

  useEffect(() => {
    setSelectedColorTitle(selectedColorObj?.title ?? null);
  }, [selectedColorObj?.title, setSelectedColorTitle]);

  useEffect(() => {
    if (prevGenerationStatusRef.current === "running" && generationStatus === "done") {
      setShowMockup(true);
    }
    prevGenerationStatusRef.current = generationStatus;
  }, [generationStatus]);

  const uploadPng = useCallback(
    async (blob: Blob, kind: string, filename: string) => {
      const fd = new FormData();
      fd.append("file", blob, filename);
      fd.append("metadata", JSON.stringify({ kind, placement: mockupPlacement }));
      const res = await fetch("/api/save-artwork", { method: "POST", body: fd });
      if (res.ok) return (await res.json()).publicUrl as string;
      return undefined;
    },
    [mockupPlacement],
  );

  const activeBuildControllerRef = useRef<AbortController | null>(null);

  const buildMockupPhotos = useCallback(async () => {
    if (!hasGeneratedImage || !selectedVariant || !data?.id || generationRunning) return;

    const shopProductId = data.id;
    const variantId = selectedVariant.id;

    activeBuildControllerRef.current?.abort();
    const controller = new AbortController();
    activeBuildControllerRef.current = controller;

    setPrintifyMocksLoading(true);
    setPrintifyMocksError(null);

    try {
      const isOpposite = textPlacement === "opposite" && !!textOnlyDataUrl;
      const printSource = isOpposite
        ? (artworkOnlyDataUrl ?? compositeDataUrl ?? artworkUrl!)
        : (compositeDataUrl ?? artworkUrl!);

      const oppositeSide: "front" | "back" =
        artworkSide === "front" ? "back" : "front";

      const cornersForArtworkSide =
        textPlacement === "same" ? cornersOnlyDataUrl : null;
      const cornersForOppositeSide =
        textPlacement === "opposite" ? cornersOnlyDataUrl : null;

      const printFileUrls: Partial<Record<"front" | "back", string>> = {};

      if (!isOpposite) {
        const blob = await buildPrintAreaPng(
          printSource,
          mockupPlacement,
          product.type,
          artworkSide,
          printMultiplierOverrides,
          cornersForArtworkSide,
        );
        const url = await uploadPng(blob, "preview_print", "preview-print.png");
        if (!url) throw new Error("Could not upload print preview");
        printFileUrls[artworkSide] = url;
      } else {
        const [artBlob, textBlob] = await Promise.all([
          buildPrintAreaPng(
            printSource,
            mockupPlacement,
            product.type,
            artworkSide,
            printMultiplierOverrides,
            cornersForArtworkSide,
          ),
          buildPrintAreaPng(
            textOnlyDataUrl!,
            { xPct: 0.5, yPct: 0.5, scale: 1 },
            product.type,
            oppositeSide,
            printMultiplierOverrides,
            cornersForOppositeSide,
          ),
        ]);
        const [artUrl, textUrl] = await Promise.all([
          uploadPng(artBlob, "preview_print", "preview-print-art.png"),
          uploadPng(textBlob, "preview_print_text", "preview-print-text.png"),
        ]);
        if (!artUrl || !textUrl)
          throw new Error("Could not upload print preview");
        printFileUrls[artworkSide] = artUrl;
        printFileUrls[oppositeSide] = textUrl;
      }

      if (controller.signal.aborted) return;

      const res = await fetch("/api/printify/preview-mockups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopProductId,
          variantId,
          printFileUrls,
        }),
        signal: controller.signal,
      });

      const json = (await res.json()) as {
        mockups?: PrintifyMockupItem[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Mockup request failed");
      }

      setPrintifyMockups(Array.isArray(json.mockups) ? json.mockups : []);
    } catch (e) {
      if (controller.signal.aborted) return;
      setPrintifyMocksError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!controller.signal.aborted) {
        setPrintifyMocksLoading(false);
      }
    }
  }, [
    hasGeneratedImage,
    selectedVariant,
    data?.id,
    generationRunning,
    textPlacement,
    textOnlyDataUrl,
    artworkOnlyDataUrl,
    compositeDataUrl,
    artworkUrl,
    artworkSide,
    mockupPlacement,
    product.type,
    printMultiplierOverrides,
    cornersOnlyDataUrl,
    uploadPng,
  ]);

  const buildMockupPhotosRef = useRef(buildMockupPhotos);
  useEffect(() => {
    buildMockupPhotosRef.current = buildMockupPhotos;
  }, [buildMockupPhotos]);

  useEffect(() => {
    if (
      !hasGeneratedImage ||
      !selectedVariant ||
      !data?.id ||
      generationRunning
    ) {
      activeBuildControllerRef.current?.abort();
      setPrintifyMockups([]);
      setPrintifyMocksError(null);
      setPrintifyMocksLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      buildMockupPhotosRef.current();
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasGeneratedImage, selectedVariant, data?.id, generationRunning]);

  async function handleAddToCart() {
    if (!selectedVariant || !selectedSizeObj) return;
    if (!artworkUrl || generationStatus === "running") return;

    let persistedArtworkUrl: string | undefined;
    let persistedThumbnailUrl: string | undefined;
    let persistedTextArtworkUrl: string | undefined;

    const isOpposite = textPlacement === 'opposite' && !!textOnlyDataUrl;
    const printSource = isOpposite
      ? (artworkOnlyDataUrl ?? compositeDataUrl ?? artworkUrl)
      : (compositeDataUrl ?? artworkUrl);

    const oppositeSide: 'front' | 'back' = artworkSide === 'front' ? 'back' : 'front';

    if (printSource) {
      setUploading(true);
      try {
        const cornersForArtworkSide = textPlacement === 'same' ? cornersOnlyDataUrl : null;
        const cornersForOppositeSide = textPlacement === 'opposite' ? cornersOnlyDataUrl : null;
        const printBlob = buildPrintAreaPng(
          printSource,
          mockupPlacement,
          product.type,
          artworkSide,
          printMultiplierOverrides,
          cornersForArtworkSide,
        );
        const thumbSource = isOpposite
          ? (artworkOnlyDataUrl ?? compositeDataUrl ?? artworkUrl)
          : (compositeDataUrl ?? artworkUrl);
        const thumbBlank = isOpposite
          ? (getBlankMockupImage(product.type, selectedColorObj?.title, artworkSide) ?? null)
          : tshirtBaseImage;
        const thumbBlob = thumbBlank && thumbSource
          ? buildMockupThumbnail(
              thumbBlank,
              thumbSource,
              mockupPlacement,
              product.type,
              artworkSide,
              cornersForArtworkSide,
            )
          : null;
        const textBlob = isOpposite && textOnlyDataUrl
          ? buildPrintAreaPng(
              textOnlyDataUrl,
              { xPct: 0.5, yPct: 0.5, scale: 1 },
              product.type,
              oppositeSide,
              printMultiplierOverrides,
              cornersForOppositeSide,
            )
          : null;

        const [printResult, thumbResult, textResult] = await Promise.all([
          printBlob.then((b) => uploadPng(b, "print_area", "print-area-artwork.png")),
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
          textBlob
            ? textBlob.then((b) => uploadPng(b, "print_area_text", "print-area-text.png"))
            : Promise.resolve(undefined),
        ]);

        persistedArtworkUrl = printResult;
        persistedThumbnailUrl = thumbResult;
        persistedTextArtworkUrl = textResult;
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
      artworkSide,
      ...(persistedArtworkUrl ? { artworkUrl: persistedArtworkUrl } : {}),
      ...(persistedThumbnailUrl ? { thumbnailUrl: persistedThumbnailUrl } : {}),
      ...(persistedTextArtworkUrl
        ? { textArtworkUrl: persistedTextArtworkUrl, textArtworkSide: oppositeSide }
        : {}),
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  const availableSizeIds = new Set(
    data?.variants
      .filter((v) => v.colorId === selectedColor)
      .map((v) => v.sizeId) ?? []
  );

  const slideshowItems = useMemo((): PrintifyMockupItem[] => {
    if (!hasGeneratedImage) {
      return allImages.map((src) => ({ src, position: "catalog" }));
    }
    if (printifyMockups.length > 0) {
      return printifyMockups;
    }
    return allImages.map((src) => ({ src, position: "catalog" }));
  }, [hasGeneratedImage, printifyMockups, allImages]);

  useEffect(() => {
    const n = slideshowItems.length;
    if (n === 0) return;
    if (activeImageIdx >= n) setActiveImageIdx(0);
  }, [slideshowItems.length, activeImageIdx]);

  const useSkeletonHero =
    hasGeneratedImage &&
    !!selectedVariant &&
    printifyMocksLoading &&
    printifyMockups.length === 0;

  const showMockupUpsellBanner = hasGeneratedImage && Boolean(printifyMocksError);

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
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          {hasGeneratedImage && (
            <div className="flex flex-wrap items-center gap-1 mb-3">
              <button
                onClick={() => setShowMockup(false)}
                className={`px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border transition ${
                  !showMockup
                    ? "border-ignition bg-ignition/10 text-white"
                    : "border-border text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                Mockup photos
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
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-ignition" />
              </button>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border border-border text-muted hover:border-white/30 hover:text-white transition flex items-center gap-1.5"
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMockup(false);
                  buildMockupPhotosRef.current();
                }}
                disabled={printifyMocksLoading || generationRunning}
                className="ml-auto px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border border-ignition/60 text-white hover:bg-ignition/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {printifyMocksLoading ? "Rebuilding…" : "Rebuild mockup photos"}
              </button>
            </div>
          )}

          {showMockup ? (
            <MockupPreview />
          ) : (
            <>
              {hasGeneratedImage && (
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {useSkeletonHero ? (
                      <p className="font-sub text-[11px] text-muted uppercase tracking-widest">
                        Generating realistic Printify mockups for your size and color…
                      </p>
                    ) : printifyMockups.length > 0 ? (
                      <p className="font-sub text-[11px] text-muted uppercase tracking-widest">
                        Your artwork on supplier mockups for this variant.
                      </p>
                    ) : (
                      <p className="font-sub text-[11px] text-muted uppercase tracking-widest">
                        Catalog photos until mockups finish loading or if Printify preview is
                        unavailable.
                      </p>
                    )}
                    {showMockupUpsellBanner && (
                      <p className="font-body text-[11px] text-amber-200/90">
                        {printifyMockups.length > 0 ? (
                          <>
                            Latest mockup refresh failed ({printifyMocksError}). Showing the last
                            successful mockups.
                          </>
                        ) : (
                          <>
                            Mockup preview failed ({printifyMocksError}). Showing store catalog
                            imagery until it succeeds.
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => buildMockupPhotosRef.current()}
                    disabled={printifyMocksLoading || generationRunning}
                    className="shrink-0 px-3 py-1.5 text-[11px] font-sub font-bold uppercase tracking-widest border border-border text-muted hover:border-white/30 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {printifyMocksLoading ? "Rebuilding…" : "Rebuild mockup photos"}
                  </button>
                </div>
              )}
              <div className="relative aspect-square overflow-hidden bg-obsidian border border-border">
                {useSkeletonHero ? (
                  <div className="flex h-full w-full animate-pulse items-center justify-center bg-carbon">
                    <span className="font-sub text-xs uppercase tracking-widest text-muted">
                      Building mockups…
                    </span>
                  </div>
                ) : slideshowItems[activeImageIdx]?.src ? (
                  <Image
                    src={slideshowItems[activeImageIdx].src}
                    alt={`${product.name} - ${selectedColorObj?.title ?? ""}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-sub text-sm text-muted">
                      {hasGeneratedImage
                        ? "No preview image for this color yet"
                        : "No image"}
                    </span>
                  </div>
                )}
              </div>

              {(useSkeletonHero ? 6 : slideshowItems.length) > 1 &&
                (useSkeletonHero ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={`sk-${idx}`}
                        className="h-16 w-16 shrink-0 animate-pulse rounded border border-border bg-carbon"
                        aria-hidden
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {slideshowItems.map((item, idx) => (
                      <button
                        key={`${item.src}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`relative h-16 w-16 overflow-hidden border transition ${
                          idx === activeImageIdx
                            ? "border-ignition"
                            : "border-border hover:border-white/30"
                        }`}
                      >
                        <Image
                          src={item.src}
                          alt={`View ${idx + 1}`}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>
                ))}
            </>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-sub text-xs font-bold uppercase tracking-widest text-ignition">
            {product.type}
          </p>

          <h1 className="mt-2 font-heading text-display text-white">
            {product.name}
          </h1>

          <p className="mt-4 font-heading text-4xl text-white">
            {formatPrice(displayPrice)}
          </p>

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

          <div className="mt-10 border-t border-border pt-8">
            <Button
              variant="success"
              size="lg"
              className="w-full flex items-center justify-center gap-2 disabled:!opacity-35"
              onClick={handleAddToCart}
              disabled={!canFinalizeCart}
            >
              {uploading ? (
                "SAVING ARTWORK..."
              ) : added ? (
                <>
                  <Check size={18} /> ADDED TO CART
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> FINALISE AND ADD TO CART
                </>
              )}
            </Button>

            {!selectedVariant && selectedColor && selectedSize && (
              <p className="mt-3 font-body text-xs text-redline">
                This color/size combination is not available.
              </p>
            )}
          </div>
        </div>
      </div>

      <MockupPreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}
