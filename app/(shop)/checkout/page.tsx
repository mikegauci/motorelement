"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import {
  DOWNLOAD_ARTWORK_LABEL,
  DOWNLOAD_ARTWORK_PRICE_CENTS,
  downloadArtworkFeeCents,
  triggerBrowserDownload,
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

type DownloadKind = "full" | "car" | "text";

type CheckoutDownloadItem = {
  key: string;
  label: string;
  downloadFullUrl?: string;
  downloadCarOnlyUrl?: string;
  downloadTextUrl?: string;
};

function toCheckoutDownloads(items: CartItem[]): CheckoutDownloadItem[] {
  return items
    .filter(
      (item) =>
        item.downloadArtwork &&
        (item.downloadFullUrl || item.downloadCarOnlyUrl || item.downloadTextUrl)
    )
    .map((item, index) => ({
      key: `${item.productId}-${item.size}-${item.color}-${index}`,
      label: `${item.name}${item.color ? ` · ${item.color}` : ""} · Size ${item.size}`,
      downloadFullUrl: item.downloadFullUrl,
      downloadCarOnlyUrl: item.downloadCarOnlyUrl,
      downloadTextUrl: item.downloadTextUrl,
    }));
}

function isDesignerItem(item: CartItem) {
  return item.illustrationMode === "designer";
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successHint, setSuccessHint] = useState<
    "designer" | "printify" | "mixed" | null
  >(null);
  const [downloadItems, setDownloadItems] = useState<CheckoutDownloadItem[]>(
    []
  );
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const downloadFee = downloadArtworkFeeCents(items);
  const downloadLines = items.filter((item) => item.downloadArtwork).length;
  const sourceFilesFee = designerSourceFilesFeeCents(items);
  const sourceFilesLines = items.filter((item) => item.includeSourceFiles).length;
  const priorityFee = designerPriorityFeeCents(items);
  const priorityLines = items.filter((item) => item.designerPriority).length;
  const designerItems = items.filter(isDesignerItem);
  const aiItems = items.filter((item) => !isDesignerItem(item));
  const hasDesigner = designerItems.length > 0;
  const hasAi = aiItems.length > 0;

  useEffect(() => {
    if (items.length === 0 && !success) {
      router.replace("/cart");
    }
  }, [items.length, router, success]);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSuccessHint(null);
    setDownloadItems([]);
    setDownloadError(null);

    const nextDownloads = toCheckoutDownloads(items);
    const wantedDownload = items.some((item) => item.downloadArtwork);
    const designerOnly = hasDesigner && !hasAi;

    try {
      const messages: string[] = [];

      if (hasDesigner) {
        const res = await fetch("/api/designer-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: designerItems }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to send designer brief");
          setLoading(false);
          return;
        }
        console.log("[checkout] designer-order response", data);
        messages.push(
          designerItems.some((item) => item.designerPriority)
            ? "Your rush order has been placed — we'll be in touch within 24 hours."
            : "Your order has been placed — we'll be in touch in 1–3 days."
        );
      }

      if (hasAi) {
        const res = await fetch("/api/test/printify-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: aiItems }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            messages.length
              ? `${messages.join(" ")} Printify failed: ${data.error || "Something went wrong"}`
              : data.error || "Something went wrong"
          );
          setLoading(false);
          return;
        }
        messages.push(
          `Printify order created! ID: ${data.printifyOrderId} (status: ${data.status})`
        );
      }

      setSuccess(messages.join(" "));
      if (designerOnly) {
        setSuccessHint("designer");
      } else if (hasAi && !hasDesigner) {
        setSuccessHint("printify");
      } else {
        setSuccessHint("mixed");
      }
      clear();
      setLoading(false);

      if (nextDownloads.length > 0) {
        setDownloadItems(nextDownloads);
      } else if (wantedDownload) {
        setDownloadError(
          "Download was selected but artwork exports were not saved. Remove the item, set Download Artwork to Yes, and add to cart again."
        );
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleDownload(
    item: CheckoutDownloadItem,
    kind: DownloadKind
  ) {
    const url =
      kind === "full"
        ? item.downloadFullUrl
        : kind === "car"
          ? item.downloadCarOnlyUrl
          : item.downloadTextUrl;
    if (!url) return;

    const actionKey = `${item.key}:${kind}`;
    setDownloadingKey(actionKey);
    setDownloadError(null);
    try {
      const filename =
        kind === "full"
          ? "motorelement-artwork-full.png"
          : kind === "text"
            ? "motorelement-artwork-text.png"
            : item.downloadFullUrl || item.downloadTextUrl
              ? "motorelement-artwork-car-only.png"
              : "motorelement-artwork.png";
      await triggerBrowserDownload(url, filename);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Download failed"
      );
    } finally {
      setDownloadingKey(null);
    }
  }

  if (items.length === 0 && !success) return null;

  const showDownloadSection =
    downloadItems.length > 0 || !!downloadError;

  const checkoutLabel = loading
    ? "SUBMITTING..."
    : hasDesigner && hasAi
      ? "SUBMIT ORDER"
      : hasDesigner
        ? "SUBMIT DESIGNER REQUEST"
        : "TEST: SEND TO PRINTIFY";

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="font-heading text-display text-white">CHECKOUT</h1>

      <div className="mt-12 border border-border bg-obsidian p-8">
        {success ? (
          <div className="py-8 text-center">
            <h2 className="font-heading text-2xl text-green-400">
              ORDER SUBMITTED
            </h2>
            <p className="mt-4 font-body text-sm text-white">{success}</p>
            {successHint === "printify" && (
              <p className="mt-2 font-body text-xs text-muted">
                Check your Printify dashboard to see the order.
              </p>
            )}
            {successHint === "designer" && (
              <p className="mt-2 font-body text-xs text-muted">
                No Printify order yet — fulfillment happens after the designer
                finishes the artwork.
              </p>
            )}

            {showDownloadSection && (
              <div className="mt-8 border-t border-border pt-8">
                <h3 className="font-heading text-xl text-white">
                  Digital Artwork
                </h3>
                {downloadError && (
                  <p className="mt-3 font-body text-sm text-redline">
                    {downloadError}
                  </p>
                )}
                <div className="mt-4 space-y-6">
                  {downloadItems.map((item) => {
                    const hasBundle = !!(
                      item.downloadFullUrl && item.downloadCarOnlyUrl
                    );
                    const busy = downloadingKey?.startsWith(`${item.key}:`);

                    return (
                      <div key={item.key} className="space-y-3">
                        {downloadItems.length > 1 && (
                          <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                            {item.label}
                          </p>
                        )}
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
                          {hasBundle ? (
                            <>
                              <Button
                                variant="primary"
                                size="lg"
                                onClick={() => handleDownload(item, "full")}
                                disabled={!!downloadingKey}
                              >
                                {downloadingKey === `${item.key}:full`
                                  ? "DOWNLOADING…"
                                  : "DOWNLOAD FULL ARTWORK"}
                              </Button>
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => handleDownload(item, "car")}
                                disabled={!!downloadingKey}
                              >
                                {downloadingKey === `${item.key}:car`
                                  ? "DOWNLOADING…"
                                  : "DOWNLOAD CAR ONLY"}
                              </Button>
                              {item.downloadTextUrl && (
                                <Button
                                  variant="outline"
                                  size="lg"
                                  onClick={() => handleDownload(item, "text")}
                                  disabled={!!downloadingKey}
                                >
                                  {downloadingKey === `${item.key}:text`
                                    ? "DOWNLOADING…"
                                    : "DOWNLOAD TEXT"}
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={() =>
                                handleDownload(
                                  item,
                                  item.downloadCarOnlyUrl
                                    ? "car"
                                    : item.downloadFullUrl
                                      ? "full"
                                      : "text"
                                )
                              }
                              disabled={!!downloadingKey}
                            >
                              {busy ? "DOWNLOADING…" : "DOWNLOAD IMAGE"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="mt-8"
              onClick={() => router.push("/")}
            >
              BACK TO SHOP
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-2xl text-white">ORDER REVIEW</h2>

            {hasAi && (
              <p className="mt-2 rounded bg-amber-900/40 px-3 py-2 font-body text-xs text-amber-300">
                TEST MODE — AI items are sent directly to Printify with a test
                address (no payment).
              </p>
            )}
            {hasDesigner && (
              <p className="mt-2 rounded bg-white/5 px-3 py-2 font-body text-xs text-muted">
                Designer items email a brief to the illustrator (original photo,
                notes, product, color). Fulfillment is handled outside the app.
              </p>
            )}

            <div className="mt-6 divide-y divide-border">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-body text-sm text-white">{item.name}</p>
                    <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                      {item.type}
                      {item.color && ` · ${item.color}`}
                      {" · "}Size {item.size} &middot; Qty{" "}
                      {item.quantity}
                      {item.illustrationMode === "designer"
                        ? item.designerPriority
                          ? " · Designer Priority (<24h)"
                          : " · Designer (1–3 days)"
                        : ""}
                      {item.includeSourceFiles ? " · Source files" : ""}
                      {item.downloadArtwork ? " · Download" : ""}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-white">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
              {downloadFee > 0 && (
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-body text-sm text-white">
                      {DOWNLOAD_ARTWORK_LABEL}
                    </p>
                    <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                      High-res digital copy
                      {downloadLines > 1 ? ` · × ${downloadLines}` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-white">
                    {formatPrice(downloadLines * DOWNLOAD_ARTWORK_PRICE_CENTS)}
                  </p>
                </div>
              )}
              {sourceFilesFee > 0 && (
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-body text-sm text-white">
                      {DESIGNER_SOURCE_FILES_LABEL}
                    </p>
                    <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                      Editable designer source files
                      {sourceFilesLines > 1 ? ` · × ${sourceFilesLines}` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-white">
                    {formatPrice(
                      sourceFilesLines * DESIGNER_SOURCE_FILES_PRICE_CENTS
                    )}
                  </p>
                </div>
              )}
              {priorityFee > 0 && (
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-body text-sm text-white">
                      {DESIGNER_PRIORITY_LABEL}
                    </p>
                    <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                      Under 24 hours
                      {priorityLines > 1 ? ` · × ${priorityLines}` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-white">
                    {formatPrice(priorityLines * DESIGNER_PRIORITY_PRICE_CENTS)}
                  </p>
                </div>
              )}
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
              {checkoutLabel}
            </Button>

            <p className="mt-4 text-center font-body text-xs text-muted">
              {hasDesigner && !hasAi
                ? "Sends the designer brief by email. No Printify order is created yet."
                : hasDesigner && hasAi
                  ? "Designer items are emailed; AI items go to Printify (test mode)."
                  : "Bypasses Stripe. Sends order directly to Printify for testing."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
