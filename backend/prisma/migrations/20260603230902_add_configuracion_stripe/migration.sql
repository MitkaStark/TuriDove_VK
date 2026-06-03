-- ConfiguracionStripe (singleton)
CREATE TABLE "configuracion_stripe" (
  "id"                 TEXT NOT NULL DEFAULT 'singleton',
  "secret_key_enc"     TEXT,
  "public_key"         TEXT,
  "webhook_secret_enc" TEXT,
  "modo"               TEXT,
  "updated_by"         TEXT,
  "updated_at"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "configuracion_stripe_pkey" PRIMARY KEY ("id")
);
