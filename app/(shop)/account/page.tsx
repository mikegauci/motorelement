"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { User } from "@supabase/supabase-js";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface OrderSummary {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ id: string; quantity: number; size: string; price: number }>;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      const res = await fetch(
        `/api/orders?customerId=${currentUser.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="font-heading text-display text-white">MY ACCOUNT</h1>
        <p className="mt-8 text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-display text-white">MY ACCOUNT</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <div className="mt-8 border border-border bg-obsidian p-6">
        <p className="font-sub text-xs font-bold uppercase tracking-widest text-muted">
          Email
        </p>
        <p className="mt-1 font-body text-sm text-white">{user?.email}</p>
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-2xl text-white">ORDER HISTORY</h2>

        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-border bg-obsidian p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-white">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 font-body text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-white">
                      {formatPrice(order.total)}
                    </p>
                    <span className="mt-1 inline-block rounded-none bg-carbon px-2 py-1 font-sub text-xs font-bold uppercase tracking-widest text-muted">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
