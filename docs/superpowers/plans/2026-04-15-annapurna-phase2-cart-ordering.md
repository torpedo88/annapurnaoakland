# Annapurna Phase 2: Cart + Ordering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cart functionality, checkout flow, and Stripe payment integration so customers can order food online.

**Architecture:** Client-side cart state via React Context + localStorage persistence. Item customization drawer (spice level, rice choice, special instructions). Checkout page with order type selection (pickup/delivery/dine-in). Stripe Checkout (hosted) for PCI-compliant payments. Stripe webhooks to confirm orders and save to DB. Order confirmation page with status tracking.

**Tech Stack:** Stripe Checkout, React Context, Zod validation, Next.js API routes, Resend (email confirmations).

**Spec:** `docs/superpowers/specs/2026-04-15-annapurna-redesign-design.md` — Section 6: Order Flow

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts              # POST: create Stripe Checkout session
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts          # POST: Stripe webhook handler
│   ├── order/
│   │   ├── page.tsx                  # Checkout page
│   │   ├── confirmation/
│   │   │   └── page.tsx             # Post-payment confirmation
│   │   └── [id]/
│   │       └── page.tsx             # Order status tracking
│   └── layout.tsx                    # Updated with CartProvider
├── components/
│   ├── cart/
│   │   ├── cart-provider.tsx         # React Context for cart state
│   │   ├── cart-sidebar.tsx          # Slide-out cart drawer
│   │   ├── cart-item.tsx             # Individual cart line item
│   │   ├── cart-summary.tsx          # Subtotal, tax, tip, total
│   │   └── cart-icon.tsx             # Header cart icon with count badge
│   ├── menu/
│   │   ├── item-customization-drawer.tsx  # Spice, rice, quantity, instructions
│   │   └── menu-item-card.tsx        # Updated with add-to-cart integration
│   └── order/
│       ├── order-type-selector.tsx   # Pickup / Delivery / Dine-in tabs
│       ├── pickup-form.tsx           # Schedule pickup time
│       ├── delivery-form.tsx         # Address + delivery fee
│       ├── customer-info-form.tsx    # Name, email, phone
│       └── tip-selector.tsx          # 15/18/20/custom tip
├── lib/
│   ├── stripe.ts                     # Stripe server client
│   ├── cart-utils.ts                 # Cart calculation helpers (tax, totals)
│   └── env.ts                        # Updated with STRIPE keys
└── types/
    ├── cart.ts                       # Cart types
    └── order.ts                      # Order types
```

---

### Task 1: Install Stripe + Add Environment Variables

**Files:**
- Modify: `package.json`
- Modify: `src/lib/env.ts`
- Modify: `.env.example`
- Create: `src/lib/stripe.ts`

- [ ] **Step 1: Install Stripe**

```bash
npm install stripe @stripe/stripe-js
```

- [ ] **Step 2: Update env validation**

Add to `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 3: Update .env.example**

Add:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 4: Create Stripe server client**

Create `src/lib/stripe.ts`:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});
```

- [ ] **Step 5: Add Stripe keys to .env.local**

The user needs to create a Stripe account and add test keys to `.env.local`. For now, add placeholder values so the app doesn't crash on pages that don't use Stripe.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: install Stripe SDK and add environment configuration"
```

---

### Task 2: Cart Types and Utilities

**Files:**
- Create: `src/types/cart.ts`
- Create: `src/types/order.ts`
- Create: `src/lib/cart-utils.ts`

- [ ] **Step 1: Create cart types**

Create `src/types/cart.ts`:

```ts
export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  spiceLevel: "mild" | "medium" | "spicy" | null;
  riceChoice: "basmati" | "brown" | null;
  specialInstructions: string;
}

export interface Cart {
  items: CartItem[];
  orderType: "pickup" | "delivery" | "dine_in";
  scheduledTime: string | null;
  deliveryAddress: string | null;
  specialInstructions: string;
}
```

- [ ] **Step 2: Create order types**

Create `src/types/order.ts`:

```ts
export interface OrderSummary {
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export type OrderType = "pickup" | "delivery" | "dine_in";
export type OrderStatus = "confirmed" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";
export type SpiceLevel = "mild" | "medium" | "spicy";
export type RiceChoice = "basmati" | "brown";
```

- [ ] **Step 3: Create cart utilities**

Create `src/lib/cart-utils.ts`:

```ts
import type { CartItem } from "@/types/cart";
import type { OrderSummary } from "@/types/order";

const TAX_RATE = 0.1025; // Oakland CA sales tax

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

export function calculateDeliveryFee(orderType: string): number {
  if (orderType !== "delivery") return 0;
  return 4.99;
}

export function calculateTotal(
  items: CartItem[],
  tip: number,
  orderType: string,
  discount: number = 0
): OrderSummary {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal);
  const deliveryFee = calculateDeliveryFee(orderType);
  const total = Math.round((subtotal + tax + tip + deliveryFee - discount) * 100) / 100;

  return { subtotal, tax, tip, deliveryFee, discount, total };
}

export function generateCartItemId(
  menuItemId: string,
  spiceLevel: string | null,
  riceChoice: string | null
): string {
  return `${menuItemId}-${spiceLevel ?? "none"}-${riceChoice ?? "none"}`;
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add cart and order types with calculation utilities"
```

