ALTER TABLE "reservas"
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "reservas_idempotency_key_key" ON "reservas"("idempotency_key");
