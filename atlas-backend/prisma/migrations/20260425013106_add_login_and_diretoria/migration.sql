/*
  Warnings:

  - A unique constraint covering the columns `[login]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `login` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PerfilUsuario" ADD VALUE 'DIRETORIA';

-- DropIndex
DROP INDEX "usuarios_matricula_key";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "login" VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_login_key" ON "usuarios"("login");
