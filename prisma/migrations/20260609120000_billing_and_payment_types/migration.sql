-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PlanBillingType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION');

-- AlterTable
ALTER TABLE "lesson_plans" ADD COLUMN "billing_type" "PlanBillingType" NOT NULL DEFAULT 'ONE_TIME';
ALTER TABLE "lesson_plans" ADD COLUMN "stripe_price_id" TEXT;
ALTER TABLE "lesson_plans" ADD COLUMN "stripe_product_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "user_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "type" "PaymentType" NOT NULL DEFAULT 'ONE_TIME';
ALTER TABLE "payments" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "payments" ALTER COLUMN "booking_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "lesson_plans_billing_type_idx" ON "lesson_plans"("billing_type");
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX "payments_type_idx" ON "payments"("type");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