---

### Task 3: Cart Context Provider

**Files:**
- Create: `src/components/cart/cart-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create CartProvider**

Create `src/components/cart/cart-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types/cart";
import { generateCartItemId } from "@/lib/cart-utils";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "annapurna-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem = useCallback((newItem: Omit<CartItem, "id">) => {
    const id = generateCartItemId(
      newItem.menuItemId,
      newItem.spiceLevel,
      newItem.riceChoice
    );

    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, { ...newItem, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
```

- [ ] **Step 2: Wrap layout with CartProvider**

In `src/app/layout.tsx`, import `CartProvider` and wrap the body content:

```tsx
import { CartProvider } from "@/components/cart/cart-provider";

// In the body:
<body className="font-sans bg-background text-foreground antialiased">
  <CartProvider>
    <Header />
    <main className="min-h-screen">{children}</main>
    <Footer />
  </CartProvider>
</body>
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add cart context provider with localStorage persistence"
```

---

### Task 4: Cart UI Components

**Files:**
- Create: `src/components/cart/cart-icon.tsx`
- Create: `src/components/cart/cart-item.tsx`
- Create: `src/components/cart/cart-summary.tsx`
- Create: `src/components/cart/cart-sidebar.tsx`
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Create CartIcon**

Create `src/components/cart/cart-icon.tsx` — a button showing a shopping bag/cart SVG icon with a count badge (animated bounce on change). Uses `useCart()` for itemCount.

- [ ] **Step 2: Create CartItem**

Create `src/components/cart/cart-item.tsx` — displays item name, customizations (spice level, rice choice), price, quantity controls (+/-), remove button. Uses `useCart()` for updateQuantity and removeItem.

- [ ] **Step 3: Create CartSummary**

Create `src/components/cart/cart-summary.tsx` — displays subtotal, tax (10.25%), delivery fee (if applicable), tip, total. Uses `calculateTotal` from cart-utils.

- [ ] **Step 4: Create CartSidebar**

Create `src/components/cart/cart-sidebar.tsx` — uses shadcn Sheet, slides from right. Shows CartItem list, CartSummary at bottom, "Proceed to Checkout" button linking to /order. Empty state message when no items.

- [ ] **Step 5: Add CartIcon and CartSidebar to Header**

Update `src/components/layout/header.tsx` to show CartIcon next to "Order Now" button. CartIcon opens CartSidebar on click.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add cart sidebar with item management and order summary"
```

---

### Task 5: Item Customization Drawer

**Files:**
- Create: `src/components/menu/item-customization-drawer.tsx`
- Modify: `src/components/menu/menu-item-card.tsx`

- [ ] **Step 1: Create ItemCustomizationDrawer**

Create `src/components/menu/item-customization-drawer.tsx` — a "use client" Sheet/Drawer that opens when "Add to Cart" is clicked on a menu item card. Contains:
- Item name and price at top
- Quantity selector (- / number / +), default 1
- Spice level selector (only if item.hasSpiceOptions): three flame-icon buttons for Mild/Medium/Spicy
- Rice choice selector (only if item.hasRiceChoice): two buttons for Basmati/Brown
- Special instructions textarea
- "Add to Cart" button at bottom that calls `useCart().addItem()` and closes the drawer
- Uses the MenuItem type for props

- [ ] **Step 2: Update MenuItemCard**

Modify `src/components/menu/menu-item-card.tsx` — replace the static "Add to Cart" button with one that opens the ItemCustomizationDrawer. Pass the menu item data to the drawer. Make the card a "use client" component.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add item customization drawer with spice, rice, and quantity options"
```

---

### Task 6: Checkout Page

**Files:**
- Create: `src/components/order/order-type-selector.tsx`
- Create: `src/components/order/customer-info-form.tsx`
- Create: `src/components/order/tip-selector.tsx`
- Create: `src/app/order/page.tsx`

- [ ] **Step 1: Create OrderTypeSelector**

Create `src/components/order/order-type-selector.tsx` — three tab-style buttons for Pickup / Delivery / Dine-in. Pickup shows time scheduler (ASAP or 15-min increments). Delivery shows address input. Dine-in shows "I'm here" option.

- [ ] **Step 2: Create CustomerInfoForm**

Create `src/components/order/customer-info-form.tsx` — name, email, phone fields with Zod validation. All required.

- [ ] **Step 3: Create TipSelector**

Create `src/components/order/tip-selector.tsx` — preset buttons (15%, 18%, 20%, Custom). Custom shows input field. Calculates tip based on subtotal.

- [ ] **Step 4: Create Checkout Page**

Create `src/app/order/page.tsx` — "use client" page that:
- Shows cart items summary (read-only, link back to /menu to edit)
- OrderTypeSelector
- CustomerInfoForm
- TipSelector
- CartSummary with final total
- "Pay with Stripe" button that POSTs to /api/checkout and redirects to Stripe Checkout
- Redirects to /menu if cart is empty

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: build checkout page with order type, customer info, and tip selection"
```

---

### Task 7: Stripe Checkout API Route

**Files:**
- Create: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Create checkout API route**

Create `src/app/api/checkout/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    spiceLevel: z.string().nullable(),
    riceChoice: z.string().nullable(),
    specialInstructions: z.string(),
    menuItemId: z.string(),
  })),
  orderType: z.enum(["pickup", "delivery", "dine_in"]),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  tip: z.number().min(0),
  deliveryAddress: z.string().nullable(),
  deliveryFee: z.number().min(0),
  scheduledTime: z.string().nullable(),
  specialInstructions: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, orderType, customerName, customerEmail, customerPhone, tip, deliveryAddress, deliveryFee, scheduledTime, specialInstructions } = parsed.data;

  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        description: [
          item.spiceLevel ? `Spice: ${item.spiceLevel}` : null,
          item.riceChoice ? `Rice: ${item.riceChoice}` : null,
          item.specialInstructions || null,
        ].filter(Boolean).join(" | ") || undefined,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  // Add delivery fee as a line item if applicable
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee", description: undefined },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  // Add tip as a line item if applicable
  if (tip > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Tip", description: undefined },
        unit_amount: Math.round(tip * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${req.nextUrl.origin}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.nextUrl.origin}/order`,
    customer_email: customerEmail,
    automatic_tax: { enabled: false },
    metadata: {
      orderType,
      customerName,
      customerPhone,
      deliveryAddress: deliveryAddress ?? "",
      scheduledTime: scheduledTime ?? "",
      specialInstructions,
      tip: tip.toString(),
      deliveryFee: deliveryFee.toString(),
      itemsJson: JSON.stringify(items),
    },
  });

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Stripe Checkout API route with order metadata"
```

---

### Task 8: Stripe Webhook + Order Saving

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create Stripe webhook handler**

Create `src/app/api/webhooks/stripe/route.ts`:

Handles `checkout.session.completed` event:
1. Verify webhook signature using STRIPE_WEBHOOK_SECRET
2. Parse metadata from the session (items, customer info, order type, etc.)
3. Insert order into `orders` table
4. Insert order items into `order_items` table
5. Return 200

Must use `request.text()` for raw body (Stripe needs raw body for signature verification).
Set `export const dynamic = "force-dynamic"` to prevent caching.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Stripe webhook handler to save orders to database"
```

