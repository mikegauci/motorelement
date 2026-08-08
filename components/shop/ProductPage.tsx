"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { ShoppingBag, Check, Eye } from "lucide-react";
import type { Product } from "@/types/product";
import MockupPreview from "./customizer/MockupPreview";
import MockupPreviewModal from "./customizer/MockupPreviewModal";
import { useCustomizer } from "./customizer/CustomizerContext";
import { buildPrintAreaPng, buildMockupThumbnail } from "./customizer/helpers";
import {
  getBlankMockupImage,
  getProductGalleryImages,
  isRealBackgroundUrl,
  type PrintExportMultiplierOverrides,
} from "./customizer/constants";
import { getLinkedPrintifyProductIds } from "@/lib/printify/variants";

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

const MUG_SYNTHETIC_COLORS: PrintifyColor[] = [
  { id: 1, title: "White", hex: "#ffffff" },
  { id: 2, title: "Black", hex: "#000000" },
];

function mergeMugPrintifyData(products: PrintifyData[]): PrintifyData {
  const primary = products[0];
  const sizesByTitle = new Map<string, PrintifySize>();
  for (const product of products) {
    for (const size of product.sizes) {
      const key = size.title.toLowerCase().replace(/\s+/g, "");
      if (!sizesByTitle.has(key)) sizesByTitle.set(key, size);
    }
  }
  const sizes = Array.from(sizesByTitle.values());
  const sizeIdByTitle = new Map(
    sizes.map((s) => [s.title.toLowerCase().replace(/\s+/g, ""), s.id])
  );

  const colorIdBySlug: Record<string, number> = {
    white: 1,
    black: 2,
  };

  const variants: PrintifyVariant[] = [];
  products.forEach((product, index) => {
    const colorSlug = index === 0 ? "white" : "black";
    const colorId = colorIdBySlug[colorSlug];
    for (const variant of product.variants) {
      const sizeTitle = product.sizes.find((s) => s.id === variant.sizeId)?.title;
      if (!sizeTitle) continue;
      const sizeKey = sizeTitle.toLowerCase().replace(/\s+/g, "");
      const sizeId = sizeIdByTitle.get(sizeKey);
      if (sizeId == null) continue;
      variants.push({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        sizeId,
        colorId,
      });
    }
  });

  return {
    id: primary.id,
    title: primary.title,
    description: primary.description,
    colors: MUG_SYNTHETIC_COLORS,
    sizes,
    variants,
    images: primary.images,
  };
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
    artworkSide, textPlacement, mockupViewSide, downloadArtworkEnabled, artworkHasExtras,
    illustrationMode, customerPhotoDataUrl, customerNotes,
    designerBackgroundUrl, designerRequestedText, designerTextCorner,
    aiArtworkUrl,
    designerIncludeSourceFiles, designerPriority,
    designerCornerImageUrl, designerCornerImageLabel,
    setArtworkSide, setTextPlacement, setSelectedSizeTitle,
  } = useCustomizer();
  const [data, setData] = useState<PrintifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadExportError, setDownloadExportError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const isMug = product.type === "mug";

  useEffect(() => {
    setProductType(product.type);
  }, [product.type, setProductType]);

  useEffect(() => {
    if (!isMug) return;
    setArtworkSide("front");
    setTextPlacement("same");
  }, [isMug, setArtworkSide, setTextPlacement]);

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
        const productIds = isMug
          ? getLinkedPrintifyProductIds(printifyProductId)
          : [printifyProductId];
        const responses = await Promise.all(
          productIds.map((id) =>
            fetch(`/api/printify/product/${id}`, { cache: "no-store" })
          )
        );
        if (responses.some((res) => !res.ok)) throw new Error("Failed to load");
        const products = (await Promise.all(
          responses.map((res) => res.json())
        )) as PrintifyData[];
        const json =
          isMug && products.length > 1
            ? mergeMugPrintifyData(products)
            : products[0];
        setData(json);
        if (json.colors.length > 0) setSelectedColor(json.colors[0].id);
        else setSelectedColor(null);
        if (json.sizes.length > 0) {
          const defaultSize = isMug
            ? json.sizes[0]
            : json.colors.length === 0
              ? json.sizes[0]
              : (json.sizes[2] ?? json.sizes[0]);
          setSelectedSize(defaultSize.id);
        }
      } catch {
        console.error("Failed to load Printify data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [printifyProductId, isMug]);

  const hasColors = (data?.colors.length ?? 0) > 0;

  const selectedVariant =
    data?.variants.find((v) => {
      if (v.sizeId !== selectedSize) return false;
      if (!hasColors) return true;
      return v.colorId === selectedColor;
    }) ?? null;

  const selectedColorObj = data?.colors.find((c) => c.id === selectedColor);

  const selectedSizeObj = data?.sizes.find((s) => s.id === selectedSize);
  const displayPrice = selectedVariant?.price ?? product.basePrice;
  const hasGeneratedImage = Boolean(artworkUrl);
  const generationRunning = generationStatus === "running";
  const isDesignerMode = illustrationMode === "designer";
  const galleryImages = useMemo(
    () => getProductGalleryImages(product.type),
    [product.type]
  );
  const showingGallery = galleryIndex != null && galleryImages[galleryIndex] != null;
  const canFinalizeCart = isDesignerMode
    ? !!selectedVariant && !!customerPhotoDataUrl && !uploading
    : !!selectedVariant &&
      !!artworkUrl &&
      !uploading &&
      !generationRunning;

  useEffect(() => {
    const colorTitle = selectedColorObj?.title ?? (isMug ? "White" : undefined);
    const blank = getBlankMockupImage(
      product.type,
      colorTitle,
      mockupViewSide,
      selectedSizeObj?.title,
    );
    setTshirtBaseImage(blank ?? null);
  }, [
    product.type,
    selectedColorObj?.title,
    selectedSizeObj?.title,
    mockupViewSide,
    setTshirtBaseImage,
    isMug,
  ]);

  useEffect(() => {
    setSelectedColorHex(selectedColorObj?.hex ?? (isMug ? "#ffffff" : null));
  }, [selectedColorObj?.hex, setSelectedColorHex, isMug]);

  useEffect(() => {
    setSelectedColorTitle(selectedColorObj?.title ?? (isMug ? "White" : null));
  }, [selectedColorObj?.title, setSelectedColorTitle, isMug]);

  useEffect(() => {
    setSelectedSizeTitle(selectedSizeObj?.title ?? null);
  }, [selectedSizeObj?.title, setSelectedSizeTitle]);

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

  async function handleAddToCart() {
    if (!selectedVariant || !selectedSizeObj) return;

    if (isDesignerMode) {
      if (!customerPhotoDataUrl) return;

      setUploading(true);
      setDownloadExportError(null);
      try {
        let persistedThumbnailUrl: string | undefined;

        const photoRes = await fetch(customerPhotoDataUrl);
        const photoBlob = await photoRes.blob();
        const persistedPhotoUrl = await uploadPng(
          photoBlob,
          "customer_photo",
          "customer-photo.jpg",
        );

        if (!persistedPhotoUrl) {
          setDownloadExportError(
            "Could not save your photo. Please try again.",
          );
          return;
        }

        if (tshirtBaseImage && artworkUrl) {
          try {
            const thumbBlob = await buildMockupThumbnail(
              tshirtBaseImage,
              artworkUrl,
              mockupPlacement,
              product.type,
              artworkSide,
              null,
              selectedSizeObj.title,
            );
            const fd = new FormData();
            fd.append("file", thumbBlob, "mockup-thumbnail.jpg");
            fd.append("metadata", JSON.stringify({ kind: "mockup_thumbnail" }));
            const res = await fetch("/api/save-artwork", {
              method: "POST",
              body: fd,
            });
            if (res.ok) {
              persistedThumbnailUrl = (await res.json()).publicUrl as string;
            }
          } catch (err) {
            console.error("Failed to build designer thumbnail:", err);
          }
        }

        let persistedBackgroundUrl: string | undefined;
        if (isRealBackgroundUrl(designerBackgroundUrl)) {
          const bgUrl = designerBackgroundUrl as string;
          const isPublicRemote =
            /^https?:\/\//i.test(bgUrl) &&
            !/localhost|127\.0\.0\.1/i.test(bgUrl);
          if (isPublicRemote) {
            persistedBackgroundUrl = bgUrl;
          } else {
            try {
              const bgRes = await fetch(bgUrl);
              const bgBlob = await bgRes.blob();
              const ext = bgBlob.type.includes("jpeg") ? "jpg" : "png";
              persistedBackgroundUrl = await uploadPng(
                bgBlob,
                "designer_background",
                `designer-background.${ext}`,
              );
            } catch (err) {
              console.error("Failed to persist designer background:", err);
            }
          }
        }

        let persistedAiArtworkUrl: string | undefined;
        if (aiArtworkUrl) {
          const isPublicRemote =
            /^https?:\/\//i.test(aiArtworkUrl) &&
            !/localhost|127\.0\.0\.1/i.test(aiArtworkUrl);
          if (isPublicRemote) {
            persistedAiArtworkUrl = aiArtworkUrl;
          } else {
            try {
              const aiRes = await fetch(aiArtworkUrl);
              const aiBlob = await aiRes.blob();
              const ext = aiBlob.type.includes("jpeg") ? "jpg" : "png";
              persistedAiArtworkUrl = await uploadPng(
                aiBlob,
                "ai_artwork_reference",
                `ai-artwork-reference.${ext}`,
              );
            } catch (err) {
              console.error("Failed to persist AI artwork reference:", err);
            }
          }
        }

        let persistedCornerImageUrl: string | undefined;
        if (designerCornerImageUrl) {
          const isPublicRemote =
            /^https?:\/\//i.test(designerCornerImageUrl) &&
            !/localhost|127\.0\.0\.1/i.test(designerCornerImageUrl);
          if (isPublicRemote) {
            persistedCornerImageUrl = designerCornerImageUrl;
          } else {
            try {
              const cornerRes = await fetch(designerCornerImageUrl);
              const cornerBlob = await cornerRes.blob();
              const ext = cornerBlob.type.includes("jpeg")
                ? "jpg"
                : cornerBlob.type.includes("svg")
                  ? "svg"
                  : "png";
              persistedCornerImageUrl = await uploadPng(
                cornerBlob,
                "designer_corner_image",
                `designer-corner-image.${ext}`,
              );
            } catch (err) {
              console.error("Failed to persist designer corner image:", err);
            }
          }
        }

        addItem({
          productId: product.id,
          name: product.name,
          type: product.type,
          size: selectedSizeObj.title,
          color: selectedColorObj?.title ?? (isMug ? "White" : ""),
          price: displayPrice,
          artworkSide,
          illustrationMode: "designer",
          customerPhotoUrl: persistedPhotoUrl,
          ...(customerNotes.trim()
            ? { customerNotes: customerNotes.trim() }
            : {}),
          ...(designerRequestedText.trim()
            ? { requestedText: designerRequestedText.trim() }
            : {}),
          ...(designerTextCorner
            ? { textCorner: designerTextCorner }
            : {}),
          ...(designerRequestedText.trim() || designerTextCorner || persistedCornerImageUrl
            ? { textPlacement }
            : {}),
          ...(persistedBackgroundUrl
            ? { backgroundUrl: persistedBackgroundUrl }
            : {}),
          ...(persistedAiArtworkUrl
            ? { aiArtworkUrl: persistedAiArtworkUrl }
            : {}),
          ...(persistedCornerImageUrl
            ? {
                cornerImageUrl: persistedCornerImageUrl,
                ...(designerCornerImageLabel
                  ? { cornerImageLabel: designerCornerImageLabel }
                  : {}),
              }
            : {}),
          ...(designerIncludeSourceFiles
            ? { includeSourceFiles: true }
            : {}),
          ...(designerPriority ? { designerPriority: true } : {}),
          ...(persistedThumbnailUrl
            ? { thumbnailUrl: persistedThumbnailUrl }
            : {}),
        });
        setAdded(true);
        openCart();
        setTimeout(() => setAdded(false), 2000);
      } catch (err) {
        console.error("Failed to add designer item:", err);
        setDownloadExportError(
          "Could not add designer item to cart. Please try again.",
        );
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!artworkUrl || generationStatus === "running") return;

    let persistedArtworkUrl: string | undefined;
    let persistedThumbnailUrl: string | undefined;
    let persistedTextArtworkUrl: string | undefined;
    let persistedDownloadFullUrl: string | undefined;
    let persistedDownloadCarOnlyUrl: string | undefined;
    let persistedDownloadTextUrl: string | undefined;
    setDownloadExportError(null);

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
          ? (getBlankMockupImage(
              product.type,
              selectedColorObj?.title,
              artworkSide,
              selectedSizeObj.title,
            ) ?? null)
          : tshirtBaseImage;
        const thumbBlob = thumbBlank && thumbSource
          ? buildMockupThumbnail(
              thumbBlank,
              thumbSource,
              mockupPlacement,
              product.type,
              artworkSide,
              cornersForArtworkSide,
              selectedSizeObj.title,
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

        if (downloadArtworkEnabled) {
          if (artworkHasExtras) {
            persistedDownloadFullUrl = printResult;

            if (artworkUrl) {
              try {
                const carOnlyBlob = await buildPrintAreaPng(
                  artworkUrl,
                  mockupPlacement,
                  product.type,
                  artworkSide,
                  printMultiplierOverrides,
                  null,
                );
                persistedDownloadCarOnlyUrl = await uploadPng(
                  carOnlyBlob,
                  "download_car_only",
                  "download-car-only.png"
                );
              } catch (err) {
                console.error("Failed to save download car-only artwork:", err);
              }
            }

            if (persistedTextArtworkUrl) {
              persistedDownloadTextUrl = persistedTextArtworkUrl;
            }
          } else {
            persistedDownloadCarOnlyUrl = printResult;
          }
        }
      } catch (err) {
        console.error("Failed to build artwork:", err);
      } finally {
        setUploading(false);
      }
    }

    const downloadExportsReady = downloadArtworkEnabled
      ? artworkHasExtras
        ? !!(persistedDownloadFullUrl && persistedDownloadCarOnlyUrl)
        : !!persistedDownloadCarOnlyUrl
      : false;

    if (downloadArtworkEnabled && !downloadExportsReady) {
      setDownloadExportError(
        "Digital download could not be saved. The item was added without the download add-on — try again."
      );
    }

    addItem({
      productId: product.id,
      name: product.name,
      type: product.type,
      size: selectedSizeObj.title,
      color: selectedColorObj?.title ?? (isMug ? "White" : ""),
      price: displayPrice,
      artworkSide,
      illustrationMode: "ai",
      ...(downloadExportsReady ? { downloadArtwork: true } : {}),
      ...(persistedArtworkUrl ? { artworkUrl: persistedArtworkUrl } : {}),
      ...(persistedThumbnailUrl ? { thumbnailUrl: persistedThumbnailUrl } : {}),
      ...(persistedTextArtworkUrl
        ? { textArtworkUrl: persistedTextArtworkUrl, textArtworkSide: oppositeSide }
        : {}),
      ...(downloadExportsReady && persistedDownloadFullUrl
        ? { downloadFullUrl: persistedDownloadFullUrl }
        : {}),
      ...(downloadExportsReady && persistedDownloadCarOnlyUrl
        ? { downloadCarOnlyUrl: persistedDownloadCarOnlyUrl }
        : {}),
      ...(downloadExportsReady && persistedDownloadTextUrl
        ? { downloadTextUrl: persistedDownloadTextUrl }
        : {}),
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  const availableSizeIds = new Set(
    data?.variants
      .filter((v) => !hasColors || v.colorId === selectedColor)
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
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          {hasGeneratedImage && !isDesignerMode && (
            <div className="flex flex-wrap items-center gap-1 mb-3">
              <button
                type="button"
                onClick={() => setGalleryIndex(null)}
                className={`px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border transition flex items-center gap-1.5 ${
                  !showingGallery
                    ? "border-ignition bg-ignition/10 text-white"
                    : "border-border text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                Live Mockup
                {!showingGallery && (
                  <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-ignition" />
                )}
              </button>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2 text-xs font-sub font-bold uppercase tracking-widest border border-border text-muted hover:border-white/30 hover:text-white transition flex items-center gap-1.5"
              >
                <Eye size={14} />
                Preview
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start">
            <div className="min-w-0 flex-1">
              {showingGallery ? (
                <div className="relative w-full aspect-square overflow-hidden border border-border bg-obsidian">
                  <Image
                    src={galleryImages[galleryIndex]!}
                    alt={`${product.name} gallery`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              ) : (
                <MockupPreview />
              )}
            </div>

            {galleryImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-x-visible">
                <button
                  type="button"
                  onClick={() => setGalleryIndex(null)}
                  aria-label="Show live mockup"
                  aria-pressed={!showingGallery}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden border transition ${
                    !showingGallery
                      ? "border-ignition"
                      : "border-border hover:border-white/40"
                  }`}
                >
                  <Image
                    src={
                      getBlankMockupImage(
                        product.type,
                        selectedColorObj?.title,
                        "front",
                        selectedSizeObj?.title,
                      ) ?? galleryImages[0]
                    }
                    alt="Mockup"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
                {galleryImages.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    aria-label={`Show gallery image ${i + 1}`}
                    aria-pressed={galleryIndex === i}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden border transition ${
                      galleryIndex === i
                        ? "border-ignition"
                        : "border-border hover:border-white/40"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
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

            {downloadExportError && (
              <p className="mt-3 font-body text-xs text-redline">
                {downloadExportError}
              </p>
            )}

            {!selectedVariant && selectedSize && (!hasColors || selectedColor) && (
              <p className="mt-3 font-body text-xs text-redline">
                {hasColors
                  ? "This color/size combination is not available."
                  : "This size is not available."}
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
