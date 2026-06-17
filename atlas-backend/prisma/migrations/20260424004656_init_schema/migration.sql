-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN_DTEC', 'COMANDANTE', 'USUARIO_BATALHAO');

-- CreateTable
CREATE TABLE "diretorias" (
    "id" SERIAL NOT NULL,
    "sigla" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diretorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batalhoes" (
    "id" SERIAL NOT NULL,
    "sigla" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "diretoria_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batalhoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secoes" (
    "id" SERIAL NOT NULL,
    "sigla" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "batalhao_id" INTEGER,
    "diretoria_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "matricula" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200),
    "posto_graduacao" VARCHAR(100),
    "batalhao_id" INTEGER,
    "secao_id" INTEGER,
    "perfil" "PerfilUsuario" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_equipamento" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "marca_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_equipamento" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_aquisicao" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_aquisicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidades" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" SERIAL NOT NULL,
    "patrimonio" VARCHAR(50) NOT NULL,
    "numero_serie" VARCHAR(200),
    "sei" VARCHAR(200),
    "data_aquisicao" DATE,
    "observacao" TEXT,
    "data_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_equipamento_id" INTEGER NOT NULL,
    "marca_id" INTEGER,
    "modelo_id" INTEGER,
    "status_id" INTEGER NOT NULL,
    "tipo_aquisicao_id" INTEGER,
    "disponibilidade_id" INTEGER NOT NULL,
    "secao_id" INTEGER NOT NULL,
    "usuario_responsavel_id" INTEGER,
    "data_retorno_emprestimo" DATE,
    "data_aprovacao" TIMESTAMP(3),
    "usuario_aprovador_id" INTEGER,
    "motivo_negacao" TEXT,
    "usuario_negador_id" INTEGER,
    "dados_especificos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alteracoes_pendentes" (
    "id" SERIAL NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "dados_antigos" JSONB NOT NULL,
    "dados_novos" JSONB NOT NULL,
    "campos_alterados" TEXT[],
    "solicitante_id" INTEGER NOT NULL,
    "data_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprovado_por_id" INTEGER,
    "data_aprovacao" TIMESTAMP(3),
    "aprovado" BOOLEAN,
    "motivo_negacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alteracoes_pendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_operacoes" (
    "id" SERIAL NOT NULL,
    "equipamento_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "acao" VARCHAR(50) NOT NULL,
    "descricao" TEXT NOT NULL,
    "dados_alterados" JSONB,
    "ip" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_operacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diretorias_sigla_key" ON "diretorias"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "batalhoes_sigla_key" ON "batalhoes"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "secoes_sigla_key" ON "secoes"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_equipamento_nome_key" ON "tipos_equipamento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nome_key" ON "marcas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "status_equipamento_nome_key" ON "status_equipamento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_aquisicao_nome_key" ON "tipos_aquisicao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidades_nome_key" ON "disponibilidades"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_patrimonio_key" ON "equipamentos"("patrimonio");

-- CreateIndex
CREATE INDEX "equipamentos_patrimonio_idx" ON "equipamentos"("patrimonio");

-- CreateIndex
CREATE INDEX "equipamentos_secao_id_idx" ON "equipamentos"("secao_id");

-- CreateIndex
CREATE INDEX "equipamentos_status_id_idx" ON "equipamentos"("status_id");

-- CreateIndex
CREATE INDEX "equipamentos_tipo_equipamento_id_idx" ON "equipamentos"("tipo_equipamento_id");

-- CreateIndex
CREATE INDEX "equipamentos_usuario_responsavel_id_idx" ON "equipamentos"("usuario_responsavel_id");

-- CreateIndex
CREATE INDEX "alteracoes_pendentes_equipamento_id_idx" ON "alteracoes_pendentes"("equipamento_id");

-- CreateIndex
CREATE INDEX "alteracoes_pendentes_solicitante_id_idx" ON "alteracoes_pendentes"("solicitante_id");

-- CreateIndex
CREATE INDEX "log_operacoes_equipamento_id_idx" ON "log_operacoes"("equipamento_id");

-- CreateIndex
CREATE INDEX "log_operacoes_usuario_id_idx" ON "log_operacoes"("usuario_id");

-- CreateIndex
CREATE INDEX "log_operacoes_created_at_idx" ON "log_operacoes"("created_at");

-- AddForeignKey
ALTER TABLE "batalhoes" ADD CONSTRAINT "batalhoes_diretoria_id_fkey" FOREIGN KEY ("diretoria_id") REFERENCES "diretorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secoes" ADD CONSTRAINT "secoes_batalhao_id_fkey" FOREIGN KEY ("batalhao_id") REFERENCES "batalhoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secoes" ADD CONSTRAINT "secoes_diretoria_id_fkey" FOREIGN KEY ("diretoria_id") REFERENCES "diretorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_batalhao_id_fkey" FOREIGN KEY ("batalhao_id") REFERENCES "batalhoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_secao_id_fkey" FOREIGN KEY ("secao_id") REFERENCES "secoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_tipo_equipamento_id_fkey" FOREIGN KEY ("tipo_equipamento_id") REFERENCES "tipos_equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status_equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_tipo_aquisicao_id_fkey" FOREIGN KEY ("tipo_aquisicao_id") REFERENCES "tipos_aquisicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_disponibilidade_id_fkey" FOREIGN KEY ("disponibilidade_id") REFERENCES "disponibilidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_secao_id_fkey" FOREIGN KEY ("secao_id") REFERENCES "secoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_usuario_responsavel_id_fkey" FOREIGN KEY ("usuario_responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_usuario_aprovador_id_fkey" FOREIGN KEY ("usuario_aprovador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_usuario_negador_id_fkey" FOREIGN KEY ("usuario_negador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_pendentes" ADD CONSTRAINT "alteracoes_pendentes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_pendentes" ADD CONSTRAINT "alteracoes_pendentes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_pendentes" ADD CONSTRAINT "alteracoes_pendentes_aprovado_por_id_fkey" FOREIGN KEY ("aprovado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_operacoes" ADD CONSTRAINT "log_operacoes_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_operacoes" ADD CONSTRAINT "log_operacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
