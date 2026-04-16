import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reservations", label: "Reservations" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "Our Story" },
];

export function Footer() {
  return (
    <footer className="bg-primary-dark text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <h3 className="font-serif text-2xl font-bold">Annapurna</h3>
            <p className="text-sm text-primary-foreground/70 italic">
              Taste of the Himalayas
            </p>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              Family-owned Nepali-Indian restaurant bringing the flavors of the
              Himalayas to Oakland, CA since 2010.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Hours */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
              Hours
            </h4>
            <div className="text-sm text-primary-foreground/60 space-y-1">
              <p className="font-medium text-primary-foreground/80">Open Daily</p>
              <p>11:00 AM – 9:30 PM</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
              Contact
            </h4>
            <address className="not-italic text-sm text-primary-foreground/60 space-y-1">
              <p>948 Clay Street</p>
              <p>Oakland, CA 94607</p>
              <a
                href="tel:+15102509696"
                className="block mt-2 hover:text-primary-foreground transition-colors"
              >
                (510) 250-9696
              </a>
            </address>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />

        <p className="text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} Annapurna Restaurant. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
