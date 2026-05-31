# Annapurna Oakland — Full Restaurant Platform Redesign

**Date:** 2026-04-15
**Author:** Avsek Maharjan
**Status:** Draft

---

## 1. Overview

Complete redesign of annapurnaoakland.com — replacing the current Wix-hosted site with a modern, custom-built restaurant platform. The site serves as both a brand showcase and a full ordering/reservation/loyalty platform for a family-owned Nepali-Indian restaurant at 948 Clay Street, Oakland, CA.

### Goals

- Modern, mobile-first restaurant website with strong brand identity
- Custom online ordering with Stripe payments (replacing Wix order.online)
- Time-slot based reservation system with capacity management
- Points-based loyalty program with rewards
- Catering request system with quote workflow
- Admin dashboard for restaurant operations, analytics, and menu management
- Kitchen order display + thermal printer integration

### Non-Goals

- Third-party delivery logistics (DoorDash, UberEats integration) — start with pickup, self-delivery, and dine-in
- Table management / seating chart — use simple capacity-per-slot model
- Mobile native app — responsive web app covers this
- Multi-location support — single restaurant

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, API routes, Server Actions, Vercel deploy |
| Language | TypeScript (strict, zero `any`) | Type safety across the stack |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development, customizable component library |
| Database | PostgreSQL via Supabase | Free tier (500MB), realtime subscriptions, Row Level Security |
| Auth | Supabase Auth | Email + Google sign-in, role-based access (owner/staff/customer) |
| Payments | Stripe Checkout | PCI compliant, Apple Pay, Google Pay, 2.9% + $0.30/txn |
| Email | Resend | Order/reservation confirmations, marketing. Free up to 3K/mo |
| Analytics | PostHog + Vercel Analytics | Product analytics (free 1M events) + web vitals |
| Validation | Zod | Schema validation on forms, API inputs, env vars |
| ORM | Drizzle | Type-safe queries, lightweight, good performance |
| Hosting | Vercel | Free tier, edge functions, preview deployments |
| Kitchen Printer | Star CloudPRNT / Epson ePOS | HTTP-based printing from server |

### Monorepo Structure

Single Next.js app with two "experiences":
- **Customer site** — all public routes
- **Admin dashboard** — `/admin/*` protected by middleware + role check

---

## 3. Brand & Design Language

### Identity

- **Name:** Annapurna — named after the Himalayan mountain and Hindu goddess of food/nourishment
- **Tagline:** "Taste of the Himalayas"
- **Cuisine:** Nepali-Indian (momos, chhoila, tikka masala, tandoori, biryani)
- **Vibe:** Warm, authentic, inviting — modern but grounded. Neighborhood gem with Himalayan soul.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#D4731A` (Deep Saffron) | CTAs, links, accents |
| `primary-dark` | `#8B4513` (Burnt Umber) | Hover states, headings |
| `secondary` | `#8B1A1A` (Deep Red) | Highlights, loyalty badges |
| `background` | `#FAF7F2` (Warm White) | Page background |
| `surface` | `#F5F0E8` (Cream) | Cards, modals |
| `text` | `#2D2A26` (Charcoal) | Body text |
| `text-muted` | `#6B6560` (Warm Gray) | Secondary text |
| `accent` | `#4A7C59` (Himalayan Green) | Vegetarian tags, success states |
| `gold` | `#C5963A` (Mountain Gold) | Loyalty tiers, premium catering |

### Typography

- **Headings:** Playfair Display (serif, warm and elegant)
- **Body:** Inter (sans-serif, highly legible)
- **Prices/Order numbers:** DM Mono (monospace)

### Design Elements

- Subtle Himalayan mountain silhouette in hero/footer
- Warm food photography with consistent warm-tone filter
- Rounded corners (`radius-lg`) on cards
- Micro-animations: cart count bounce, order status transitions, smooth page transitions
- Mobile-first — 70%+ of restaurant orders come from phones
- Spice level selector as visual flame icons (1-3 flames)
- Dietary tags as colored pills (green = veg, yellow = vegan option, blue = gluten-free)
- shadcn/ui components customized with saffron/warm palette
- Cards with soft shadows

