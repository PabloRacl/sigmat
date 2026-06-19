-- Adiciona batalhao_id ao equipamento para consultas diretas por OME
ALTER TABLE "equipamentos" ADD COLUMN IF NOT EXISTS "batalhao_id" INTEGER;

-- Cria índice para consultas por batalhão
CREATE INDEX IF NOT EXISTS "equipamentos_batalhao_id_idx" ON "equipamentos" ("batalhao_id");

-- Adiciona chave estrangeira
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'equipamentos_batalhao_id_fkey'
  ) THEN
    ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_batalhao_id_fkey"
      FOREIGN KEY ("batalhao_id") REFERENCES "batalhoes"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Preenche batalhao_id dos registros existentes baseado na relação seção → batalhão
UPDATE "equipamentos" e
SET "batalhao_id" = s."batalhao_id"
FROM "secoes" s
WHERE e."secao_id" = s."id"
  AND e."batalhao_id" IS NULL
  AND s."batalhao_id" IS NOT NULL;
