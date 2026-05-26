-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'STRIPE';

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "stripe_checkout_url" TEXT,
ADD COLUMN     "stripe_event_log" JSONB,
ADD COLUMN     "stripe_session_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pagos_stripe_session_id_key" ON "pagos"("stripe_session_id");

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_events_stripe_event_id_key" ON "stripe_events"("stripe_event_id");