---

## 4. Database Schema

### Core Tables

```sql
-- Menu
menu_categories (
  id UUID PK DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_catering BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

menu_items (
  id UUID PK DEFAULT gen_random_uuid(),
  category_id UUID FK → menu_categories.id,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  has_spice_options BOOLEAN DEFAULT false,
  has_rice_choice BOOLEAN DEFAULT false,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan_option BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  -- Catering fields
  half_tray_price DECIMAL(10,2),
  full_tray_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Orders
orders (
  id UUID PK DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID FK → customers.id (nullable for guests),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('pickup', 'delivery', 'dine_in')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  tip DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  loyalty_points_earned INT DEFAULT 0,
  loyalty_points_redeemed INT DEFAULT 0,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  scheduled_time TIMESTAMPTZ,
  delivery_address TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

order_items (
  id UUID PK DEFAULT gen_random_uuid(),
  order_id UUID FK → orders.id ON DELETE CASCADE,
  menu_item_id UUID FK → menu_items.id,
  item_name TEXT NOT NULL,
  item_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  spice_level TEXT CHECK (spice_level IN ('mild', 'medium', 'spicy')),
  rice_choice TEXT CHECK (rice_choice IN ('basmati', 'brown')),
  special_instructions TEXT,
  -- Catering
  tray_size TEXT CHECK (tray_size IN ('half', 'full')),
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Customers
customers (
  id UUID PK DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE FK → auth.users.id,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  default_address TEXT,
  loyalty_points INT DEFAULT 0,
  lifetime_spend DECIMAL(10,2) DEFAULT 0,
  order_count INT DEFAULT 0,
  birthday DATE,
  referral_code TEXT UNIQUE,
  referred_by UUID FK → customers.id,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Reservations
reservations (
  id UUID PK DEFAULT gen_random_uuid(),
  customer_id UUID FK → customers.id (nullable for guests),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  party_size INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

time_slots (
  id UUID PK DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time TIME NOT NULL,
  max_capacity INT NOT NULL DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(day_of_week, time)
)

-- Loyalty
loyalty_rewards (
  id UUID PK DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_item', 'discount_amount', 'discount_percent')),
  reward_value DECIMAL(10,2),
  max_item_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

loyalty_transactions (
  id UUID PK DEFAULT gen_random_uuid(),
  customer_id UUID FK → customers.id,
  order_id UUID FK → orders.id (nullable),
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus', 'referral', 'welcome', 'birthday', 'streak')),
  points INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Catering
catering_requests (
  id UUID PK DEFAULT gen_random_uuid(),
  customer_id UUID FK → customers.id (nullable),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  party_size INT NOT NULL,
  budget_range TEXT,
  dietary_needs TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'confirmed', 'completed', 'cancelled')),
  admin_notes TEXT,
  quoted_total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Settings
restaurant_settings (
  key TEXT PK,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
)
-- Keys: 'hours', 'delivery_radius', 'delivery_fees', 'tax_rate', 'prep_time', 'loyalty_config'
```

---

## 5. Pages & Routes

### Public Routes

| Route | Page | Description |
|---|---|---|
| `/` | Homepage | Hero, story, featured dishes, reviews, hours, map |
| `/menu` | Menu | Full menu with categories, dietary filters, add-to-cart |
| `/order` | Checkout | Cart review, order type, schedule, payment |
| `/order/[id]` | Order Status | Live order tracking after payment |
| `/order/confirmation` | Confirmation | Post-payment success page |
| `/reservations` | Reservations | Date/time picker, party size, book a table |
| `/catering` | Catering | Catering menu + inquiry form |
| `/about` | Our Story | Family history, Himalayan heritage, photos |
| `/account` | Account | Profile, order history, addresses |
| `/account/loyalty` | Loyalty | Points balance, rewards, referral code |
| `/login` | Auth | Sign in / Sign up (Supabase Auth) |

### Admin Routes (protected)

