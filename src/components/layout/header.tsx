"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reservations", label: "Reservations" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "Our Story" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-bold text-primary-dark">
          Annapurna
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Log In
          </Button>
          <Button size="sm" render={<Link href="/menu" />}>
            Order Now
          </Button>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="font-serif text-xl font-bold text-primary-dark text-left">
                  Annapurna
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4 px-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    render={
                      <Link href="/login" onClick={() => setOpen(false)} />
                    }
                  >
                    Log In
                  </Button>
                  <Button
                    render={
                      <Link href="/menu" onClick={() => setOpen(false)} />
                    }
                  >
                    Order Now
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