---

### Task 9: Order Confirmation + Status Pages

**Files:**
- Create: `src/app/order/confirmation/page.tsx`
- Create: `src/app/order/[id]/page.tsx`

- [ ] **Step 1: Create confirmation page**

Create `src/app/order/confirmation/page.tsx`:
- Reads `session_id` from URL search params
- Fetches Stripe session to get payment status and metadata
- Shows order confirmation: order number, items, total, estimated time
- Shows "Track Your Order" link
- Clears the cart on mount

- [ ] **Step 2: Create order status page**

Create `src/app/order/[id]/page.tsx`:
- Server component that fetches order from DB by ID
- Shows order status with visual progress: Confirmed -> Preparing -> Ready -> Picked Up
- Shows order details (items, total, customer info)
- Auto-refreshes status (client component with polling or just manual refresh for now)

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add order confirmation and status tracking pages"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Type check**
```bash
npx tsc --noEmit
```

- [ ] **Step 2: Lint**
```bash
npm run lint
```

- [ ] **Step 3: Build**
```bash
npm run build
```

- [ ] **Step 4: Manual test flow**
1. Browse menu, add items with customizations
2. Open cart sidebar, verify items and totals
3. Proceed to checkout, fill customer info
4. Complete Stripe test payment (card: 4242 4242 4242 4242)
5. Verify confirmation page shows
6. Check Supabase orders table for the new order

- [ ] **Step 5: Commit fixes**
```bash
git add .
git commit -m "fix: resolve build and type issues for phase 2"
```

---

## Phase 2 Complete

At this point you have:
- Cart with localStorage persistence and React Context
- Item customization (spice, rice, quantity, instructions)
- Cart sidebar with item management
- Checkout page with order type, customer info, tip selection
- Stripe Checkout integration (PCI compliant)
- Webhook to save orders to database
- Order confirmation and status tracking pages
- Full ordering flow: Browse -> Add to Cart -> Checkout -> Pay -> Confirmation

**Next:** Phase 3 — Admin Dashboard
