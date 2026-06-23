-- CreateEnum
CREATE TYPE "StatusTransferencia" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "transferencias" (
    "id" SERIAL NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "origem_id" INTEGER NOT NULL,
    "destino_id" INTEGER NOT NULL,
    "solicitante_id" INTEGER NOT NULL,
    "recebedor_id" INTEGER,
    "status" "StatusTransferencia" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "data_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_recebimento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferencias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "secoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_origem_id_fkey" FOREIGN KEY ("origem_id") REFERENCES "secoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_recebedor_id_fkey" FOREIGN KEY ("recebedor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias" ADD CONSTRAINT "transferencias_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
