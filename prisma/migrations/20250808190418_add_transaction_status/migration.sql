-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDENTE', 'PAGO', 'RECEBIDO');

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "updatedAt" TIMESTAMP(3);
