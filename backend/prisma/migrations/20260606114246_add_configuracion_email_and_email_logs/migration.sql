CREATE TABLE "configuracion_email" (
  "id"                  TEXT NOT NULL DEFAULT 'singleton',
  "provider"            TEXT,
  "resend_api_key_enc"  TEXT,
  "smtp_host"           TEXT,
  "smtp_port"           INTEGER,
  "smtp_user_enc"       TEXT,
  "smtp_pass_enc"       TEXT,
  "from_email"          TEXT,
  "from_name"           TEXT,
  "updated_by"          TEXT,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "configuracion_email_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_logs" (
  "id"          TEXT NOT NULL,
  "to_email"    TEXT NOT NULL,
  "subject"     TEXT NOT NULL,
  "template"    TEXT NOT NULL,
  "status"      TEXT NOT NULL,
  "error_msg"   TEXT,
  "provider_id" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_to_email_idx" ON "email_logs"("to_email");
CREATE INDEX "email_logs_template_idx" ON "email_logs"("template");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