| Route | Page | Description |
|---|---|---|
| `/admin` | Dashboard | Revenue, order count, live order feed |
| `/admin/orders` | Orders | Real-time order management with status updates + print |
| `/admin/menu` | Menu Management | CRUD menu items, toggle availability, reorder categories |
| `/admin/reservations` | Reservations | View/confirm/cancel, manage capacity |
| `/admin/catering` | Catering | Review requests, send quotes |
| `/admin/customers` | Customers | Customer list, lifetime value, notes |
| `/admin/analytics` | Analytics | Revenue charts, popular items, peak hours, customer metrics |
| `/admin/loyalty` | Loyalty | Manage rewards, grant bonus points |
| `/admin/settings` | Settings | Hours, delivery, tax, notifications, printer |

---

## 6. Order Flow

### Customer Journey

```
Browse Menu → Add to Cart (customizations) → Review Cart → Select Order Type → Stripe Checkout → Confirmation
```

### Detailed Steps

1. **Add to Cart** — Click menu item, drawer slides up with:
   - Quantity selector
   - Spice level: Mild / Medium / Spicy (flame icons)
   - Rice choice (if applicable): Basmati / Brown
   - Special instructions text field
   - Cart icon in header shows count with bounce animation

2. **Cart Sidebar** — Slide-out from right:
   - All items with customizations editable inline
   - Remove items, adjust quantity
   - Subtotal, tax (10.25% CA), tip selector (15/18/20/custom), total
   - "Proceed to Checkout" button

3. **Checkout (`/order`):**
   - Logged in: pre-fill name, phone, email, address
   - Guest: collect info, offer account creation after
   - Order type: Pickup (ASAP or schedule, 15-min increments) / Delivery (address + fee $3.99-$5.99) / Dine-in
   - Apply loyalty points or promo code
   - Redirect to Stripe Checkout (hosted, PCI compliant)

4. **Post-Payment:**
   - Stripe webhook → order saved to DB as `confirmed`
   - Loyalty points awarded (1 point per $1 spent on food)
   - Confirmation page with order #, estimated time, items
   - Email confirmation via Resend
   - Kitchen: printer auto-prints ticket + admin dashboard notification with sound

5. **Order Status Updates:**
   - Admin updates: Confirmed → Preparing → Ready → Picked Up/Delivered
   - Customer sees live status on `/order/[id]`
   - Email sent when status = "Ready for Pickup"

### Kitchen Ticket Format

```
================================
  ANNAPURNA - Order #1042
  PICKUP - ASAP
  Customer: John D. | 510-555-1234
================================
1x Chicken Tikka Masala  [SPICY]
   Rice: Brown
   "Extra sauce please"
2x Garlic Naan
1x Mango Lassi
--------------------------------
  Subtotal: $29.97
  Tax:       $3.07
  Tip:       $5.00
  TOTAL:    $38.04
  Paid via Stripe
================================
```

---

## 7. Reservations System

### Time Slot Configuration

- Lunch: 11:00 AM - 2:00 PM (30-min intervals)
- Dinner: 5:00 PM - 9:00 PM (30-min intervals)
- Each slot: max 8 parties (configurable by admin)
- Slots auto-disable when full

### Customer Flow

1. Select date (today + 30 days)
2. See available time slots (greyed out if full)
3. Select party size (1-12, 12+ redirects to catering)
4. Add special requests
5. Logged in: one-click confirm. Guest: collect name/phone/email
6. Confirmation email with "Add to Calendar" ICS link
7. Reminder email 24 hours before

### Admin Controls

- Daily reservation view with party sizes
- Confirm / waitlist / cancel with message to customer
- Edit capacity per slot
- No-show tracking

---

## 8. Loyalty Program

### Points System

- $1 spent on food = 1 point (excludes tax and tip)
- Points never expire
- Must have an account to earn/redeem

### Rewards

| Points | Reward |
|---|---|
| 50 | Free Mango Lassi or Chai |
| 100 | Free appetizer (Samosa, Pakora, or Veg Momo) |
| 150 | Free dessert (Gulab Jamun, Kheer, or Kulfi) |
| 250 | $20 off any order |
| 500 | Free entree (up to $19.99 value) |

### Engagement Bonuses

- Welcome: 25 points on account creation
- Birthday: Double points during birthday week
- Streak: Order 3 weeks in a row = bonus 50 points
- Referral: Friend gets 25 points, you get 25 points on their first order

