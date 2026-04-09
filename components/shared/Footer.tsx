import Link from "next/link";

const shopLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/custom-upload", label: "Custom Upload" },
  { href: "/size-guide", label: "Size Guide" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="bg-obsidian border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="font-heading text-2xl text-white">
              MOTOR ELEMENT
            </span>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Car enthusiast apparel and merchandise. Your car. Your art. Your
              style.
            </p>
          </div>

          <div>
            <h4 className="font-sub font-bold uppercase tracking-widest text-label text-muted mb-4">
              Shop
            </h4>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sub font-bold uppercase tracking-widest text-label text-muted mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted">
            &copy; 2024 Motor Element. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* TODO: YouTube and share social icons */}
            <span className="text-xs text-muted">YouTube</span>
            <span className="text-xs text-muted">Share</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
