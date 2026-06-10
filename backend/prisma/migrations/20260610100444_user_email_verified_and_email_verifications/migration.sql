ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- Auto-verificar usuarios pre-existentes
UPDATE "users" SET "email_verified_at" = "updated_at" WHERE "email_verified_at" IS NULL;

CREATE TABLE "email_verifications" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verifications_token_hash_key" ON "email_verifications"("token_hash");
CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications"("user_id");

ALTER TABLE "email_verifications"
  ADD CONSTRAINT "email_verifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
