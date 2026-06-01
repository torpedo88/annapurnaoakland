ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" text DEFAULT 'online' NOT NULL;