import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";

const navLinks = [
  { href: "/products", label: "SHOP ALL" },
  { href: "/custom-upload", label: "CUSTOM UPLOAD" },
  { href: "/size-guide", label: "SIZE GUIDE" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-carbon">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
            className="text-muted transition-colors hover:text-white"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
          </Link>
          <Link
            href="/account"
            className="text-muted transition-colors hover:text-white"
            aria-label="Account"
          >
            <User size={20} />
          </Link>
          {/* TODO: mobile menu logic */}
          <button
            className="text-muted transition-colors hover:text-white md:hidden"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