### Customer Dashboard (`/account/loyalty`)

- Points balance with progress bar to next reward
- "You're 30 points away from a free appetizer!"
- Points history (earned, redeemed, bonuses)
- Available rewards to redeem
- Referral code + share link

---

## 9. Admin Dashboard

### Home (`/admin`)

- At-a-glance cards: today's revenue (vs last week), order count (by type), active reservations, pending catering
- Live order feed with color-coded status pills
- Audio chime on new orders
- One-tap status updates, print ticket per order

### Menu Management (`/admin/menu`)

- Drag-and-drop category ordering
- Per-item: edit all fields, image upload, toggle availability
- Bulk price updates
- Separate catering menu management

### Analytics (`/admin/analytics`)

- Revenue: daily/weekly/monthly charts (Recharts)
- Popular items: top 10 by quantity and revenue
- Peak hours: heatmap by hour and day of week
- Order types: pie chart (pickup/delivery/dine-in)
- Average order value: trend line
- Customer metrics: new vs returning, repeat rate, lifetime value
- Date range selector with presets

### Customer Management (`/admin/customers`)

- Searchable customer list
- Per customer: order history, total spend, loyalty points, reservation history
- Grant bonus points, add notes

### Settings (`/admin/settings`)

- Restaurant hours (per day of week)
- Delivery radius and fee tiers
- Tax rate
- Estimated prep time by order type
- Notification preferences
- Printer configuration
- Loyalty program on/off and point ratios

### Auth & Roles

- `owner` — full access to everything
- `staff` — orders + reservations only (no analytics, settings, menu edits)
- Protected by Next.js middleware + Supabase RLS

---

## 10. Infrastructure & Cost

### Monthly Operating Costs

| Service | Cost | Notes |
|---|---|---|
| Vercel | $0 | Free tier (hobby) |
| Supabase | $0 | Free tier (500MB, 50K auth users) |
| Stripe | 2.9% + $0.30/txn | ~$145/mo on $5K orders |
| Resend | $0 | Free up to 3K emails/mo |
| PostHog | $0 | Free up to 1M events/mo |
| Domain | ~$12/year | Already owned |
| **Total** | **~$145/mo** | **Processing fees only** |

### Scaling Triggers

- Supabase free tier exceeded → Pro plan at $25/mo
- Vercel hobby limits hit → Pro plan at $20/mo
- Resend 3K emails exceeded → $20/mo
- High traffic → consider Vercel Pro for analytics + bandwidth

### Kitchen Hardware

- Thermal printer (Star/Epson network): ~$150 one-time
- Tablet + wall mount for KDS: ~$200 one-time (or use existing)
- **Total hardware: ~$350 one-time**

---

## 11. Menu Data

The full menu has been captured from the current site and will be seeded into the database. Summary:

- **Appetizers:** 13 items ($7.99-$16.99)
- **Vegetarian:** 16 items ($16.99-$17.99)
- **Chicken:** 8 items ($17.99-$18.99)
- **Lamb:** 7 items ($18.99-$19.99)
- **Tandoori:** 5 items ($22.99-$25.99)
- **Seafood:** 6 items ($18.99-$19.99)
- **Biryani:** 3 items ($17.99-$19.99)
- **House Special:** 1 item ($19.99)
- **Breads:** 11 items ($4.99-$6.99)
- **Side Orders:** 7 items ($3.50-$10.99)
- **Desserts:** 4 items ($7.99-$8.99)
- **Beverages:** 6 items ($2.99-$5.99)
- **Catering:** Full tray pricing across all categories

Full menu data with descriptions and prices will be included in the database seed file.

---

## 12. Future Considerations (Not In Scope)

- Third-party delivery integration (DoorDash, UberEats)
- SMS notifications via Twilio (~$0.0079/msg)
- Multi-language support (Nepali, Hindi)
- Gift cards
- Table-side QR code ordering
- Kitchen display system (dedicated KDS app vs web dashboard)
- Mobile native app (PWA as interim)
- Google Reviews integration on homepage
- Instagram feed embed
