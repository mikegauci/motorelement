"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { href: "/products", label: "SHOP ALL" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-carbon">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="font-heading text-2xl text-white">
          MOTOR ELEMENT
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sub font-bold uppercase tracking-widest text-sm text-muted transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative text-muted transition-colors hover:text-white"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-ignition text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/account"
            className="text-muted transition-colors hover:text-white"
            aria-label="Account"
          >
            <User size={20} />
          </Link>
          <button
            className="text-muted transition-colors hover:text-white md:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <nav className="border-t border-border bg-carbon px-6 py-4 md:hidden">
          <ul className="space-y-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-sub font-bold uppercase tracking-widest text-sm text-muted transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
