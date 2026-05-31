ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'received';--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "last_event_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "access_token" text DEFAULT gen_random_uuid()::text NOT NULL;