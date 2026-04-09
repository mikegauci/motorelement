export const dynamic = "force-dynamic";

import Link from "next/link";
import { retrieveCheckoutSession } from "@/lib/stripe/helpers";
import { Button } from "@/components/ui/Button";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-display text-white">
          ORDER CONFIRMED
        </h1>
        <p className="mt-8 text-muted">No session found.</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  let session;
  try {
    session = await retrieveCheckoutSession(sessionId);
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-display text-white">
          ORDER CONFIRMED
        </h1>
        <p className="mt-8 text-muted">
          Could not retrieve order details. Please check your email for
          confirmation.
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const lineItems = session.line_items?.data ?? [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ignition/20 text-3xl">
          &#10003;
        </div>
        <h1 className="mt-6 font-heading text-display text-white">
          ORDER CONFIRMED
        </h1>
        <p className="mt-4 font-body text-sm text-muted">
          Thank you for your purchase. A confirmation email has been sent.
        </p>
      </div>

      <div className="mt-12 border border-border bg-obsidian p-8">
        <h2 className="font-heading text-2xl text-white">ORDER DETAILS</h2>

        <div className="mt-6 divide-y divide-border">
          {lineItems.map((item) => (
            <div key={item.id} className="flex justify-between py-4">
              <div>
                <p className="font-body text-sm text-white">
                  {item.description}
                </p>
                <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
                  Qty {item.quantity}
                </p>
              </div>
              <p className="font-mono text-sm text-white">
                {formatPrice(item.amount_total)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <div className="flex justify-between font-heading text-xl">
            <span className="text-white">TOTAL</span>
            <span className="text-white">
              {formatPrice(session.amount_total ?? 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
