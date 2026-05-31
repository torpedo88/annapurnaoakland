"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MenuItem } from "@/data/menu";

const CART_KEY = "annapurna:cart";
const TAX_RATE = 0.0925; // Oakland sales tax ~9.25%

export type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

type CartContextShape = {
  lines: CartLine[];
  add: (item: MenuItem, qty?: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  subtotal: number;
  tax: number;
  count: number;
  justAdded: { id: string; ts: number } | null;
};

const CartContext = createContext<CartContextShape | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [justAdded, setJustAdded] = useState<{ id: string; ts: number } | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((item: MenuItem, qty: number = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + qty } : l));
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, qty, image: item.image },
      ];
    });
    setJustAdded({ id: item.id, ts: Date.now() });
  }, []);

  const increment = useCallback((id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)));
  }, []);

  const decrement = useCallback((id: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);
  const tax = useMemo(() => +(subtotal * TAX_RATE).toFixed(2), [subtotal]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const value = useMemo<CartContextShape>(
    () => ({
      lines,
      add,
      increment,
      decrement,
      remove,
      clear,
      isOpen,
      setOpen,
      subtotal,
      tax,
      count,
      justAdded,
    }),
    [lines, add, increment, decrement, remove, clear, isOpen, subtotal, tax, count, justAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export { TAX_RATE };
