import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  decimal,
  date,
  time,
  timestamp,
  jsonb,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const now = () => sql`now()`;
const genUuid = () => sql`gen_random_uuid()`;

// ─── Menu Categories ───────────────────────────────────────────────────────────
export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().default(genUuid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order"),
  isCatering: boolean("is_catering"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Menu Items ────────────────────────────────────────────────────────────────
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().default(genUuid()),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  hasSpiceOptions: boolean("has_spice_options"),
  hasRiceChoice: boolean("has_rice_choice"),
  isVegetarian: boolean("is_vegetarian"),
  isVeganOption: boolean("is_vegan_option"),
  isGlutenFree: boolean("is_gluten_free"),
  isAvailable: boolean("is_available").default(true),
  sortOrder: integer("sort_order"),
  halfTrayPrice: decimal("half_tray_price", { precision: 10, scale: 2 }),
  fullTrayPrice: decimal("full_tray_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Customers ─────────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(genUuid()),
  authUserId: uuid("auth_user_id").unique(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone"),
  defaultAddress: text("default_address"),
  loyaltyPoints: integer("loyalty_points"),
  lifetimeSpend: decimal("lifetime_spend", { precision: 10, scale: 2 }),
  orderCount: integer("order_count"),
  birthday: date("birthday"),
  referralCode: text("referral_code").unique(),
  referredBy: uuid("referred_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Orders ────────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(genUuid()),
  orderNumber: serial("order_number"),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  orderType: text("order_type"),
  status: text("status").default("received"),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid | paid | refunded
  paymentMethod: text("payment_method"), // cash | card | online
  source: text("source").notNull().default("online"), // online | phone
  // High-entropy per-order token required to read the order (guards IDOR / PII).
  accessToken: text("access_token").notNull().default(sql`gen_random_uuid()::text`),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  tax: decimal("tax", { precision: 10, scale: 2 }),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }),
  loyaltyPointsEarned: integer("loyalty_points_earned"),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  scheduledTime: timestamp("scheduled_time", { withTimezone: true }),
  deliveryAddress: text("delivery_address"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Order Items ───────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(genUuid()),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").references(() => menuItems.id),
  itemName: text("item_name"),
  itemPrice: decimal("item_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(1),
  spiceLevel: text("spice_level"),
  riceChoice: text("rice_choice"),
  specialInstructions: text("special_instructions"),
  traySize: text("tray_size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Reservations ──────────────────────────────────────────────────────────────
export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().default(genUuid()),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  date: date("date"),
  timeSlot: time("time_slot"),
  partySize: integer("party_size"),
  status: text("status").default("confirmed"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Time Slots ────────────────────────────────────────────────────────────────
export const timeSlots = pgTable(
  "time_slots",
  {
    id: uuid("id").primaryKey().default(genUuid()),
    dayOfWeek: integer("day_of_week").notNull(),
    time: time("time").notNull(),
    maxCapacity: integer("max_capacity").default(8),
    isActive: boolean("is_active").default(true),
  },
  (table) => ({
    uniqueDayTime: unique().on(table.dayOfWeek, table.time),
  })
);

// ─── Loyalty Rewards ──────────────────────────────────────────────────────────
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: uuid("id").primaryKey().default(genUuid()),
  name: text("name"),
  description: text("description"),
  pointsRequired: integer("points_required"),
  rewardType: text("reward_type"),
  rewardValue: decimal("reward_value", { precision: 10, scale: 2 }),
  maxItemValue: decimal("max_item_value", { precision: 10, scale: 2 }),
  isActive: boolean("is_active"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Loyalty Transactions ─────────────────────────────────────────────────────
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: uuid("id").primaryKey().default(genUuid()),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  orderId: uuid("order_id").references(() => orders.id),
  type: text("type"),
  points: integer("points"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Catering Requests ────────────────────────────────────────────────────────
export const cateringRequests = pgTable("catering_requests", {
  id: uuid("id").primaryKey().default(genUuid()),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  eventDate: date("event_date"),
  partySize: integer("party_size"),
  budgetRange: text("budget_range"),
  dietaryNeeds: text("dietary_needs"),
  details: text("details"),
  status: text("status").default("pending"),
  adminNotes: text("admin_notes"),
  quotedTotal: decimal("quoted_total", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Restaurant Settings ──────────────────────────────────────────────────────
export const restaurantSettings = pgTable("restaurant_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().default(genUuid()),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  externalDeliveryId: text("external_delivery_id").notNull().unique(),
  provider: text("provider").default("doordash_drive"),
  status: text("status").default("created"),
  feeCents: integer("fee_cents"),
  currency: text("currency").default("USD"),
  trackingUrl: text("tracking_url"),
  dropoffAddress: text("dropoff_address"),
  lastEventId: text("last_event_id"), // webhook idempotency / replay guard
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Staff (admin users) ─────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().default(genUuid()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"), // 'owner' | 'manager' | 'staff'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

// ─── Promos / Discounts ────────────────────────────────────────────────────────
export const promos = pgTable("promos", {
  id: uuid("id").primaryKey().default(genUuid()),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull().default("percent"), // percent | fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrder: decimal("min_order", { precision: 10, scale: 2 }),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});
