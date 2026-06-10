ALTER TABLE "stripe_events"
  ADD COLUMN "processed_successfully" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "error_message" TEXT,
  ADD COLUMN "retries" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "stripe_events_processed_successfully_idx" ON "stripe_events"("processed_successfully");
