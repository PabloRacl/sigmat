-- Adiciona a coluna autorizado ao usuário para habilitar a autorização de login
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "autorizado" BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE "usuarios" SET "autorizado" = TRUE WHERE "autorizado" IS NULL;
