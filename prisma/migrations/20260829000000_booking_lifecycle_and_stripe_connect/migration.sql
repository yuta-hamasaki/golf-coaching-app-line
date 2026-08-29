ALTER TABLE "coaches"
  ADD COLUMN "stripe_account_id" TEXT,
  ADD COLUMN "stripe_charges_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stripe_payouts_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "bookings"
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "expires_at" TIMESTAMP(3);

ALTER TABLE "payments" ADD COLUMN "stripe_refund_id" TEXT;

CREATE TABLE "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coaches_stripe_account_id_key" ON "coaches"("stripe_account_id");
CREATE INDEX "bookings_status_expires_at_idx" ON "bookings"("status", "expires_at");
