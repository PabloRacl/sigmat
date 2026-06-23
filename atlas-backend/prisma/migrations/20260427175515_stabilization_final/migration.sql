/*
  Warnings:

  - You are about to drop the column `dados_especificos` on the `equipamentos` table. All the data in the column will be lost.
  - Changed the type of `acao` on the `log_operacoes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AcaoLog" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'TRANSFER', 'BATCH_UPDATE', 'ABERTURA_OS', 'ATUALIZACAO_OS', 'TRANSFERENCIA_CONCLUIDA', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDA', 'CANCELADA');

-- AlterTable
ALTER TABLE "batalhoes" ADD COLUMN     "cidade" VARCHAR(100),
ADD COLUMN     "endereco" VARCHAR(255),
ADD COLUMN     "telefone_bpm" VARCHAR(50),
ADD COLUMN     "telefone_ti" VARCHAR(50);

-- AlterTable
ALTER TABLE "disponibilidades" ADD COLUMN     "descricao" VARCHAR(255);

-- AlterTable
ALTER TABLE "equipamentos" DROP COLUMN "dados_especificos",
ADD COLUMN     "especificacoes" JSONB;

-- AlterTable
ALTER TABLE "log_operacoes" DROP COLUMN "acao",
ADD COLUMN     "acao" "AcaoLog" NOT NULL;

-- AlterTable
ALTER TABLE "status_equipamento" ADD COLUMN     "cor_emoji" VARCHAR(50),
ADD COLUMN     "descricao_amigavel" VARCHAR(255);

-- AlterTable
ALTER TABLE "tipos_aquisicao" ADD COLUMN     "cor_emoji" VARCHAR(50),
ADD COLUMN     "descricao_amigavel" VARCHAR(255);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "nome_guerra" VARCHAR(100),
ADD COLUMN     "status_funcional" VARCHAR(100),
ADD COLUMN     "telefone" VARCHAR(50);

-- CreateTable
CREATE TABLE "usuario_secoes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "secao_id" INTEGER NOT NULL,
    "data_associacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_secoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_tipos_equipamento" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_equipamento_id" INTEGER NOT NULL,
    "data_associacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_tipos_equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" SERIAL NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "solicitante_id" INTEGER NOT NULL,
    "tecnico_responsavel" VARCHAR(200),
    "descricao_problema" TEXT NOT NULL,
    "status" "StatusManutencao" NOT NULL DEFAULT 'ABERTA',
    "data_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_previsao" TIMESTAMP(3),
    "data_conclusao" TIMESTAMP(3),
    "solucao_aplicada" TEXT,
    "valor_gasto" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_secoes_usuario_id_secao_id_key" ON "usuario_secoes"("usuario_id", "secao_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_tipos_equipamento_usuario_id_tipo_equipamento_id_key" ON "usuario_tipos_equipamento"("usuario_id", "tipo_equipamento_id");

-- CreateIndex
CREATE INDEX "ordens_servico_equipamento_id_idx" ON "ordens_servico"("equipamento_id");

-- CreateIndex
CREATE INDEX "ordens_servico_status_idx" ON "ordens_servico"("status");

-- CreateIndex
CREATE INDEX "ordens_servico_solicitante_id_idx" ON "ordens_servico"("solicitante_id");

-- CreateIndex
CREATE INDEX "equipamentos_sei_idx" ON "equipamentos"("sei");

-- CreateIndex
CREATE INDEX "equipamentos_numero_serie_idx" ON "equipamentos"("numero_serie");

-- CreateIndex
CREATE INDEX "modelos_marca_id_idx" ON "modelos"("marca_id");

-- CreateIndex
CREATE INDEX "transferencias_equipamento_id_idx" ON "transferencias"("equipamento_id");

-- CreateIndex
CREATE INDEX "transferencias_destino_id_idx" ON "transferencias"("destino_id");

-- CreateIndex
CREATE INDEX "transferencias_solicitante_id_idx" ON "transferencias"("solicitante_id");

-- CreateIndex
CREATE INDEX "transferencias_status_idx" ON "transferencias"("status");

-- AddForeignKey
ALTER TABLE "usuario_secoes" ADD CONSTRAINT "usuario_secoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_secoes" ADD CONSTRAINT "usuario_secoes_secao_id_fkey" FOREIGN KEY ("secao_id") REFERENCES "secoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_tipos_equipamento" ADD CONSTRAINT "usuario_tipos_equipamento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_tipos_equipamento" ADD CONSTRAINT "usuario_tipos_equipamento_tipo_equipamento_id_fkey" FOREIGN KEY ("tipo_equipamento_id") REFERENCES "tipos_equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
