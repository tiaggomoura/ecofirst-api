-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "installmentTotal" INTEGER,
ADD COLUMN     "seriesId" TEXT;
